import "core-js/stable";

/**
 * Pure-JS polyfills for pypkjs (V8 via STPyV8).
 * Provides: crypto, Buffer, TextEncoder, TextDecoder as globals.
 *
 * pypkjs V8 has: BigInt, WebSocket, ArrayBuffer, Uint8Array, globalThis
 * pypkjs V8 lacks: crypto, Buffer, require, TextEncoder, TextDecoder
 */

const pkjsGlobal: any = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  return Function("return this")();
})();

if (typeof pkjsGlobal.globalThis === "undefined") {
  pkjsGlobal.globalThis = pkjsGlobal;
}

const {
  BN_ONE,
  BN_TWO,
  BN_THREE,
  BN_ZERO,
  bnFromBuffer,
  bnFromHex,
  bnModPow,
  bnPositiveMod,
  bnToBuffer
} = require("./bigint");

// ── Base64 (pure JS, no atob/btoa dependency) ─────────────────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function b64encode(str: string): string {
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i), b = i+1<str.length?str.charCodeAt(i+1):0, c = i+2<str.length?str.charCodeAt(i+2):0;
    out += B64[(a>>2)&63] + B64[((a&3)<<4)|((b>>4)&15)] + (i+1<str.length?B64[((b&15)<<2)|((c>>6)&3)]:"=") + (i+2<str.length?B64[c&63]:"=");
  }
  return out;
}
function b64decode(str: string): string {
  const lookup: Record<string,number> = {};
  for (let i = 0; i < B64.length; i++) lookup[B64[i]] = i;
  let out = "";
  for (let i = 0; i < str.length; i += 4) {
    const a = lookup[str[i]]||0, b = lookup[str[i+1]]||0, c = lookup[str[i+2]]||0, d = lookup[str[i+3]]||0;
    out += String.fromCharCode((a<<2)|((b>>4)&3));
    if (str[i+2] !== "=") out += String.fromCharCode(((b&15)<<4)|((c>>2)&15));
    if (str[i+3] !== "=") out += String.fromCharCode(((c&3)<<6)|d);
  }
  return out;
}

// ── SHA-256 ────────────────────────────────────────────────────────────────

const K256 = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];

