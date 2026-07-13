"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __assign = void 0 && (void 0).__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = void 0 && (void 0).__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
var __spreadArray = void 0 && (void 0).__spreadArray || function (to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
require("./polyfills");
var hsa2_boot_1 = require("./hsa2-boot");
var _a = require("./transport"),
  APP_ACTIONS = _a.APP_ACTIONS,
  APP_MESSAGE_KEYS = _a.APP_MESSAGE_KEYS,
  APP_RESULT_CODES = _a.APP_RESULT_CODES,
  APP_STATE_CODES = _a.APP_STATE_CODES;
var _b = require("./config"),
  APP_NAME = _b.APP_NAME,
  DIRECT_APPLE_BOOTSTRAP = _b.DIRECT_APPLE_BOOTSTRAP,
  MOCK_BOOTSTRAP = _b.MOCK_BOOTSTRAP,
  getAppMode = _b.getAppMode,
  getMockScenario = _b.getMockScenario;
// Clay configuration framework — generates settings page as data: URI
var Clay = require("@rebble/clay");
var clayConfig = require("./clay-config.json");
var clayCustomFn = require("./clay-custom");
var nodeCrypto = globalThis.__polyfill_crypto || null;
var BufferCtor = globalThis.__polyfill_Buffer || null;
var getWasmCrypto = require("./wasm-crypto").getWasmCrypto;
var _c = require("./bigint"),
  BN_TWO = _c.BN_TWO,
  isBn = _c.isBn,
  bnFromBuffer = _c.bnFromBuffer,
  bnFromHex = _c.bnFromHex,
  bnModPow = _c.bnModPow,
  bnPositiveMod = _c.bnPositiveMod,
  bnToBuffer = _c.bnToBuffer;
var PKJS_READY_KEY = 15025;
// Clay instance — initialized lazily so userData can be refreshed each time
var PKJS_STORAGE_KEY = "findmy-pebble-pkjs-state-v2";
var PKJS_DIRECT_SETTINGS_KEY = "findmy-pebble-direct-settings-v1";
var PKJS_PENDING_AUTH_KEY = "findmy-pebble-pending-auth-v1";
var PKJS_PREFERENCES_KEY = "findmy-pebble-preferences-v1";
var PKJS_LOG_BUFFER_KEY = "findmy-pebble-log-buffer-v1";
var RECENT_ONLINE_WINDOW_DAYS = 30;
var MAX_LOG_BUFFER_LINES = 200;
var MAX_LOG_SHARE_LINES = 60;
var MAX_LOG_SHARE_CHARS = 4000;
var APPLE_NETWORK_TIMEOUT_MS = 20000;
var LOCATION_TIMEOUT_MS = 10000;
var LOCATION_MAX_AGE_MS = 5 * 60 * 1000;
var FMIP_CLIENT_CONTEXT_TIMEZONE = "US/Pacific";
var APPLE_AUTH_ENDPOINT = "https://idmsa.apple.com/appleauth/auth";
var APPLE_SETUP_ENDPOINT = "https://setup.icloud.com/setup/ws/1";
var APPLE_WIDGET_KEY = "d39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d";
var SRP_2048_N_HEX = "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73";
var SRP_2048_LENGTH_BYTES = 256;
var FMIP_PARAMS = {
  clientBuildNumber: "2534Project66",
  clientMasteringNumber: "2534B22"
};
var APPLE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Safari/605.1.15",
  origin: "https://www.icloud.com",
  referer: "https://www.icloud.com/",
  accept: "application/json, text/javascript, */*; q=0.01"
};
var currentState;
var currentDevices = [];
var APPLE_TIMEOUT_ERROR_MESSAGE = "Network request timed out.";
var watchPlatform = function watchPlatform() {
  var pebbleApi = Pebble;
  if (typeof pebbleApi.getActiveWatchInfo !== "function") {
    return undefined;
  }
  var watchInfo = pebbleApi.getActiveWatchInfo();
  return watchInfo && typeof watchInfo.platform === "string" ? watchInfo.platform : undefined;
};
var WATCH_DEVICE_LIMIT_DEFAULT = 10;
var watchDeviceLimit = function watchDeviceLimit() {
  return watchPlatform() === "aplite" ? 3 : WATCH_DEVICE_LIMIT_DEFAULT;
};
var devicesForWatch = function devicesForWatch(devices, defaultDeviceId) {
  var limit = watchDeviceLimit();
  if (devices.length <= limit) {
    var selectedIndex_1 = defaultDeviceId ? devices.findIndex(function (device) {
      return device.id === defaultDeviceId;
    }) : 0;
    return {
      devices: devices,
      selectedIndex: selectedIndex_1 >= 0 ? selectedIndex_1 : 0
    };
  }
  var selectedIndex = defaultDeviceId ? devices.findIndex(function (device) {
    return device.id === defaultDeviceId;
  }) : 0;
  if (selectedIndex >= 0 && selectedIndex < limit) {
    return {
      devices: devices.slice(0, limit),
      selectedIndex: selectedIndex
    };
  }
  if (selectedIndex >= limit) {
    return {
      devices: devices.slice(0, limit - 1).concat(devices[selectedIndex]),
      selectedIndex: limit - 1
    };
  }
  return {
    devices: devices.slice(0, limit),
    selectedIndex: 0
  };
};
var pendingAuthState;
// True while a login / verify / SMS operation is in flight — makes the settings
// page show a "please wait, close and reopen" screen instead of a stale form.
// Time-bounded so a missed reset can never leave the page stuck on "please wait".
var authBusy = false;
var authBusyUntilMs = 0;
var setAuthBusy = function setAuthBusy(busy) {
  authBusy = busy;
  authBusyUntilMs = busy ? nowMs() + 45000 : 0;
};
var isAuthBusy = function isAuthBusy() {
  return authBusy && nowMs() < authBusyUntilMs;
};
// A short message shown on the sign-in page after a failed attempt (e.g. bad
// credentials or the code couldn't be sent), so failures fall back cleanly.
var loginErrorNotice = "";
var cachedUserLocation;
// ── In-memory cookie jar ──────────────────────────────────────────────
// pypkjs uses Python requests.Session which shares cookies across all
// requests automatically. Real iOS PKJS does NOT — the XHR cookie store
// is ephemeral or domain-scoped. This jar accumulates Set-Cookie values
// from every Apple response and replays them on subsequent requests.
var cookieJar = {};
var nativeConsole = (typeof console === "undefined" ? "undefined" : _typeof(console)) === "object" && console ? {
  log: typeof console.log === "function" ? console.log.bind(console) : undefined,
  info: typeof console.info === "function" ? console.info.bind(console) : undefined,
  warn: typeof console.warn === "function" ? console.warn.bind(console) : undefined,
  error: typeof console.error === "function" ? console.error.bind(console) : undefined
} : {};
var sensitiveKeyPattern = /^(?:pass(?:word)?|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)$/i;
var emailPattern = /\b([A-Z0-9._%+-])[A-Z0-9._%+-]*@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
var logBuffer = function () {
  try {
    var raw = localStorage.getItem(PKJS_LOG_BUFFER_KEY);
    if (!raw) {
      return [];
    }
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(function (entry) {
      return String(entry || "");
    }).filter(function (entry) {
      return entry.length > 0;
    }).slice(-MAX_LOG_BUFFER_LINES) : [];
  } catch (_error) {
    return [];
  }
}();
var persistLogBuffer = function persistLogBuffer() {
  try {
    localStorage.setItem(PKJS_LOG_BUFFER_KEY, JSON.stringify(logBuffer.slice(-MAX_LOG_BUFFER_LINES)));
  } catch (_error) {
    // Ignore storage failures; logs are still kept in memory for this session.
  }
};
var sanitizeUrlLike = function sanitizeUrlLike(value) {
  var sanitized = String(value || "");
  sanitized = sanitized.replace(/^pebblejs:\/\/close#.*$/i, "pebblejs://close#<redacted>");
  sanitized = sanitized.replace(/^(mailto:[^?]+)\?.*$/i, "$1?<redacted>");
  sanitized = sanitized.replace(/(\/\/[^\/\s:@]+:)[^@\/\s]+@/g, "$1<redacted>@");
  sanitized = sanitized.replace(/([?&](?:password|pass|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)=)[^&#\s]*/gi, "$1<redacted>");
  if (/^https?:\/\//i.test(sanitized) && sanitized.indexOf("#") !== -1) {
    sanitized = sanitized.replace(/#.*/, "#<redacted>");
  }
  return sanitized;
};
var maskEmail = function maskEmail(value) {
  return String(value || "").replace(emailPattern, function (_match, first, domain) {
    return "".concat(String(first || ""), "***@").concat(String(domain || ""));
  });
};
var sanitizeString = function sanitizeString(value) {
  var sanitized = String(value || "");
  sanitized = sanitized.replace(/\b(?:https?|pebblejs|mailto):\/\/[^\s]+/gi, function (match) {
    return sanitizeUrlLike(match);
  });
  sanitized = sanitized.replace(/(["']?(?:password|pass|pwd|sessionToken|trustToken|token|cookie|cookieHeader|authorization|scnt|sessionId|authAttributes|dsid|clientId|appleId|email)["']?\s*[:=]\s*["']?)([^"',\s}]+)/gi, "$1<redacted>");
  sanitized = sanitized.replace(/([?&](?:password|pass|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)=)[^&#\s]*/gi, "$1<redacted>");
  sanitized = maskEmail(sanitized);
  return sanitized;
};
var _sanitizeValue = function sanitizeValue(value, seen) {
  if (seen === void 0) {
    seen = [];
  }
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (value instanceof Error) {
    return {
      name: sanitizeString(value.name || "Error"),
      message: sanitizeString(value.message || ""),
      stack: sanitizeString(value.stack || "")
    };
  }
  if (!value || _typeof(value) !== "object") {
    return value;
  }
  if (seen.indexOf(value) >= 0) {
    return "[circular]";
  }
  var nextSeen = seen.concat([value]);
  if (Array.isArray(value)) {
    return value.map(function (entry) {
      return _sanitizeValue(entry, nextSeen);
    });
  }
  var output = {};
  Object.keys(value).forEach(function (key) {
    if (sensitiveKeyPattern.test(key)) {
      output[key] = "<redacted>";
      return;
    }
    output[key] = _sanitizeValue(value[key], nextSeen);
  });
  return output;
};
var stringifyLogArg = function stringifyLogArg(value) {
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (value instanceof Error) {
    var sanitizedError = _sanitizeValue(value);
    return "".concat(sanitizedError.name, ": ").concat(sanitizedError.message);
  }
  if (_typeof(value) === "object" && value) {
    try {
      return JSON.stringify(_sanitizeValue(value));
    } catch (_error) {
      return "[unserializable]";
    }
  }
  return sanitizeString(String(value));
};
var appendLogLine = function appendLogLine(level, args) {
  var values = Array.prototype.slice.call(args).map(function (value) {
    return stringifyLogArg(value);
  });
  var line = "[".concat(new Date().toISOString(), "] ").concat(level.toUpperCase(), " ").concat(values.join(" ")).trim();
  logBuffer = logBuffer.concat([line]).slice(-MAX_LOG_BUFFER_LINES);
  persistLogBuffer();
  return values;
};
var patchConsoleMethod = function patchConsoleMethod(level) {
  var nativeMethod = nativeConsole[level] || nativeConsole.log;
  if (!nativeMethod || (typeof console === "undefined" ? "undefined" : _typeof(console)) !== "object" || !console) {
    return;
  }
  console[level] = function patchedConsoleMethod() {
    var sanitized = appendLogLine(level, arguments);
    nativeMethod(sanitized.join(" "));
  };
};
patchConsoleMethod("log");
patchConsoleMethod("info");
patchConsoleMethod("warn");
patchConsoleMethod("error");
var summarizeShareState = function summarizeShareState() {
  var state = readState();
  var pending = readPendingAuthState();
  return ["Generated: ".concat(new Date().toISOString()), "Mode: ".concat(state ? state.mode : activeMode()), "Connection: ".concat(state && state.connection ? state.connection.state : "unknown"), "Summary: ".concat(sanitizeString(state && state.connection && state.connection.summary || "Unavailable")), "Pending 2FA: ".concat(pending ? "yes" : "no"), "Device count: ".concat(state && Array.isArray(state.devices) ? state.devices.length : 0)];
};
var buildLogShareBody = function buildLogShareBody() {
  var header = __spreadArray(__spreadArray(["FindMy for Pebble logs", ""], summarizeShareState(), true), ["", "Recent sanitized logs:"], false);
  var logLines = logBuffer.slice(-MAX_LOG_SHARE_LINES);
  var body = header.concat(logLines).join("\n");
  if (body.length > MAX_LOG_SHARE_CHARS) {
    var overflow = body.length - MAX_LOG_SHARE_CHARS;
    var trimmedLogs = logLines.join("\n").slice(Math.min(overflow + 64, Math.max(logLines.join("\n").length - 256, 0)));
    body = header.concat(["[older log lines omitted]", trimmedLogs]).join("\n");
  }
  return body;
};
var stageSectionId = function stageSectionId(configStage) {
  switch (configStage) {
    case "verify":
      return "verify-section";
    case "complete":
      return "signout-section";
    case "busy":
      return "busy-section";
    default:
      return "login-section";
  }
};
var buildClayConfig = function buildClayConfig(configStage) {
  var nextConfig = JSON.parse(JSON.stringify(clayConfig));
  if (!Array.isArray(nextConfig)) {
    return nextConfig;
  }
  // The logs viewer (id "logs-widget") is populated client-side from
  // userData.logs by clay-custom — no server-side HTML injection needed here.
  var visibleSectionId = stageSectionId(configStage);
  return nextConfig.filter(function (item) {
    if (!item || _typeof(item) !== "object") {
      return false;
    }
    if (item.id === "main-heading" || item.id === "subtitle") {
      return true;
    }
    // The busy/"please wait" page stays minimal — no support or privacy blocks.
    if (configStage !== "busy" && (item.id === "support-section" || item.id === "privacy-note")) {
      return true;
    }
    if (item.id === visibleSectionId) {
      return true;
    }
    return false;
  });
};
var clearStoredLogBuffer = function clearStoredLogBuffer() {
  logBuffer = [];
  localStorage.removeItem(PKJS_LOG_BUFFER_KEY);
};
var clearCookieJar = function clearCookieJar() {
  Object.keys(cookieJar).forEach(function (key) {
    delete cookieJar[key];
  });
};
var resetAllToDefaults = function resetAllToDefaults() {
  localStorage.removeItem("clay-settings");
  clearStoredLogBuffer();
  clearStoredDirectAppleSettings();
  clearPendingAuthState();
  localStorage.removeItem(PKJS_PREFERENCES_KEY);
  clearCookieJar();
  localStorage.removeItem(PKJS_STORAGE_KEY);
  currentState = undefined;
  currentDevices = [];
  var resetState = baseDisconnectedState("direct_apple", "Direct Apple mode is not configured on the phone yet.");
  writeState(resetState);
  return resetState;
};
/** Parse Set-Cookie header(s) and merge into the jar. */
var mergeSetCookies = function mergeSetCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  // Set-Cookie may contain multiple cookies separated by comma+space,
  // but cookie values can also contain commas (e.g. dates). Split on
  // comma followed by a cookie-name= pattern to be safe.
  // Simpler approach: split on `, ` where the next part has `=` before `;`
  var cookies = setCookieHeader.split(/,\s*(?=[A-Za-z_\-]+=)/);
  cookies.forEach(function (cookie) {
    var nameValue = cookie.split(";")[0].trim(); // drop Path, Domain, etc.
    var eqIdx = nameValue.indexOf("=");
    if (eqIdx > 0) {
      var name_1 = nameValue.substring(0, eqIdx).trim();
      cookieJar[name_1] = nameValue; // store full "name=value"
    }
  });
};
/** Build a Cookie header from the jar. */
var buildCookieHeader = function buildCookieHeader() {
  return Object.keys(cookieJar).map(function (name) {
    return cookieJar[name];
  }).join("; ");
};
console.log("pkjs bootstrap loaded");
// Probe whether this runtime can run WebAssembly. If it can, the SRP crypto
// (PBKDF2 + 2048-bit modexp) can be moved to a WASM module for near-native
// speed without sending credentials off-device. Logged once at startup.
(function () {
  try {
    var wa = globalThis.WebAssembly;
    var instantiates = false;
    var validates = false;
    if (wa && typeof wa.Module === "function") {
      var emptyModule = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]);
      try {
        validates = typeof wa.validate === "function" ? !!wa.validate(emptyModule) : false;
        var mod = new wa.Module(emptyModule);
        new wa.Instance(mod);
        instantiates = true;
      } catch (_inner) {
        instantiates = false;
      }
    }
    console.log("wasm probe: WebAssembly=" + _typeof(wa) + " Module=" + (wa ? _typeof(wa.Module) : "n/a") + " validate=" + String(validates) + " instantiates=" + String(instantiates));
  } catch (error) {
    console.log("wasm probe: error " + String(error));
  }
})();
var nowIso = function nowIso() {
  return new Date().toISOString();
};
// ── Auth-flow timing instrumentation ─────────────────────────────────
// Emits "timing: <label> took <ms>ms" lines so we can see where the login
// latency actually goes (SRP crypto vs each network round-trip vs total)
// before deciding how to speed it up. Cheap and side-effect free.
var nowMs = function nowMs() {
  return typeof Date.now === "function" ? Date.now() : new Date().getTime();
};
var logTiming = function logTiming(label, startMs, extra) {
  console.log("timing: ".concat(label, " took ").concat(nowMs() - startMs, "ms").concat(extra ? " " + extra : ""));
};
// Endpoint label with the query string stripped (query can carry sensitive
// values); the console sanitizer still runs over whatever we log.
var timingEndpointLabel = function timingEndpointLabel(method, url) {
  return "".concat(method, " ").concat(String(url || "").split("?")[0]);
};
var containsPlaceholder = function containsPlaceholder(value) {
  return !value || value.includes("replace-with");
};
var randomClientId = function randomClientId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (_char) {
    var random = Math.floor(Math.random() * 16);
    var value = _char === "x" ? random : random & 0x3 | 0x8;
    return value.toString(16);
  });
};
var base64FromBuffer = function base64FromBuffer(value) {
  return BufferCtor.from(value).toString("base64");
};
var bufferFromBase64 = function bufferFromBase64(value) {
  return BufferCtor.from(value, "base64");
};
var hexFromBuffer = function hexFromBuffer(value) {
  return BufferCtor.from(value).toString("hex");
};
var parseResponseHeaders = function parseResponseHeaders(raw) {
  var headers = {};
  if (!raw) return headers;
  raw.split(/\r?\n/).forEach(function (line) {
    var separator = line.indexOf(":");
    if (separator <= 0) {
      return;
    }
    var key = line.slice(0, separator).trim().toLowerCase();
    var value = line.slice(separator + 1).trim();
    if (key) {
      headers[key] = value;
    }
  });
  return headers;
};
var parseAppleError = function parseAppleError(response) {
  var body = response.body && _typeof(response.body) === "object" ? response.body : {};
  var serviceErrors = Array.isArray(body.serviceErrors) ? body.serviceErrors : [];
  var firstServiceError = serviceErrors[0];
  var bodyMessage = firstServiceError && (firstServiceError.message || firstServiceError.errorMessage) || body.errorMessage || body.reason || body.error || "";
  var textMessage = response.text && response.text.length < 240 ? response.text : "";
  return String(bodyMessage || textMessage || "HTTP ".concat(response.status));
};
var updateSessionFieldsFromHeaders = function updateSessionFieldsFromHeaders(target, headers) {
  return Object.assign({}, target, {
    accountCountry: String(headers["x-apple-id-account-country"] || target.accountCountry || ""),
    sessionId: String(headers["x-apple-id-session-id"] || target.sessionId || ""),
    authAttributes: String(headers["x-apple-auth-attributes"] || target.authAttributes || ""),
    sessionToken: String(headers["x-apple-session-token"] || target.sessionToken || ""),
    trustToken: String(headers["x-apple-twosv-trust-token"] || target.trustToken || ""),
    scnt: String(headers.scnt || target.scnt || "")
  });
};
var baseAppleAuthHeaders = function baseAppleAuthHeaders(clientId) {
  return {
    Accept: "application/json, text/javascript",
    "Content-Type": "application/json",
    Referer: "https://idmsa.apple.com",
    "X-Apple-OAuth-Client-Id": APPLE_WIDGET_KEY,
    "X-Apple-OAuth-Client-Type": "firstPartyAuth",
    "X-Apple-OAuth-Redirect-URI": "https://www.icloud.com",
    "X-Apple-OAuth-Require-Grant-Code": "true",
    "X-Apple-OAuth-Response-Mode": "web_message",
    "X-Apple-OAuth-Response-Type": "code",
    "X-Apple-OAuth-State": clientId,
    "X-Apple-Frame-Id": clientId,
    "X-Apple-Widget-Key": APPLE_WIDGET_KEY,
    "X-Apple-FD-Client-Info": JSON.stringify({
      U: APPLE_HEADERS["user-agent"],
      L: "en-US",
      Z: "GMT+00:00",
      V: "1.1",
      F: ""
    }, null, 0)
  };
};
var buildAppleAuthHeaders = function buildAppleAuthHeaders(clientId, authState, overrides) {
  var headers = Object.assign({}, baseAppleAuthHeaders(clientId));
  if (authState && authState.scnt) {
    headers.scnt = authState.scnt;
  }
  if (authState && authState.sessionId) {
    headers["X-Apple-ID-Session-Id"] = authState.sessionId;
  }
  if (authState && authState.authAttributes) {
    headers["X-Apple-Auth-Attributes"] = authState.authAttributes;
  }
  if (overrides) {
    Object.keys(overrides).forEach(function (key) {
      headers[key] = overrides[key];
    });
  }
  return headers;
};
var formatTrustedPhoneLabel = function formatTrustedPhoneLabel(trustedPhoneNumber) {
  if (!trustedPhoneNumber || _typeof(trustedPhoneNumber) !== "object") {
    return "";
  }
  var numberWithDialCode = trustedPhoneNumber.numberWithDialCode || trustedPhoneNumber.phoneNumber;
  var obfuscatedNumber = trustedPhoneNumber.obfuscatedNumber;
  return String(numberWithDialCode || obfuscatedNumber || "");
};
var readPendingAuthState = function readPendingAuthState() {
  if (pendingAuthState) {
    return pendingAuthState;
  }
  var raw = localStorage.getItem(PKJS_PENDING_AUTH_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    pendingAuthState = JSON.parse(raw);
    return pendingAuthState;
  } catch (_error) {
    localStorage.removeItem(PKJS_PENDING_AUTH_KEY);
    return undefined;
  }
};
var writePendingAuthState = function writePendingAuthState(value) {
  pendingAuthState = value;
  localStorage.setItem(PKJS_PENDING_AUTH_KEY, JSON.stringify(value));
};
var clearPendingAuthState = function clearPendingAuthState() {
  pendingAuthState = undefined;
  localStorage.removeItem(PKJS_PENDING_AUTH_KEY);
};
var readStoredDirectAppleSettings = function readStoredDirectAppleSettings() {
  var raw = localStorage.getItem(PKJS_DIRECT_SETTINGS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(PKJS_DIRECT_SETTINGS_KEY);
    return {};
  }
};
var writeStoredDirectAppleSettings = function writeStoredDirectAppleSettings(settings) {
  localStorage.setItem(PKJS_DIRECT_SETTINGS_KEY, JSON.stringify(settings));
};
var clearStoredDirectAppleSettings = function clearStoredDirectAppleSettings() {
  localStorage.removeItem(PKJS_DIRECT_SETTINGS_KEY);
};
var readStoredPreferences = function readStoredPreferences() {
  var raw = localStorage.getItem(PKJS_PREFERENCES_KEY);
  if (!raw) {
    return {};
  }
  try {
    var parsed = JSON.parse(raw);
    return parsed.distanceUnit === "kilometers" ? {
      distanceUnit: "kilometers"
    } : {
      distanceUnit: "miles"
    };
  } catch (_error) {
    localStorage.removeItem(PKJS_PREFERENCES_KEY);
    return {};
  }
};
var resolvedDistanceUnit = function resolvedDistanceUnit() {
  return readStoredPreferences().distanceUnit || "miles";
};
var writeStoredPreferences = function writeStoredPreferences(preferences) {
  localStorage.setItem(PKJS_PREFERENCES_KEY, JSON.stringify(preferences));
};
var persistDirectAppleSession = function persistDirectAppleSession(session) {
  writeStoredDirectAppleSettings({
    appleId: session.appleId,
    defaultDeviceId: session.defaultDeviceId,
    serviceRoot: String(session.serviceRoot || ""),
    dsid: String(session.dsid || ""),
    clientId: String(session.clientId || ""),
    cookieHeader: String(session.cookieHeader || ""),
    playSoundUrl: String(session.playSoundUrl || ""),
    sessionToken: String(session.sessionToken || ""),
    trustToken: String(session.trustToken || ""),
    accountCountry: String(session.accountCountry || ""),
    scnt: String(session.scnt || ""),
    sessionId: String(session.sessionId || ""),
    authAttributes: String(session.authAttributes || ""),
    password: String(session.password || readStoredDirectAppleSettings().password || "")
  });
};
var resolvedDirectAppleSettings = function resolvedDirectAppleSettings() {
  var stored = readStoredDirectAppleSettings();
  return {
    appleId: String(stored.appleId || DIRECT_APPLE_BOOTSTRAP.appleId || ""),
    defaultDeviceId: String(stored.defaultDeviceId || DIRECT_APPLE_BOOTSTRAP.defaultDeviceId || ""),
    serviceRoot: String(stored.serviceRoot || DIRECT_APPLE_BOOTSTRAP.serviceRoot || ""),
    dsid: String(stored.dsid || DIRECT_APPLE_BOOTSTRAP.dsid || ""),
    clientId: String(stored.clientId || DIRECT_APPLE_BOOTSTRAP.clientId || ""),
    cookieHeader: String(stored.cookieHeader || DIRECT_APPLE_BOOTSTRAP.cookieHeader || ""),
    playSoundUrl: String(stored.playSoundUrl || DIRECT_APPLE_BOOTSTRAP.playSoundUrl || ""),
    sessionToken: stored.sessionToken ? String(stored.sessionToken) : "",
    trustToken: stored.trustToken ? String(stored.trustToken) : "",
    accountCountry: stored.accountCountry ? String(stored.accountCountry) : "",
    scnt: stored.scnt ? String(stored.scnt) : "",
    sessionId: stored.sessionId ? String(stored.sessionId) : "",
    authAttributes: stored.authAttributes ? String(stored.authAttributes) : "",
    password: stored.password ? String(stored.password) : ""
  };
};
var directAppleConfigured = function directAppleConfigured() {
  var settings = resolvedDirectAppleSettings();
  if (containsPlaceholder(settings.appleId) || containsPlaceholder(settings.clientId)) {
    return false;
  }
  if (!containsPlaceholder(settings.sessionToken)) {
    return true;
  }
  return !containsPlaceholder(settings.serviceRoot) && !containsPlaceholder(settings.dsid) && (!containsPlaceholder(settings.cookieHeader) || !containsPlaceholder(settings.sessionToken));
};
var hasCompleteDirectAppleSession = function hasCompleteDirectAppleSession(settings) {
  return !containsPlaceholder(settings.appleId) && !containsPlaceholder(settings.clientId) && !containsPlaceholder(settings.sessionToken) && !containsPlaceholder(settings.serviceRoot) && !containsPlaceholder(settings.dsid);
};
var getConfigStage = function getConfigStage(settings, pending) {
  // A pending 2FA challenge takes priority: a stale complete session from a
  // previous sign-in would otherwise make this read as "signed in" and skip the
  // code-entry page while the user is mid-verification.
  if (pending) {
    return "verify";
  }
  if (hasCompleteDirectAppleSession(settings)) {
    return "complete";
  }
  return "credentials";
};
var activeMode = function activeMode() {
  var configuredMode = getAppMode();
  if (configuredMode === "direct_apple") {
    return "direct_apple";
  }
  return "mock_local";
};
var srpPrimeN = bnFromHex(SRP_2048_N_HEX);
var srpGenerator = BN_TWO;
var bufferConcat = function bufferConcat(parts) {
  return BufferCtor.concat(parts.map(function (part) {
    return BufferCtor.from(part);
  }));
};
var sha256Buffer = function sha256Buffer() {
  var parts = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    parts[_i] = arguments[_i];
  }
  var hash = nodeCrypto.createHash("sha256");
  parts.forEach(function (part) {
    hash.update(BufferCtor.from(part));
  });
  return hash.digest();
};
var positiveMod = function positiveMod(value, modulus) {
  return bnPositiveMod(value, modulus);
};
var modPow = function modPow(base, exponent, modulus) {
  return bnModPow(base, exponent, modulus);
};
var bigIntFromBuffer = function bigIntFromBuffer(value) {
  return bnFromBuffer(value);
};
var bufferFromBigInt = function bufferFromBigInt(value, targetLength) {
  return bnToBuffer(value, targetLength);
};
var padToN = function padToN(value) {
  var buffer = isBn(value) ? bufferFromBigInt(value) : BufferCtor.from(value);
  if (buffer.length >= SRP_2048_LENGTH_BYTES) {
    return buffer;
  }
  return bufferConcat([BufferCtor.alloc(SRP_2048_LENGTH_BYTES - buffer.length), buffer]);
};
var computeSrpMultiplierK = function computeSrpMultiplierK() {
  return bigIntFromBuffer(sha256Buffer(padToN(srpPrimeN), padToN(srpGenerator)));
};
var deriveAppleSrpPassword = function deriveAppleSrpPassword(password, salt, iterations, protocol) {
  var passwordHash = nodeCrypto.createHash("sha256").update(String(password), "utf8").digest();
  var passwordDigest = passwordHash;
  if (protocol === "s2k_fo") {
    passwordDigest = BufferCtor.from(passwordHash.toString("hex"), "utf8");
  }
  if (protocol !== "s2k" && protocol !== "s2k_fo") {
    throw new Error("Unsupported Apple SRP protocol: ".concat(protocol));
  }
  var wasm = getWasmCrypto();
  if (wasm) {
    try {
      var pwU8 = passwordDigest instanceof Uint8Array ? passwordDigest : new Uint8Array(Array.prototype.slice.call(passwordDigest));
      var saltU8 = salt instanceof Uint8Array ? salt : new Uint8Array(Array.prototype.slice.call(salt));
      return BufferCtor.from(wasm.pbkdf2(pwU8, saltU8, iterations));
    } catch (_error) {
      // fall back to the JS implementation below
    }
  }
  return nodeCrypto.pbkdf2Sync(passwordDigest, salt, iterations, 32, "sha256");
};
var sendResponse = function sendResponse(payload, logFailure) {
  if (logFailure === void 0) {
    logFailure = true;
  }
  if (typeof Pebble.sendAppMessage !== "function") {
    if (logFailure) {
      console.log("Pebble.sendAppMessage is unavailable");
    }
    return;
  }
  Pebble.sendAppMessage(payload, undefined, function (event) {
    if (logFailure) {
      console.log("pkjs reply failed: ".concat(JSON.stringify(event)));
    }
  });
};
var sendReadyAck = function sendReadyAck() {
  var _a;
  sendResponse((_a = {}, _a[PKJS_READY_KEY] = 1, _a), false);
};
var encodeStateCode = function encodeStateCode(state) {
  switch (state) {
    case "disconnected":
      return APP_STATE_CODES.disconnected;
    case "connecting":
      return APP_STATE_CODES.connecting;
    case "connected":
      return APP_STATE_CODES.connected;
    case "needs_reauth":
      return APP_STATE_CODES.needsReauth;
    default:
      return APP_STATE_CODES.degraded;
  }
};
var encodeResultCode = function encodeResultCode(result) {
  switch (result) {
    case "success":
      return APP_RESULT_CODES.success;
    case "reconnect_needed":
      return APP_RESULT_CODES.reconnectNeeded;
    default:
      return APP_RESULT_CODES.failure;
  }
};
var stripTransientAppleSessionState = function stripTransientAppleSessionState(session) {
  var sanitized = Object.assign({}, session);
  delete sanitized.serverContext;
  return sanitized;
};
var stateForPersistence = function stateForPersistence(state) {
  return state.mode === "direct_apple" && state.session ? Object.assign({}, state, {
    session: stripTransientAppleSessionState(state.session)
  }) : state;
};
var isNetworkTimeoutError = function isNetworkTimeoutError(error) {
  return error instanceof Error && error.message === APPLE_TIMEOUT_ERROR_MESSAGE;
};
var writeState = function writeState(state) {
  currentState = state;
  currentDevices = state.devices;
  localStorage.setItem(PKJS_STORAGE_KEY, JSON.stringify(stateForPersistence(state)));
};
var readState = function readState() {
  if (currentState) {
    return currentState;
  }
  var raw = localStorage.getItem(PKJS_STORAGE_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    var parsed = JSON.parse(raw);
    currentState = parsed;
    currentDevices = parsed.devices;
    return parsed;
  } catch (_error) {
    localStorage.removeItem(PKJS_STORAGE_KEY);
    return undefined;
  }
};
var baseDisconnectedState = function baseDisconnectedState(provider, summary) {
  return {
    mode: provider === "direct_apple" ? "direct_apple" : "mock_local",
    devices: [],
    connection: {
      state: "disconnected",
      summary: summary,
      provider: provider
    }
  };
};
var seedMockState = function seedMockState() {
  var scenario = getMockScenario();
  var updatedAt = nowIso();
  var devices = [{
    id: "iphone-primary",
    name: "Local iPhone",
    deviceClass: "iPhone",
    batteryLevelPercent: 84,
    distanceMeters: 420
  }, {
    id: "ipad-desk",
    name: "Desk iPad",
    deviceClass: "iPad",
    batteryLevelPercent: 63,
    distanceMeters: 18
  }, {
    id: "macbook-pro",
    name: "MacBook Pro",
    deviceClass: "Mac",
    batteryLevelPercent: 51,
    distanceMeters: 1200
  }];
  var state = scenario === "expired" ? "needs_reauth" : scenario === "degraded" ? "degraded" : "connected";
  return {
    mode: "mock_local",
    devices: devices,
    session: {
      provider: "mock_local",
      appleId: MOCK_BOOTSTRAP.appleId,
      createdAt: updatedAt,
      updatedAt: updatedAt,
      defaultDeviceId: MOCK_BOOTSTRAP.defaultDeviceId,
      scenario: scenario
    },
    connection: {
      state: state,
      summary: scenario === "expired" ? "Phone-side mock session requires reconnect." : scenario === "degraded" ? "Phone-side mock session is usable but stale." : "Phone-side mock session is ready.",
      provider: "mock_local",
      lastCheckedAt: updatedAt,
      defaultDeviceId: MOCK_BOOTSTRAP.defaultDeviceId
    }
  };
};
var seedDirectAppleState = function seedDirectAppleState() {
  var settings = resolvedDirectAppleSettings();
  var pending = readPendingAuthState();
  if (pending && pending.appleId === settings.appleId) {
    var updatedAt_1 = nowIso();
    return {
      mode: "direct_apple",
      devices: [],
      session: {
        provider: "direct_apple",
        appleId: pending.appleId,
        createdAt: updatedAt_1,
        updatedAt: updatedAt_1,
        defaultDeviceId: settings.defaultDeviceId,
        playSoundUrl: settings.playSoundUrl,
        cookieHeader: settings.cookieHeader,
        serviceRoot: settings.serviceRoot,
        dsid: settings.dsid,
        clientId: pending.clientId,
        sessionToken: pending.sessionToken,
        trustToken: pending.trustToken,
        accountCountry: pending.accountCountry,
        scnt: pending.scnt,
        sessionId: pending.sessionId,
        authAttributes: pending.authAttributes
      },
      connection: {
        state: "needs_reauth",
        summary: "Apple sign-in needs a 2FA code in phone settings.",
        provider: "direct_apple",
        lastCheckedAt: updatedAt_1,
        defaultDeviceId: settings.defaultDeviceId
      }
    };
  }
  if (!directAppleConfigured()) {
    return baseDisconnectedState("direct_apple", "Direct Apple mode is not configured on the phone yet.");
  }
  var updatedAt = nowIso();
  return {
    mode: "direct_apple",
    devices: [],
    session: {
      provider: "direct_apple",
      appleId: settings.appleId,
      createdAt: updatedAt,
      updatedAt: updatedAt,
      defaultDeviceId: settings.defaultDeviceId,
      playSoundUrl: settings.playSoundUrl,
      cookieHeader: settings.cookieHeader,
      serviceRoot: settings.serviceRoot,
      dsid: settings.dsid,
      clientId: settings.clientId,
      sessionToken: settings.sessionToken,
      trustToken: settings.trustToken,
      accountCountry: settings.accountCountry,
      scnt: settings.scnt,
      sessionId: settings.sessionId,
      authAttributes: settings.authAttributes,
      password: settings.password
    },
    connection: {
      state: "connecting",
      summary: "Phone-side Apple session is configured. Syncing Find My devices...",
      provider: "direct_apple",
      lastCheckedAt: updatedAt,
      defaultDeviceId: settings.defaultDeviceId
    }
  };
};
var buildClayUrl = function buildClayUrl() {
  var pending = readPendingAuthState();
  var settings = resolvedDirectAppleSettings();
  // While an auth operation is running, show a "please wait" page instead of a
  // form that may be mid-transition — the user is told to close and reopen.
  var configStage = isAuthBusy() ? "busy" : getConfigStage(settings, pending);
  var resolvedClayConfig = buildClayConfig(configStage);
  // Create a new Clay instance each time so userData reflects current state
  var clayUserData = {
    configStage: configStage,
    appleId: settings.appleId || "",
    distanceUnit: resolvedDistanceUnit(),
    pendingMode: pending ? pending.deliveryMethod || pending.mode || "" : "",
    pendingNotice: pending ? pending.deliveryNotice || "Enter your Apple verification code." : "",
    loginError: loginErrorNotice || "",
    // Sanitized recent logs, shown in-page by the collapsible logs viewer.
    logs: buildLogShareBody()
  };
  var clay = new Clay(resolvedClayConfig, clayCustomFn, {
    autoHandleEvents: false,
    userData: clayUserData
  });
  // Clay only copies userData into `meta` on its "ready" handler when
  // autoHandleEvents is false — but we call generateUrl() immediately, so the
  // config page would otherwise receive an empty userData (every stage would
  // fall back to defaults, and userData-only pages like "busy" render blank).
  // Populate meta ourselves, mirroring what Clay's internal setup does.
  try {
    var pebbleApi = Pebble;
    clay.meta = {
      activeWatchInfo: typeof pebbleApi.getActiveWatchInfo === "function" ? pebbleApi.getActiveWatchInfo() : null,
      accountToken: typeof pebbleApi.getAccountToken === "function" ? pebbleApi.getAccountToken() : "",
      watchToken: typeof pebbleApi.getWatchToken === "function" ? pebbleApi.getWatchToken() : "",
      userData: clayUserData
    };
  } catch (_metaError) {
    clay.meta = clay.meta || {};
    clay.meta.userData = clayUserData;
  }
  var url = clay.generateUrl();
  // Diagnostic: log the shape of the Pebble host object so we can tell which
  // app (Core Devices vs legacy Rebble) is actually running and whether the
  // old firmware-sniff heuristic was reliable.
  try {
    var pebbleAny = Pebble;
    var keys = _typeof(pebbleAny) === "object" && pebbleAny ? Object.keys(pebbleAny) : [];
    console.log("config: host probe firmware=" + _typeof(pebbleAny.firmware) + " getActiveWatchInfo=" + _typeof(pebbleAny.getActiveWatchInfo) + " platform=" + String(watchPlatform() || "?") + " urlScheme=" + url.slice(0, 5) + " keys=" + keys.join(","));
  } catch (_error) {
    // ignore probe failures
  }
  // The modern Core Devices app (which is what supports Dev Connect and is the
  // only app still shipping) handles data: URIs natively. The old firmware
  // sniff misclassified Core Devices as legacy Rebble and routed the config
  // page through http://clay.pebble.com.s3-website-us-west-2.amazonaws.com/ —
  // a dead legacy S3 asset whose buttons never dispatch. Serve the data: URI
  // directly instead.
  return url;
};
var applyDirectAppleSettings = function applyDirectAppleSettings(settings) {
  if (settings) {
    writeStoredDirectAppleSettings(settings);
  } else {
    clearStoredDirectAppleSettings();
    clearPendingAuthState();
  }
  currentState = undefined;
  currentDevices = [];
  if (settings) {
    writeState(seedDirectAppleState());
    return;
  }
  var resetState = baseDisconnectedState("direct_apple", "Direct Apple mode is not configured on the phone yet.");
  writeState(resetState);
};
var ensureState = function ensureState() {
  var mode = activeMode();
  var existing = readState();
  if (existing && existing.mode === mode) {
    return existing;
  }
  var seeded = mode === "direct_apple" ? seedDirectAppleState() : seedMockState();
  writeState(seeded);
  return seeded;
};
var sendDeviceSync = function sendDeviceSync(state) {
  var _a;
  var watchSync = devicesForWatch(state.devices, state.connection.defaultDeviceId);
  currentDevices = watchSync.devices;
  sendResponse((_a = {}, _a[APP_MESSAGE_KEYS.state] = encodeStateCode(state.connection.state), _a[APP_MESSAGE_KEYS.devices] = JSON.stringify(watchSync.devices.map(function (device) {
    return [device.name, device.deviceClass, formatDistanceText(device.distanceMeters), formatBatteryText(device.batteryLevelPercent, device.isCharging)];
  })), _a[APP_MESSAGE_KEYS.selectedIndex] = watchSync.selectedIndex, _a));
};
var sendResetSync = function sendResetSync(state) {
  var _a;
  currentDevices = [];
  sendResponse((_a = {}, _a[APP_MESSAGE_KEYS.reset] = 1, _a[APP_MESSAGE_KEYS.state] = encodeStateCode(state.connection.state), _a[APP_MESSAGE_KEYS.devices] = JSON.stringify([]), _a[APP_MESSAGE_KEYS.selectedIndex] = 0, _a));
};
var sendPingStatus = function sendPingStatus(result, detail, connection) {
  var _a;
  void detail;
  sendResponse((_a = {}, _a[APP_MESSAGE_KEYS.result] = encodeResultCode(result), _a[APP_MESSAGE_KEYS.state] = encodeStateCode(connection.state), _a));
};
var findSelectedIndex = function findSelectedIndex(defaultDeviceId) {
  if (!defaultDeviceId) {
    return 0;
  }
  var index = currentDevices.findIndex(function (device) {
    return device.id === defaultDeviceId;
  });
  return index >= 0 ? index : 0;
};
var normalizeDeviceClass = function normalizeDeviceClass(value) {
  var normalized = String(value || "").toLowerCase();
  if (normalized.includes("ipad")) {
    return "iPad";
  }
  if (normalized.includes("mac")) {
    return "Mac";
  }
  if (normalized.includes("iphone")) {
    return "iPhone";
  }
  return null;
};
var coerceNumber = function coerceNumber(value) {
  if (typeof value === "number" && isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    var trimmed = value.trim();
    var normalized = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
    var parsed = Number(normalized);
    return isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};
var normalizeBatteryLevelPercent = function normalizeBatteryLevelPercent(value) {
  var numeric = coerceNumber(value);
  if (typeof numeric !== "number") {
    return undefined;
  }
  if (numeric >= 0 && numeric <= 1.01) {
    return Math.max(0, Math.min(100, Math.round(numeric * 100)));
  }
  if (numeric >= 0 && numeric <= 100) {
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }
  return undefined;
};
var normalizeBatteryStatus = function normalizeBatteryStatus(value) {
  return String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
};
var coerceBooleanish = function coerceBooleanish(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return undefined;
  }
  var normalized = String(value || "").toLowerCase().trim().replace(/[\s_-]+/g, "");
  if (!normalized) {
    return undefined;
  }
  if (normalized === "true" || normalized === "yes" || normalized === "on" || normalized === "1" || normalized === "charging" || normalized === "charged" || normalized === "full" || normalized === "fullycharged" || normalized === "fullcharge" || normalized === "accharging" || normalized === "wirelesscharging") {
    return true;
  }
  if (normalized === "false" || normalized === "no" || normalized === "off" || normalized === "0" || normalized === "notcharging" || normalized === "discharging" || normalized === "unplugged" || normalized === "battery") {
    return false;
  }
  return undefined;
};
var extractBatteryLevelPercent = function extractBatteryLevelPercent(device) {
  var battery = device && _typeof(device.battery) === "object" ? device.battery : undefined;
  var batteryInfo = device && _typeof(device.batteryInfo) === "object" ? device.batteryInfo : undefined;
  var batteryStatus = normalizeBatteryStatus(device.batteryStatus || device.batteryState || device.batteryChargingStatus || battery && (battery.status || battery.state || battery.batteryStatus || battery.chargingStatus) || batteryInfo && (batteryInfo.status || batteryInfo.state || batteryInfo.batteryStatus || batteryInfo.chargingStatus) || "");
  var numericCandidates = [device.batteryLevelPercent, device.batteryLevel, device.batteryPercentage, device.batteryPercent, device.batteryLevelValue, batteryInfo && batteryInfo.batteryLevel, batteryInfo && batteryInfo.level, batteryInfo && batteryInfo.batteryPercentage, batteryInfo && batteryInfo.percent, battery && battery.batteryLevel, battery && battery.level, battery && battery.batteryPercentage, battery && battery.percent, battery && battery.value];
  for (var _i = 0, numericCandidates_1 = numericCandidates; _i < numericCandidates_1.length; _i++) {
    var candidate = numericCandidates_1[_i];
    var normalized = normalizeBatteryLevelPercent(candidate);
    if (typeof normalized === "number") {
      if (normalized === 0 && (!batteryStatus || batteryStatus === "unknown")) {
        continue;
      }
      return normalized;
    }
  }
  if (batteryStatus === "charged" || batteryStatus === "full" || batteryStatus === "fullycharged" || batteryStatus === "fullcharge") {
    return 100;
  }
  return undefined;
};
var extractBatteryCharging = function extractBatteryCharging(device) {
  var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
  var battery = device && _typeof(device.battery) === "object" ? device.battery : undefined;
  var batteryInfo = device && _typeof(device.batteryInfo) === "object" ? device.batteryInfo : undefined;
  var batteryStatus = normalizeBatteryStatus(device.batteryStatus || device.batteryState || device.batteryChargingStatus || device.chargeStatus || device.chargingState || device.powerSource || battery && (battery.status || battery.state || battery.batteryStatus || battery.chargingStatus) || battery && (battery.chargeStatus || battery.chargingState || battery.powerSource) || batteryInfo && (batteryInfo.status || batteryInfo.state || batteryInfo.batteryStatus || batteryInfo.chargingStatus) || batteryInfo && (batteryInfo.chargeStatus || batteryInfo.chargingState || batteryInfo.powerSource) || "");
  var booleanCandidates = [device.isCharging, device.isBatteryCharging, device.batteryCharging, device.charging, device.externalPowerConnected, device.powerConnected, device.isPluggedIn, batteryInfo && ((_a = batteryInfo.isCharging) !== null && _a !== void 0 ? _a : batteryInfo.charging), batteryInfo && ((_c = (_b = batteryInfo.externalPowerConnected) !== null && _b !== void 0 ? _b : batteryInfo.powerConnected) !== null && _c !== void 0 ? _c : batteryInfo.isPluggedIn), battery && ((_d = battery.isCharging) !== null && _d !== void 0 ? _d : battery.charging), battery && ((_g = (_f = battery.externalPowerConnected) !== null && _f !== void 0 ? _f : battery.powerConnected) !== null && _g !== void 0 ? _g : battery.isPluggedIn), device.batteryStatus, device.batteryState, device.batteryChargingStatus, device.chargeStatus, device.chargingState, device.powerSource, batteryInfo && ((_o = (_m = (_l = (_k = (_j = (_h = batteryInfo.status) !== null && _h !== void 0 ? _h : batteryInfo.state) !== null && _j !== void 0 ? _j : batteryInfo.batteryStatus) !== null && _k !== void 0 ? _k : batteryInfo.chargingStatus) !== null && _l !== void 0 ? _l : batteryInfo.chargeStatus) !== null && _m !== void 0 ? _m : batteryInfo.chargingState) !== null && _o !== void 0 ? _o : batteryInfo.powerSource), battery && ((_u = (_t = (_s = (_r = (_q = (_p = battery.status) !== null && _p !== void 0 ? _p : battery.state) !== null && _q !== void 0 ? _q : battery.batteryStatus) !== null && _r !== void 0 ? _r : battery.chargingStatus) !== null && _s !== void 0 ? _s : battery.chargeStatus) !== null && _t !== void 0 ? _t : battery.chargingState) !== null && _u !== void 0 ? _u : battery.powerSource)];
  for (var _i = 0, booleanCandidates_1 = booleanCandidates; _i < booleanCandidates_1.length; _i++) {
    var candidate = booleanCandidates_1[_i];
    var normalized = coerceBooleanish(candidate);
    if (typeof normalized === "boolean") {
      return normalized;
    }
  }
  return batteryStatus.indexOf("charging") >= 0 || batteryStatus.indexOf("charged") >= 0 || batteryStatus === "full" || batteryStatus.indexOf("fullcharge") >= 0;
};
var batteryDebugSnapshot = function batteryDebugSnapshot(device) {
  var battery = device && _typeof(device.battery) === "object" ? device.battery : undefined;
  var batteryInfo = device && _typeof(device.batteryInfo) === "object" ? device.batteryInfo : undefined;
  return {
    name: String(device.name || device.deviceDisplayName || "Unnamed device"),
    id: String(device.id || ""),
    root: {
      batteryStatus: device.batteryStatus,
      batteryState: device.batteryState,
      batteryChargingStatus: device.batteryChargingStatus,
      chargeStatus: device.chargeStatus,
      chargingState: device.chargingState,
      powerSource: device.powerSource,
      isCharging: device.isCharging,
      isBatteryCharging: device.isBatteryCharging,
      batteryCharging: device.batteryCharging,
      charging: device.charging,
      externalPowerConnected: device.externalPowerConnected,
      powerConnected: device.powerConnected,
      isPluggedIn: device.isPluggedIn,
      batteryLevelPercent: device.batteryLevelPercent,
      batteryLevel: device.batteryLevel,
      batteryPercentage: device.batteryPercentage,
      batteryPercent: device.batteryPercent,
      batteryLevelValue: device.batteryLevelValue
    },
    battery: battery ? {
      status: battery.status,
      state: battery.state,
      batteryStatus: battery.batteryStatus,
      chargingStatus: battery.chargingStatus,
      chargeStatus: battery.chargeStatus,
      chargingState: battery.chargingState,
      powerSource: battery.powerSource,
      isCharging: battery.isCharging,
      charging: battery.charging,
      externalPowerConnected: battery.externalPowerConnected,
      powerConnected: battery.powerConnected,
      isPluggedIn: battery.isPluggedIn,
      batteryLevel: battery.batteryLevel,
      level: battery.level,
      batteryPercentage: battery.batteryPercentage,
      percent: battery.percent,
      value: battery.value
    } : undefined,
    batteryInfo: batteryInfo ? {
      status: batteryInfo.status,
      state: batteryInfo.state,
      batteryStatus: batteryInfo.batteryStatus,
      chargingStatus: batteryInfo.chargingStatus,
      chargeStatus: batteryInfo.chargeStatus,
      chargingState: batteryInfo.chargingState,
      powerSource: batteryInfo.powerSource,
      isCharging: batteryInfo.isCharging,
      charging: batteryInfo.charging,
      externalPowerConnected: batteryInfo.externalPowerConnected,
      powerConnected: batteryInfo.powerConnected,
      isPluggedIn: batteryInfo.isPluggedIn,
      batteryLevel: batteryInfo.batteryLevel,
      level: batteryInfo.level,
      batteryPercentage: batteryInfo.batteryPercentage,
      percent: batteryInfo.percent
    } : undefined
  };
};
var extractCoordinates = function extractCoordinates(device) {
  var location = device.location;
  if (!location || _typeof(location) !== "object") {
    return undefined;
  }
  var latitude = coerceNumber(location.latitude);
  var longitude = coerceNumber(location.longitude);
  if (typeof latitude === "number" && typeof longitude === "number") {
    return {
      latitude: latitude,
      longitude: longitude
    };
  }
  return undefined;
};
var readCurrentUserLocation = function readCurrentUserLocation() {
  return new Promise(function (resolve) {
    var now = Date.now();
    if (cachedUserLocation && now - cachedUserLocation.capturedAt <= LOCATION_MAX_AGE_MS) {
      resolve(cachedUserLocation);
      return;
    }
    if ((typeof navigator === "undefined" ? "undefined" : _typeof(navigator)) !== "object" || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
      resolve(cachedUserLocation);
      return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      cachedUserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        capturedAt: now
      };
      resolve(cachedUserLocation);
    }, function (error) {
      console.log("geolocation: unable to read current position: " + String(error && error.message ? error.message : error));
      resolve(cachedUserLocation);
    }, {
      enableHighAccuracy: false,
      timeout: LOCATION_TIMEOUT_MS,
      maximumAge: LOCATION_MAX_AGE_MS
    });
  });
};
var distanceBetweenMeters = function distanceBetweenMeters(from, to) {
  var earthRadiusMeters = 6371000;
  var toRadians = function toRadians(value) {
    return value * Math.PI / 180;
  };
  var deltaLat = toRadians(to.latitude - from.latitude);
  var deltaLon = toRadians(to.longitude - from.longitude);
  var fromLat = toRadians(from.latitude);
  var toLat = toRadians(to.latitude);
  var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};
var formatDistanceText = function formatDistanceText(distanceMeters) {
  if (typeof distanceMeters !== "number" || !isFinite(distanceMeters)) {
    return "Distance unknown";
  }
  if (resolvedDistanceUnit() === "miles") {
    if (distanceMeters < 160.934) {
      var feet = Math.max(10, Math.round(distanceMeters * 3.28084 / 10) * 10);
      return "".concat(feet, " ft away");
    }
    var miles = distanceMeters / 1609.344;
    return miles < 10 ? "".concat(miles.toFixed(1), " mi away") : "".concat(Math.round(miles), " mi away");
  }
  if (distanceMeters < 1000) {
    return "".concat(Math.round(distanceMeters / 10) * 10, " m away");
  }
  var kilometers = distanceMeters / 1000;
  return kilometers < 10 ? "".concat(kilometers.toFixed(1), " km away") : "".concat(Math.round(kilometers), " km away");
};
var formatBatteryText = function formatBatteryText(batteryLevelPercent, isCharging) {
  var base = typeof batteryLevelPercent === "number" && isFinite(batteryLevelPercent) ? "".concat(Math.round(batteryLevelPercent), "% battery") : "Battery unknown";
  return isCharging ? "".concat(base, " charging") : base;
};
var recentOnlineCutoffMs = function recentOnlineCutoffMs() {
  return Date.now() - RECENT_ONLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};
var deviceLastSeenMs = function deviceLastSeenMs(device) {
  var location = device.location;
  if (location && _typeof(location) === "object") {
    for (var _i = 0, _a = ["timeStamp", "secureLocationTs"]; _i < _a.length; _i++) {
      var key = _a[_i];
      var value = location[key];
      if (typeof value === "number") {
        return value;
      }
    }
  }
  for (var _b = 0, _c = ["lastLocatedTime", "lastLocationTime", "lastSeenTimestamp", "lastSeenTime"]; _b < _c.length; _b++) {
    var key = _c[_b];
    var value = device[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
};
var isVisibleWatchTarget = function isVisibleWatchTarget(device) {
  if (!device.features || !device.features.SND) {
    return false;
  }
  return normalizeDeviceClass(device.deviceClass) !== null;
};
var isRecentlyOnline = function isRecentlyOnline(device) {
  var lastSeenMs = deviceLastSeenMs(device);
  return typeof lastSeenMs === "number" && lastSeenMs >= recentOnlineCutoffMs();
};
var summarizeDevice = function summarizeDevice(device, userLocation) {
  var deviceClass = normalizeDeviceClass(device.deviceClass);
  if (!deviceClass) {
    return undefined;
  }
  var coordinates = extractCoordinates(device);
  var batteryLevelPercent = extractBatteryLevelPercent(device);
  var isCharging = extractBatteryCharging(device);
  console.log("battery_debug: " + JSON.stringify(__assign(__assign({}, batteryDebugSnapshot(device)), {
    derived: {
      batteryLevelPercent: batteryLevelPercent,
      isCharging: isCharging
    }
  })));
  return {
    id: String(device.id || ""),
    name: String(device.name || device.deviceDisplayName || "Unnamed device"),
    deviceClass: deviceClass,
    batteryLevelPercent: batteryLevelPercent,
    isCharging: isCharging,
    distanceMeters: coordinates && userLocation ? Math.round(distanceBetweenMeters(userLocation, coordinates)) : undefined
  };
};
var buildQuery = function buildQuery(params) {
  return Object.keys(params).filter(function (key) {
    return params[key] !== undefined && params[key] !== "";
  }).map(function (key) {
    return "".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(String(params[key])));
  }).join("&");
};
var requestJson = function requestJson(method, url, params, headers, body) {
  if (params === void 0) {
    params = {};
  }
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var query = buildQuery(params);
    var requestUrl = query ? "".concat(url, "?").concat(query) : url;
    var requestStartedMs = nowMs();
    var timingLabel = timingEndpointLabel(method, url);
    var settled = false;
    var finishResolve = function finishResolve(value) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdogTimer);
      logTiming(timingLabel, requestStartedMs, "-> " + value.status);
      resolve(value);
    };
    var finishReject = function finishReject(error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdogTimer);
      logTiming(timingLabel, requestStartedMs, "-> error");
      reject(error);
    };
    var watchdogTimer = setTimeout(function () {
      console.log("requestJson: watchdog timeout for " + requestUrl);
      try {
        xhr.abort();
      } catch (_error) {
        // Ignore abort failures from older PKJS runtimes.
      }
      finishReject(new Error(APPLE_TIMEOUT_ERROR_MESSAGE));
    }, APPLE_NETWORK_TIMEOUT_MS);
    xhr.open(method, requestUrl, true);
    xhr.timeout = APPLE_NETWORK_TIMEOUT_MS;
    xhr.withCredentials = true;
    // Inject accumulated cookies from the jar (real iOS PKJS doesn't
    // share cookies cross-domain the way pypkjs/Python requests.Session does)
    var jarCookies = buildCookieHeader();
    if (jarCookies) {
      xhr.setRequestHeader("Cookie", jarCookies);
    }
    Object.keys(headers).forEach(function (key) {
      // Don't override the Cookie header we just set from the jar
      if (key.toLowerCase() === "cookie") return;
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      var text = xhr.responseText || "";
      var parsed = undefined;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch (_error) {
          parsed = undefined;
        }
      }
      var headers = parseResponseHeaders(xhr.getAllResponseHeaders());
      // pypkjs's getAllResponseHeaders() may return null, but getResponseHeader works
      // Capture important headers individually as fallback
      if (!headers["set-cookie"]) {
        try {
          var sc = xhr.getResponseHeader("Set-Cookie");
          if (sc) headers["set-cookie"] = sc;
        } catch (_e) {/* ignore */}
      }
      if (!headers["x-apple-session-token"]) {
        try {
          var st = xhr.getResponseHeader("X-Apple-Session-Token");
          if (st) headers["x-apple-session-token"] = st;
        } catch (_e) {/* ignore */}
      }
      if (!headers["x-apple-twosv-trust-token"]) {
        try {
          var tt = xhr.getResponseHeader("X-Apple-TwoSV-Trust-Token");
          if (tt) headers["x-apple-twosv-trust-token"] = tt;
        } catch (_e) {/* ignore */}
      }
      if (!headers["scnt"]) {
        try {
          var s = xhr.getResponseHeader("scnt");
          if (s) headers["scnt"] = s;
        } catch (_e) {/* ignore */}
      }
      // Merge Set-Cookie into the jar for future requests
      if (headers["set-cookie"]) {
        mergeSetCookies(headers["set-cookie"]);
      }
      finishResolve({
        status: xhr.status,
        body: parsed,
        text: text,
        headers: headers
      });
    };
    xhr.onerror = function () {
      return finishReject(new Error("Network request failed."));
    };
    xhr.ontimeout = function () {
      return finishReject(new Error(APPLE_TIMEOUT_ERROR_MESSAGE));
    };
    if (body) {
      xhr.send(JSON.stringify(body));
      return;
    }
    xhr.send();
  });
};
var appleParams = function appleParams(session) {
  return Object.assign({}, FMIP_PARAMS, {
    clientId: String(session.clientId || ""),
    dsid: String(session.dsid || "")
  });
};
var appleHeaders = function appleHeaders(_session) {
  var headers = Object.assign({}, APPLE_HEADERS, {
    "content-type": "application/json"
  });
  // Cookie header is injected automatically by requestJson from the cookie jar.
  return headers;
};
var buildDirectAppleSession = function buildDirectAppleSession(session, connection, devices) {
  return {
    mode: "direct_apple",
    devices: devices || [],
    session: Object.assign({
      provider: "direct_apple",
      appleId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      defaultDeviceId: ""
    }, session),
    connection: connection
  };
};
var loginSummaryState = function loginSummaryState(summary, session) {
  return buildDirectAppleSession(session || {}, {
    state: "needs_reauth",
    summary: summary,
    provider: "direct_apple",
    lastCheckedAt: nowIso(),
    defaultDeviceId: String(session && session.defaultDeviceId || "")
  }, []);
};
var ensureAccountLogin = function ensureAccountLogin(session) {
  return __awaiter(void 0, void 0, void 0, function () {
    var accountLoginStartMs, response, body, dsInfo, webservices, findMe, merged, jarSnapshot;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          accountLoginStartMs = nowMs();
          if (!session.sessionToken) {
            throw new Error("Apple session token is missing.");
          }
          return [4 /*yield*/, requestJson("POST", "".concat(APPLE_SETUP_ENDPOINT, "/accountLogin"), {}, {
            Accept: "application/json, text/javascript",
            "Content-Type": "application/json",
            Origin: "https://www.icloud.com",
            Referer: "https://www.icloud.com/"
          }, {
            accountCountryCode: session.accountCountry || "",
            dsWebAuthToken: session.sessionToken,
            extended_login: true,
            trustToken: session.trustToken || ""
          })];
        case 1:
          response = _a.sent();
          if (response.status !== 200 || !response.body || _typeof(response.body) !== "object") {
            throw new Error("Apple account bootstrap failed: ".concat(parseAppleError(response)));
          }
          body = response.body;
          dsInfo = body.dsInfo && _typeof(body.dsInfo) === "object" ? body.dsInfo : {};
          webservices = body.webservices && _typeof(body.webservices) === "object" ? body.webservices : {};
          findMe = webservices.findme && _typeof(webservices.findme) === "object" ? webservices.findme : {};
          merged = updateSessionFieldsFromHeaders(session, response.headers);
          jarSnapshot = buildCookieHeader();
          console.log("ensureAccountLogin: cookie jar has " + Object.keys(cookieJar).length + " cookies, total=" + jarSnapshot.length + " chars");
          logTiming("account-login:total", accountLoginStartMs);
          return [2 /*return*/, Object.assign({}, merged, {
            updatedAt: nowIso(),
            serviceRoot: String(findMe.url || merged.serviceRoot || "").replace(/:443$/, ""),
            dsid: String(dsInfo.dsid || merged.dsid || ""),
            accountCountry: String(merged.accountCountry || dsInfo.countryCode || ""),
            cookieHeader: jarSnapshot
          })];
      }
    });
  });
};
var fetchMfaBootState = function fetchMfaBootState(pending) {
  return __awaiter(void 0, void 0, void 0, function () {
    var response, withFresh, boot;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, requestJson("GET", APPLE_AUTH_ENDPOINT, {}, buildAppleAuthHeaders(pending.clientId, pending, {
            Accept: "text/html"
          }))];
        case 1:
          response = _a.sent();
          withFresh = updateSessionFieldsFromHeaders(pending, response.headers);
          if (response.status !== 200 || !response.text) {
            return [2 /*return*/, withFresh];
          }
          try {
            boot = (0, hsa2_boot_1.parseHsa2BootContext)(response.text);
            return [2 /*return*/, Object.assign({}, withFresh, {
              mode: String(boot.mode || withFresh.mode || ""),
              hasTrustedDevices: Boolean(boot.hasTrustedDevices),
              trustedPhoneNumber: boot.trustedPhoneNumber,
              authInitialRoute: boot.authInitialRoute,
              authFactors: boot.authFactors,
              bridgeInitiateData: boot.bridgeInitiateData,
              phoneNumberVerification: boot.phoneNumberVerification,
              sourceAppId: boot.sourceAppId
            })];
          } catch (_error) {
            return [2 /*return*/, withFresh];
          }
          return [2 /*return*/];
      }
    });
  });
};
var updatePendingAuthState = function updatePendingAuthState(update) {
  var current = readPendingAuthState();
  if (!current) {
    return;
  }
  writePendingAuthState(Object.assign({}, current, update));
};
var requestAppleSmsCodeInternal = function requestAppleSmsCodeInternal(pending, notice) {
  return __awaiter(void 0, void 0, void 0, function () {
    var response, fresh;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!pending.trustedPhoneNumber) {
            throw new Error("Apple did not expose an SMS verification route for this sign-in.");
          }
          return [4 /*yield*/, requestJson("PUT", "".concat(APPLE_AUTH_ENDPOINT, "/verify/phone"), {}, buildAppleAuthHeaders(pending.clientId, pending, {
            Accept: "application/json"
          }), {
            phoneNumber: {
              id: pending.trustedPhoneNumber.id
            },
            mode: "sms"
          })];
        case 1:
          response = _a.sent();
          if (response.status !== 200 && response.status !== 204) {
            throw new Error("Apple could not send an SMS code: ".concat(parseAppleError(response)));
          }
          fresh = updateSessionFieldsFromHeaders(pending, response.headers);
          updatePendingAuthState({
            mode: "sms",
            deliveryMethod: "sms",
            verificationRoute: "sms",
            deliveryNotice: notice || "Apple sent an SMS verification code.",
            scnt: fresh.scnt,
            sessionId: fresh.sessionId,
            authAttributes: fresh.authAttributes,
            sessionToken: fresh.sessionToken,
            trustToken: fresh.trustToken,
            accountCountry: fresh.accountCountry
          });
          return [2 /*return*/];
      }
    });
  });
};
// No APNS trusted-device push bridge here (auth/bridge/*): it needs heavy
// synchronous P-256 crypto plus an open WebSocket, which froze the
// single-threaded PKJS runtime and locked users out of the settings page.
// 2FA is code-entry only — trusted-device code via the standard verify route,
// or SMS.
var requestAppleTwoFactorCode = function requestAppleTwoFactorCode() {
  return __awaiter(void 0, void 0, void 0, function () {
    var pending, phoneLabel;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          pending = readPendingAuthState();
          if (!pending) {
            throw new Error("No Apple 2FA challenge is pending.");
          }
          console.log("request_2fa_code: mode=" + String(pending.mode || "unknown") + " authInitialRoute=" + String(pending.authInitialRoute || "") + " hasTrustedDevices=" + String(Boolean(pending.hasTrustedDevices)));
          if (!pending.trustedPhoneNumber) return [3 /*break*/, 2];
          phoneLabel = formatTrustedPhoneLabel(pending.trustedPhoneNumber);
          return [4 /*yield*/, requestAppleSmsCodeInternal(pending, phoneLabel ? "We texted a 6-digit code to " + phoneLabel + ". Enter it below — tap Resend Code if it doesn&#39;t arrive." : "We texted a 6-digit code to your phone. Enter it below — tap Resend Code if it doesn&#39;t arrive.")];
        case 1:
          _a.sent();
          console.log("request_2fa_code: auto-sent SMS");
          return [2 /*return*/];
        case 2:
          updatePendingAuthState({
            deliveryMethod: "trusted_device",
            verificationRoute: "trusted_device",
            deliveryNotice: "Enter the verification code shown on your trusted Apple device."
          });
          return [2 /*return*/];
      }
    });
  });
};
// Runs the full idmsa SRP sign-in (authorize → init → complete) and returns the
// raw completion response plus a session skeleton populated from its headers.
// The stored trustToken is replayed so a trusted device skips 2FA (Apple
// answers 200 instead of 409). Shared by the interactive login flow and the
// silent re-auth path that keeps the iCloud session alive over time.
var runAppleSrpSignin = function runAppleSrpSignin(trimmedAppleId, password) {
  return __awaiter(void 0, void 0, void 0, function () {
    var srpStartMs, previous, clientId, authHeaders, authorizeResponse, clientPubStartMs, privateA, publicA, initResponse, challengeCryptoStartMs, challenge, saltBuffer, serverPublicBuffer, pbkdf2StartMs, passwordBuffer, modexpStartMs, identityHash, x, serverPublic, u, gx, exponent, base, S, sessionKey, hN, hg, hNxorg, xi, hUser, m1, m2, completeResponse, sessionBase;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          srpStartMs = nowMs();
          previous = resolvedDirectAppleSettings();
          clientId = containsPlaceholder(previous.clientId) || !previous.clientId ? randomClientId() : previous.clientId;
          authHeaders = buildAppleAuthHeaders(clientId);
          return [4 /*yield*/, requestJson("GET", "".concat(APPLE_AUTH_ENDPOINT, "/authorize/signin"), {
            frame_id: clientId,
            skVersion: "7",
            iframeid: clientId,
            client_id: APPLE_WIDGET_KEY,
            response_type: "code",
            redirect_uri: "https://www.icloud.com",
            response_mode: "web_message",
            state: clientId,
            authVersion: "latest"
          }, authHeaders)];
        case 1:
          authorizeResponse = _a.sent();
          if (authorizeResponse.status !== 200) {
            throw new Error("Apple sign-in bootstrap failed: ".concat(parseAppleError(authorizeResponse)));
          }
          clientPubStartMs = nowMs();
          privateA = bigIntFromBuffer(nodeCrypto.randomBytes(32));
          publicA = padToN(modPow(srpGenerator, privateA, srpPrimeN));
          logTiming("srp-crypto:client-public-A", clientPubStartMs);
          return [4 /*yield*/, requestJson("POST", "".concat(APPLE_AUTH_ENDPOINT, "/signin/init"), {}, authHeaders, {
            a: base64FromBuffer(publicA),
            accountName: trimmedAppleId,
            protocols: ["s2k", "s2k_fo"]
          })];
        case 2:
          initResponse = _a.sent();
          if (initResponse.status !== 200 || !initResponse.body) {
            throw new Error("Apple login failed during SRP init: ".concat(parseAppleError(initResponse)));
          }
          challengeCryptoStartMs = nowMs();
          challenge = initResponse.body;
          saltBuffer = bufferFromBase64(String(challenge.salt || ""));
          serverPublicBuffer = bufferFromBase64(String(challenge.b || ""));
          pbkdf2StartMs = nowMs();
          passwordBuffer = deriveAppleSrpPassword(password, saltBuffer, Number(challenge.iteration || 0), String(challenge.protocol || "s2k"));
          logTiming("srp-crypto:pbkdf2", pbkdf2StartMs, "iters=" + Number(challenge.iteration || 0));
          modexpStartMs = nowMs();
          identityHash = sha256Buffer(BufferCtor.from(":"), passwordBuffer);
          x = bigIntFromBuffer(sha256Buffer(saltBuffer, identityHash));
          serverPublic = bigIntFromBuffer(serverPublicBuffer);
          u = bigIntFromBuffer(sha256Buffer(padToN(publicA), padToN(serverPublicBuffer)));
          gx = modPow(srpGenerator, x, srpPrimeN);
          exponent = privateA.add(u.mul(x));
          base = positiveMod(serverPublic.sub(computeSrpMultiplierK().mul(gx)), srpPrimeN);
          S = modPow(base, exponent, srpPrimeN);
          sessionKey = sha256Buffer(bufferFromBigInt(S));
          hN = sha256Buffer(padToN(srpPrimeN));
          hg = sha256Buffer(padToN(srpGenerator));
          hNxorg = BufferCtor.alloc(32);
          for (xi = 0; xi < 32; xi++) hNxorg[xi] = hN[xi] ^ hg[xi];
          hUser = sha256Buffer(BufferCtor.from(trimmedAppleId, "utf8"));
          m1 = sha256Buffer(hNxorg, hUser, saltBuffer, publicA, serverPublicBuffer, sessionKey);
          m2 = sha256Buffer(publicA, m1, sessionKey);
          logTiming("srp-crypto:modexp", modexpStartMs);
          logTiming("srp-crypto:challenge-response", challengeCryptoStartMs);
          return [4 /*yield*/, requestJson("POST", "".concat(APPLE_AUTH_ENDPOINT, "/signin/complete"), {
            isRememberMeEnabled: "true"
          }, authHeaders, {
            accountName: trimmedAppleId,
            c: challenge.c,
            m1: base64FromBuffer(m1),
            m2: base64FromBuffer(m2),
            rememberMe: true,
            trustTokens: previous.trustToken ? [previous.trustToken] : []
          })];
        case 3:
          completeResponse = _a.sent();
          sessionBase = updateSessionFieldsFromHeaders({
            provider: "direct_apple",
            appleId: trimmedAppleId,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            defaultDeviceId: previous.defaultDeviceId || "",
            playSoundUrl: previous.playSoundUrl || "",
            cookieHeader: previous.cookieHeader || "",
            serviceRoot: previous.serviceRoot || "",
            dsid: previous.dsid || "",
            clientId: clientId,
            password: password
          }, completeResponse.headers);
          logTiming("srp-signin:total", srpStartMs, "-> " + completeResponse.status);
          return [2 /*return*/, {
            completeResponse: completeResponse,
            sessionBase: sessionBase,
            clientId: clientId,
            previous: previous
          }];
      }
    });
  });
};
var startAppleLogin = function startAppleLogin(appleId, password) {
  return __awaiter(void 0, void 0, void 0, function () {
    var loginStartMs, trimmedAppleId, signin, completeResponse, clientId, previous, sessionBase, pending, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          loginStartMs = nowMs();
          trimmedAppleId = String(appleId || "").trim();
          if (!trimmedAppleId || !password) {
            throw new Error("Apple ID and password are required.");
          }
          return [4 /*yield*/, runAppleSrpSignin(trimmedAppleId, password)];
        case 1:
          signin = _a.sent();
          completeResponse = signin.completeResponse;
          clientId = signin.clientId;
          previous = signin.previous;
          sessionBase = signin.sessionBase;
          if (!(completeResponse.status === 409)) return [3 /*break*/, 7];
          pending = updateSessionFieldsFromHeaders({
            appleId: trimmedAppleId,
            clientId: clientId,
            sessionToken: sessionBase.sessionToken,
            trustToken: sessionBase.trustToken,
            accountCountry: sessionBase.accountCountry,
            scnt: sessionBase.scnt,
            sessionId: sessionBase.sessionId,
            authAttributes: sessionBase.authAttributes
          }, completeResponse.headers);
          return [4 /*yield*/, fetchMfaBootState(pending)];
        case 2:
          pending = _a.sent();
          writePendingAuthState(pending);
          applyDirectAppleSettings({
            appleId: trimmedAppleId,
            defaultDeviceId: previous.defaultDeviceId || "",
            serviceRoot: previous.serviceRoot || "",
            dsid: previous.dsid || "",
            clientId: clientId,
            playSoundUrl: previous.playSoundUrl || "",
            cookieHeader: previous.cookieHeader || "",
            sessionToken: pending.sessionToken,
            trustToken: pending.trustToken,
            accountCountry: pending.accountCountry,
            scnt: pending.scnt,
            sessionId: pending.sessionId,
            authAttributes: pending.authAttributes,
            // Retain the (verified-correct) password so the session can silently
            // re-authenticate later without prompting the user again.
            password: password
          });
          // Mark 2FA-required and return immediately so the settings page can reopen
          // for code entry. The trusted-device bridge bootstrap (heavy EC crypto + a
          // WebSocket to Apple, which can be slow or fail) runs in the BACKGROUND —
          // awaiting it here previously blocked the single-threaded PKJS runtime and
          // left the settings page unopenable ("locked out") after sign-in.
          writeState(loginSummaryState("Apple sign-in needs a 2FA code in phone settings.", {
            appleId: trimmedAppleId,
            clientId: clientId,
            defaultDeviceId: previous.defaultDeviceId || "",
            sessionToken: pending.sessionToken,
            trustToken: pending.trustToken,
            accountCountry: pending.accountCountry,
            scnt: pending.scnt,
            sessionId: pending.sessionId,
            authAttributes: pending.authAttributes,
            playSoundUrl: previous.playSoundUrl || ""
          }));
          logTiming("login:total", loginStartMs, "-> 2fa-required");
          _a.label = 3;
        case 3:
          _a.trys.push([3, 5,, 6]);
          return [4 /*yield*/, requestAppleTwoFactorCode()];
        case 4:
          _a.sent();
          return [3 /*break*/, 6];
        case 5:
          error_1 = _a.sent();
          // Couldn't send the code — fall back to the sign-in page.
          console.log("requestAppleTwoFactorCode: 2FA setup failed, reverting to sign-in: " + String(error_1));
          clearPendingAuthState();
          loginErrorNotice = "We couldn't send a verification code. Please sign in again.";
          writeState(loginSummaryState(loginErrorNotice, {
            appleId: trimmedAppleId,
            clientId: clientId,
            defaultDeviceId: previous.defaultDeviceId || "",
            playSoundUrl: previous.playSoundUrl || ""
          }));
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
        case 7:
          if (completeResponse.status !== 200) {
            throw new Error("Apple login failed: ".concat(parseAppleError(completeResponse)));
          }
          return [4 /*yield*/, ensureAccountLogin(sessionBase)];
        case 8:
          sessionBase = _a.sent();
          clearPendingAuthState();
          persistDirectAppleSession(sessionBase);
          writeState(buildDirectAppleSession(sessionBase, {
            state: "connecting",
            summary: "Apple sign-in succeeded. Syncing Find My devices...",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: sessionBase.defaultDeviceId
          }));
          logTiming("login:total", loginStartMs, "-> signed-in");
          return [2 /*return*/];
      }
    });
  });
};
// Guard so overlapping sync/ping requests don't kick off parallel re-logins.
var silentReauthInFlight = false;
// Silently re-establish the iCloud web session using the stored Apple ID
// password + trustToken, without any user interaction. This is the mechanism
// that keeps auth alive: when Apple expires the cookies / dsWebAuthToken, the
// old code could only replay the dead token via accountLogin and would fall
// back to needs_reauth. Here we run a fresh SRP sign-in (the trustToken makes
// Apple skip 2FA and return 200), refresh the trust token to roll the trusted-
// device window forward, then bootstrap a new account session. Returns the
// refreshed session, or null when re-auth needs the user again (no stored
// password, wrong password, or an expired/rejected trust token → HTTP 409).
var attemptSilentReauth = function attemptSilentReauth(session) {
  return __awaiter(void 0, void 0, void 0, function () {
    var stored, appleId, password, silentReauthStartMs, signin, refreshed, trustResponse, trustError_1, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          stored = resolvedDirectAppleSettings();
          appleId = String(session.appleId || stored.appleId || "").trim();
          password = String(session.password || stored.password || "");
          if (!appleId || !password) {
            console.log("silentReauth: no stored password; user re-auth required");
            return [2 /*return*/, null];
          }
          if (silentReauthInFlight) {
            console.log("silentReauth: already in progress, skipping");
            return [2 /*return*/, null];
          }
          silentReauthInFlight = true;
          silentReauthStartMs = nowMs();
          _a.label = 1;
        case 1:
          _a.trys.push([1, 8, 9, 10]);
          console.log("silentReauth: re-running SRP sign-in with stored credentials");
          return [4 /*yield*/, runAppleSrpSignin(appleId, password)];
        case 2:
          signin = _a.sent();
          if (signin.completeResponse.status === 409) {
            // Trust token expired or rejected — Apple now wants a fresh 2FA code,
            // which only the user can provide. Surface as needs_reauth.
            console.log("silentReauth: Apple requires 2FA again (trust token no longer valid)");
            return [2 /*return*/, null];
          }
          if (signin.completeResponse.status !== 200) {
            console.log("silentReauth: sign-in failed status=" + signin.completeResponse.status);
            return [2 /*return*/, null];
          }
          refreshed = signin.sessionBase;
          _a.label = 3;
        case 3:
          _a.trys.push([3, 5,, 6]);
          return [4 /*yield*/, requestJson("GET", "".concat(APPLE_AUTH_ENDPOINT, "/2sv/trust"), {}, buildAppleAuthHeaders(refreshed.clientId || signin.clientId, refreshed))];
        case 4:
          trustResponse = _a.sent();
          if (trustResponse.status === 200 || trustResponse.status === 204) {
            refreshed = updateSessionFieldsFromHeaders(refreshed, trustResponse.headers);
          } else {
            console.log("silentReauth: trust refresh returned status=" + trustResponse.status);
          }
          return [3 /*break*/, 6];
        case 5:
          trustError_1 = _a.sent();
          console.log("silentReauth: trust refresh failed: " + String(trustError_1));
          return [3 /*break*/, 6];
        case 6:
          return [4 /*yield*/, ensureAccountLogin(refreshed)];
        case 7:
          refreshed = _a.sent();
          // Preserve local-only preferences and force a fresh Find My init on next
          // refresh (the old serverContext belongs to the expired session).
          refreshed = Object.assign({}, refreshed, {
            appleId: appleId,
            password: password,
            defaultDeviceId: session.defaultDeviceId || refreshed.defaultDeviceId,
            playSoundUrl: session.playSoundUrl || refreshed.playSoundUrl,
            serverContext: undefined
          });
          clearPendingAuthState();
          persistDirectAppleSession(refreshed);
          console.log("silentReauth: success — minted a fresh Apple session");
          return [2 /*return*/, refreshed];
        case 8:
          error_2 = _a.sent();
          console.log("silentReauth: error: " + String(error_2));
          return [2 /*return*/, null];
        case 9:
          logTiming("silent-reauth:total", silentReauthStartMs);
          silentReauthInFlight = false;
          return [7 /*endfinally*/];
        case 10:
          return [2 /*return*/];
      }
    });
  });
};
var requestAppleSmsCode = function requestAppleSmsCode() {
  return __awaiter(void 0, void 0, void 0, function () {
    var pending;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          pending = readPendingAuthState();
          if (!pending) {
            throw new Error("No Apple 2FA challenge is pending.");
          }
          if (!pending.trustedPhoneNumber) {
            throw new Error("Apple did not expose an SMS verification route for this sign-in.");
          }
          console.log("request_2fa_sms: requesting SMS route with pendingMode=" + String(pending.mode || "unknown"));
          return [4 /*yield*/, requestAppleSmsCodeInternal(pending, "New code sent. Enter it below.")];
        case 1:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
};
var verifyAppleTwoFactorCode = function verifyAppleTwoFactorCode(code) {
  return __awaiter(void 0, void 0, void 0, function () {
    var verifyStartMs, pending, verificationRoute, headers, response, rotated, session, trustResponse;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          verifyStartMs = nowMs();
          pending = readPendingAuthState();
          if (!pending) {
            throw new Error("No Apple 2FA challenge is pending.");
          }
          if (!code) {
            throw new Error("The Apple verification code is required.");
          }
          verificationRoute = pending.verificationRoute || (pending.mode === "sms" ? "sms" : "trusted_device");
          headers = buildAppleAuthHeaders(pending.clientId, pending, {
            Accept: verificationRoute === "sms" ? "application/json, plain/text" : "application/json, text/javascript"
          });
          if (!(verificationRoute === "sms" && pending.trustedPhoneNumber)) return [3 /*break*/, 2];
          console.log("login_verify_2fa: using SMS verification route");
          return [4 /*yield*/, requestJson("POST", "".concat(APPLE_AUTH_ENDPOINT, "/verify/phone/securitycode"), {}, buildAppleAuthHeaders(pending.clientId, pending, {
            Accept: "application/json, plain/text"
          }), {
            phoneNumber: {
              id: pending.trustedPhoneNumber.id
            },
            securityCode: {
              code: code
            },
            mode: pending.trustedPhoneNumber.pushMode || "sms"
          })];
        case 1:
          response = _a.sent();
          if (response.status !== 200 && response.status !== 204) {
            rotated = updateSessionFieldsFromHeaders(pending, response.headers);
            updatePendingAuthState({
              scnt: rotated.scnt,
              sessionId: rotated.sessionId,
              authAttributes: rotated.authAttributes
            });
            throw new Error("The Apple 2FA code was not accepted.");
          }
          return [3 /*break*/, 4];
        case 2:
          console.log("login_verify_2fa: using trusted-device verification route");
          return [4 /*yield*/, requestJson("POST", "".concat(APPLE_AUTH_ENDPOINT, "/verify/trusteddevice/securitycode"), {}, buildAppleAuthHeaders(pending.clientId, pending, {
            Accept: "application/json"
          }), {
            securityCode: {
              code: code
            }
          })];
        case 3:
          response = _a.sent();
          if (response.status !== 200 && response.status !== 204) {
            throw new Error("The Apple 2FA code was not accepted.");
          }
          _a.label = 4;
        case 4:
          session = updateSessionFieldsFromHeaders({
            provider: "direct_apple",
            appleId: pending.appleId,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
            playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || "",
            cookieHeader: resolvedDirectAppleSettings().cookieHeader || "",
            serviceRoot: resolvedDirectAppleSettings().serviceRoot || "",
            dsid: resolvedDirectAppleSettings().dsid || "",
            clientId: pending.clientId,
            sessionToken: pending.sessionToken,
            trustToken: pending.trustToken,
            accountCountry: pending.accountCountry,
            scnt: pending.scnt,
            sessionId: pending.sessionId,
            authAttributes: pending.authAttributes,
            // Carried over from the credentials step so silent re-auth stays possible.
            password: resolvedDirectAppleSettings().password || ""
          }, response.headers);
          return [4 /*yield*/, requestJson("GET", "".concat(APPLE_AUTH_ENDPOINT, "/2sv/trust"), {}, buildAppleAuthHeaders(session.clientId || pending.clientId, session))];
        case 5:
          trustResponse = _a.sent();
          if (trustResponse.status !== 200 && trustResponse.status !== 204) {
            throw new Error("Apple did not trust this local session: ".concat(parseAppleError(trustResponse)));
          }
          session = updateSessionFieldsFromHeaders(session, trustResponse.headers);
          return [4 /*yield*/, ensureAccountLogin(session)];
        case 6:
          session = _a.sent();
          clearPendingAuthState();
          persistDirectAppleSession(session);
          writeState(buildDirectAppleSession(session, {
            state: "connecting",
            summary: "Apple sign-in completed. Syncing Find My devices...",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: session.defaultDeviceId
          }));
          logTiming("verify-2fa:total", verifyStartMs);
          return [2 /*return*/];
      }
    });
  });
};
var initClientBody = function initClientBody(serverContext, locate) {
  if (locate === void 0) {
    locate = true;
  }
  var body = {
    clientContext: {
      appName: "iCloud Find (Web)",
      appVersion: "2.0",
      apiVersion: "3.0",
      deviceListVersion: 1,
      fmly: false,
      timezone: FMIP_CLIENT_CONTEXT_TIMEZONE,
      inactiveTime: 0
    }
  };
  if (serverContext) {
    body.serverContext = serverContext;
    if (locate) {
      body.isUpdatingAllLocations = true;
      body.clientContext.shouldLocate = true;
      body.clientContext.selectedDevice = "all";
    }
  }
  return body;
};
var refreshDevicesDirectApple = function refreshDevicesDirectApple(state_1) {
  var args_1 = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args_1[_i - 1] = arguments[_i];
  }
  return __awaiter(void 0, __spreadArray([state_1], args_1, true), void 0, function (state, locate) {
    var session, userLocationPromise, error_3, reauthed, requestRefresh, response, error_4, retryError_1, reauthed, retryResponse, reAuthError_1, reauthed, userLocation, visibleDevices, defaultDeviceId, selectedDevice, updatedAt;
    if (locate === void 0) {
      locate = true;
    }
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          session = state.session;
          userLocationPromise = readCurrentUserLocation();
          if (!session) {
            return [2 /*return*/, Object.assign({}, baseDisconnectedState("direct_apple", "Direct Apple session is missing required local fields."), {
              connection: {
                state: "needs_reauth",
                summary: "Direct Apple session is incomplete on the phone.",
                provider: "direct_apple",
                lastCheckedAt: nowIso(),
                defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
              }
            })];
          }
          if (!((!session.serviceRoot || !session.dsid) && session.sessionToken)) return [3 /*break*/, 5];
          _a.label = 1;
        case 1:
          _a.trys.push([1, 3,, 5]);
          return [4 /*yield*/, ensureAccountLogin(session)];
        case 2:
          session = _a.sent();
          persistDirectAppleSession(session);
          return [3 /*break*/, 5];
        case 3:
          error_3 = _a.sent();
          // Replaying the stored token failed — try a full silent re-login before
          // giving up and asking the user to sign in again.
          console.log("refreshDevices: account bootstrap failed, attempting silent re-auth");
          return [4 /*yield*/, attemptSilentReauth(session)];
        case 4:
          reauthed = _a.sent();
          if (reauthed) {
            session = reauthed;
          } else {
            return [2 /*return*/, Object.assign({}, state, {
              devices: [],
              session: session,
              connection: {
                state: "needs_reauth",
                summary: error_3 instanceof Error ? error_3.message : "Apple account session needs to be refreshed.",
                provider: "direct_apple",
                lastCheckedAt: nowIso(),
                defaultDeviceId: session.defaultDeviceId
              }
            })];
          }
          return [3 /*break*/, 5];
        case 5:
          if (!session.serviceRoot || !session.clientId || !session.dsid) {
            return [2 /*return*/, Object.assign({}, state, {
              devices: [],
              session: session,
              connection: {
                state: "needs_reauth",
                summary: "Direct Apple session is incomplete on the phone.",
                provider: "direct_apple",
                lastCheckedAt: nowIso(),
                defaultDeviceId: session.defaultDeviceId
              }
            })];
          }
          requestRefresh = function requestRefresh(activeSession) {
            return __awaiter(void 0, void 0, void 0, function () {
              var hasServerContext, endpoint, fmipResponse;
              return __generator(this, function (_a) {
                switch (_a.label) {
                  case 0:
                    hasServerContext = Boolean(activeSession.serverContext);
                    endpoint = "".concat(activeSession.serviceRoot, "/fmipservice/client/web/").concat(hasServerContext ? "refreshClient" : "initClient");
                    console.log("refreshDevices: " + endpoint + " hasCtx=" + hasServerContext + " locate=" + String(locate));
                    return [4 /*yield*/, requestJson("POST", endpoint, appleParams(activeSession), appleHeaders(activeSession), initClientBody(hasServerContext ? activeSession.serverContext : undefined, locate))];
                  case 1:
                    fmipResponse = _a.sent();
                    console.log("refreshDevices: status=" + fmipResponse.status + " hasContent=" + String(fmipResponse.body && Array.isArray(fmipResponse.body.content)) + " bodyKeys=" + (fmipResponse.body ? Object.keys(fmipResponse.body).join(",") : "null"));
                    return [2 /*return*/, fmipResponse];
                }
              });
            });
          };
          _a.label = 6;
        case 6:
          _a.trys.push([6, 8,, 15]);
          return [4 /*yield*/, requestRefresh(session)];
        case 7:
          response = _a.sent();
          return [3 /*break*/, 15];
        case 8:
          error_4 = _a.sent();
          if (!isNetworkTimeoutError(error_4)) {
            throw error_4;
          }
          console.log("refreshDevices: request timed out; retrying with fresh Find My context");
          session = stripTransientAppleSessionState(session);
          _a.label = 9;
        case 9:
          _a.trys.push([9, 11,, 14]);
          return [4 /*yield*/, requestRefresh(session)];
        case 10:
          response = _a.sent();
          return [3 /*break*/, 14];
        case 11:
          retryError_1 = _a.sent();
          if (!isNetworkTimeoutError(retryError_1) || !session.sessionToken) {
            throw retryError_1;
          }
          console.log("refreshDevices: init retry timed out; refreshing Apple account bootstrap");
          return [4 /*yield*/, ensureAccountLogin(session)];
        case 12:
          session = _a.sent();
          persistDirectAppleSession(session);
          return [4 /*yield*/, requestRefresh(session)];
        case 13:
          response = _a.sent();
          return [3 /*break*/, 14];
        case 14:
          return [3 /*break*/, 15];
        case 15:
          if (!(response.status === 401 || response.status === 403 || response.status === 421)) return [3 /*break*/, 19];
          console.log("refreshDevices: got " + response.status + ", attempting silent re-auth");
          return [4 /*yield*/, attemptSilentReauth(session)];
        case 16:
          reauthed = _a.sent();
          if (!reauthed) return [3 /*break*/, 18];
          session = reauthed;
          return [4 /*yield*/, requestRefresh(session)];
        case 17:
          response = _a.sent();
          _a.label = 18;
        case 18:
          if (!reauthed || response.status === 401 || response.status === 403 || response.status === 421) {
            return [2 /*return*/, Object.assign({}, state, {
              devices: [],
              session: session,
              connection: {
                state: "needs_reauth",
                summary: "Apple session needs refresh (HTTP ".concat(response.status, ")."),
                provider: "direct_apple",
                lastCheckedAt: nowIso(),
                defaultDeviceId: session.defaultDeviceId
              }
            })];
          }
          _a.label = 19;
        case 19:
          if (!(response.status === 450)) return [3 /*break*/, 27];
          console.log("refreshDevices: got 450, re-authenticating session...");
          _a.label = 20;
        case 20:
          _a.trys.push([20, 23,, 24]);
          return [4 /*yield*/, ensureAccountLogin(session)];
        case 21:
          session = _a.sent();
          persistDirectAppleSession(session);
          console.log("refreshDevices: re-auth OK, retrying Find My refresh...");
          return [4 /*yield*/, requestRefresh(session)];
        case 22:
          retryResponse = _a.sent();
          console.log("refreshDevices: retry status=" + retryResponse.status);
          response = retryResponse;
          return [3 /*break*/, 24];
        case 23:
          reAuthError_1 = _a.sent();
          console.log("refreshDevices: re-auth failed: " + String(reAuthError_1));
          return [3 /*break*/, 24];
        case 24:
          if (!(response.status === 450)) return [3 /*break*/, 27];
          console.log("refreshDevices: still 450, attempting silent re-auth");
          return [4 /*yield*/, attemptSilentReauth(session)];
        case 25:
          reauthed = _a.sent();
          if (!reauthed) return [3 /*break*/, 27];
          session = reauthed;
          return [4 /*yield*/, requestRefresh(session)];
        case 26:
          response = _a.sent();
          _a.label = 27;
        case 27:
          if (response.status !== 200 || !response.body || !Array.isArray(response.body.content)) {
            return [2 /*return*/, Object.assign({}, state, {
              devices: [],
              connection: {
                state: "degraded",
                summary: response.status ? "Apple device sync failed with HTTP ".concat(response.status, ".") : "Apple device sync returned an invalid payload.",
                provider: "direct_apple",
                lastCheckedAt: nowIso(),
                defaultDeviceId: session.defaultDeviceId
              }
            })];
          }
          return [4 /*yield*/, userLocationPromise];
        case 28:
          userLocation = _a.sent();
          visibleDevices = response.body.content.filter(function (device) {
            return isVisibleWatchTarget(device) && isRecentlyOnline(device);
          }).map(function (device) {
            return summarizeDevice(device, userLocation);
          }).filter(Boolean);
          defaultDeviceId = visibleDevices.some(function (device) {
            return device.id === session.defaultDeviceId;
          }) ? session.defaultDeviceId : visibleDevices[0] ? visibleDevices[0].id : session.defaultDeviceId;
          selectedDevice = visibleDevices.find(function (device) {
            return device.id === defaultDeviceId;
          });
          updatedAt = nowIso();
          return [2 /*return*/, {
            mode: "direct_apple",
            devices: visibleDevices,
            session: Object.assign({}, session, {
              updatedAt: updatedAt,
              defaultDeviceId: defaultDeviceId,
              serverContext: response.body && response.body.serverContext && _typeof(response.body.serverContext) === "object" ? response.body.serverContext : session.serverContext
            }),
            connection: {
              state: visibleDevices.length > 0 ? "connected" : "degraded",
              summary: visibleDevices.length > 0 ? "Phone-side Apple session is ready for ".concat(selectedDevice && selectedDevice.name || "your device", ".") : "No iPhone, iPad, or Mac devices have been online in the last ".concat(RECENT_ONLINE_WINDOW_DAYS, " days."),
              provider: "direct_apple",
              lastCheckedAt: updatedAt,
              defaultDeviceId: defaultDeviceId
            }
          }];
      }
    });
  });
};
var parsePlaySoundResult = function parsePlaySoundResult(device, response) {
  if (response.status !== 200) {
    return {
      accepted: false,
      detail: "Apple returned HTTP ".concat(response.status, " for ").concat(device.name, ".")
    };
  }
  var body = response.body && _typeof(response.body) === "object" ? response.body : {};
  var content = Array.isArray(body.content) ? body.content[0] || {} : {};
  var statusCode = String(content.snd && content.snd.statusCode || content.msg && content.msg.statusCode || body.statusCode || "");
  if (statusCode === "200") {
    return {
      accepted: true,
      detail: "Ping sent to ".concat(device.name, ".")
    };
  }
  if (statusCode === "205") {
    return {
      accepted: false,
      detail: "".concat(device.name, " is listed in Find My but Apple did not confirm a playable sound.")
    };
  }
  return {
    accepted: false,
    detail: "Apple returned play-sound status ".concat(statusCode || "unknown", " for ").concat(device.name, ".")
  };
};
var pingDirectApple = function pingDirectApple(selectedIndex) {
  return __awaiter(void 0, void 0, void 0, function () {
    var requestPlaySound, startingState, syncedState, targetDevice, session, response, bootstrapError_1, reauthed, refreshedState, refreshedTarget, e_1, parsed, connection;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          requestPlaySound = function requestPlaySound(activeSession, deviceId) {
            return __awaiter(void 0, void 0, void 0, function () {
              return __generator(this, function (_a) {
                return [2 /*return*/, requestJson("POST", "".concat(activeSession.serviceRoot, "/fmipservice/client/web/playSound"), appleParams(activeSession), appleHeaders(activeSession), {
                  device: deviceId,
                  subject: "FindMy for Pebble Alert",
                  clientContext: {
                    fmly: true
                  }
                })];
              });
            });
          };
          startingState = ensureState();
          syncedState = startingState;
          if (!(!startingState.devices || startingState.devices.length === 0 || !((_a = startingState.session) === null || _a === void 0 ? void 0 : _a.serviceRoot))) return [3 /*break*/, 2];
          return [4 /*yield*/, refreshDevicesDirectApple(startingState, false)];
        case 1:
          syncedState = _b.sent();
          writeState(syncedState);
          _b.label = 2;
        case 2:
          if (!syncedState.session || syncedState.connection.state === "needs_reauth") {
            return [2 /*return*/, {
              result: "reconnect_needed",
              detail: syncedState.connection.summary,
              connection: syncedState.connection
            }];
          }
          targetDevice = syncedState.devices[selectedIndex] || syncedState.devices[0];
          if (!targetDevice) {
            return [2 /*return*/, {
              result: "failure",
              detail: "No iPhone, iPad, or Mac devices have been online in the last ".concat(RECENT_ONLINE_WINDOW_DAYS, " days."),
              connection: syncedState.connection
            }];
          }
          session = Object.assign({}, syncedState.session, {
            defaultDeviceId: targetDevice.id,
            updatedAt: nowIso()
          });
          return [4 /*yield*/, requestPlaySound(session, targetDevice.id)];
        case 3:
          response = _b.sent();
          console.log("playSound: status=" + response.status);
          if (!(response.status === 450)) return [3 /*break*/, 15];
          console.log("playSound: got 450, re-authenticating...");
          _b.label = 4;
        case 4:
          _b.trys.push([4, 14,, 15]);
          _b.label = 5;
        case 5:
          _b.trys.push([5, 7,, 9]);
          return [4 /*yield*/, ensureAccountLogin(session)];
        case 6:
          session = _b.sent();
          persistDirectAppleSession(session);
          return [3 /*break*/, 9];
        case 7:
          bootstrapError_1 = _b.sent();
          // Stored token is dead — mint a completely fresh session instead.
          console.log("playSound: bootstrap replay failed, attempting silent re-auth");
          return [4 /*yield*/, attemptSilentReauth(session)];
        case 8:
          reauthed = _b.sent();
          if (!reauthed) {
            throw bootstrapError_1;
          }
          session = reauthed;
          return [3 /*break*/, 9];
        case 9:
          return [4 /*yield*/, refreshDevicesDirectApple(Object.assign({}, syncedState, {
            session: session
          }), false)];
        case 10:
          refreshedState = _b.sent();
          syncedState = refreshedState;
          if (refreshedState.session) {
            session = Object.assign({}, refreshedState.session, {
              defaultDeviceId: targetDevice.id,
              updatedAt: nowIso()
            });
          }
          refreshedTarget = refreshedState.devices.find(function (device) {
            return device.id === targetDevice.id;
          }) || refreshedState.devices[selectedIndex] || refreshedState.devices[0];
          if (!refreshedTarget) return [3 /*break*/, 12];
          targetDevice = refreshedTarget;
          session = Object.assign({}, session, {
            defaultDeviceId: targetDevice.id,
            updatedAt: nowIso()
          });
          return [4 /*yield*/, requestPlaySound(session, targetDevice.id)];
        case 11:
          response = _b.sent();
          return [3 /*break*/, 13];
        case 12:
          console.log("playSound: refresh after re-auth returned no reachable devices");
          _b.label = 13;
        case 13:
          console.log("playSound: retry status=" + response.status);
          return [3 /*break*/, 15];
        case 14:
          e_1 = _b.sent();
          console.log("playSound: re-auth failed: " + String(e_1));
          return [3 /*break*/, 15];
        case 15:
          parsed = parsePlaySoundResult(targetDevice, response);
          connection = {
            state: response.status === 401 || response.status === 403 || response.status === 421 ? "needs_reauth" : parsed.accepted ? "connected" : "degraded",
            summary: response.status === 401 || response.status === 403 || response.status === 421 ? "Apple session needs refresh (HTTP ".concat(response.status, ").") : parsed.accepted ? "Phone-side Apple session responded successfully." : "Apple received the request but did not confirm a playable sound.",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: targetDevice.id
          };
          writeState(Object.assign({}, syncedState, {
            session: session,
            connection: connection
          }));
          return [2 /*return*/, {
            result: connection.state === "needs_reauth" ? "reconnect_needed" : parsed.accepted ? "success" : "failure",
            detail: parsed.accepted ? parsed.detail : connection.state === "needs_reauth" ? connection.summary : parsed.detail,
            connection: connection
          }];
      }
    });
  });
};
var syncInProgress = false;
// Short-lived cache so the burst of startup syncs doesn't each hit Apple.
var DEVICE_SYNC_CACHE_MS = 6000;
var lastGoodSyncMs = 0;
var syncState = function syncState() {
  return __awaiter(void 0, void 0, void 0, function () {
    var state, refreshed, pendingState, sess, refreshStartMs, refreshed, error_5, failedState;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (syncInProgress) {
            console.log("syncState: skipping — sync already in progress");
            return [2 /*return*/];
          }
          syncInProgress = true;
          _a.label = 1;
        case 1:
          _a.trys.push([1,, 6, 7]);
          state = ensureState();
          // Serve the last good result without a network round-trip if it's fresh —
          // collapses the reopen/ready-ack sync storm into a single Apple refresh.
          if (state.mode === "direct_apple" && state.session && Array.isArray(state.devices) && state.devices.length > 0 && state.connection.state === "connected" && lastGoodSyncMs && nowMs() - lastGoodSyncMs < DEVICE_SYNC_CACHE_MS) {
            console.log("syncState: serving cached devices (age " + (nowMs() - lastGoodSyncMs) + "ms)");
            sendDeviceSync(state);
            return [2 /*return*/];
          }
          if (state.mode === "mock_local") {
            refreshed = Object.assign({}, state, {
              connection: Object.assign({}, state.connection, {
                lastCheckedAt: nowIso()
              })
            });
            writeState(refreshed);
            sendDeviceSync(refreshed);
            return [2 /*return*/];
          }
          if (readPendingAuthState()) {
            pendingState = loginSummaryState("Apple sign-in needs a 2FA code in phone settings.", state.session || undefined);
            writeState(pendingState);
            sendDeviceSync(pendingState);
            return [2 /*return*/];
          }
          _a.label = 2;
        case 2:
          _a.trys.push([2, 4,, 5]);
          sess = state.session;
          console.log("syncState: mode=" + state.mode + " hasSession=" + String(Boolean(sess && sess.sessionToken)));
          // Stale-while-revalidate: push the last-known devices to the watch right
          // away so it shows them instantly, then refresh from Apple in the
          // background and send the updated list when it arrives.
          if (Array.isArray(state.devices) && state.devices.length > 0) {
            sendDeviceSync(state);
          }
          refreshStartMs = nowMs();
          return [4 /*yield*/, refreshDevicesDirectApple(state, false)];
        case 3:
          refreshed = _a.sent();
          logTiming("device-refresh:total", refreshStartMs, "-> " + refreshed.connection.state);
          console.log("syncState: got " + refreshed.devices.length + " devices, state=" + refreshed.connection.state);
          if (refreshed.devices.length > 0) {
            clearPendingAuthState(); // Clear any stale pending state after successful sync
            if (refreshed.connection.state === "connected") {
              lastGoodSyncMs = nowMs();
            }
          }
          writeState(refreshed);
          sendDeviceSync(refreshed);
          return [3 /*break*/, 5];
        case 4:
          error_5 = _a.sent();
          console.log("syncState: refresh failed: " + String(error_5));
          failedState = Object.assign({}, state, {
            devices: state.devices,
            connection: {
              state: "degraded",
              summary: error_5 instanceof Error ? error_5.message : "Phone-side Apple sync failed.",
              provider: "direct_apple",
              lastCheckedAt: nowIso(),
              defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
            }
          });
          writeState(failedState);
          sendDeviceSync(failedState);
          return [3 /*break*/, 5];
        case 5:
          return [3 /*break*/, 7];
        case 6:
          syncInProgress = false;
          return [7 /*endfinally*/];
        case 7:
          return [2 /*return*/];
      }
    });
  });
};
var pingState = function pingState(selectedIndex) {
  return __awaiter(void 0, void 0, void 0, function () {
    var state, updatedAt, scenario, connection, result, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          state = ensureState();
          if (state.mode === "mock_local") {
            updatedAt = nowIso();
            scenario = state.session && state.session.scenario || "healthy";
            connection = {
              state: scenario === "expired" ? "needs_reauth" : scenario === "degraded" ? "degraded" : "connected",
              summary: scenario === "expired" ? "Phone-side mock session requires reconnect." : scenario === "degraded" ? "Phone-side mock session is usable but stale." : "Phone-side mock session is ready.",
              provider: "mock_local",
              lastCheckedAt: updatedAt,
              defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
            };
            writeState(Object.assign({}, state, {
              connection: connection,
              session: state.session ? Object.assign({}, state.session, {
                updatedAt: updatedAt
              }) : state.session
            }));
            sendPingStatus(scenario === "expired" ? "reconnect_needed" : "success", scenario === "expired" ? "Stored phone-side mock session expired." : "Mock ping sent to ".concat(state.session && state.session.defaultDeviceId || "device", "."), connection);
            return [2 /*return*/];
          }
          _a.label = 1;
        case 1:
          _a.trys.push([1, 3,, 4]);
          console.log("pingState: pinging device " + selectedIndex);
          return [4 /*yield*/, pingDirectApple(selectedIndex)];
        case 2:
          result = _a.sent();
          console.log("pingState: result=" + result.result + " detail=" + result.detail);
          sendPingStatus(result.result, result.detail, result.connection);
          return [3 /*break*/, 4];
        case 3:
          error_6 = _a.sent();
          console.log("pingState: ERROR: " + String(error_6));
          sendPingStatus("failure", error_6 instanceof Error ? error_6.message : "Phone-side Apple request failed.", {
            state: "degraded",
            summary: "Phone-side Apple request failed.",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: ensureState().session ? ensureState().session.defaultDeviceId : undefined
          });
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
Pebble.addEventListener("ready", function () {
  console.log("pkjs ready for ".concat(APP_NAME));
  // Seed the cookie jar from the persisted session so cookies survive
  // PKJS restarts (app relaunch, phone reboot, etc.)
  var storedSettings = resolvedDirectAppleSettings();
  if (storedSettings.cookieHeader && !containsPlaceholder(storedSettings.cookieHeader)) {
    // cookieHeader is stored in Cookie format: "name1=val1; name2=val2"
    storedSettings.cookieHeader.split(";").forEach(function (pair) {
      var trimmed = pair.trim();
      var eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        var name_2 = trimmed.substring(0, eqIdx).trim();
        cookieJar[name_2] = trimmed;
      }
    });
    console.log("cookie jar seeded with " + Object.keys(cookieJar).length + " cookies from stored session");
  }
  ensureState();
  // One ack now plus one fallback — the watch has its own sync-retry loop, so
  // we no longer spam four acks (each of which triggered a full network sync).
  sendReadyAck();
  setTimeout(sendReadyAck, 1500);
  void syncState();
});
Pebble.addEventListener("showConfiguration", function () {
  console.log("showConfiguration: opening settings");
  if (typeof Pebble.openURL !== "function") {
    console.log("Pebble.openURL is unavailable");
    return;
  }
  var configUrl;
  try {
    configUrl = buildClayUrl();
  } catch (error) {
    console.log("showConfiguration: buildClayUrl failed: " + String(error));
    configUrl = undefined;
  }
  if (!configUrl) {
    console.log("showConfiguration: no config URL; settings could not be built");
    return;
  }
  console.log("Opening configuration page");
  Pebble.openURL(configUrl);
});
Pebble.addEventListener("webviewclosed", function (event) {
  var response = event && typeof event.response === "string" ? event.response : "";
  console.log("webviewclosed: response length=" + response.length);
  if (!response) {
    console.log("webviewclosed: empty response");
    return;
  }
  try {
    var payloadMatch = String(response).trim().match(/^[^{}]*[?#](.+)$/);
    var rawResponse = payloadMatch ? payloadMatch[1] : String(response).trim();
    var decodedResponse = rawResponse.match(/^\s*\{/) ? rawResponse : decodeURIComponent(rawResponse);
    console.log("webviewclosed: decoded prefix=" + decodedResponse.slice(0, 32));
    var parsedResponse_1 = JSON.parse(decodedResponse);
    var parsed = parsedResponse_1 && _typeof(parsedResponse_1) === "object" ? Object.keys(parsedResponse_1).reduce(function (result, key) {
      var value = parsedResponse_1[key];
      result[key] = value && _typeof(value) === "object" && "value" in value ? value.value : value;
      return result;
    }, {}) : {};
    var action = String(parsed.action || "").trim();
    var appleId_1 = String(parsed.appleId || "").trim();
    var password_1 = String(parsed.password || "");
    var code_1 = String(parsed.twoFactorCode || parsed.code || "").trim();
    if (!action) {
      if (code_1) {
        action = "login_verify_2fa";
      } else if (password_1) {
        action = "login_start";
      } else {
        console.log("webviewclosed: no actionable Clay data");
        return;
      }
    }
    if (action === "clear") {
      applyDirectAppleSettings(null);
      void syncState();
      return;
    }
    if (action === "reset_all") {
      var resetState = resetAllToDefaults();
      sendResetSync(resetState);
      return;
    }
    if (action === "set_distance_unit") {
      var distanceUnit = parsed.distanceUnit === "kilometers" ? "kilometers" : "miles";
      writeStoredPreferences({
        distanceUnit: distanceUnit
      });
      sendDeviceSync(ensureState());
      return;
    }
    if (action === "login_start") {
      if (readPendingAuthState()) {
        console.log("login_start: skipping — auth already in progress");
        return;
      }
      console.log("login_start: sign-in requested");
      loginErrorNotice = ""; // clear any error from a previous attempt
      setAuthBusy(true); // show the "please wait" page if settings is reopened mid-flow
      writeState(loginSummaryState("Starting Apple sign-in on the phone...", {
        appleId: appleId_1,
        clientId: resolvedDirectAppleSettings().clientId || randomClientId(),
        defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
        playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
      }));
      sendDeviceSync(ensureState());
      void function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var error_7, postLoginSettings, hasValidSession;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2,, 3]);
                console.log("login_start: calling startAppleLogin...");
                return [4 /*yield*/, startAppleLogin(appleId_1, password_1)];
              case 1:
                _a.sent();
                console.log("login_start: startAppleLogin completed");
                return [3 /*break*/, 3];
              case 2:
                error_7 = _a.sent();
                // Sign-in failed (wrong password, network, etc.) — fall back to the
                // sign-in page with the reason shown.
                console.log("login_start: ERROR: " + String(error_7));
                clearPendingAuthState();
                loginErrorNotice = error_7 instanceof Error ? error_7.message : "Apple sign-in failed. Please try again.";
                writeState(loginSummaryState(loginErrorNotice, {
                  appleId: appleId_1,
                  clientId: resolvedDirectAppleSettings().clientId || randomClientId(),
                  defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
                  playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
                }));
                return [3 /*break*/, 3];
              case 3:
                setAuthBusy(false); // done working — let the real page render
                return [4 /*yield*/, syncState()];
              case 4:
                _a.sent();
                postLoginSettings = resolvedDirectAppleSettings();
                hasValidSession = postLoginSettings.sessionToken && postLoginSettings.serviceRoot && !containsPlaceholder(postLoginSettings.serviceRoot);
                if (!hasValidSession && typeof Pebble.openURL === "function") {
                  console.log("login_start: reopening settings (" + (readPendingAuthState() ? "verify" : "sign-in") + ")");
                  Pebble.openURL(buildClayUrl());
                }
                return [2 /*return*/];
            }
          });
        });
      }();
      return;
    }
    if (action === "login_verify_2fa") {
      setAuthBusy(true);
      writeState(loginSummaryState("Submitting Apple verification code on the phone...", resolvedDirectAppleSettings()));
      sendDeviceSync(ensureState());
      void function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var error_8, pending, s, hasValidSession;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2,, 3]);
                return [4 /*yield*/, verifyAppleTwoFactorCode(code_1)];
              case 1:
                _a.sent();
                return [3 /*break*/, 3];
              case 2:
                error_8 = _a.sent();
                pending = readPendingAuthState();
                // Wrong/expired code — keep the user on the verify page to retry.
                if (pending) {
                  updatePendingAuthState({
                    deliveryNotice: "That code wasn&#39;t accepted. Check it and try again, or tap Resend Code."
                  });
                }
                writeState(loginSummaryState(error_8 instanceof Error ? error_8.message : "Apple 2FA verification failed.", {
                  appleId: pending ? pending.appleId : resolvedDirectAppleSettings().appleId,
                  clientId: pending ? pending.clientId : resolvedDirectAppleSettings().clientId,
                  defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
                  sessionToken: pending ? pending.sessionToken : resolvedDirectAppleSettings().sessionToken,
                  trustToken: pending ? pending.trustToken : resolvedDirectAppleSettings().trustToken,
                  accountCountry: pending ? pending.accountCountry : resolvedDirectAppleSettings().accountCountry,
                  scnt: pending ? pending.scnt : resolvedDirectAppleSettings().scnt,
                  sessionId: pending ? pending.sessionId : resolvedDirectAppleSettings().sessionId,
                  authAttributes: pending ? pending.authAttributes : resolvedDirectAppleSettings().authAttributes,
                  playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
                }));
                return [3 /*break*/, 3];
              case 3:
                setAuthBusy(false);
                return [4 /*yield*/, syncState()];
              case 4:
                _a.sent();
                s = resolvedDirectAppleSettings();
                hasValidSession = s.sessionToken && s.serviceRoot && !containsPlaceholder(s.serviceRoot);
                if (!hasValidSession && readPendingAuthState() && typeof Pebble.openURL === "function") {
                  Pebble.openURL(buildClayUrl());
                }
                return [2 /*return*/];
            }
          });
        });
      }();
      return;
    }
    if (action === "request_2fa_sms") {
      setAuthBusy(true);
      writeState(loginSummaryState("Requesting an Apple SMS verification code...", resolvedDirectAppleSettings()));
      sendDeviceSync(ensureState());
      void function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var error_9;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2,, 3]);
                return [4 /*yield*/, requestAppleSmsCode()];
              case 1:
                _a.sent();
                writeState(loginSummaryState("Apple sent an SMS verification code. Reopen settings and enter it.", {
                  appleId: resolvedDirectAppleSettings().appleId,
                  clientId: resolvedDirectAppleSettings().clientId,
                  defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
                  sessionToken: resolvedDirectAppleSettings().sessionToken,
                  trustToken: resolvedDirectAppleSettings().trustToken,
                  accountCountry: resolvedDirectAppleSettings().accountCountry,
                  scnt: resolvedDirectAppleSettings().scnt,
                  sessionId: resolvedDirectAppleSettings().sessionId,
                  authAttributes: resolvedDirectAppleSettings().authAttributes,
                  playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
                }));
                return [3 /*break*/, 3];
              case 2:
                error_9 = _a.sent();
                if (readPendingAuthState()) {
                  updatePendingAuthState({
                    deliveryNotice: "We couldn&#39;t send a new code. Wait a moment and tap Resend Code again."
                  });
                }
                writeState(loginSummaryState(error_9 instanceof Error ? error_9.message : "Apple could not send an SMS verification code.", {
                  appleId: resolvedDirectAppleSettings().appleId,
                  clientId: resolvedDirectAppleSettings().clientId,
                  defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
                  sessionToken: resolvedDirectAppleSettings().sessionToken,
                  trustToken: resolvedDirectAppleSettings().trustToken,
                  accountCountry: resolvedDirectAppleSettings().accountCountry,
                  scnt: resolvedDirectAppleSettings().scnt,
                  sessionId: resolvedDirectAppleSettings().sessionId,
                  authAttributes: resolvedDirectAppleSettings().authAttributes,
                  playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
                }));
                return [3 /*break*/, 3];
              case 3:
                setAuthBusy(false);
                // Reopen so the user can type the resent code without navigating back.
                if (readPendingAuthState() && typeof Pebble.openURL === "function") {
                  Pebble.openURL(buildClayUrl());
                }
                sendDeviceSync(ensureState());
                return [2 /*return*/];
            }
          });
        });
      }();
      return;
    }
    if (action === "save") {
      applyDirectAppleSettings({
        appleId: String(parsed.appleId || ""),
        defaultDeviceId: String(parsed.defaultDeviceId || ""),
        serviceRoot: String(parsed.serviceRoot || ""),
        dsid: String(parsed.dsid || ""),
        clientId: String(parsed.clientId || ""),
        playSoundUrl: String(parsed.playSoundUrl || ""),
        cookieHeader: String(parsed.cookieHeader || ""),
        sessionToken: String(parsed.sessionToken || ""),
        trustToken: String(parsed.trustToken || ""),
        accountCountry: String(parsed.accountCountry || ""),
        scnt: String(parsed.scnt || ""),
        sessionId: String(parsed.sessionId || ""),
        authAttributes: String(parsed.authAttributes || ""),
        // Preserve any stored password (not part of the manual save form) so
        // silent re-auth keeps working after a manual settings save.
        password: String(parsed.password || readStoredDirectAppleSettings().password || "")
      });
      void syncState();
    }
  } catch (error) {
    console.log("settings response parse failed: " + String(error));
  }
});
Pebble.addEventListener("appmessage", function (event) {
  var payload = event && _typeof(event) === "object" && "payload" in event ? event.payload : undefined;
  if (payload && PKJS_READY_KEY in payload) {
    console.log("pkjs received watch ready probe");
    sendReadyAck();
    return;
  }
  var action = Number(payload && APP_MESSAGE_KEYS.action in payload ? payload[APP_MESSAGE_KEYS.action] : 0);
  if (action === APP_ACTIONS.ping) {
    console.log("pkjs received ping request");
    void pingState(Number(payload && APP_MESSAGE_KEYS.selectedIndex in payload ? payload[APP_MESSAGE_KEYS.selectedIndex] : 0));
    return;
  }
  if (action === APP_ACTIONS.sync) {
    console.log("pkjs received sync request");
    void syncState();
  }
});