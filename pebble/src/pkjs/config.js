"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMockScenario = exports.getAppMode = exports.DIRECT_APPLE_BOOTSTRAP = exports.MOCK_BOOTSTRAP = exports.AUTO_SEED_LOCAL_STATE = exports.APP_NAME = void 0;
exports.APP_NAME = "FindMy for Pebble";
exports.AUTO_SEED_LOCAL_STATE = true;
var APP_MODE_VALUE = "direct_apple";
var MOCK_SCENARIO_VALUE = "healthy";
exports.MOCK_BOOTSTRAP = {
  appleId: "local-user@example.com",
  defaultDeviceId: "iphone-primary"
};
exports.DIRECT_APPLE_BOOTSTRAP = {
  appleId: "",
  defaultDeviceId: "",
  serviceRoot: "",
  dsid: "",
  clientId: "",
  playSoundUrl: "",
  cookieHeader: ""
};
var getAppMode = function getAppMode() {
  return APP_MODE_VALUE;
};
exports.getAppMode = getAppMode;
var getMockScenario = function getMockScenario() {
  return MOCK_SCENARIO_VALUE;
};
exports.getMockScenario = getMockScenario;