function sha256Raw(data: Uint8Array): Uint8Array {
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  const len = data.length;
  const padLen = ((len + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(data);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padLen - 4, len * 8, false);
  const w = new Int32Array(64);
  for (let off = 0; off < padLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = (((w[i-15]>>>7)|(w[i-15]<<25))^((w[i-15]>>>18)|(w[i-15]<<14))^(w[i-15]>>>3))|0;
      const s1 = (((w[i-2]>>>17)|(w[i-2]<<15))^((w[i-2]>>>19)|(w[i-2]<<13))^(w[i-2]>>>10))|0;
      w[i] = (w[i-16]+s0+w[i-7]+s1)|0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const S1 = (((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))|0;
      const ch = ((e&f)^(~e&g))|0;
      const t1 = (h+S1+ch+K256[i]+w[i])|0;
      const S0 = (((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))|0;
      const maj = ((a&b)^(a&c)^(b&c))|0;
      const t2 = (S0+maj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+h)|0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  ov.setUint32(0,h0,false);ov.setUint32(4,h1,false);ov.setUint32(8,h2,false);ov.setUint32(12,h3,false);
  ov.setUint32(16,h4,false);ov.setUint32(20,h5,false);ov.setUint32(24,h6,false);ov.setUint32(28,h7,false);
  return out;
}

function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  let k = key.length > 64 ? sha256Raw(key) : key;
  const padded = new Uint8Array(64);
  padded.set(k);
  const ipad = new Uint8Array(64 + msg.length);
  const opad = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) { ipad[i] = padded[i] ^ 0x36; opad[i] = padded[i] ^ 0x5c; }
  ipad.set(msg, 64);
  opad.set(sha256Raw(ipad), 64);
  return sha256Raw(opad);
}

// SHA-256 initial hash values.
const SHA256_IV = Int32Array.of(
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
);
const _compressW = new Int32Array(64);
// Compress one 64-byte block (at `off`) into the 8-word big-endian `state`, in place.
function sha256Compress(state: Int32Array, block: Uint8Array, off: number): void {
  const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
  const w = _compressW;
  for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, false);
  for (let i = 16; i < 64; i++) {
    const s0 = (((w[i-15]>>>7)|(w[i-15]<<25))^((w[i-15]>>>18)|(w[i-15]<<14))^(w[i-15]>>>3))|0;
    const s1 = (((w[i-2]>>>17)|(w[i-2]<<15))^((w[i-2]>>>19)|(w[i-2]<<13))^(w[i-2]>>>10))|0;
    w[i] = (w[i-16]+s0+w[i-7]+s1)|0;
  }
  let a=state[0],b=state[1],c=state[2],d=state[3],e=state[4],f=state[5],g=state[6],h=state[7];
  for (let i = 0; i < 64; i++) {
    const S1 = (((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))|0;
    const ch = ((e&f)^(~e&g))|0;
    const t1 = (h+S1+ch+K256[i]+w[i])|0;
    const S0 = (((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))|0;
    const maj = ((a&b)^(a&c)^(b&c))|0;
    const t2 = (S0+maj)|0;
    h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
  }
  state[0]=(state[0]+a)|0;state[1]=(state[1]+b)|0;state[2]=(state[2]+c)|0;state[3]=(state[3]+d)|0;
  state[4]=(state[4]+e)|0;state[5]=(state[5]+f)|0;state[6]=(state[6]+g)|0;state[7]=(state[7]+h)|0;
}

function pbkdf2(pw: Uint8Array, salt: Uint8Array, iter: number, keylen: number): Uint8Array {
  // The HMAC key (pw) is constant across all iterations, so precompute the
  // SHA-256 midstate after the ipad/opad key blocks once. Each iteration then
  // costs 2 block compressions instead of 4 (no re-hashing of the pads) — ~2x
  // faster PBKDF2, which dominates Apple SRP sign-in on the pure-JS runtime.
  const key = pw.length > 64 ? sha256Raw(pw) : pw;
  const ipadKey = new Uint8Array(64);
  const opadKey = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const kb = i < key.length ? key[i] : 0;
    ipadKey[i] = kb ^ 0x36;
    opadKey[i] = kb ^ 0x5c;
  }
  const ipadMid = SHA256_IV.slice();
  sha256Compress(ipadMid, ipadKey, 0);
  const opadMid = SHA256_IV.slice();
  sha256Compress(opadMid, opadKey, 0);

  // Second (final) block for a 32-byte message: msg(32) | 0x80 | zeros | len.
  // The HMAC hashes ipad(64)+msg(32)=96 bytes => bit length 768, constant.
  const innerBlock = new Uint8Array(64);
  innerBlock[32] = 0x80;
  new DataView(innerBlock.buffer).setUint32(60, 96 * 8, false);
  const outerBlock = new Uint8Array(64);
  outerBlock[32] = 0x80;
  const outerDv = new DataView(outerBlock.buffer);
  outerDv.setUint32(60, 96 * 8, false);
  const stateA = new Int32Array(8);
  const stateB = new Int32Array(8);
  const innerDv = new DataView(innerBlock.buffer);
  // HMAC(key, u) for a 32-byte u, writing the 32-byte result back into `u`.
  const hmacFast = (u: Uint8Array): void => {
    innerBlock.set(u, 0);
    stateA.set(ipadMid);
    sha256Compress(stateA, innerBlock, 0);
    for (let i = 0; i < 8; i++) outerDv.setInt32(i * 4, stateA[i], false);
    stateB.set(opadMid);
    sha256Compress(stateB, outerBlock, 0);
    for (let i = 0; i < 8; i++) innerDv.setInt32(i * 4, stateB[i], false); // reuse innerBlock[0..31] as scratch
    for (let i = 0; i < 32; i++) u[i] = innerBlock[i];
  };

  const result = new Uint8Array(keylen);
  for (let block = 1; block <= Math.ceil(keylen / 32); block++) {
    const sb = new Uint8Array(salt.length + 4);
    sb.set(salt);
    sb[salt.length]=(block>>>24)&0xff; sb[salt.length+1]=(block>>>16)&0xff;
    sb[salt.length+2]=(block>>>8)&0xff; sb[salt.length+3]=block&0xff;
    const u = new Uint8Array(hmacSha256(key, sb)); // first iteration: salt-based (generic)
    const t = new Uint8Array(u);
    for (let i = 1; i < iter; i++) { hmacFast(u); for (let j = 0; j < 32; j++) t[j] ^= u[j]; }
    const off = (block - 1) * 32;
    result.set(t.subarray(0, Math.min(32, keylen - off)), off);
  }
  return result;
}

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
  else for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
  return buf;
}

// ── Buffer shim (factory, not class — avoids TS Uint8Array conflicts) ──────

function bufFrom(data: any, encoding?: string): any {
  if (typeof data === "string") {
    if (encoding === "base64") {
      const bin = b64decode(data); const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return addBufMethods(buf);
    }
    if (encoding === "hex") {
      const buf = new Uint8Array(data.length / 2);
      for (let i = 0; i < buf.length; i++) buf[i] = parseInt(data.substr(i * 2, 2), 16);
      return addBufMethods(buf);
    }
    const bytes: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const c = data.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0|(c>>6), 0x80|(c&0x3f)); }
      else { bytes.push(0xe0|(c>>12), 0x80|((c>>6)&0x3f), 0x80|(c&0x3f)); }
    }
    return addBufMethods(new Uint8Array(bytes));
  }
  if (data instanceof Uint8Array) { const b = new Uint8Array(data.length); b.set(data); return addBufMethods(b); }
  if (data instanceof ArrayBuffer) return addBufMethods(new Uint8Array(data));
  if (Array.isArray(data)) return addBufMethods(new Uint8Array(data));
  return addBufMethods(new Uint8Array(typeof data === "number" ? data : 0));
}

