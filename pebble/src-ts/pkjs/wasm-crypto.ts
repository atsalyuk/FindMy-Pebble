// WebAssembly-accelerated SRP crypto. The phone PKJS runtime has no native
// crypto, so PBKDF2 (~20k HMAC-SHA256) and 2048-bit modexp ran for seconds in
// pure JS. This wraps a freestanding WASM module (tools/wasm/srpcrypto.c) that
// runs them near-native. Instantiation is synchronous and guarded — if the
// runtime lacks WebAssembly or anything fails, callers fall back to JS and the
// result is identical (verified in tools/wasm/verify.cjs).
import { WASM_CRYPTO_B64 } from "./wasm-crypto-bytes";

export type WasmCrypto = {
  // base/mod: 256-byte big-endian; exp: big-endian, minimal length. Returns 256-byte BE.
  modexp: (base: Uint8Array, exp: Uint8Array, mod: Uint8Array) => Uint8Array;
  // Returns a 32-byte PBKDF2-HMAC-SHA256 derived key.
  pbkdf2: (pw: Uint8Array, salt: Uint8Array, iters: number) => Uint8Array;
};

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const b64decode = (s: string): Uint8Array => {
  const lookup = new Int16Array(256);
  for (let i = 0; i < 256; i++) lookup[i] = -1;
  for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS.charCodeAt(i)] = i;
  const len = s.length;
  let pad = 0;
  if (len && s.charAt(len - 1) === "=") pad++;
  if (len > 1 && s.charAt(len - 2) === "=") pad++;
  const outLen = (len / 4) * 3 - pad;
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[s.charCodeAt(i)];
    const b = lookup[s.charCodeAt(i + 1)];
    const c = lookup[s.charCodeAt(i + 2)];
    const d = lookup[s.charCodeAt(i + 3)];
    const trip = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
    if (o < outLen) out[o++] = (trip >> 16) & 0xff;
    if (o < outLen) out[o++] = (trip >> 8) & 0xff;
    if (o < outLen) out[o++] = trip & 0xff;
  }
  return out;
};

let cached: WasmCrypto | null | undefined; // undefined = not yet attempted

const init = (): WasmCrypto | null => {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    const wa: any = (globalThis as any).WebAssembly;
    if (!wa || typeof wa.Module !== "function" || typeof wa.Instance !== "function") {
      return cached;
    }
    const module = new wa.Module(b64decode(WASM_CRYPTO_B64));
    const instance = new wa.Instance(module, {});
    const ex: any = instance.exports;
    if (!ex || typeof ex.io !== "function" || typeof ex.modexp !== "function" || typeof ex.pbkdf2 !== "function") {
      return cached;
    }
    const ioPtr: number = ex.io();
    const OFF = { base: 0, exp: 256, mod: 512, out: 768, pw: 1024, salt: 1152, pout: 1280 };
    const mem = () => new Uint8Array(ex.memory.buffer);

    const modexp = (base: Uint8Array, exp: Uint8Array, mod: Uint8Array): Uint8Array => {
      const m = mem();
      m.set(base, ioPtr + OFF.base);
      m.set(exp, ioPtr + OFF.exp);
      m.set(mod, ioPtr + OFF.mod);
      ex.modexp(ioPtr + OFF.base, ioPtr + OFF.exp, exp.length, ioPtr + OFF.mod, ioPtr + OFF.out);
      return mem().slice(ioPtr + OFF.out, ioPtr + OFF.out + 256);
    };
    const pbkdf2 = (pw: Uint8Array, salt: Uint8Array, iters: number): Uint8Array => {
      const m = mem();
      m.set(pw, ioPtr + OFF.pw);
      m.set(salt, ioPtr + OFF.salt);
      ex.pbkdf2(ioPtr + OFF.pw, pw.length, ioPtr + OFF.salt, salt.length, iters, ioPtr + OFF.pout);
      return mem().slice(ioPtr + OFF.pout, ioPtr + OFF.pout + 32);
    };

    cached = { modexp, pbkdf2 };
    console.log("wasm-crypto: initialized (native-speed SRP)");
  } catch (error) {
    console.log("wasm-crypto: init failed, using JS fallback: " + String(error));
    cached = null;
  }
  return cached;
};

export const getWasmCrypto = (): WasmCrypto | null => init();
