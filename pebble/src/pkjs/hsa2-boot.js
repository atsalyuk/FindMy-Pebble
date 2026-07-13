"use strict";

// Parses the boot_args JSON embedded in Apple's HSA2 2FA page. This is the
// only surviving piece of the retired trusted-device bridge: the boot context
// still drives 2FA routing (trusted phone number, delivery mode, auth factors).
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseHsa2BootContext = void 0;
var parseHsa2BootContext = function parseHsa2BootContext(htmlText) {
  var match = htmlText.match(/<script[^>]*class=["'][^"']*boot_args[^"']*["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) {
    throw new Error("Missing HSA2 boot args payload.");
  }
  var payload = JSON.parse(match[1]);
  var direct = payload && _typeof(payload) === "object" ? payload.direct || {} : {};
  var twoSV = direct && _typeof(direct) === "object" ? direct.twoSV || {} : {};
  var bridgeInitiateData = twoSV && _typeof(twoSV.bridgeInitiateData) === "object" ? Object.assign({}, twoSV.bridgeInitiateData) : {};
  var phoneNumberVerification = bridgeInitiateData && _typeof(bridgeInitiateData.phoneNumberVerification) === "object" ? Object.assign({}, bridgeInitiateData.phoneNumberVerification) : {};
  var trustedPhoneNumber = phoneNumberVerification.trustedPhoneNumber || (twoSV && _typeof(twoSV.trustedPhoneNumber) === "object" ? twoSV.trustedPhoneNumber : undefined);
  return {
    authInitialRoute: String(direct.authInitialRoute || ""),
    hasTrustedDevices: Boolean(direct.hasTrustedDevices),
    authFactors: Array.isArray(twoSV.authFactors) ? twoSV.authFactors.filter(function (value) {
      return typeof value === "string";
    }) : [],
    bridgeInitiateData: bridgeInitiateData,
    phoneNumberVerification: phoneNumberVerification,
    sourceAppId: twoSV.sourceAppId ? String(twoSV.sourceAppId) : undefined,
    trustedPhoneNumber: trustedPhoneNumber,
    mode: String(twoSV.mode || phoneNumberVerification.mode || "")
  };
};
exports.parseHsa2BootContext = parseHsa2BootContext;