function bufAlloc(size: number, fill?: number): any {
  const buf = new Uint8Array(size);
  if (fill !== undefined) buf.fill(fill);
  return addBufMethods(buf);
}

function bufConcat(list: any[]): any {
  let total = 0; for (const item of list) total += item.length;
  const result = new Uint8Array(total);
  let offset = 0; for (const item of list) { result.set(item, offset); offset += item.length; }
  return addBufMethods(result);
}

function addBufMethods(buf: Uint8Array): any {
  const b: any = buf;
  b.toString = (enc?: string) => {
    if (enc === "base64") { let s = ""; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]); return b64encode(s); }
    if (enc === "hex") { let s = ""; for (let i = 0; i < buf.length; i++) s += (buf[i]<16?"0":"") + buf[i].toString(16); return s; }
    let s = ""; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]); return s;
  };
  b.copy = (target: any, ts?: number, ss?: number, se?: number) => target.set(buf.subarray(ss||0, se||buf.length), ts||0);
  b.equals = (other: Uint8Array) => { if (buf.length !== other.length) return false; for (let i=0;i<buf.length;i++) if (buf[i]!==other[i]) return false; return true; };
  b.readUInt16LE = (o: number) => buf[o]|(buf[o+1]<<8);
  b.readUInt32LE = (o: number) => (buf[o]|(buf[o+1]<<8)|(buf[o+2]<<16)|(buf[o+3]<<24))>>>0;
  b.readInt16LE = (o: number) => { const v = b.readUInt16LE(o); return v>0x7fff?v-0x10000:v; };
  b.readInt32LE = (o: number) => buf[o]|(buf[o+1]<<8)|(buf[o+2]<<16)|(buf[o+3]<<24);
  b.writeUInt16LE = (v: number, o: number) => { buf[o]=v&0xff; buf[o+1]=(v>>8)&0xff; };
  b.writeUInt32LE = (v: number, o: number) => { buf[o]=v&0xff;buf[o+1]=(v>>8)&0xff;buf[o+2]=(v>>16)&0xff;buf[o+3]=(v>>24)&0xff; };
  b.writeInt16LE = (v: number, o: number) => b.writeUInt16LE(v<0?v+0x10000:v, o);
  return b;
}

