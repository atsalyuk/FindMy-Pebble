const fs=require("fs"), path=require("path"), crypto=require("crypto");
const bytes=fs.readFileSync(path.join(__dirname,"srpcrypto.wasm"));
const inst=new WebAssembly.Instance(new WebAssembly.Module(bytes),{});
const ex=inst.exports;
const mem=()=>new Uint8Array(ex.memory.buffer);
const io=ex.io();
// offsets within io region
const O={base:0,exp:256,mod:512,out:768,pw:1024,salt:1152,pout:1280};
const N_HEX="AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73";
const N=BigInt("0x"+N_HEX);
function toBE(bi,len){let h=bi.toString(16);if(h.length%2)h="0"+h;const b=Buffer.from(h,"hex");const out=Buffer.alloc(len);b.copy(out,len-b.length);return out;}
function wasmModexp(baseBI,expBI){
  const m=mem();
  m.set(toBE(baseBI,256),io+O.base);
  const eb=toBE(expBI,256); // pass full 256, explen=256
  m.set(eb,io+O.exp);
  m.set(toBE(N,256),io+O.mod);
  ex.modexp(io+O.base,io+O.exp,256,io+O.mod,io+O.out);
  const r=Buffer.from(mem().subarray(io+O.out,io+O.out+256));
  return BigInt("0x"+r.toString("hex"));
}
let ok=true,cases=0;
for(let i=0;i<25;i++){
  const base=BigInt("0x"+crypto.randomBytes(256).toString("hex"))%N;
  const expLen=[32,64,32,20][i%4];
  const exp=BigInt("0x"+crypto.randomBytes(expLen).toString("hex"));
  const want=(function(b,e,m){let r=1n;b%=m;while(e>0n){if(e&1n)r=r*b%m;e>>=1n;b=b*b%m;}return r;})(base,exp,N);
  const got=wasmModexp(base,exp);
  cases++;
  if(got!==want){ok=false;console.log("MODEXP MISMATCH i="+i);}
}
// g=2 base like real SRP
{const got=wasmModexp(2n, BigInt("0x"+crypto.randomBytes(32).toString("hex"))); const e=BigInt("0x"+crypto.randomBytes(32).toString("hex")); const want=(function(b,ee,m){let r=1n;b%=m;while(ee>0n){if(ee&1n)r=r*b%m;ee>>=1n;b=b*b%m;}return r;})(2n,e,N); /*placeholder*/}
// pbkdf2 tests vs native
function wasmPbkdf2(pw,salt,iters){
  const m=mem();
  m.set(pw,io+O.pw); m.set(salt,io+O.salt);
  ex.pbkdf2(io+O.pw,pw.length,io+O.salt,salt.length,iters,io+O.pout);
  return Buffer.from(mem().subarray(io+O.pout,io+O.pout+32));
}
let pok=true,pcases=0;
for(const [pl,sl,it] of [[32,20,1],[32,20,2],[32,16,1000],[64,20,3],[32,20,20871],[48,32,5],[70,19,10]]){
  const pw=crypto.randomBytes(pl), salt=crypto.randomBytes(sl);
  const want=crypto.pbkdf2Sync(pw,salt,it,32,"sha256");
  const got=wasmPbkdf2(new Uint8Array(pw),new Uint8Array(salt),it);
  pcases++;
  if(!want.equals(got)){pok=false;console.log(`PBKDF2 MISMATCH pl=${pl} sl=${sl} it=${it}`);}
}
console.log(ok?`MODEXP: all ${cases} cases match Node BigInt`:"MODEXP FAILED");
console.log(pok?`PBKDF2: all ${pcases} cases match Node native`:"PBKDF2 FAILED");
// timing on the real SRP shapes
const t0=Date.now(); wasmModexp(2n,BigInt("0x"+crypto.randomBytes(64).toString("hex"))); const tm=Date.now()-t0;
const t1=Date.now(); wasmPbkdf2(crypto.randomBytes(32),crypto.randomBytes(20),20871); const tp=Date.now()-t1;
console.log(`timing (desktop wasm): 512-bit modexp=${tm}ms  pbkdf2(20871)=${tp}ms`);
