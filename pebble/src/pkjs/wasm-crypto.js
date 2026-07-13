"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWasmCrypto = void 0;
// WebAssembly-accelerated SRP crypto. The phone PKJS runtime has no native
// crypto, so PBKDF2 (~20k HMAC-SHA256) and 2048-bit modexp ran for seconds in
// pure JS. This wraps a freestanding WASM module (tools/wasm/srpcrypto.c) that
// runs them near-native. Instantiation is synchronous and guarded — if the
// runtime lacks WebAssembly or anything fails, callers fall back to JS and the
// result is identical (verified in tools/wasm/verify.cjs).
var wasm_crypto_bytes_1 = require("./wasm-crypto-bytes");
var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64decode = function b64decode(s) {
  var lookup = new Int16Array(256);
  for (var i = 0; i < 256; i++) lookup[i] = -1;
  for (var i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS.charCodeAt(i)] = i;
  var len = s.length;
  var pad = 0;
  if (len && s.charAt(len - 1) === "=") pad++;
  if (len > 1 && s.charAt(len - 2) === "=") pad++;
  var outLen = len / 4 * 3 - pad;
  var out = new Uint8Array(outLen);
  var o = 0;
  for (var i = 0; i < len; i += 4) {
    var a = lookup[s.charCodeAt(i)];
    var b = lookup[s.charCodeAt(i + 1)];
    var c = lookup[s.charCodeAt(i + 2)];
    var d = lookup[s.charCodeAt(i + 3)];
    var trip = a << 18 | b << 12 | (c < 0 ? 0 : c) << 6 | (d < 0 ? 0 : d);
    if (o < outLen) out[o++] = trip >> 16 & 0xff;
    if (o < outLen) out[o++] = trip >> 8 & 0xff;
    if (o < outLen) out[o++] = trip & 0xff;
  }
  return out;
};
var cached; // undefined = not yet attempted
var init = function init() {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    var wa = globalThis.WebAssembly;
    if (!wa || typeof wa.Module !== "function" || typeof wa.Instance !== "function") {
      return cached;
    }
    var module = new wa.Module(b64decode(wasm_crypto_bytes_1.WASM_CRYPTO_B64));
    var instance = new wa.Instance(module, {});
    var ex_1 = instance.exports;
    if (!ex_1 || typeof ex_1.io !== "function" || typeof ex_1.modexp !== "function" || typeof ex_1.pbkdf2 !== "function") {
      return cached;
    }
    var ioPtr_1 = ex_1.io();
    var OFF_1 = {
      base: 0,
      exp: 256,
      mod: 512,
      out: 768,
      pw: 1024,
      salt: 1152,
      pout: 1280
    };
    var mem_1 = function mem_1() {
      return new Uint8Array(ex_1.memory.buffer);
    };
    var modexp = function modexp(base, exp, mod) {
      var m = mem_1();
      m.set(base, ioPtr_1 + OFF_1.base);
      m.set(exp, ioPtr_1 + OFF_1.exp);
      m.set(mod, ioPtr_1 + OFF_1.mod);
      ex_1.modexp(ioPtr_1 + OFF_1.base, ioPtr_1 + OFF_1.exp, exp.length, ioPtr_1 + OFF_1.mod, ioPtr_1 + OFF_1.out);
      return mem_1().slice(ioPtr_1 + OFF_1.out, ioPtr_1 + OFF_1.out + 256);
    };
    var pbkdf2 = function pbkdf2(pw, salt, iters) {
      var m = mem_1();
      m.set(pw, ioPtr_1 + OFF_1.pw);
      m.set(salt, ioPtr_1 + OFF_1.salt);
      ex_1.pbkdf2(ioPtr_1 + OFF_1.pw, pw.length, ioPtr_1 + OFF_1.salt, salt.length, iters, ioPtr_1 + OFF_1.pout);
      return mem_1().slice(ioPtr_1 + OFF_1.pout, ioPtr_1 + OFF_1.pout + 32);
    };
    cached = {
      modexp: modexp,
      pbkdf2: pbkdf2
    };
    console.log("wasm-crypto: initialized (native-speed SRP)");
  } catch (error) {
    console.log("wasm-crypto: init failed, using JS fallback: " + String(error));
    cached = null;
  }
  return cached;
};
var getWasmCrypto = function getWasmCrypto() {
  return init();
};
exports.getWasmCrypto = getWasmCrypto;