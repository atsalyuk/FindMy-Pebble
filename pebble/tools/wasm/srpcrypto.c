// Freestanding wasm32 crypto for Apple SRP sign-in: SHA-256, PBKDF2-HMAC-SHA256,
// and 2048-bit Montgomery modular exponentiation. Compiled with no libc; the
// only memory is the exported linear memory. JS writes inputs into the exported
// io() region and passes pointers to the exported functions.
//
// Correctness is validated in tools/wasm/verify.cjs against Node's native
// crypto (pbkdf2) and BigInt (modexp) before the bytes are embedded.

typedef unsigned char u8;
typedef unsigned int u32;
typedef unsigned long long u64;

// ───────────────────────── SHA-256 ─────────────────────────
static const u32 K[64] = {
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

#define ROTR(x,n) (((x)>>(n))|((x)<<(32-(n))))

static void sha256_compress(u32 h[8], const u8 *p) {
  u32 w[64];
  for (int i = 0; i < 16; i++)
    w[i] = ((u32)p[i*4]<<24)|((u32)p[i*4+1]<<16)|((u32)p[i*4+2]<<8)|((u32)p[i*4+3]);
  for (int i = 16; i < 64; i++) {
    u32 s0 = ROTR(w[i-15],7)^ROTR(w[i-15],18)^(w[i-15]>>3);
    u32 s1 = ROTR(w[i-2],17)^ROTR(w[i-2],19)^(w[i-2]>>10);
    w[i] = w[i-16]+s0+w[i-7]+s1;
  }
  u32 a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
  for (int i = 0; i < 64; i++) {
    u32 S1 = ROTR(e,6)^ROTR(e,11)^ROTR(e,25);
    u32 ch = (e&f)^(~e&g);
    u32 t1 = hh+S1+ch+K[i]+w[i];
    u32 S0 = ROTR(a,2)^ROTR(a,13)^ROTR(a,22);
    u32 maj = (a&b)^(a&c)^(b&c);
    u32 t2 = S0+maj;
    hh=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
  }
  h[0]+=a; h[1]+=b; h[2]+=c; h[3]+=d; h[4]+=e; h[5]+=f; h[6]+=g; h[7]+=hh;
}

static const u32 SHA_IV[8] = {
  0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
};

static void sha256(const u8 *msg, int len, u8 out[32]) {
  u32 h[8];
  for (int i=0;i<8;i++) h[i]=SHA_IV[i];
  int i = 0;
  for (; i + 64 <= len; i += 64) sha256_compress(h, msg + i);
  u8 block[128];
  int rem = len - i;
  for (int j=0;j<rem;j++) block[j]=msg[i+j];
  block[rem] = 0x80;
  int total = (rem + 9 <= 64) ? 64 : 128;
  for (int j=rem+1;j<total-8;j++) block[j]=0;
  u64 bits = (u64)len * 8;
  for (int j=0;j<8;j++) block[total-1-j] = (u8)(bits >> (8*j));
  sha256_compress(h, block);
  if (total == 128) sha256_compress(h, block+64);
  for (int j=0;j<8;j++){ out[j*4]=h[j]>>24; out[j*4+1]=h[j]>>16; out[j*4+2]=h[j]>>8; out[j*4+3]=h[j]; }
}

// HMAC-SHA256 with midstate caching for a fixed key (PBKDF2 inner loop).
static void hmac_pads(const u8 *key, int keylen, u32 imid[8], u32 omid[8]) {
  u8 k[64];
  u8 khash[32];
  if (keylen > 64) { sha256(key, keylen, khash); key = khash; keylen = 32; }
  for (int i=0;i<64;i++) k[i] = i < keylen ? key[i] : 0;
  u8 ipad[64], opad[64];
  for (int i=0;i<64;i++){ ipad[i]=k[i]^0x36; opad[i]=k[i]^0x5c; }
  for (int i=0;i<8;i++){ imid[i]=SHA_IV[i]; omid[i]=SHA_IV[i]; }
  sha256_compress(imid, ipad);
  sha256_compress(omid, opad);
}

static void pbkdf2_hmac_sha256_impl(const u8 *pw, int pwlen, const u8 *salt, int saltlen, int iters, u8 out[32]) {
  u32 imid[8], omid[8];
  hmac_pads(pw, pwlen, imid, omid);

  // U1 = HMAC(pw, salt || INT(1)) — salt length is arbitrary, do it generically.
  u8 msg[256];
  int ml = 0;
  for (int i=0;i<saltlen;i++) msg[ml++]=salt[i];
  msg[ml++]=0; msg[ml++]=0; msg[ml++]=0; msg[ml++]=1;
  u32 hi[8];
  for (int i=0;i<8;i++) hi[i]=imid[i];
  // hash salt||INT continuing from ipad midstate
  {
    u8 blk[128]; int j=0;
    for (; j+64 <= ml; j+=64) sha256_compress(hi, msg+j);
    int rem = ml - j;
    for (int t=0;t<rem;t++) blk[t]=msg[j+t];
    blk[rem]=0x80;
    int total = (rem + 9 <= 64) ? 64 : 128;
    for (int t=rem+1;t<total-8;t++) blk[t]=0;
    u64 bits = (u64)(64 + ml) * 8;
    for (int t=0;t<8;t++) blk[total-1-t]=(u8)(bits>>(8*t));
    sha256_compress(hi, blk);
    if (total==128) sha256_compress(hi, blk+64);
  }
  u8 inner[32];
  for (int i=0;i<8;i++){ inner[i*4]=hi[i]>>24; inner[i*4+1]=hi[i]>>16; inner[i*4+2]=hi[i]>>8; inner[i*4+3]=hi[i]; }
  u32 ho[8]; for (int i=0;i<8;i++) ho[i]=omid[i];
  u8 oblk[64];
  for (int i=0;i<32;i++) oblk[i]=inner[i];
  oblk[32]=0x80; for (int i=33;i<56;i++) oblk[i]=0;
  { u64 bits=(u64)(64+32)*8; for (int t=0;t<8;t++) oblk[63-t]=(u8)(bits>>(8*t)); }
  sha256_compress(ho, oblk);
  u8 u[32];
  for (int i=0;i<8;i++){ u[i*4]=ho[i]>>24; u[i*4+1]=ho[i]>>16; u[i*4+2]=ho[i]>>8; u[i*4+3]=ho[i]; }
  for (int i=0;i<32;i++) out[i]=u[i];

  // Iterations: u = HMAC(pw, u), out ^= u — both blocks single, use midstates.
  u8 iblk[64], ob[64];
  iblk[32]=0x80; for (int i=33;i<56;i++) iblk[i]=0;
  { u64 bits=(u64)(64+32)*8; for (int t=0;t<8;t++) iblk[63-t]=(u8)(bits>>(8*t)); }
  ob[32]=0x80; for (int i=33;i<56;i++) ob[i]=0;
  { u64 bits=(u64)(64+32)*8; for (int t=0;t<8;t++) ob[63-t]=(u8)(bits>>(8*t)); }
  for (int it=1; it<iters; it++) {
    for (int i=0;i<32;i++) iblk[i]=u[i];
    u32 s[8]; for (int i=0;i<8;i++) s[i]=imid[i];
    sha256_compress(s, iblk);
    for (int i=0;i<8;i++){ ob[i*4]=s[i]>>24; ob[i*4+1]=s[i]>>16; ob[i*4+2]=s[i]>>8; ob[i*4+3]=s[i]; }
    u32 s2[8]; for (int i=0;i<8;i++) s2[i]=omid[i];
    sha256_compress(s2, ob);
    for (int i=0;i<8;i++){ u[i*4]=s2[i]>>24; u[i*4+1]=s2[i]>>16; u[i*4+2]=s2[i]>>8; u[i*4+3]=s2[i]; }
    for (int i=0;i<32;i++) out[i]^=u[i];
  }
}

// ─────────────────── 2048-bit Montgomery modexp ───────────────────
#define NL 64  // 64 x 32-bit limbs = 2048 bits

// limbs are little-endian (limb[0] = least significant)
static void be_to_limbs(const u8 *b, u32 *limbs) {
  // b is 256 big-endian bytes
  for (int i=0;i<NL;i++) {
    int off = (NL-1-i)*4;
    limbs[i] = ((u32)b[off]<<24)|((u32)b[off+1]<<16)|((u32)b[off+2]<<8)|((u32)b[off+3]);
  }
}
static void limbs_to_be(const u32 *limbs, u8 *b) {
  for (int i=0;i<NL;i++) {
    int off = (NL-1-i)*4;
    b[off]=limbs[i]>>24; b[off+1]=limbs[i]>>16; b[off+2]=limbs[i]>>8; b[off+3]=limbs[i];
  }
}

// compare a,b (little-endian limbs): 1 if a>=b else 0
static int geq(const u32 *a, const u32 *b) {
  for (int i=NL-1;i>=0;i--){ if (a[i]!=b[i]) return a[i]>b[i]; }
  return 1;
}
// a -= b (assumes a>=b)
static void sub_in(u32 *a, const u32 *b) {
  u64 borrow=0;
  for (int i=0;i<NL;i++){ u64 d=(u64)a[i]-b[i]-borrow; a[i]=(u32)d; borrow=(d>>63)&1; }
}

static u32 mont_n0inv(u32 n0) {
  u32 inv = n0; // n0 is odd; Newton iteration mod 2^32
  for (int i=0;i<5;i++) inv = inv * (2u - n0*inv);
  return (u32)(0u - inv); // -N^{-1} mod 2^32
}

// CIOS Montgomery multiply: r = a*b*R^{-1} mod n (all NL-limb little-endian)
static void mont_mul(const u32 *a, const u32 *b, const u32 *n, u32 n0inv, u32 *r) {
  u32 t[NL+2];
  for (int i=0;i<NL+2;i++) t[i]=0;
  for (int i=0;i<NL;i++) {
    u64 C=0;
    for (int j=0;j<NL;j++){ u64 p=(u64)a[j]*b[i]+t[j]+C; t[j]=(u32)p; C=p>>32; }
    u64 s=(u64)t[NL]+C; t[NL]=(u32)s; t[NL+1]=(u32)(s>>32);
    u32 m=(u32)(t[0]*n0inv);
    C=((u64)m*n[0]+t[0])>>32;
    for (int j=1;j<NL;j++){ u64 p=(u64)m*n[j]+t[j]+C; t[j-1]=(u32)p; C=p>>32; }
    s=(u64)t[NL]+C; t[NL-1]=(u32)s; t[NL]=t[NL+1]+(u32)(s>>32);
  }
  for (int i=0;i<NL;i++) r[i]=t[i];
  if (t[NL] || geq(r,n)) sub_in(r,n);
}

static u32 g_base[NL], g_exp[NL], g_mod[NL], g_out[NL];
static u32 g_r2[NL], g_am[NL], g_res[NL], g_tmp[NL];

// modexp: base/mod are 256 big-endian bytes; exp is explen big-endian bytes;
// writes 256 big-endian bytes to out. Requires odd modulus.
__attribute__((export_name("modexp")))
void modexp(const u8 *base, const u8 *exp, int explen, const u8 *mod, u8 *out) {
  be_to_limbs(base, g_base);
  be_to_limbs(mod, g_mod);
  u32 n0inv = mont_n0inv(g_mod[0]);

  // R^2 mod N via 4096 doublings of 1 mod N (R = 2^2048).
  for (int i=0;i<NL;i++) g_r2[i]=0;
  g_r2[0]=1;
  for (int b=0;b<4096;b++) {
    // g_r2 <<= 1
    u32 carry=0;
    for (int i=0;i<NL;i++){ u32 nx=(g_r2[i]>>31)&1; g_r2[i]=(g_r2[i]<<1)|carry; carry=nx; }
    if (carry || geq(g_r2,g_mod)) sub_in(g_r2,g_mod);
  }

  // aMont = a * R2 * R^-1 = a*R mod N
  // reduce base mod N first (base may be >= N in the S step)
  if (geq(g_base,g_mod)) sub_in(g_base,g_mod);
  mont_mul(g_base, g_r2, g_mod, n0inv, g_am);

  // res = R mod N = Montgomery(1) = 1*R2*R^-1
  { u32 one[NL]; for (int i=0;i<NL;i++) one[i]=0; one[0]=1;
    mont_mul(one, g_r2, g_mod, n0inv, g_res); }

  // square-and-multiply over exponent bits (MSB first)
  for (int i=0;i<explen;i++) {
    u8 byte = exp[i];
    for (int bit=7;bit>=0;bit--) {
      mont_mul(g_res, g_res, g_mod, n0inv, g_tmp);
      for (int k=0;k<NL;k++) g_res[k]=g_tmp[k];
      if ((byte>>bit)&1) {
        mont_mul(g_res, g_am, g_mod, n0inv, g_tmp);
        for (int k=0;k<NL;k++) g_res[k]=g_tmp[k];
      }
    }
  }

  // convert out of Montgomery: res * 1 * R^-1
  { u32 one[NL]; for (int i=0;i<NL;i++) one[i]=0; one[0]=1;
    mont_mul(g_res, one, g_mod, n0inv, g_out); }
  limbs_to_be(g_out, out);
}

__attribute__((export_name("pbkdf2")))
void pbkdf2(const u8 *pw, int pwlen, const u8 *salt, int saltlen, int iters, u8 *out) {
  pbkdf2_hmac_sha256_impl(pw, pwlen, salt, saltlen, iters, out);
}

// I/O scratch region JS writes inputs into and reads outputs from.
static u8 g_io[4096];
__attribute__((export_name("io")))
u8 *io(void) { return g_io; }