const BufferShim: any = { from: bufFrom, alloc: bufAlloc, concat: bufConcat };

// ── TextEncoder/TextDecoder ────────────────────────────────────────────────

class TextEncoderPoly { encode(s: string): Uint8Array { return bufFrom(s); } }
class TextDecoderPoly { decode(b: Uint8Array): string { let s=""; for(let i=0;i<b.length;) { const c=b[i++]; if(c<0x80) s+=String.fromCharCode(c); else if(c<0xe0) s+=String.fromCharCode(((c&0x1f)<<6)|(b[i++]&0x3f)); else if(c<0xf0){const v=((c&0x0f)<<12)|((b[i++]&0x3f)<<6)|(b[i++]&0x3f);s+=String.fromCharCode(v);} else{const v=((c&0x07)<<18)|((b[i++]&0x3f)<<12)|((b[i++]&0x3f)<<6)|(b[i++]&0x3f);s+=String.fromCodePoint(v);}} return s; } }

// ── Crypto shim ────────────────────────────────────────────────────────────

const cryptoShim: any = {
  createHash(algo?: string) {
    if (algo && algo !== "sha256") throw new Error("createHash: only sha256 is supported");
    const parts: Uint8Array[] = [];
    return {
      update(input: any, enc?: string) { parts.push(typeof input==="string"?bufFrom(input,enc||"utf8"):new Uint8Array(input)); return this; },
      digest(enc?: string) { let t=0; for(const p of parts)t+=p.length; const c=new Uint8Array(t); let o=0; for(const p of parts){c.set(p,o);o+=p.length;} const r=bufFrom(sha256Raw(c)); return enc==="hex"?r.toString("hex"):r; }
    };
  },
  createHmac(_: string, key: any) {
    const k = key instanceof Uint8Array ? key : bufFrom(key);
    const parts: Uint8Array[] = [];
    return {
      update(input: any) { parts.push(input instanceof Uint8Array ? input : bufFrom(input)); return this; },
      digest(enc?: string) { let t=0;for(const p of parts)t+=p.length; const c=new Uint8Array(t);let o=0;for(const p of parts){c.set(p,o);o+=p.length;} const r=bufFrom(hmacSha256(k,c)); return enc==="hex"?r.toString("hex"):r; }
    };
  },
  randomBytes(n: number) { return bufFrom(randomBytes(n)); },
  pbkdf2Sync(pw: any, salt: any, iter: number, kl: number) {
    return bufFrom(pbkdf2(pw instanceof Uint8Array?pw:bufFrom(pw), salt instanceof Uint8Array?salt:bufFrom(salt), iter, kl));
  },
};

// ── Install globally ───────────────────────────────────────────────────────

if (typeof pkjsGlobal.TextEncoder === "undefined") pkjsGlobal.TextEncoder = TextEncoderPoly;
if (typeof pkjsGlobal.TextDecoder === "undefined") pkjsGlobal.TextDecoder = TextDecoderPoly;
if (typeof pkjsGlobal.URL === "undefined") {
  pkjsGlobal.URL = class URL {
    protocol: string; hostname: string; pathname: string; search: string; hash: string; href: string;
    constructor(url: string) {
      this.href = url;
      const m = url.match(/^(\w+):\/\/([^/:]+)(:[0-9]+)?(\/[^?#]*)?(\\?[^#]*)?(#.*)?$/);
      this.protocol = m ? m[1] + ":" : "";
      this.hostname = m ? m[2] : "";
      this.pathname = m ? (m[4] || "/") : "/";
      this.search = m ? (m[5] || "") : "";
      this.hash = m ? (m[6] || "") : "";
    }
  };
}
pkjsGlobal.__polyfill_crypto = cryptoShim;
pkjsGlobal.__polyfill_Buffer = BufferShim;

export {};
