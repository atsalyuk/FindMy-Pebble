const BN: any = require("bn.js");
const { getWasmCrypto } = require("./wasm-crypto");

const getBufferCtor = () => {
  const globalValue: any = globalThis as any;
  return globalValue.__polyfill_Buffer || globalValue.Buffer;
};

const normalizeHex = (value: string) => String(value || "").replace(/^0x/i, "") || "00";

const ensureBn = (value: any) => (BN.isBN(value) ? value : new BN(String(value), 10));

const BN_ZERO = new BN(0);
const BN_ONE = new BN(1);
const BN_TWO = new BN(2);
const BN_THREE = new BN(3);
const BN_FOUR = new BN(4);

const isBn = (value: any) => BN.isBN(value);

const bnFromHex = (value: string) => new BN(normalizeHex(value), 16);

const bnFromNumber = (value: number) => new BN(String(value), 10);

const bnFromBuffer = (value: any) => {
  const BufferCtor = getBufferCtor();
  const hex = BufferCtor.from(value).toString("hex");
  return new BN(hex || "00", 16);
};

const bnToBuffer = (value: any, targetLength?: number) => {
  const BufferCtor = getBufferCtor();
  let hex = ensureBn(value).toString(16);
  if (hex.length % 2 === 1) {
    hex = `0${hex}`;
  }
  let buffer = BufferCtor.from(hex || "00", "hex");
  if (targetLength && buffer.length < targetLength) {
    buffer = BufferCtor.concat([BufferCtor.alloc(targetLength - buffer.length), buffer]);
  }
  return buffer;
};

const bnPositiveMod = (value: any, modulus: any) => ensureBn(value).umod(ensureBn(modulus));

// Cache Montgomery reduction contexts per modulus. Building the context costs
// O(n); it is reused across the multiple modexps that share the SRP prime N.
const redContextCache: { key?: string; ctx?: any } = {};
const getRedContext = (modulusBn: any) => {
  const key = modulusBn.toString(16);
  if (redContextCache.key !== key) {
    redContextCache.key = key;
    redContextCache.ctx = BN.red(modulusBn);
  }
  return redContextCache.ctx;
};

// Modular exponentiation via bn.js Montgomery reduction (redPow). This replaces
// the naive square-and-multiply loop, whose per-step division dominated the
// SRP sign-in time (~8s of crypto measured on-watch). redPow uses a windowed
// method with Montgomery reduction and returns an identical result, so the SRP
// values are unchanged — only faster. Requires an odd modulus, which the SRP
// prime N (a safe prime) satisfies.
const bnModPow = (base: any, exponent: any, modulus: any) => {
  const modulusBn = ensureBn(modulus);
  const exponentBn = ensureBn(exponent);
  if (exponentBn.isZero()) {
    return BN_ONE;
  }
  // WASM fast path: fixed 2048-bit odd modulus (all SRP modexps use prime N).
  if (!modulusBn.isEven() && modulusBn.bitLength() <= 2048) {
    const wasm = getWasmCrypto();
    if (wasm) {
      try {
        const baseBytes = Uint8Array.from(bnPositiveMod(base, modulusBn).toArray("be", 256));
        const modBytes = Uint8Array.from(modulusBn.toArray("be", 256));
        const expBytes = Uint8Array.from(exponentBn.toArray("be"));
        if (expBytes.length <= 256) {
          const outBytes = wasm.modexp(baseBytes, expBytes, modBytes);
          return new BN(Array.prototype.slice.call(outBytes));
        }
      } catch (_error) {
        // fall through to the JS implementation below
      }
    }
  }
  if (modulusBn.isEven()) {
    // Montgomery reduction needs an odd modulus; fall back to the simple loop
    // for the (unused in SRP) even-modulus case.
    let result = BN_ONE;
    let currentBase = bnPositiveMod(base, modulusBn);
    let currentExponent = exponentBn;
    while (!currentExponent.isZero()) {
      if (currentExponent.isOdd()) {
        result = result.mul(currentBase).umod(modulusBn);
      }
      currentExponent = currentExponent.ushrn(1);
      currentBase = currentBase.mul(currentBase).umod(modulusBn);
    }
    return result;
  }
  const ctx = getRedContext(modulusBn);
  const baseRed = bnPositiveMod(base, modulusBn).toRed(ctx);
  return baseRed.redPow(exponentBn).fromRed();
};

export {
  BN,
  BN_ZERO,
  BN_ONE,
  BN_TWO,
  BN_THREE,
  BN_FOUR,
  isBn,
  bnFromHex,
  bnFromNumber,
  bnFromBuffer,
  bnToBuffer,
  bnPositiveMod,
  bnModPow
};
