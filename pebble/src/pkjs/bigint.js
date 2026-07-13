"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bnModPow = exports.bnPositiveMod = exports.bnToBuffer = exports.bnFromBuffer = exports.bnFromNumber = exports.bnFromHex = exports.isBn = exports.BN_FOUR = exports.BN_THREE = exports.BN_TWO = exports.BN_ONE = exports.BN_ZERO = exports.BN = void 0;
var BN = require("bn.js");
exports.BN = BN;
var getWasmCrypto = require("./wasm-crypto").getWasmCrypto;
var getBufferCtor = function getBufferCtor() {
  var globalValue = globalThis;
  return globalValue.__polyfill_Buffer || globalValue.Buffer;
};
var normalizeHex = function normalizeHex(value) {
  return String(value || "").replace(/^0x/i, "") || "00";
};
var ensureBn = function ensureBn(value) {
  return BN.isBN(value) ? value : new BN(String(value), 10);
};
var BN_ZERO = new BN(0);
exports.BN_ZERO = BN_ZERO;
var BN_ONE = new BN(1);
exports.BN_ONE = BN_ONE;
var BN_TWO = new BN(2);
exports.BN_TWO = BN_TWO;
var BN_THREE = new BN(3);
exports.BN_THREE = BN_THREE;
var BN_FOUR = new BN(4);
exports.BN_FOUR = BN_FOUR;
var isBn = function isBn(value) {
  return BN.isBN(value);
};
exports.isBn = isBn;
var bnFromHex = function bnFromHex(value) {
  return new BN(normalizeHex(value), 16);
};
exports.bnFromHex = bnFromHex;
var bnFromNumber = function bnFromNumber(value) {
  return new BN(String(value), 10);
};
exports.bnFromNumber = bnFromNumber;
var bnFromBuffer = function bnFromBuffer(value) {
  var BufferCtor = getBufferCtor();
  var hex = BufferCtor.from(value).toString("hex");
  return new BN(hex || "00", 16);
};
exports.bnFromBuffer = bnFromBuffer;
var bnToBuffer = function bnToBuffer(value, targetLength) {
  var BufferCtor = getBufferCtor();
  var hex = ensureBn(value).toString(16);
  if (hex.length % 2 === 1) {
    hex = "0".concat(hex);
  }
  var buffer = BufferCtor.from(hex || "00", "hex");
  if (targetLength && buffer.length < targetLength) {
    buffer = BufferCtor.concat([BufferCtor.alloc(targetLength - buffer.length), buffer]);
  }
  return buffer;
};
exports.bnToBuffer = bnToBuffer;
var bnPositiveMod = function bnPositiveMod(value, modulus) {
  return ensureBn(value).umod(ensureBn(modulus));
};
exports.bnPositiveMod = bnPositiveMod;
// Cache Montgomery reduction contexts per modulus. Building the context costs
// O(n); it is reused across the multiple modexps that share the SRP prime N.
var redContextCache = {};
var getRedContext = function getRedContext(modulusBn) {
  var key = modulusBn.toString(16);
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
var bnModPow = function bnModPow(base, exponent, modulus) {
  var modulusBn = ensureBn(modulus);
  var exponentBn = ensureBn(exponent);
  if (exponentBn.isZero()) {
    return BN_ONE;
  }
  // WASM fast path: fixed 2048-bit odd modulus (all SRP modexps use prime N).
  if (!modulusBn.isEven() && modulusBn.bitLength() <= 2048) {
    var wasm = getWasmCrypto();
    if (wasm) {
      try {
        var baseBytes = Uint8Array.from(bnPositiveMod(base, modulusBn).toArray("be", 256));
        var modBytes = Uint8Array.from(modulusBn.toArray("be", 256));
        var expBytes = Uint8Array.from(exponentBn.toArray("be"));
        if (expBytes.length <= 256) {
          var outBytes = wasm.modexp(baseBytes, expBytes, modBytes);
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
    var result = BN_ONE;
    var currentBase = bnPositiveMod(base, modulusBn);
    var currentExponent = exponentBn;
    while (!currentExponent.isZero()) {
      if (currentExponent.isOdd()) {
        result = result.mul(currentBase).umod(modulusBn);
      }
      currentExponent = currentExponent.ushrn(1);
      currentBase = currentBase.mul(currentBase).umod(modulusBn);
    }
    return result;
  }
  var ctx = getRedContext(modulusBn);
  var baseRed = bnPositiveMod(base, modulusBn).toRed(ctx);
  return baseRed.redPow(exponentBn).fromRed();
};
exports.bnModPow = bnModPow;