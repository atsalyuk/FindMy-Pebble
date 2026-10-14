import "./polyfills";
import { parseHsa2BootContext, type Hsa2BootContext } from "./hsa2-boot";

const { APP_ACTIONS, APP_MESSAGE_KEYS, APP_RESULT_CODES, APP_STATE_CODES } = require("./transport");
const { APP_NAME, DIRECT_APPLE_BOOTSTRAP, MOCK_BOOTSTRAP, getAppMode, getMockScenario } = require("./config");

// Clay configuration framework — generates settings page as data: URI
const Clay = require("@rebble/clay");
const clayConfig = require("./clay-config.json");
const clayCustomFn = require("./clay-custom");
const nodeCrypto: any = (globalThis as any).__polyfill_crypto || null;
const BufferCtor: any = (globalThis as any).__polyfill_Buffer || null;
const { getWasmCrypto } = require("./wasm-crypto");
const {
  BN_TWO,
  isBn,
  bnFromBuffer,
  bnFromHex,
  bnModPow,
  bnPositiveMod,
  bnToBuffer
} = require("./bigint");

type DeviceClass = "iPhone" | "iPad" | "Mac";
type ConnectionState = "disconnected" | "connecting" | "connected" | "degraded" | "needs_reauth";
type Provider = "mock_local" | "direct_apple";
type Result = "success" | "reconnect_needed" | "failure";
type DistanceUnit = "miles" | "kilometers";

type DeviceSummary = {
  id: string;
  name: string;
  deviceClass: DeviceClass;
  batteryLevelPercent?: number;
  isCharging?: boolean;
  distanceMeters?: number;
};

type ConnectionHealth = {
  state: ConnectionState;
  summary: string;
  provider: Provider;
  lastCheckedAt?: string;
  defaultDeviceId?: string;
};

type AppleSessionBundle = {
  provider: Provider;
  appleId: string;
  createdAt: string;
  updatedAt: string;
  defaultDeviceId: string;
  scenario?: "healthy" | "degraded" | "expired";
  playSoundUrl?: string;
  cookieHeader?: string;
  serviceRoot?: string;
  dsid?: string;
  clientId?: string;
  serverContext?: Record<string, unknown>;
  sessionToken?: string;
  trustToken?: string;
  accountCountry?: string;
  scnt?: string;
  sessionId?: string;
  authAttributes?: string;
  // Apple ID password, retained so the session can be silently re-established
  // when Apple expires the iCloud web session. Skipping 2FA on re-login relies
  // on the stored trustToken marking this clientId as a trusted device.
  password?: string;
};

type LocalState = {
  mode: "mock_local" | "direct_apple";
  session?: AppleSessionBundle;
  devices: DeviceSummary[];
  connection: ConnectionHealth;
};

type JsonResponse = {
  status: number;
  body: any;
  text: string;
  headers: Record<string, string>;
};

type DirectAppleSettings = {
  appleId: string;
  defaultDeviceId: string;
  serviceRoot: string;
  dsid: string;
  clientId: string;
  cookieHeader: string;
  playSoundUrl: string;
  sessionToken?: string;
  trustToken?: string;
  accountCountry?: string;
  scnt?: string;
  sessionId?: string;
  authAttributes?: string;
  password?: string;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  capturedAt: number;
};

type PendingAuthState = {
  appleId: string;
  clientId: string;
  sessionToken?: string;
  trustToken?: string;
  accountCountry?: string;
  scnt?: string;
  sessionId?: string;
  authAttributes?: string;
  mode?: string;
  hasTrustedDevices?: boolean;
  trustedPhoneNumber?: any;
  authInitialRoute?: string;
  authFactors?: string[];
  bridgeInitiateData?: Record<string, unknown>;
  phoneNumberVerification?: Record<string, unknown>;
  sourceAppId?: string;
  deliveryMethod?: "unknown" | "trusted_device" | "sms" | "security_key";
  verificationRoute?: "trusted_device" | "sms";
  deliveryNotice?: string;
};

type ConfigStage = "credentials" | "verify" | "complete" | "busy";

const PKJS_READY_KEY = 15025;
// Clay instance — initialized lazily so userData can be refreshed each time
const PKJS_STORAGE_KEY = "findmy-pebble-pkjs-state-v2";
const PKJS_DIRECT_SETTINGS_KEY = "findmy-pebble-direct-settings-v1";
const PKJS_PENDING_AUTH_KEY = "findmy-pebble-pending-auth-v1";
const PKJS_PREFERENCES_KEY = "findmy-pebble-preferences-v1";
const PKJS_LOG_BUFFER_KEY = "findmy-pebble-log-buffer-v1";
const RECENT_ONLINE_WINDOW_DAYS = 30;
const MAX_LOG_BUFFER_LINES = 200;
const MAX_LOG_SHARE_LINES = 60;
const MAX_LOG_SHARE_CHARS = 4000;
const APPLE_NETWORK_TIMEOUT_MS = 20000;
const LOCATION_TIMEOUT_MS = 10000;
const LOCATION_MAX_AGE_MS = 5 * 60 * 1000;
const FMIP_CLIENT_CONTEXT_TIMEZONE = "US/Pacific";
const APPLE_AUTH_ENDPOINT = "https://idmsa.apple.com/appleauth/auth";
const APPLE_SETUP_ENDPOINT = "https://setup.icloud.com/setup/ws/1";
const APPLE_WIDGET_KEY = "d39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d";
const SRP_2048_N_HEX = "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73";
const SRP_2048_LENGTH_BYTES = 256;
const FMIP_PARAMS = {
  clientBuildNumber: "2534Project66",
  clientMasteringNumber: "2534B22"
} as const;
const APPLE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Safari/605.1.15",
  origin: "https://www.icloud.com",
  referer: "https://www.icloud.com/",
  accept: "application/json, text/javascript, */*; q=0.01"
} as const;

let currentState: LocalState | undefined;
let currentDevices: DeviceSummary[] = [];

const APPLE_TIMEOUT_ERROR_MESSAGE = "Network request timed out.";

const watchPlatform = (): string | undefined => {
  const pebbleApi = Pebble as any;
  if (typeof pebbleApi.getActiveWatchInfo !== "function") {
    return undefined;
  }

  const watchInfo = pebbleApi.getActiveWatchInfo();
  return watchInfo && typeof watchInfo.platform === "string"
    ? watchInfo.platform
    : undefined;
};

const WATCH_DEVICE_LIMIT_DEFAULT = 10;

const watchDeviceLimit = (): number => watchPlatform() === "aplite" ? 3 : WATCH_DEVICE_LIMIT_DEFAULT;

const devicesForWatch = (devices: DeviceSummary[], defaultDeviceId?: string) => {
  const limit = watchDeviceLimit();
  if (devices.length <= limit) {
    const selectedIndex = defaultDeviceId
      ? devices.findIndex((device) => device.id === defaultDeviceId)
      : 0;
    return {
      devices,
      selectedIndex: selectedIndex >= 0 ? selectedIndex : 0
    };
  }

  const selectedIndex = defaultDeviceId
    ? devices.findIndex((device) => device.id === defaultDeviceId)
    : 0;

  if (selectedIndex >= 0 && selectedIndex < limit) {
    return {
      devices: devices.slice(0, limit),
      selectedIndex
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
let pendingAuthState: PendingAuthState | undefined;
// True while a login / verify / SMS operation is in flight — makes the settings
// page show a "please wait, close and reopen" screen instead of a stale form.
// Time-bounded so a missed reset can never leave the page stuck on "please wait".
let authBusy = false;
let authBusyUntilMs = 0;
const setAuthBusy = (busy: boolean) => {
  authBusy = busy;
  authBusyUntilMs = busy ? nowMs() + 45000 : 0;
};
const isAuthBusy = () => authBusy && nowMs() < authBusyUntilMs;
// A short message shown on the sign-in page after a failed attempt (e.g. bad
// credentials or the code couldn't be sent), so failures fall back cleanly.
let loginErrorNotice = "";
let cachedUserLocation: UserLocation | undefined;

// ── In-memory cookie jar ──────────────────────────────────────────────
// pypkjs uses Python requests.Session which shares cookies across all
// requests automatically. Real iOS PKJS does NOT — the XHR cookie store
// is ephemeral or domain-scoped. This jar accumulates Set-Cookie values
// from every Apple response and replays them on subsequent requests.
const cookieJar: Record<string, string> = {};

const nativeConsole = typeof console === "object" && console
  ? {
      log: typeof console.log === "function" ? console.log.bind(console) : undefined,
      info: typeof console.info === "function" ? console.info.bind(console) : undefined,
      warn: typeof console.warn === "function" ? console.warn.bind(console) : undefined,
      error: typeof console.error === "function" ? console.error.bind(console) : undefined
    }
  : {};

const sensitiveKeyPattern = /^(?:pass(?:word)?|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)$/i;
const emailPattern = /\b([A-Z0-9._%+-])[A-Z0-9._%+-]*@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
let logBuffer: string[] = (() => {
  try {
    const raw = localStorage.getItem(PKJS_LOG_BUFFER_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((entry) => String(entry || ""))
          .filter((entry) => entry.length > 0)
          .slice(-MAX_LOG_BUFFER_LINES)
      : [];
  } catch (_error) {
    return [];
  }
})();

const persistLogBuffer = () => {
  try {
    localStorage.setItem(PKJS_LOG_BUFFER_KEY, JSON.stringify(logBuffer.slice(-MAX_LOG_BUFFER_LINES)));
  } catch (_error) {
    // Ignore storage failures; logs are still kept in memory for this session.
  }
};

const sanitizeUrlLike = (value: string) => {
  let sanitized = String(value || "");

  sanitized = sanitized.replace(/^pebblejs:\/\/close#.*$/i, "pebblejs://close#<redacted>");
  sanitized = sanitized.replace(/^(mailto:[^?]+)\?.*$/i, "$1?<redacted>");
  sanitized = sanitized.replace(/(\/\/[^\/\s:@]+:)[^@\/\s]+@/g, "$1<redacted>@");
  sanitized = sanitized.replace(
    /([?&](?:password|pass|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)=)[^&#\s]*/gi,
    "$1<redacted>"
  );

  if (/^https?:\/\//i.test(sanitized) && sanitized.indexOf("#") !== -1) {
    sanitized = sanitized.replace(/#.*/, "#<redacted>");
  }

  return sanitized;
};

const maskEmail = (value: string) =>
  String(value || "").replace(emailPattern, (_match, first, domain) => `${String(first || "")}***@${String(domain || "")}`);

const sanitizeString = (value: string) => {
  let sanitized = String(value || "");

  sanitized = sanitized.replace(/\b(?:https?|pebblejs|mailto):\/\/[^\s]+/gi, (match) => sanitizeUrlLike(match));
  sanitized = sanitized.replace(
    /(["']?(?:password|pass|pwd|sessionToken|trustToken|token|cookie|cookieHeader|authorization|scnt|sessionId|authAttributes|dsid|clientId|appleId|email)["']?\s*[:=]\s*["']?)([^"',\s}]+)/gi,
    "$1<redacted>"
  );
  sanitized = sanitized.replace(
    /([?&](?:password|pass|pwd|sessiontoken|trusttoken|token|cookie|cookieheader|authorization|scnt|sessionid|authattributes|dsid|clientid|appleid|email)=)[^&#\s]*/gi,
    "$1<redacted>"
  );
  sanitized = maskEmail(sanitized);

  return sanitized;
};

const sanitizeValue = (value: any, seen: any[] = []): any => {
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

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.indexOf(value) >= 0) {
    return "[circular]";
  }

  const nextSeen = seen.concat([value]);

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, nextSeen));
  }

  const output: Record<string, unknown> = {};
  Object.keys(value).forEach((key) => {
    if (sensitiveKeyPattern.test(key)) {
      output[key] = "<redacted>";
      return;
    }
    output[key] = sanitizeValue(value[key], nextSeen);
  });
  return output;
};

const stringifyLogArg = (value: unknown) => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (value instanceof Error) {
    const sanitizedError = sanitizeValue(value);
    return `${sanitizedError.name}: ${sanitizedError.message}`;
  }

  if (typeof value === "object" && value) {
    try {
      return JSON.stringify(sanitizeValue(value));
    } catch (_error) {
      return "[unserializable]";
    }
  }

  return sanitizeString(String(value));
};

const appendLogLine = (level: "log" | "info" | "warn" | "error", args: IArguments | unknown[]) => {
  const values = Array.prototype.slice.call(args).map((value) => stringifyLogArg(value));
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${values.join(" ")}`.trim();
  logBuffer = logBuffer.concat([line]).slice(-MAX_LOG_BUFFER_LINES);
  persistLogBuffer();
  return values;
};

const patchConsoleMethod = (level: "log" | "info" | "warn" | "error") => {
  const nativeMethod = (nativeConsole as Record<string, undefined | ((message?: unknown) => void)>)[level]
    || nativeConsole.log;
  if (!nativeMethod || typeof console !== "object" || !console) {
    return;
  }

  (console as any)[level] = function patchedConsoleMethod() {
    const sanitized = appendLogLine(level, arguments);
    nativeMethod(sanitized.join(" "));
  };
};

patchConsoleMethod("log");
patchConsoleMethod("info");
patchConsoleMethod("warn");
patchConsoleMethod("error");

const summarizeShareState = () => {
  const state = readState();
  const pending = readPendingAuthState();
  return [
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${state ? state.mode : activeMode()}`,
    `Connection: ${state && state.connection ? state.connection.state : "unknown"}`,
    `Summary: ${sanitizeString((state && state.connection && state.connection.summary) || "Unavailable")}`,
    `Pending 2FA: ${pending ? "yes" : "no"}`,
    `Device count: ${state && Array.isArray(state.devices) ? state.devices.length : 0}`
  ];
};

const buildLogShareBody = () => {
  const header = [
    "FindMy for Pebble logs",
    "",
    ...summarizeShareState(),
    "",
    "Recent sanitized logs:"
  ];
  const logLines = logBuffer.slice(-MAX_LOG_SHARE_LINES);
  let body = header.concat(logLines).join("\n");

  if (body.length > MAX_LOG_SHARE_CHARS) {
    const overflow = body.length - MAX_LOG_SHARE_CHARS;
    const trimmedLogs = logLines.join("\n").slice(Math.min(overflow + 64, Math.max(logLines.join("\n").length - 256, 0)));
    body = header.concat(["[older log lines omitted]", trimmedLogs]).join("\n");
  }

  return body;
};

const stageSectionId = (configStage: ConfigStage) => {
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

const buildClayConfig = (configStage: ConfigStage) => {
  const nextConfig = JSON.parse(JSON.stringify(clayConfig));
  if (!Array.isArray(nextConfig)) {
    return nextConfig;
  }

  // The logs viewer (id "logs-widget") is populated client-side from
  // userData.logs by clay-custom — no server-side HTML injection needed here.

  const visibleSectionId = stageSectionId(configStage);
  return nextConfig.filter((item: any) => {
    if (!item || typeof item !== "object") {
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

const clearStoredLogBuffer = () => {
  logBuffer = [];
  localStorage.removeItem(PKJS_LOG_BUFFER_KEY);
};

const clearCookieJar = () => {
  Object.keys(cookieJar).forEach((key) => {
    delete cookieJar[key];
  });
};

const resetAllToDefaults = () => {
  localStorage.removeItem("clay-settings");
  clearStoredLogBuffer();
  clearStoredDirectAppleSettings();
  clearPendingAuthState();
  localStorage.removeItem(PKJS_PREFERENCES_KEY);
  clearCookieJar();
  localStorage.removeItem(PKJS_STORAGE_KEY);
  currentState = undefined;
  currentDevices = [];

  const resetState = baseDisconnectedState("direct_apple", "Direct Apple mode is not configured on the phone yet.");
  writeState(resetState);
  return resetState;
};

/** Parse Set-Cookie header(s) and merge into the jar. */
const mergeSetCookies = (setCookieHeader: string) => {
  if (!setCookieHeader) return;
  // Set-Cookie may contain multiple cookies separated by comma+space,
  // but cookie values can also contain commas (e.g. dates). Split on
  // comma followed by a cookie-name= pattern to be safe.
  // Simpler approach: split on `, ` where the next part has `=` before `;`
  const cookies = setCookieHeader.split(/,\s*(?=[A-Za-z_\-]+=)/);
  cookies.forEach((cookie) => {
    const nameValue = cookie.split(";")[0].trim(); // drop Path, Domain, etc.
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx > 0) {
      const name = nameValue.substring(0, eqIdx).trim();
      cookieJar[name] = nameValue; // store full "name=value"
    }
  });
};

/** Build a Cookie header from the jar. */
const buildCookieHeader = (): string =>
  Object.keys(cookieJar).map((name) => cookieJar[name]).join("; ");

// Diagnostic for Find My's HTTP 450 re-auth gate: Apple's error body (if any)
// plus which cookies (names only — values never logged) were presented, so a
// log dump shows whether stale X-APPLE-WEBAUTH-* cookies are in play.
const describeFmipRejection = (response: JsonResponse) =>
  "body=" + (String(response.text || "").slice(0, 240) || "<empty>") +
  " sentCookies=[" + Object.keys(cookieJar).join(",") + "]";

console.log("pkjs bootstrap loaded");

// Probe whether this runtime can run WebAssembly. If it can, the SRP crypto
// (PBKDF2 + 2048-bit modexp) can be moved to a WASM module for near-native
// speed without sending credentials off-device. Logged once at startup.
(() => {
  try {
    const wa: any = (globalThis as any).WebAssembly;
    let instantiates = false;
    let validates = false;
    if (wa && typeof wa.Module === "function") {
      const emptyModule = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]);
      try {
        validates = typeof wa.validate === "function" ? !!wa.validate(emptyModule) : false;
        const mod = new wa.Module(emptyModule);
        new wa.Instance(mod);
        instantiates = true;
      } catch (_inner) {
        instantiates = false;
      }
    }
    console.log(
      "wasm probe: WebAssembly=" + typeof wa +
      " Module=" + (wa ? typeof wa.Module : "n/a") +
      " validate=" + String(validates) +
      " instantiates=" + String(instantiates)
    );
  } catch (error) {
    console.log("wasm probe: error " + String(error));
  }
})();

const nowIso = () => new Date().toISOString();

// ── Auth-flow timing instrumentation ─────────────────────────────────
// Emits "timing: <label> took <ms>ms" lines so we can see where the login
// latency actually goes (SRP crypto vs each network round-trip vs total)
// before deciding how to speed it up. Cheap and side-effect free.
const nowMs = (): number => (typeof Date.now === "function" ? Date.now() : new Date().getTime());

const logTiming = (label: string, startMs: number, extra?: string) => {
  console.log(`timing: ${label} took ${nowMs() - startMs}ms${extra ? " " + extra : ""}`);
};

// Endpoint label with the query string stripped (query can carry sensitive
// values); the console sanitizer still runs over whatever we log.
const timingEndpointLabel = (method: string, url: string) => `${method} ${String(url || "").split("?")[0]}`;

const containsPlaceholder = (value?: string) => !value || value.includes("replace-with");

const randomClientId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const base64FromBuffer = (value: any) => BufferCtor.from(value).toString("base64");
const bufferFromBase64 = (value: string) => BufferCtor.from(value, "base64");
const hexFromBuffer = (value: any) => BufferCtor.from(value).toString("hex");

const parseResponseHeaders = (raw: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!raw) return headers;
  raw.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator <= 0) {
      return;
    }
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key) {
      headers[key] = value;
    }
  });
  return headers;
};

const parseAppleError = (response: JsonResponse) => {
  const body = response.body && typeof response.body === "object" ? response.body : {};
  const serviceErrors = Array.isArray(body.serviceErrors) ? body.serviceErrors : [];
  const firstServiceError = serviceErrors[0];
  const bodyMessage =
    (firstServiceError && (firstServiceError.message || firstServiceError.errorMessage)) ||
    body.errorMessage ||
    body.reason ||
    body.error ||
    "";
  const textMessage = response.text && response.text.length < 240 ? response.text : "";
  return String(bodyMessage || textMessage || `HTTP ${response.status}`);
};

const updateSessionFieldsFromHeaders = (target: any, headers: Record<string, string>) =>
  Object.assign({}, target, {
    accountCountry: String(headers["x-apple-id-account-country"] || target.accountCountry || ""),
    sessionId: String(headers["x-apple-id-session-id"] || target.sessionId || ""),
    authAttributes: String(headers["x-apple-auth-attributes"] || target.authAttributes || ""),
    sessionToken: String(headers["x-apple-session-token"] || target.sessionToken || ""),
    trustToken: String(headers["x-apple-twosv-trust-token"] || target.trustToken || ""),
    scnt: String(headers.scnt || target.scnt || "")
  });

const baseAppleAuthHeaders = (clientId: string): Record<string, string> => ({
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
  "X-Apple-FD-Client-Info": JSON.stringify(
    {
      U: APPLE_HEADERS["user-agent"],
      L: "en-US",
      Z: "GMT+00:00",
      V: "1.1",
      F: ""
    },
    null,
    0
  )
});

const buildAppleAuthHeaders = (
  clientId: string,
  authState?: {
    scnt?: string;
    sessionId?: string;
    authAttributes?: string;
  },
  overrides?: Record<string, string>
) => {
  const headers = Object.assign({}, baseAppleAuthHeaders(clientId));
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
    Object.keys(overrides).forEach((key) => {
      headers[key] = overrides[key];
    });
  }
  return headers;
};

const formatTrustedPhoneLabel = (trustedPhoneNumber: any) => {
  if (!trustedPhoneNumber || typeof trustedPhoneNumber !== "object") {
    return "";
  }
  const numberWithDialCode = trustedPhoneNumber.numberWithDialCode || trustedPhoneNumber.phoneNumber;
  const obfuscatedNumber = trustedPhoneNumber.obfuscatedNumber;
  return String(numberWithDialCode || obfuscatedNumber || "");
};

const readPendingAuthState = (): PendingAuthState | undefined => {
  if (pendingAuthState) {
    return pendingAuthState;
  }
  const raw = localStorage.getItem(PKJS_PENDING_AUTH_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    pendingAuthState = JSON.parse(raw) as PendingAuthState;
    return pendingAuthState;
  } catch (_error) {
    localStorage.removeItem(PKJS_PENDING_AUTH_KEY);
    return undefined;
  }
};

const writePendingAuthState = (value: PendingAuthState) => {
  pendingAuthState = value;
  localStorage.setItem(PKJS_PENDING_AUTH_KEY, JSON.stringify(value));
};

const clearPendingAuthState = () => {
  pendingAuthState = undefined;
  localStorage.removeItem(PKJS_PENDING_AUTH_KEY);
};

const readStoredDirectAppleSettings = (): Partial<DirectAppleSettings> => {
  const raw = localStorage.getItem(PKJS_DIRECT_SETTINGS_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Partial<DirectAppleSettings>;
  } catch (_error) {
    localStorage.removeItem(PKJS_DIRECT_SETTINGS_KEY);
    return {};
  }
};

const writeStoredDirectAppleSettings = (settings: DirectAppleSettings) => {
  localStorage.setItem(PKJS_DIRECT_SETTINGS_KEY, JSON.stringify(settings));
};

const clearStoredDirectAppleSettings = () => {
  localStorage.removeItem(PKJS_DIRECT_SETTINGS_KEY);
};

type StoredPreferences = {
  distanceUnit?: DistanceUnit;
  // Device the watch app opens straight into at launch ("" / absent = device list).
  // Deliberately separate from session.defaultDeviceId, which auto-follows the
  // last pinged device — this one only changes when the user picks it in settings.
  launchDeviceId?: string;
};

const readStoredPreferences = (): StoredPreferences => {
  const raw = localStorage.getItem(PKJS_PREFERENCES_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as { distanceUnit?: string; launchDeviceId?: string };
    return {
      distanceUnit: parsed.distanceUnit === "kilometers" ? "kilometers" : "miles",
      launchDeviceId:
        typeof parsed.launchDeviceId === "string" && parsed.launchDeviceId ? parsed.launchDeviceId : undefined
    };
  } catch (_error) {
    localStorage.removeItem(PKJS_PREFERENCES_KEY);
    return {};
  }
};

const resolvedDistanceUnit = (): DistanceUnit => readStoredPreferences().distanceUnit || "miles";

const resolvedLaunchDeviceId = (): string => readStoredPreferences().launchDeviceId || "";

const writeStoredPreferences = (update: Partial<StoredPreferences>) => {
  localStorage.setItem(PKJS_PREFERENCES_KEY, JSON.stringify(Object.assign({}, readStoredPreferences(), update)));
};

const persistDirectAppleSession = (session: AppleSessionBundle) => {
  const stored = readStoredDirectAppleSettings();
  writeStoredDirectAppleSettings({
    appleId: session.appleId,
    defaultDeviceId: session.defaultDeviceId,
    serviceRoot: String(session.serviceRoot || ""),
    dsid: String(session.dsid || ""),
    clientId: String(session.clientId || ""),
    cookieHeader: String(session.cookieHeader || ""),
    playSoundUrl: String(session.playSoundUrl || ""),
    sessionToken: String(session.sessionToken || ""),
    // The trust token is only re-issued by /2sv/trust; most responses along a
    // re-auth path never carry one. An empty value here must never clobber the
    // stored token — losing it forces the user through 2FA again.
    trustToken: String(session.trustToken || stored.trustToken || ""),
    accountCountry: String(session.accountCountry || ""),
    scnt: String(session.scnt || ""),
    sessionId: String(session.sessionId || ""),
    authAttributes: String(session.authAttributes || ""),
    password: String(session.password || stored.password || "")
  });
};

const resolvedDirectAppleSettings = (): DirectAppleSettings => {
  const stored = readStoredDirectAppleSettings();
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

const directAppleConfigured = () => {
  const settings = resolvedDirectAppleSettings();
  if (containsPlaceholder(settings.appleId) || containsPlaceholder(settings.clientId)) {
    return false;
  }

  if (!containsPlaceholder(settings.sessionToken)) {
    return true;
  }

  return (
    !containsPlaceholder(settings.serviceRoot) &&
    !containsPlaceholder(settings.dsid) &&
    (!containsPlaceholder(settings.cookieHeader) || !containsPlaceholder(settings.sessionToken))
  );
};

const hasCompleteDirectAppleSession = (settings: DirectAppleSettings) =>
  !containsPlaceholder(settings.appleId) &&
  !containsPlaceholder(settings.clientId) &&
  !containsPlaceholder(settings.sessionToken) &&
  !containsPlaceholder(settings.serviceRoot) &&
  !containsPlaceholder(settings.dsid);

const getConfigStage = (settings: DirectAppleSettings, pending?: PendingAuthState): ConfigStage => {
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

const activeMode = (): "mock_local" | "direct_apple" => {
  const configuredMode = getAppMode();
  if (configuredMode === "direct_apple") {
    return "direct_apple";
  }
  return "mock_local";
};

const srpPrimeN = bnFromHex(SRP_2048_N_HEX);
const srpGenerator = BN_TWO;

const bufferConcat = (parts: any[]) => BufferCtor.concat(parts.map((part) => BufferCtor.from(part)));

const sha256Buffer = (...parts: any[]) => {
  const hash = nodeCrypto.createHash("sha256");
  parts.forEach((part) => {
    hash.update(BufferCtor.from(part));
  });
  return hash.digest();
};

const positiveMod = (value: any, modulus: any) => bnPositiveMod(value, modulus);

const modPow = (base: any, exponent: any, modulus: any) => bnModPow(base, exponent, modulus);

const bigIntFromBuffer = (value: any) => bnFromBuffer(value);

const bufferFromBigInt = (value: any, targetLength?: number) => bnToBuffer(value, targetLength);

const padToN = (value: any) => {
  const buffer = isBn(value) ? bufferFromBigInt(value) : BufferCtor.from(value);
  if (buffer.length >= SRP_2048_LENGTH_BYTES) {
    return buffer;
  }
  return bufferConcat([BufferCtor.alloc(SRP_2048_LENGTH_BYTES - buffer.length), buffer]);
};

const computeSrpMultiplierK = () => bigIntFromBuffer(sha256Buffer(padToN(srpPrimeN), padToN(srpGenerator)));

const deriveAppleSrpPassword = (
  password: string,
  salt: any,
  iterations: number,
  protocol: string
) => {
  const passwordHash = nodeCrypto.createHash("sha256").update(String(password), "utf8").digest();
  let passwordDigest = passwordHash;
  if (protocol === "s2k_fo") {
    passwordDigest = BufferCtor.from(passwordHash.toString("hex"), "utf8");
  }
  if (protocol !== "s2k" && protocol !== "s2k_fo") {
    throw new Error(`Unsupported Apple SRP protocol: ${protocol}`);
  }
  const wasm = getWasmCrypto();
  if (wasm) {
    try {
      const pwU8 = passwordDigest instanceof Uint8Array ? passwordDigest : new Uint8Array(Array.prototype.slice.call(passwordDigest));
      const saltU8 = salt instanceof Uint8Array ? salt : new Uint8Array(Array.prototype.slice.call(salt));
      return BufferCtor.from(wasm.pbkdf2(pwU8, saltU8, iterations));
    } catch (_error) {
      // fall back to the JS implementation below
    }
  }
  return nodeCrypto.pbkdf2Sync(passwordDigest, salt, iterations, 32, "sha256");
};

const sendResponse = (payload: Record<number, string | number>, logFailure = true) => {
  if (typeof Pebble.sendAppMessage !== "function") {
    if (logFailure) {
      console.log("Pebble.sendAppMessage is unavailable");
    }
    return;
  }

  Pebble.sendAppMessage(payload, undefined, (event: unknown) => {
    if (logFailure) {
      console.log(`pkjs reply failed: ${JSON.stringify(event)}`);
    }
  });
};

const sendReadyAck = () => {
  sendResponse(
    {
      [PKJS_READY_KEY]: 1
    },
    false
  );
};

const encodeStateCode = (state: ConnectionState) => {
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

const encodeResultCode = (result: Result) => {
  switch (result) {
    case "success":
      return APP_RESULT_CODES.success;
    case "reconnect_needed":
      return APP_RESULT_CODES.reconnectNeeded;
    default:
      return APP_RESULT_CODES.failure;
  }
};

const stripTransientAppleSessionState = (session: AppleSessionBundle): AppleSessionBundle => {
  const sanitized = Object.assign({}, session);
  delete sanitized.serverContext;
  return sanitized;
};

const stateForPersistence = (state: LocalState): LocalState => (
  state.mode === "direct_apple" && state.session
    ? Object.assign({}, state, {
      session: stripTransientAppleSessionState(state.session)
    })
    : state
);


const isNetworkTimeoutError = (error: unknown): error is Error =>
  error instanceof Error && error.message === APPLE_TIMEOUT_ERROR_MESSAGE;

const writeState = (state: LocalState) => {
  currentState = state;
  currentDevices = state.devices;
  localStorage.setItem(PKJS_STORAGE_KEY, JSON.stringify(stateForPersistence(state)));
};

const readState = (): LocalState | undefined => {
  if (currentState) {
    return currentState;
  }

  const raw = localStorage.getItem(PKJS_STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as LocalState;
    currentState = parsed;
    currentDevices = parsed.devices;
    return parsed;
  } catch (_error) {
    localStorage.removeItem(PKJS_STORAGE_KEY);
    return undefined;
  }
};

const baseDisconnectedState = (provider: Provider, summary: string): LocalState => ({
  mode: provider === "direct_apple" ? "direct_apple" : "mock_local",
  devices: [],
  connection: {
    state: "disconnected",
    summary,
    provider
  }
});

const seedMockState = (): LocalState => {
  const scenario = getMockScenario();
  const updatedAt = nowIso();
  const devices: DeviceSummary[] = [
    { id: "iphone-primary", name: "Local iPhone", deviceClass: "iPhone", batteryLevelPercent: 84, distanceMeters: 420 },
    { id: "ipad-desk", name: "Desk iPad", deviceClass: "iPad", batteryLevelPercent: 63, distanceMeters: 18 },
    { id: "macbook-pro", name: "MacBook Pro", deviceClass: "Mac", batteryLevelPercent: 51, distanceMeters: 1200 }
  ];

  const state: ConnectionState =
    scenario === "expired" ? "needs_reauth" : scenario === "degraded" ? "degraded" : "connected";

  return {
    mode: "mock_local",
    devices,
    session: {
      provider: "mock_local",
      appleId: MOCK_BOOTSTRAP.appleId,
      createdAt: updatedAt,
      updatedAt,
      defaultDeviceId: MOCK_BOOTSTRAP.defaultDeviceId,
      scenario
    },
    connection: {
      state,
      summary:
        scenario === "expired"
          ? "Phone-side mock session requires reconnect."
          : scenario === "degraded"
            ? "Phone-side mock session is usable but stale."
            : "Phone-side mock session is ready.",
      provider: "mock_local",
      lastCheckedAt: updatedAt,
      defaultDeviceId: MOCK_BOOTSTRAP.defaultDeviceId
    }
  };
};

const seedDirectAppleState = (): LocalState => {
  const settings = resolvedDirectAppleSettings();
  const pending = readPendingAuthState();
  if (pending && pending.appleId === settings.appleId) {
    const updatedAt = nowIso();
    return {
      mode: "direct_apple",
      devices: [],
      session: {
        provider: "direct_apple",
        appleId: pending.appleId,
        createdAt: updatedAt,
        updatedAt,
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
        lastCheckedAt: updatedAt,
        defaultDeviceId: settings.defaultDeviceId
      }
    };
  }

  if (!directAppleConfigured()) {
    return baseDisconnectedState(
      "direct_apple",
      "Direct Apple mode is not configured on the phone yet."
    );
  }

  const updatedAt = nowIso();
  return {
    mode: "direct_apple",
    devices: [],
    session: {
      provider: "direct_apple",
      appleId: settings.appleId,
      createdAt: updatedAt,
      updatedAt,
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

const buildClayUrl = () => {
  const pending = readPendingAuthState();
  const settings = resolvedDirectAppleSettings();
  // While an auth operation is running, show a "please wait" page instead of a
  // form that may be mid-transition — the user is told to close and reopen.
  const configStage: ConfigStage = isAuthBusy() ? "busy" : getConfigStage(settings, pending);
  const resolvedClayConfig = buildClayConfig(configStage);

  // Create a new Clay instance each time so userData reflects current state
  const clayUserData = {
    configStage,
    appleId: settings.appleId || "",
    distanceUnit: resolvedDistanceUnit(),
    // Cached devices for the "Open at launch" picker shown once signed in.
    devices: ensureState().devices.map((device) => ({ id: device.id, name: device.name })),
    launchDeviceId: resolvedLaunchDeviceId(),
    pendingMode: pending ? (pending.deliveryMethod || pending.mode || "") : "",
    pendingNotice: pending ? (pending.deliveryNotice || "Enter your Apple verification code.") : "",
    loginError: loginErrorNotice || "",
    // Sanitized recent logs, shown in-page by the collapsible logs viewer.
    logs: buildLogShareBody()
  };
  const clay = new Clay(resolvedClayConfig, clayCustomFn, {
    autoHandleEvents: false,
    userData: clayUserData
  });

  // Clay only copies userData into `meta` on its "ready" handler when
  // autoHandleEvents is false — but we call generateUrl() immediately, so the
  // config page would otherwise receive an empty userData (every stage would
  // fall back to defaults, and userData-only pages like "busy" render blank).
  // Populate meta ourselves, mirroring what Clay's internal setup does.
  try {
    const pebbleApi: any = Pebble;
    (clay as any).meta = {
      activeWatchInfo: typeof pebbleApi.getActiveWatchInfo === "function" ? pebbleApi.getActiveWatchInfo() : null,
      accountToken: typeof pebbleApi.getAccountToken === "function" ? pebbleApi.getAccountToken() : "",
      watchToken: typeof pebbleApi.getWatchToken === "function" ? pebbleApi.getWatchToken() : "",
      userData: clayUserData
    };
  } catch (_metaError) {
    (clay as any).meta = (clay as any).meta || {};
    (clay as any).meta.userData = clayUserData;
  }

  const url = clay.generateUrl();

  // Diagnostic: log the shape of the Pebble host object so we can tell which
  // app (Core Devices vs legacy Rebble) is actually running and whether the
  // old firmware-sniff heuristic was reliable.
  try {
    const pebbleAny = Pebble as any;
    const keys = typeof pebbleAny === "object" && pebbleAny ? Object.keys(pebbleAny) : [];
    console.log(
      "config: host probe firmware=" + typeof pebbleAny.firmware +
      " getActiveWatchInfo=" + typeof pebbleAny.getActiveWatchInfo +
      " platform=" + String(watchPlatform() || "?") +
      " urlScheme=" + url.slice(0, 5) +
      " keys=" + keys.join(",")
    );
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

const applyDirectAppleSettings = (settings: DirectAppleSettings | null) => {
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

  const resetState = baseDisconnectedState("direct_apple", "Direct Apple mode is not configured on the phone yet.");
  writeState(resetState);
};

const ensureState = (): LocalState => {
  const mode = activeMode();
  const existing = readState();
  if (existing && existing.mode === mode) {
    return existing;
  }

  const seeded = mode === "direct_apple" ? seedDirectAppleState() : seedMockState();
  writeState(seeded);
  return seeded;
};

const sendDeviceSync = (state: LocalState) => {
  // When a launch device is chosen it also drives the watch list windowing so
  // it stays visible even past the per-platform device limit.
  const launchDeviceId = resolvedLaunchDeviceId();
  const watchSync = devicesForWatch(state.devices, launchDeviceId || state.connection.defaultDeviceId);
  currentDevices = watchSync.devices;
  const launchIndex = launchDeviceId
    ? watchSync.devices.findIndex((device) => device.id === launchDeviceId)
    : -1;
  sendResponse({
    [APP_MESSAGE_KEYS.state]: encodeStateCode(state.connection.state),
    [APP_MESSAGE_KEYS.devices]: JSON.stringify(
      watchSync.devices.map((device) => [
        device.name,
        device.deviceClass,
        formatDistanceText(device.distanceMeters),
        formatBatteryText(device.batteryLevelPercent, device.isCharging)
      ])
    ),
    [APP_MESSAGE_KEYS.selectedIndex]: watchSync.selectedIndex,
    [APP_MESSAGE_KEYS.launchIndex]: launchIndex
  });
};

const sendResetSync = (state: LocalState) => {
  currentDevices = [];
  sendResponse({
    [APP_MESSAGE_KEYS.reset]: 1,
    [APP_MESSAGE_KEYS.state]: encodeStateCode(state.connection.state),
    [APP_MESSAGE_KEYS.devices]: JSON.stringify([]),
    [APP_MESSAGE_KEYS.selectedIndex]: 0
  });
};

const sendPingStatus = (result: Result, detail: string, connection: ConnectionHealth) => {
  void detail;
  sendResponse({
    [APP_MESSAGE_KEYS.result]: encodeResultCode(result),
    [APP_MESSAGE_KEYS.state]: encodeStateCode(connection.state)
  });
};

const findSelectedIndex = (defaultDeviceId?: string) => {
  if (!defaultDeviceId) {
    return 0;
  }
  const index = currentDevices.findIndex((device) => device.id === defaultDeviceId);
  return index >= 0 ? index : 0;
};

const normalizeDeviceClass = (value: string | undefined): DeviceClass | null => {
  const normalized = String(value || "").toLowerCase();
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

const coerceNumber = (value: unknown) => {
  if (typeof value === "number" && isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const trimmed = value.trim();
    const normalized = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const normalizeBatteryLevelPercent = (value: unknown) => {
  const numeric = coerceNumber(value);
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

const normalizeBatteryStatus = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const coerceBooleanish = (value: unknown): boolean | undefined => {
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

  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
  if (!normalized) {
    return undefined;
  }

  if (
    normalized === "true"
    || normalized === "yes"
    || normalized === "on"
    || normalized === "1"
    || normalized === "charging"
    || normalized === "charged"
    || normalized === "full"
    || normalized === "fullycharged"
    || normalized === "fullcharge"
    || normalized === "accharging"
    || normalized === "wirelesscharging"
  ) {
    return true;
  }

  if (
    normalized === "false"
    || normalized === "no"
    || normalized === "off"
    || normalized === "0"
    || normalized === "notcharging"
    || normalized === "discharging"
    || normalized === "unplugged"
    || normalized === "battery"
  ) {
    return false;
  }

  return undefined;
};

const extractBatteryLevelPercent = (device: Record<string, any>) => {
  const battery = device && typeof device.battery === "object" ? device.battery : undefined;
  const batteryInfo = device && typeof device.batteryInfo === "object" ? device.batteryInfo : undefined;
  const batteryStatus = normalizeBatteryStatus(
    device.batteryStatus
      || device.batteryState
      || device.batteryChargingStatus
      || (battery && (battery.status || battery.state || battery.batteryStatus || battery.chargingStatus))
      || (batteryInfo && (batteryInfo.status || batteryInfo.state || batteryInfo.batteryStatus || batteryInfo.chargingStatus))
      || ""
  );
  const numericCandidates = [
    device.batteryLevelPercent,
    device.batteryLevel,
    device.batteryPercentage,
    device.batteryPercent,
    device.batteryLevelValue,
    batteryInfo && batteryInfo.batteryLevel,
    batteryInfo && batteryInfo.level,
    batteryInfo && batteryInfo.batteryPercentage,
    batteryInfo && batteryInfo.percent,
    battery && battery.batteryLevel,
    battery && battery.level,
    battery && battery.batteryPercentage,
    battery && battery.percent,
    battery && battery.value
  ];

  for (const candidate of numericCandidates) {
    const normalized = normalizeBatteryLevelPercent(candidate);
    if (typeof normalized === "number") {
      if (normalized === 0 && (!batteryStatus || batteryStatus === "unknown")) {
        continue;
      }

      return normalized;
    }
  }

  if (
    batteryStatus === "charged"
    || batteryStatus === "full"
    || batteryStatus === "fullycharged"
    || batteryStatus === "fullcharge"
  ) {
    return 100;
  }

  return undefined;
};

const extractBatteryCharging = (device: Record<string, any>) => {
  const battery = device && typeof device.battery === "object" ? device.battery : undefined;
  const batteryInfo = device && typeof device.batteryInfo === "object" ? device.batteryInfo : undefined;
  const batteryStatus = normalizeBatteryStatus(
    device.batteryStatus
      || device.batteryState
      || device.batteryChargingStatus
      || device.chargeStatus
      || device.chargingState
      || device.powerSource
      || (battery && (battery.status || battery.state || battery.batteryStatus || battery.chargingStatus))
      || (battery && (battery.chargeStatus || battery.chargingState || battery.powerSource))
      || (batteryInfo && (batteryInfo.status || batteryInfo.state || batteryInfo.batteryStatus || batteryInfo.chargingStatus))
      || (batteryInfo && (batteryInfo.chargeStatus || batteryInfo.chargingState || batteryInfo.powerSource))
      || ""
  );
  const booleanCandidates = [
    device.isCharging,
    device.isBatteryCharging,
    device.batteryCharging,
    device.charging,
    device.externalPowerConnected,
    device.powerConnected,
    device.isPluggedIn,
    batteryInfo && (batteryInfo.isCharging ?? batteryInfo.charging),
    batteryInfo && (batteryInfo.externalPowerConnected ?? batteryInfo.powerConnected ?? batteryInfo.isPluggedIn),
    battery && (battery.isCharging ?? battery.charging),
    battery && (battery.externalPowerConnected ?? battery.powerConnected ?? battery.isPluggedIn),
    device.batteryStatus,
    device.batteryState,
    device.batteryChargingStatus,
    device.chargeStatus,
    device.chargingState,
    device.powerSource,
    batteryInfo && (batteryInfo.status ?? batteryInfo.state ?? batteryInfo.batteryStatus ?? batteryInfo.chargingStatus ?? batteryInfo.chargeStatus ?? batteryInfo.chargingState ?? batteryInfo.powerSource),
    battery && (battery.status ?? battery.state ?? battery.batteryStatus ?? battery.chargingStatus ?? battery.chargeStatus ?? battery.chargingState ?? battery.powerSource)
  ];

  for (const candidate of booleanCandidates) {
    const normalized = coerceBooleanish(candidate);
    if (typeof normalized === "boolean") {
      return normalized;
    }
  }

  return batteryStatus.indexOf("charging") >= 0
    || batteryStatus.indexOf("charged") >= 0
    || batteryStatus === "full"
    || batteryStatus.indexOf("fullcharge") >= 0;
};

const batteryDebugSnapshot = (device: Record<string, any>) => {
  const battery = device && typeof device.battery === "object" ? device.battery : undefined;
  const batteryInfo = device && typeof device.batteryInfo === "object" ? device.batteryInfo : undefined;

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

const extractCoordinates = (device: Record<string, any>) => {
  const location = device.location;
  if (!location || typeof location !== "object") {
    return undefined;
  }

  const latitude = coerceNumber(location.latitude);
  const longitude = coerceNumber(location.longitude);
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude };
  }

  return undefined;
};

const readCurrentUserLocation = () =>
  new Promise<UserLocation | undefined>((resolve) => {
    const now = Date.now();
    if (cachedUserLocation && now - cachedUserLocation.capturedAt <= LOCATION_MAX_AGE_MS) {
      resolve(cachedUserLocation);
      return;
    }

    if (
      typeof navigator !== "object"
      || !navigator.geolocation
      || typeof navigator.geolocation.getCurrentPosition !== "function"
    ) {
      resolve(cachedUserLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedUserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          capturedAt: now
        };
        resolve(cachedUserLocation);
      },
      (error) => {
        console.log("geolocation: unable to read current position: " + String(error && error.message ? error.message : error));
        resolve(cachedUserLocation);
      },
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: LOCATION_MAX_AGE_MS
      }
    );
  });

const distanceBetweenMeters = (from: UserLocation, to: { latitude: number; longitude: number }) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

const formatDistanceText = (distanceMeters?: number) => {
  if (typeof distanceMeters !== "number" || !isFinite(distanceMeters)) {
    return "Distance unknown";
  }

  if (resolvedDistanceUnit() === "miles") {
    if (distanceMeters < 160.934) {
      const feet = Math.max(10, Math.round((distanceMeters * 3.28084) / 10) * 10);
      return `${feet} ft away`;
    }

    const miles = distanceMeters / 1609.344;
    return miles < 10 ? `${miles.toFixed(1)} mi away` : `${Math.round(miles)} mi away`;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters / 10) * 10} m away`;
  }

  const kilometers = distanceMeters / 1000;
  return kilometers < 10 ? `${kilometers.toFixed(1)} km away` : `${Math.round(kilometers)} km away`;
};

const formatBatteryText = (batteryLevelPercent?: number, isCharging?: boolean) => {
  const base = typeof batteryLevelPercent === "number" && isFinite(batteryLevelPercent)
    ? `${Math.round(batteryLevelPercent)}% battery`
    : "Battery unknown";
  return isCharging ? `${base} charging` : base;
};

const recentOnlineCutoffMs = () => Date.now() - RECENT_ONLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const deviceLastSeenMs = (device: Record<string, any>) => {
  const location = device.location;
  if (location && typeof location === "object") {
    for (const key of ["timeStamp", "secureLocationTs"]) {
      const value = location[key];
      if (typeof value === "number") {
        return value;
      }
    }
  }

  for (const key of ["lastLocatedTime", "lastLocationTime", "lastSeenTimestamp", "lastSeenTime"]) {
    const value = device[key];
    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
};

const isVisibleWatchTarget = (device: Record<string, any>) => {
  if (!device.features || !device.features.SND) {
    return false;
  }

  return normalizeDeviceClass(device.deviceClass) !== null;
};

const isRecentlyOnline = (device: Record<string, any>) => {
  const lastSeenMs = deviceLastSeenMs(device);
  return typeof lastSeenMs === "number" && lastSeenMs >= recentOnlineCutoffMs();
};

const summarizeDevice = (device: Record<string, any>, userLocation?: UserLocation): DeviceSummary | undefined => {
  const deviceClass = normalizeDeviceClass(device.deviceClass);
  if (!deviceClass) {
    return undefined;
  }

  const coordinates = extractCoordinates(device);
  const batteryLevelPercent = extractBatteryLevelPercent(device);
  const isCharging = extractBatteryCharging(device);
  console.log("battery_debug: " + JSON.stringify({
    ...batteryDebugSnapshot(device),
    derived: {
      batteryLevelPercent,
      isCharging
    }
  }));
  return {
    id: String(device.id || ""),
    name: String(device.name || device.deviceDisplayName || "Unnamed device"),
    deviceClass,
    batteryLevelPercent,
    isCharging,
    distanceMeters:
      coordinates && userLocation
        ? Math.round(distanceBetweenMeters(userLocation, coordinates))
        : undefined
  };
};

const buildQuery = (params: Record<string, string | number | boolean | undefined>) =>
  Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join("&");

const requestJson = (
  method: "GET" | "POST" | "PUT",
  url: string,
  params: Record<string, string | number | boolean | undefined> = {},
  headers: Record<string, string>,
  body?: any
) =>
  new Promise<JsonResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const query = buildQuery(params);
    const requestUrl = query ? `${url}?${query}` : url;
    const requestStartedMs = nowMs();
    const timingLabel = timingEndpointLabel(method, url);
    let settled = false;
    const finishResolve = (value: JsonResponse) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdogTimer);
      logTiming(timingLabel, requestStartedMs, "-> " + value.status);
      resolve(value);
    };
    const finishReject = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(watchdogTimer);
      logTiming(timingLabel, requestStartedMs, "-> error");
      reject(error);
    };
    const watchdogTimer = setTimeout(() => {
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
    const jarCookies = buildCookieHeader();
    if (jarCookies) {
      xhr.setRequestHeader("Cookie", jarCookies);
    }

    Object.keys(headers).forEach((key) => {
      // Don't override the Cookie header we just set from the jar
      if (key.toLowerCase() === "cookie") return;
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }

      const text = xhr.responseText || "";
      let parsed: any = undefined;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch (_error) {
          parsed = undefined;
        }
      }

      const headers = parseResponseHeaders(xhr.getAllResponseHeaders());
      // pypkjs's getAllResponseHeaders() may return null, but getResponseHeader works
      // Capture important headers individually as fallback
      if (!headers["set-cookie"]) {
        try { const sc = xhr.getResponseHeader("Set-Cookie"); if (sc) headers["set-cookie"] = sc; } catch (_e) { /* ignore */ }
      }
      if (!headers["x-apple-session-token"]) {
        try { const st = xhr.getResponseHeader("X-Apple-Session-Token"); if (st) headers["x-apple-session-token"] = st; } catch (_e) { /* ignore */ }
      }
      if (!headers["x-apple-twosv-trust-token"]) {
        try { const tt = xhr.getResponseHeader("X-Apple-TwoSV-Trust-Token"); if (tt) headers["x-apple-twosv-trust-token"] = tt; } catch (_e) { /* ignore */ }
      }
      if (!headers["scnt"]) {
        try { const s = xhr.getResponseHeader("scnt"); if (s) headers["scnt"] = s; } catch (_e) { /* ignore */ }
      }

      // Merge Set-Cookie into the jar for future requests
      if (headers["set-cookie"]) {
        mergeSetCookies(headers["set-cookie"]);
      }

      finishResolve({
        status: xhr.status,
        body: parsed,
        text,
        headers
      });
    };

    xhr.onerror = () => finishReject(new Error("Network request failed."));
    xhr.ontimeout = () => finishReject(new Error(APPLE_TIMEOUT_ERROR_MESSAGE));

    if (body) {
      xhr.send(JSON.stringify(body));
      return;
    }

    xhr.send();
  });

const appleParams = (session: AppleSessionBundle) => Object.assign({}, FMIP_PARAMS, {
  clientId: String(session.clientId || ""),
  dsid: String(session.dsid || "")
});

const appleHeaders = (_session: AppleSessionBundle) => {
  const headers: Record<string, string> = Object.assign({}, APPLE_HEADERS, {
    "content-type": "application/json"
  });
  // Cookie header is injected automatically by requestJson from the cookie jar.
  return headers;
};

const buildDirectAppleSession = (
  session: Partial<AppleSessionBundle>,
  connection: ConnectionHealth,
  devices?: DeviceSummary[]
): LocalState => ({
  mode: "direct_apple",
  devices: devices || [],
  session: Object.assign(
    {
      provider: "direct_apple" as Provider,
      appleId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      defaultDeviceId: ""
    },
    session
  ) as AppleSessionBundle,
  connection
});

const loginSummaryState = (summary: string, session?: Partial<AppleSessionBundle>) =>
  buildDirectAppleSession(
    session || {},
    {
      state: "needs_reauth",
      summary,
      provider: "direct_apple",
      lastCheckedAt: nowIso(),
      defaultDeviceId: String((session && session.defaultDeviceId) || "")
    },
    []
  );

const ensureAccountLogin = async (session: AppleSessionBundle): Promise<AppleSessionBundle> => {
  const accountLoginStartMs = nowMs();
  if (!session.sessionToken) {
    throw new Error("Apple session token is missing.");
  }

  const response = await requestJson(
    "POST",
    `${APPLE_SETUP_ENDPOINT}/accountLogin`,
    {},
    {
      Accept: "application/json, text/javascript",
      "Content-Type": "application/json",
      Origin: "https://www.icloud.com",
      Referer: "https://www.icloud.com/"
    },
    {
      accountCountryCode: session.accountCountry || "",
      dsWebAuthToken: session.sessionToken,
      extended_login: true,
      trustToken: session.trustToken || ""
    }
  );

  if (response.status !== 200 || !response.body || typeof response.body !== "object") {
    throw new Error(`Apple account bootstrap failed: ${parseAppleError(response)}`);
  }

  const body = response.body;
  const dsInfo = body.dsInfo && typeof body.dsInfo === "object" ? body.dsInfo : {};
  const webservices = body.webservices && typeof body.webservices === "object" ? body.webservices : {};
  const findMe = webservices.findme && typeof webservices.findme === "object" ? webservices.findme : {};
  const merged = updateSessionFieldsFromHeaders(session, response.headers);

  // Persist the full cookie jar so it survives PKJS restarts
  const jarSnapshot = buildCookieHeader();
  console.log("ensureAccountLogin: cookie jar has " + Object.keys(cookieJar).length + " cookies, total=" + jarSnapshot.length + " chars");
  logTiming("account-login:total", accountLoginStartMs);

  return Object.assign({}, merged, {
    updatedAt: nowIso(),
    serviceRoot: String(findMe.url || merged.serviceRoot || "").replace(/:443$/, ""),
    dsid: String(dsInfo.dsid || merged.dsid || ""),
    accountCountry: String(merged.accountCountry || dsInfo.countryCode || ""),
    cookieHeader: jarSnapshot
  });
};

const fetchMfaBootState = async (pending: PendingAuthState): Promise<PendingAuthState> => {
  const response = await requestJson(
    "GET",
    APPLE_AUTH_ENDPOINT,
    {},
    buildAppleAuthHeaders(pending.clientId, pending, {
      Accept: "text/html"
    })
  );

  // Apple rotates the scnt/session-id anti-CSRF headers on every auth request;
  // carry the fresh ones forward so the next request (e.g. sending the SMS)
  // doesn't fail with HTTP 403 from presenting a stale scnt.
  const withFresh = updateSessionFieldsFromHeaders(pending, response.headers) as PendingAuthState;

  if (response.status !== 200 || !response.text) {
    return withFresh;
  }

  try {
    const boot = parseHsa2BootContext(response.text) as Hsa2BootContext;
    return Object.assign({}, withFresh, {
      mode: String(boot.mode || withFresh.mode || ""),
      hasTrustedDevices: Boolean(boot.hasTrustedDevices),
      trustedPhoneNumber: boot.trustedPhoneNumber,
      authInitialRoute: boot.authInitialRoute,
      authFactors: boot.authFactors,
      bridgeInitiateData: boot.bridgeInitiateData,
      phoneNumberVerification: boot.phoneNumberVerification,
      sourceAppId: boot.sourceAppId
    });
  } catch (_error) {
    return withFresh;
  }
};

const updatePendingAuthState = (update: Partial<PendingAuthState>) => {
  const current = readPendingAuthState();
  if (!current) {
    return;
  }
  writePendingAuthState(Object.assign({}, current, update));
};

const requestAppleSmsCodeInternal = async (pending: PendingAuthState, notice?: string) => {
  if (!pending.trustedPhoneNumber) {
    throw new Error("Apple did not expose an SMS verification route for this sign-in.");
  }

  const response = await requestJson(
    "PUT",
    `${APPLE_AUTH_ENDPOINT}/verify/phone`,
    {},
    buildAppleAuthHeaders(pending.clientId, pending, { Accept: "application/json" }),
    {
      phoneNumber: { id: pending.trustedPhoneNumber.id },
      mode: "sms"
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Apple could not send an SMS code: ${parseAppleError(response)}`);
  }

  // Carry forward the rotated scnt/session-id so entering the code (and any
  // future resend) presents a valid anti-CSRF token instead of a stale one.
  const fresh = updateSessionFieldsFromHeaders(pending, response.headers) as PendingAuthState;
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
};

// No APNS trusted-device push bridge here (auth/bridge/*): it needs heavy
// synchronous P-256 crypto plus an open WebSocket, which froze the
// single-threaded PKJS runtime and locked users out of the settings page.
// 2FA is code-entry only — trusted-device code via the standard verify route,
// or SMS.
const requestAppleTwoFactorCode = async () => {
  const pending = readPendingAuthState();
  if (!pending) {
    throw new Error("No Apple 2FA challenge is pending.");
  }

  console.log(
    "request_2fa_code: mode=" +
      String(pending.mode || "unknown") +
      " authInitialRoute=" +
      String(pending.authInitialRoute || "") +
      " hasTrustedDevices=" +
      String(Boolean(pending.hasTrustedDevices))
  );

  if (pending.trustedPhoneNumber) {
    // Auto-send the SMS so the user just reopens settings and types the code.
    // Throws on failure so the caller can fall back to the sign-in page.
    const phoneLabel = formatTrustedPhoneLabel(pending.trustedPhoneNumber);
    await requestAppleSmsCodeInternal(
      pending,
      phoneLabel
        ? "We texted a 6-digit code to " + phoneLabel + ". Enter it below — tap Resend Code if it doesn&#39;t arrive."
        : "We texted a 6-digit code to your phone. Enter it below — tap Resend Code if it doesn&#39;t arrive."
    );
    console.log("request_2fa_code: auto-sent SMS");
    return;
  }

  updatePendingAuthState({
    deliveryMethod: "trusted_device",
    verificationRoute: "trusted_device",
    deliveryNotice: "Enter the verification code shown on your trusted Apple device."
  });
};

type SrpSigninResult = {
  completeResponse: JsonResponse;
  sessionBase: AppleSessionBundle;
  clientId: string;
  previous: DirectAppleSettings;
};

// Runs the full idmsa SRP sign-in (authorize → init → complete) and returns the
// raw completion response plus a session skeleton populated from its headers.
// The stored trustToken is replayed so a trusted device skips 2FA (Apple
// answers 200 instead of 409). Shared by the interactive login flow and the
// silent re-auth path that keeps the iCloud session alive over time.
const runAppleSrpSignin = async (trimmedAppleId: string, password: string): Promise<SrpSigninResult> => {
  const srpStartMs = nowMs();
  const previous = resolvedDirectAppleSettings();
  const clientId = containsPlaceholder(previous.clientId) || !previous.clientId ? randomClientId() : previous.clientId;
  const authHeaders = buildAppleAuthHeaders(clientId);

  const authorizeResponse = await requestJson(
    "GET",
    `${APPLE_AUTH_ENDPOINT}/authorize/signin`,
    {
      frame_id: clientId,
      skVersion: "7",
      iframeid: clientId,
      client_id: APPLE_WIDGET_KEY,
      response_type: "code",
      redirect_uri: "https://www.icloud.com",
      response_mode: "web_message",
      state: clientId,
      authVersion: "latest"
    },
    authHeaders
  );

  if (authorizeResponse.status !== 200) {
    throw new Error(`Apple sign-in bootstrap failed: ${parseAppleError(authorizeResponse)}`);
  }

  const clientPubStartMs = nowMs();
  const privateA = bigIntFromBuffer(nodeCrypto.randomBytes(32));
  const publicA = padToN(modPow(srpGenerator, privateA, srpPrimeN));
  logTiming("srp-crypto:client-public-A", clientPubStartMs);

  const initResponse = await requestJson(
    "POST",
    `${APPLE_AUTH_ENDPOINT}/signin/init`,
    {},
    authHeaders,
    {
      a: base64FromBuffer(publicA),
      accountName: trimmedAppleId,
      protocols: ["s2k", "s2k_fo"]
    }
  );

  if (initResponse.status !== 200 || !initResponse.body) {
    throw new Error(`Apple login failed during SRP init: ${parseAppleError(initResponse)}`);
  }

  const challengeCryptoStartMs = nowMs();
  const challenge = initResponse.body;
  const saltBuffer = bufferFromBase64(String(challenge.salt || ""));
  const serverPublicBuffer = bufferFromBase64(String(challenge.b || ""));
  const pbkdf2StartMs = nowMs();
  const passwordBuffer = deriveAppleSrpPassword(
    password,
    saltBuffer,
    Number(challenge.iteration || 0),
    String(challenge.protocol || "s2k")
  );
  logTiming("srp-crypto:pbkdf2", pbkdf2StartMs, "iters=" + Number(challenge.iteration || 0));
  const modexpStartMs = nowMs();
  // pyicloud-compatible SRP: no_username_in_x + rfc5054_enable
  // x: username removed (no_username_in_x) → H(b'' + b':' + derived_password)
  const identityHash = sha256Buffer(BufferCtor.from(":"), passwordBuffer);
  const x = bigIntFromBuffer(sha256Buffer(saltBuffer, identityHash));
  // u: rfc5054 pads both A and B to N width (256 bytes)
  const serverPublic = bigIntFromBuffer(serverPublicBuffer);
  const u = bigIntFromBuffer(sha256Buffer(padToN(publicA), padToN(serverPublicBuffer)));
  const gx = modPow(srpGenerator, x, srpPrimeN);
  const exponent = privateA.add(u.mul(x));
  const base = positiveMod(serverPublic.sub(computeSrpMultiplierK().mul(gx)), srpPrimeN);
  const S = modPow(base, exponent, srpPrimeN);
  // K: SHA256(S) — NO zero-padding on S per pyicloud
  const sessionKey = sha256Buffer(bufferFromBigInt(S));
  // M1: full SRP-6a = H(HNxorg || H(username) || salt || A || B || K)
  const hN = sha256Buffer(padToN(srpPrimeN));
  const hg = sha256Buffer(padToN(srpGenerator));
  const hNxorg = BufferCtor.alloc(32);
  for (let xi = 0; xi < 32; xi++) hNxorg[xi] = hN[xi] ^ hg[xi];
  const hUser = sha256Buffer(BufferCtor.from(trimmedAppleId, "utf8"));
  const m1 = sha256Buffer(hNxorg, hUser, saltBuffer, publicA, serverPublicBuffer, sessionKey);
  // M2: H(A || M1 || K)
  const m2 = sha256Buffer(publicA, m1, sessionKey);
  logTiming("srp-crypto:modexp", modexpStartMs);
  logTiming("srp-crypto:challenge-response", challengeCryptoStartMs);

  const completeResponse = await requestJson(
    "POST",
    `${APPLE_AUTH_ENDPOINT}/signin/complete`,
    {
      isRememberMeEnabled: "true"
    },
    authHeaders,
    {
      accountName: trimmedAppleId,
      c: challenge.c,
      m1: base64FromBuffer(m1),
      m2: base64FromBuffer(m2),
      rememberMe: true,
      trustTokens: previous.trustToken ? [previous.trustToken] : []
    }
  );

  const sessionBase = updateSessionFieldsFromHeaders(
    {
      provider: "direct_apple" as Provider,
      appleId: trimmedAppleId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      defaultDeviceId: previous.defaultDeviceId || "",
      playSoundUrl: previous.playSoundUrl || "",
      cookieHeader: previous.cookieHeader || "",
      serviceRoot: previous.serviceRoot || "",
      dsid: previous.dsid || "",
      clientId: clientId,
      password: password,
      // signin/complete does not re-issue X-Apple-TwoSV-Trust-Token on a
      // trusted (200) sign-in — only /2sv/trust after 2FA does. Seed the
      // stored token so a header-less response can't blank it out of the
      // persisted session, which would force 2FA on the next re-auth.
      trustToken: previous.trustToken || ""
    },
    completeResponse.headers
  ) as AppleSessionBundle;

  logTiming("srp-signin:total", srpStartMs, "-> " + completeResponse.status);
  return { completeResponse, sessionBase, clientId, previous };
};

const startAppleLogin = async (appleId: string, password: string) => {
  const loginStartMs = nowMs();
  const trimmedAppleId = String(appleId || "").trim();
  if (!trimmedAppleId || !password) {
    throw new Error("Apple ID and password are required.");
  }

  const signin = await runAppleSrpSignin(trimmedAppleId, password);
  const completeResponse = signin.completeResponse;
  const clientId = signin.clientId;
  const previous = signin.previous;
  let sessionBase = signin.sessionBase;

  if (completeResponse.status === 409) {
    let pending = updateSessionFieldsFromHeaders(
      {
        appleId: trimmedAppleId,
        clientId: clientId,
        sessionToken: sessionBase.sessionToken,
        trustToken: sessionBase.trustToken,
        accountCountry: sessionBase.accountCountry,
        scnt: sessionBase.scnt,
        sessionId: sessionBase.sessionId,
        authAttributes: sessionBase.authAttributes
      },
      completeResponse.headers
    ) as PendingAuthState;
    pending = await fetchMfaBootState(pending);
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
    // Auto-send the SMS and set the verify-page notice before the settings page
    // reopens. Safe to await now that the (blocking) trusted-device bridge is
    // disabled — this is just an async network call and won't freeze PKJS.
    try {
      await requestAppleTwoFactorCode();
    } catch (error) {
      // Couldn't send the code — fall back to the sign-in page.
      console.log("requestAppleTwoFactorCode: 2FA setup failed, reverting to sign-in: " + String(error));
      clearPendingAuthState();
      loginErrorNotice = "We couldn't send a verification code. Please sign in again.";
      writeState(loginSummaryState(loginErrorNotice, {
        appleId: trimmedAppleId,
        clientId: clientId,
        defaultDeviceId: previous.defaultDeviceId || "",
        playSoundUrl: previous.playSoundUrl || ""
      }));
    }
    return;
  }

  if (completeResponse.status !== 200) {
    throw new Error(`Apple login failed: ${parseAppleError(completeResponse)}`);
  }

  sessionBase = await ensureAccountLogin(sessionBase);
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
};

// Guard so overlapping sync/ping requests don't kick off parallel re-logins.
let silentReauthInFlight = false;

// Silently re-establish the iCloud web session using the stored Apple ID
// password + trustToken, without any user interaction. This is the mechanism
// that keeps auth alive: when Apple expires the cookies / dsWebAuthToken, the
// old code could only replay the dead token via accountLogin and would fall
// back to needs_reauth. Here we run a fresh SRP sign-in (the trustToken makes
// Apple skip 2FA and return 200), refresh the trust token to roll the trusted-
// device window forward, then bootstrap a new account session. Returns the
// refreshed session, or null when re-auth needs the user again (no stored
// password, wrong password, or an expired/rejected trust token → HTTP 409).
const attemptSilentReauth = async (session: AppleSessionBundle): Promise<AppleSessionBundle | null> => {
  const stored = resolvedDirectAppleSettings();
  const appleId = String(session.appleId || stored.appleId || "").trim();
  const password = String(session.password || stored.password || "");

  if (!appleId || !password) {
    console.log("silentReauth: no stored password; user re-auth required");
    return null;
  }

  if (silentReauthInFlight) {
    console.log("silentReauth: already in progress, skipping");
    return null;
  }
  silentReauthInFlight = true;
  const silentReauthStartMs = nowMs();

  try {
    // Start from an empty cookie jar, like a fresh browser would. The dead
    // session's cookies (especially the FMIP-scoped X-APPLE-WEBAUTH-* set)
    // otherwise get replayed alongside the new login's cookies, and Find My's
    // re-auth gate keeps answering initClient with an instant HTTP 450.
    clearCookieJar();
    console.log("silentReauth: cleared cookie jar; re-running SRP sign-in with stored credentials");
    const signin = await runAppleSrpSignin(appleId, password);

    if (signin.completeResponse.status === 409) {
      // Trust token expired or rejected — Apple now wants a fresh 2FA code,
      // which only the user can provide. Surface as needs_reauth.
      console.log("silentReauth: Apple requires 2FA again (trust token no longer valid)");
      return null;
    }

    if (signin.completeResponse.status !== 200) {
      console.log("silentReauth: sign-in failed status=" + signin.completeResponse.status);
      return null;
    }

    let refreshed = signin.sessionBase;

    // Refresh the trusted-device token so the ~monthly trust window keeps
    // rolling forward and future silent re-auths continue to skip 2FA.
    try {
      const trustResponse = await requestJson(
        "GET",
        `${APPLE_AUTH_ENDPOINT}/2sv/trust`,
        {},
        buildAppleAuthHeaders(refreshed.clientId || signin.clientId, refreshed)
      );
      if (trustResponse.status === 200 || trustResponse.status === 204) {
        refreshed = updateSessionFieldsFromHeaders(refreshed, trustResponse.headers) as AppleSessionBundle;
      } else {
        console.log("silentReauth: trust refresh returned status=" + trustResponse.status);
      }
    } catch (trustError) {
      console.log("silentReauth: trust refresh failed: " + String(trustError));
    }

    refreshed = await ensureAccountLogin(refreshed);
    // Preserve local-only preferences and force a fresh Find My init on next
    // refresh (the old serverContext belongs to the expired session).
    refreshed = Object.assign({}, refreshed, {
      appleId,
      password,
      defaultDeviceId: session.defaultDeviceId || refreshed.defaultDeviceId,
      playSoundUrl: session.playSoundUrl || refreshed.playSoundUrl,
      serverContext: undefined
    }) as AppleSessionBundle;

    clearPendingAuthState();
    persistDirectAppleSession(refreshed);
    console.log("silentReauth: success — minted a fresh Apple session");
    return refreshed;
  } catch (error) {
    console.log("silentReauth: error: " + String(error));
    return null;
  } finally {
    logTiming("silent-reauth:total", silentReauthStartMs);
    silentReauthInFlight = false;
  }
};

const requestAppleSmsCode = async () => {
  const pending = readPendingAuthState();
  if (!pending) {
    throw new Error("No Apple 2FA challenge is pending.");
  }
  if (!pending.trustedPhoneNumber) {
    throw new Error("Apple did not expose an SMS verification route for this sign-in.");
  }
  console.log(
    "request_2fa_sms: requesting SMS route with pendingMode=" +
      String(pending.mode || "unknown")
  );
  await requestAppleSmsCodeInternal(pending, "New code sent. Enter it below.");
};

const verifyAppleTwoFactorCode = async (code: string) => {
  const verifyStartMs = nowMs();
  const pending = readPendingAuthState();
  if (!pending) {
    throw new Error("No Apple 2FA challenge is pending.");
  }
  if (!code) {
    throw new Error("The Apple verification code is required.");
  }

  const verificationRoute = pending.verificationRoute || (pending.mode === "sms" ? "sms" : "trusted_device");
  const headers = buildAppleAuthHeaders(pending.clientId, pending, {
    Accept: verificationRoute === "sms" ? "application/json, plain/text" : "application/json, text/javascript"
  });
  let response: JsonResponse;
  if (verificationRoute === "sms" && pending.trustedPhoneNumber) {
    console.log("login_verify_2fa: using SMS verification route");
    response = await requestJson(
      "POST",
      `${APPLE_AUTH_ENDPOINT}/verify/phone/securitycode`,
      {},
      buildAppleAuthHeaders(pending.clientId, pending, {
        Accept: "application/json, plain/text"
      }),
      {
        phoneNumber: { id: pending.trustedPhoneNumber.id },
        securityCode: { code: code },
        mode: pending.trustedPhoneNumber.pushMode || "sms"
      }
    );
    if (response.status !== 200 && response.status !== 204) {
      // Capture the rotated scnt so retrying with a corrected code isn't
      // rejected with 403 for presenting a stale anti-CSRF token.
      const rotated = updateSessionFieldsFromHeaders(pending, response.headers) as PendingAuthState;
      updatePendingAuthState({
        scnt: rotated.scnt,
        sessionId: rotated.sessionId,
        authAttributes: rotated.authAttributes
      });
      throw new Error("The Apple 2FA code was not accepted.");
    }
  } else {
    console.log("login_verify_2fa: using trusted-device verification route");
    response = await requestJson(
      "POST",
      `${APPLE_AUTH_ENDPOINT}/verify/trusteddevice/securitycode`,
      {},
      buildAppleAuthHeaders(pending.clientId, pending, { Accept: "application/json" }),
      {
        securityCode: { code: code }
      }
    );
    if (response.status !== 200 && response.status !== 204) {
      throw new Error("The Apple 2FA code was not accepted.");
    }
  }

  let session = updateSessionFieldsFromHeaders(
    {
      provider: "direct_apple" as Provider,
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
    },
    response.headers
  ) as AppleSessionBundle;

  const trustResponse = await requestJson(
    "GET",
    `${APPLE_AUTH_ENDPOINT}/2sv/trust`,
    {},
    buildAppleAuthHeaders(session.clientId || pending.clientId, session)
  );

  if (trustResponse.status !== 200 && trustResponse.status !== 204) {
    throw new Error(`Apple did not trust this local session: ${parseAppleError(trustResponse)}`);
  }

  session = updateSessionFieldsFromHeaders(session, trustResponse.headers);
  session = await ensureAccountLogin(session);
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
};

const initClientBody = (serverContext?: Record<string, unknown>, locate = true) => {
  const body: Record<string, unknown> = {
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
      (body.clientContext as Record<string, unknown>).shouldLocate = true;
      (body.clientContext as Record<string, unknown>).selectedDevice = "all";
    }
  }

  return body;
};

const refreshDevicesDirectApple = async (state: LocalState, locate = true): Promise<LocalState> => {
  let session = state.session;
  const userLocationPromise = readCurrentUserLocation();
  if (!session) {
    return Object.assign({}, baseDisconnectedState("direct_apple", "Direct Apple session is missing required local fields."), {
      connection: {
        state: "needs_reauth",
        summary: "Direct Apple session is incomplete on the phone.",
        provider: "direct_apple",
        lastCheckedAt: nowIso(),
        defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
      }
    });
  }

  // Only bootstrap the account session when it's genuinely incomplete (missing
  // the Find My service root / dsid needed to make the request). We no longer
  // proactively re-bootstrap on a time-based TTL — that cost ~1.8s on every
  // reopen after a few hours even when the session still worked. Expiry is
  // handled reactively below when Apple actually returns 401/403/421/450.
  if ((!session.serviceRoot || !session.dsid) && session.sessionToken) {
    try {
      session = await ensureAccountLogin(session);
      persistDirectAppleSession(session);
    } catch (error) {
      // Replaying the stored token failed — try a full silent re-login before
      // giving up and asking the user to sign in again.
      console.log("refreshDevices: account bootstrap failed, attempting silent re-auth");
      const reauthed = await attemptSilentReauth(session);
      if (reauthed) {
        session = reauthed;
      } else {
        return Object.assign({}, state, {
          devices: [],
          session: session,
          connection: {
            state: "needs_reauth",
            summary: error instanceof Error ? error.message : "Apple account session needs to be refreshed.",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: session.defaultDeviceId
          }
        });
      }
    }
  }

  if (!session.serviceRoot || !session.clientId || !session.dsid) {
    return Object.assign({}, state, {
      devices: [],
      session: session,
      connection: {
        state: "needs_reauth",
        summary: "Direct Apple session is incomplete on the phone.",
        provider: "direct_apple",
        lastCheckedAt: nowIso(),
        defaultDeviceId: session.defaultDeviceId
      }
    });
  }

  const requestRefresh = async (activeSession: AppleSessionBundle) => {
    const hasServerContext = Boolean(activeSession.serverContext);
    const endpoint = `${activeSession.serviceRoot}/fmipservice/client/web/${hasServerContext ? "refreshClient" : "initClient"}`;
    console.log("refreshDevices: " + endpoint + " hasCtx=" + hasServerContext + " locate=" + String(locate));
    const fmipResponse = await requestJson(
      "POST",
      endpoint,
      appleParams(activeSession),
      appleHeaders(activeSession),
      initClientBody(hasServerContext ? activeSession.serverContext : undefined, locate)
    );
    console.log("refreshDevices: status=" + fmipResponse.status + " hasContent=" + String(fmipResponse.body && Array.isArray(fmipResponse.body.content)) + " bodyKeys=" + (fmipResponse.body ? Object.keys(fmipResponse.body).join(",") : "null"));
    return fmipResponse;
  };

  let response: JsonResponse;
  try {
    response = await requestRefresh(session);
  } catch (error) {
    if (!isNetworkTimeoutError(error)) {
      throw error;
    }

    console.log("refreshDevices: request timed out; retrying with fresh Find My context");
    session = stripTransientAppleSessionState(session);

    try {
      response = await requestRefresh(session);
    } catch (retryError) {
      if (!isNetworkTimeoutError(retryError) || !session.sessionToken) {
        throw retryError;
      }

      console.log("refreshDevices: init retry timed out; refreshing Apple account bootstrap");
      session = await ensureAccountLogin(session);
      persistDirectAppleSession(session);
      response = await requestRefresh(session);
    }
  }

  if (response.status === 401 || response.status === 403 || response.status === 421) {
    console.log("refreshDevices: got " + response.status + ", attempting silent re-auth");
    const reauthed = await attemptSilentReauth(session);
    if (reauthed) {
      session = reauthed;
      response = await requestRefresh(session);
    }
    if (!reauthed || response.status === 401 || response.status === 403 || response.status === 421) {
      return Object.assign({}, state, {
        devices: [],
        session: session,
        connection: {
          state: "needs_reauth",
          summary: `Apple session needs refresh (HTTP ${response.status}).`,
          provider: "direct_apple",
          lastCheckedAt: nowIso(),
          defaultDeviceId: session.defaultDeviceId
        }
      });
    }
  }

  // 450 = FIND_MY_REAUTH_REQUIRED (per pyicloud). Re-authenticate session and retry.
  if (response.status === 450) {
    console.log("refreshDevices: got 450, re-authenticating session... " + describeFmipRejection(response));
    try {
      session = await ensureAccountLogin(session);
      persistDirectAppleSession(session);
      console.log("refreshDevices: re-auth OK, retrying Find My refresh...");
      const retryResponse = await requestRefresh(session);
      console.log("refreshDevices: retry status=" + retryResponse.status);
      response = retryResponse;
    } catch (reAuthError) {
      console.log("refreshDevices: re-auth failed: " + String(reAuthError));
    }

    // Token replay didn't clear the 450 — fall back to a full silent re-login.
    if (response.status === 450) {
      console.log("refreshDevices: still 450, attempting silent re-auth");
      const reauthed = await attemptSilentReauth(session);
      if (reauthed) {
        session = reauthed;
        response = await requestRefresh(session);
        if (response.status === 450) {
          console.log("refreshDevices: 450 persists on a fresh session " + describeFmipRejection(response));
        }
      } else {
        // Silent re-auth needs the user (no stored password, or the trust
        // token was rejected with a 409). Reporting this as "degraded" would
        // hide the sign-in prompt and re-run a full SRP sign-in against Apple
        // on every sync — surface needs_reauth like the 401/403/421 path.
        return Object.assign({}, state, {
          devices: [],
          session: session,
          connection: {
            state: "needs_reauth",
            summary: "Apple session expired. Open settings to sign in again.",
            provider: "direct_apple",
            lastCheckedAt: nowIso(),
            defaultDeviceId: session.defaultDeviceId
          }
        });
      }
    }
  }

  if (response.status !== 200 || !response.body || !Array.isArray(response.body.content)) {
    return Object.assign({}, state, {
      devices: [],
      connection: {
        state: "degraded",
        summary: response.status ? `Apple device sync failed with HTTP ${response.status}.` : "Apple device sync returned an invalid payload.",
        provider: "direct_apple",
        lastCheckedAt: nowIso(),
        defaultDeviceId: session.defaultDeviceId
      }
    });
  }

  const userLocation = await userLocationPromise;
  const visibleDevices = response.body.content
    .filter((device: Record<string, any>) => isVisibleWatchTarget(device) && isRecentlyOnline(device))
    .map((device: Record<string, any>) => summarizeDevice(device, userLocation))
    .filter(Boolean) as DeviceSummary[];

  const defaultDeviceId = visibleDevices.some((device) => device.id === session.defaultDeviceId)
    ? session.defaultDeviceId
    : (visibleDevices[0] ? visibleDevices[0].id : session.defaultDeviceId);

  const selectedDevice = visibleDevices.find((device) => device.id === defaultDeviceId);
  const updatedAt = nowIso();
  return {
    mode: "direct_apple",
    devices: visibleDevices,
    session: Object.assign({}, session, {
      updatedAt,
      defaultDeviceId,
      serverContext:
        response.body && response.body.serverContext && typeof response.body.serverContext === "object"
          ? response.body.serverContext
          : session.serverContext
    }),
    connection: {
      state: visibleDevices.length > 0 ? "connected" : "degraded",
      summary:
        visibleDevices.length > 0
          ? `Phone-side Apple session is ready for ${(selectedDevice && selectedDevice.name) || "your device"}.`
          : `No iPhone, iPad, or Mac devices have been online in the last ${RECENT_ONLINE_WINDOW_DAYS} days.`,
      provider: "direct_apple",
      lastCheckedAt: updatedAt,
      defaultDeviceId
    }
  };
};

const parsePlaySoundResult = (device: DeviceSummary, response: JsonResponse): { accepted: boolean; detail: string } => {
  if (response.status !== 200) {
    return {
      accepted: false,
      detail: `Apple returned HTTP ${response.status} for ${device.name}.`
    };
  }

  const body = response.body && typeof response.body === "object" ? response.body : {};
  const content = Array.isArray(body.content) ? body.content[0] || {} : {};
  const statusCode = String((content.snd && content.snd.statusCode) || (content.msg && content.msg.statusCode) || body.statusCode || "");

  if (statusCode === "200") {
    return {
      accepted: true,
      detail: `Ping sent to ${device.name}.`
    };
  }

  if (statusCode === "205") {
    return {
      accepted: false,
      detail: `${device.name} is listed in Find My but Apple did not confirm a playable sound.`
    };
  }

  return {
    accepted: false,
    detail: `Apple returned play-sound status ${statusCode || "unknown"} for ${device.name}.`
  };
};

const pingDirectApple = async (selectedIndex: number) => {
  const requestPlaySound = async (activeSession: AppleSessionBundle, deviceId: string) =>
    requestJson(
      "POST",
      `${activeSession.serviceRoot}/fmipservice/client/web/playSound`,
      appleParams(activeSession),
      appleHeaders(activeSession),
      {
        device: deviceId,
        subject: "FindMy for Pebble Alert",
        clientContext: { fmly: true }
      }
    );

  const startingState = ensureState();
  // Use existing devices if available — don't block ping with a full refresh
  let syncedState = startingState;
  if (!startingState.devices || startingState.devices.length === 0 || !startingState.session?.serviceRoot) {
    syncedState = await refreshDevicesDirectApple(startingState, false);
    writeState(syncedState);
  }

  if (!syncedState.session || syncedState.connection.state === "needs_reauth") {
    return {
      result: "reconnect_needed" as Result,
      detail: syncedState.connection.summary,
      connection: syncedState.connection
    };
  }

  let targetDevice = syncedState.devices[selectedIndex] || syncedState.devices[0];
  if (!targetDevice) {
    return {
      result: "failure" as Result,
      detail: `No iPhone, iPad, or Mac devices have been online in the last ${RECENT_ONLINE_WINDOW_DAYS} days.`,
      connection: syncedState.connection
    };
  }

  let session: AppleSessionBundle = Object.assign({}, syncedState.session, {
    defaultDeviceId: targetDevice.id,
    updatedAt: nowIso()
  });

  let response = await requestPlaySound(session, targetDevice.id);
  console.log("playSound: status=" + response.status);

  // 450 = re-auth needed (like pyicloud)
  if (response.status === 450) {
    console.log("playSound: got 450, re-authenticating...");
    try {
      try {
        session = await ensureAccountLogin(session);
        persistDirectAppleSession(session);
      } catch (bootstrapError) {
        // Stored token is dead — mint a completely fresh session instead.
        console.log("playSound: bootstrap replay failed, attempting silent re-auth");
        const reauthed = await attemptSilentReauth(session);
        if (!reauthed) {
          throw bootstrapError;
        }
        session = reauthed;
      }
      const refreshedState = await refreshDevicesDirectApple(Object.assign({}, syncedState, {
        session
      }), false);
      syncedState = refreshedState;
      if (refreshedState.session) {
        session = Object.assign({}, refreshedState.session, {
          defaultDeviceId: targetDevice.id,
          updatedAt: nowIso()
        });
      }
      const refreshedTarget =
        refreshedState.devices.find((device) => device.id === targetDevice.id)
        || refreshedState.devices[selectedIndex]
        || refreshedState.devices[0];
      if (refreshedTarget) {
        targetDevice = refreshedTarget;
        session = Object.assign({}, session, {
          defaultDeviceId: targetDevice.id,
          updatedAt: nowIso()
        });
        response = await requestPlaySound(session, targetDevice.id);
      } else {
        console.log("playSound: refresh after re-auth returned no reachable devices");
      }
      console.log("playSound: retry status=" + response.status);
    } catch (e) {
      console.log("playSound: re-auth failed: " + String(e));
    }
  }

  const parsed = parsePlaySoundResult(targetDevice, response);
  const connection: ConnectionHealth = {
    state:
      response.status === 401 || response.status === 403 || response.status === 421
        ? "needs_reauth"
        : parsed.accepted
          ? "connected"
          : "degraded",
    summary:
      response.status === 401 || response.status === 403 || response.status === 421
        ? `Apple session needs refresh (HTTP ${response.status}).`
        : parsed.accepted
          ? "Phone-side Apple session responded successfully."
          : "Apple received the request but did not confirm a playable sound.",
    provider: "direct_apple",
    lastCheckedAt: nowIso(),
    defaultDeviceId: targetDevice.id
  };

  writeState(Object.assign({}, syncedState, {
    session,
    connection
  }));

  return {
    result:
      connection.state === "needs_reauth"
        ? ("reconnect_needed" as Result)
        : parsed.accepted
          ? ("success" as Result)
          : ("failure" as Result),
    detail: parsed.accepted ? parsed.detail : connection.state === "needs_reauth" ? connection.summary : parsed.detail,
    connection
  };
};

let syncInProgress = false;
// Short-lived cache so the burst of startup syncs doesn't each hit Apple.
const DEVICE_SYNC_CACHE_MS = 6000;
let lastGoodSyncMs = 0;
const syncState = async () => {
  if (syncInProgress) {
    console.log("syncState: skipping — sync already in progress");
    return;
  }
  syncInProgress = true;
  try {
  const state = ensureState();

  // Serve the last good result without a network round-trip if it's fresh —
  // collapses the reopen/ready-ack sync storm into a single Apple refresh.
  if (
    state.mode === "direct_apple" &&
    state.session &&
    Array.isArray(state.devices) && state.devices.length > 0 &&
    state.connection.state === "connected" &&
    lastGoodSyncMs && (nowMs() - lastGoodSyncMs) < DEVICE_SYNC_CACHE_MS
  ) {
    console.log("syncState: serving cached devices (age " + (nowMs() - lastGoodSyncMs) + "ms)");
    sendDeviceSync(state);
    return;
  }

  if (state.mode === "mock_local") {
    const refreshed = Object.assign({}, state, {
      connection: Object.assign({}, state.connection, {
        lastCheckedAt: nowIso()
      })
    });
    writeState(refreshed);
    sendDeviceSync(refreshed);
    return;
  }

  if (readPendingAuthState()) {
    const pendingState = loginSummaryState("Apple sign-in needs a 2FA code in phone settings.", state.session || undefined);
    writeState(pendingState);
    sendDeviceSync(pendingState);
    return;
  }

  try {
    const sess = state.session;
    console.log("syncState: mode=" + state.mode + " hasSession=" + String(Boolean(sess && sess.sessionToken)));
    // Stale-while-revalidate: push the last-known devices to the watch right
    // away so it shows them instantly, then refresh from Apple in the
    // background and send the updated list when it arrives.
    if (Array.isArray(state.devices) && state.devices.length > 0) {
      sendDeviceSync(state);
    }
    // The watch app only needs device metadata, not a full location refresh.
    // Avoid "locate all devices" here because it can turn refreshClient into
    // a long-running request and leave the watch stuck in syncing.
    const refreshStartMs = nowMs();
    const refreshed = await refreshDevicesDirectApple(state, false);
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
  } catch (error) {
    console.log("syncState: refresh failed: " + String(error));
    const failedState: LocalState = Object.assign({}, state, {
      devices: state.devices,
      connection: {
        state: "degraded",
        summary: error instanceof Error ? error.message : "Phone-side Apple sync failed.",
        provider: "direct_apple",
        lastCheckedAt: nowIso(),
        defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
      }
    });
    writeState(failedState);
    sendDeviceSync(failedState);
  }
  } finally { syncInProgress = false; }
};

const pingState = async (selectedIndex: number) => {
  const state = ensureState();
  if (state.mode === "mock_local") {
    const updatedAt = nowIso();
    const scenario = (state.session && state.session.scenario) || "healthy";
    const connection: ConnectionHealth = {
      state: scenario === "expired" ? "needs_reauth" : scenario === "degraded" ? "degraded" : "connected",
      summary:
        scenario === "expired"
          ? "Phone-side mock session requires reconnect."
          : scenario === "degraded"
            ? "Phone-side mock session is usable but stale."
            : "Phone-side mock session is ready.",
      provider: "mock_local",
      lastCheckedAt: updatedAt,
      defaultDeviceId: state.session ? state.session.defaultDeviceId : undefined
    };
    writeState(Object.assign({}, state, {
      connection,
      session: state.session ? Object.assign({}, state.session, { updatedAt }) : state.session
    }));
    sendPingStatus(
      scenario === "expired" ? "reconnect_needed" : "success",
      scenario === "expired"
        ? "Stored phone-side mock session expired."
        : `Mock ping sent to ${(state.session && state.session.defaultDeviceId) || "device"}.`,
      connection
    );
    return;
  }

  try {
    console.log("pingState: pinging device " + selectedIndex);
    const result = await pingDirectApple(selectedIndex);
    console.log("pingState: result=" + result.result + " detail=" + result.detail);
    sendPingStatus(result.result, result.detail, result.connection);
  } catch (error) {
    console.log("pingState: ERROR: " + String(error));
    sendPingStatus(
      "failure",
      error instanceof Error ? error.message : "Phone-side Apple request failed.",
      {
        state: "degraded",
        summary: "Phone-side Apple request failed.",
        provider: "direct_apple",
        lastCheckedAt: nowIso(),
        defaultDeviceId: ensureState().session ? ensureState().session!.defaultDeviceId : undefined
      }
    );
  }
};

Pebble.addEventListener("ready", () => {
  console.log(`pkjs ready for ${APP_NAME}`);

  // Seed the cookie jar from the persisted session so cookies survive
  // PKJS restarts (app relaunch, phone reboot, etc.)
  const storedSettings = resolvedDirectAppleSettings();
  if (storedSettings.cookieHeader && !containsPlaceholder(storedSettings.cookieHeader)) {
    // cookieHeader is stored in Cookie format: "name1=val1; name2=val2"
    storedSettings.cookieHeader.split(";").forEach((pair) => {
      const trimmed = pair.trim();
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const name = trimmed.substring(0, eqIdx).trim();
        cookieJar[name] = trimmed;
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

Pebble.addEventListener("showConfiguration", () => {
  console.log("showConfiguration: opening settings");
  if (typeof Pebble.openURL !== "function") {
    console.log("Pebble.openURL is unavailable");
    return;
  }

  let configUrl: string | undefined;
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

Pebble.addEventListener("webviewclosed", (event: any) => {
  const response = event && typeof event.response === "string" ? event.response : "";
  console.log("webviewclosed: response length=" + response.length);
  if (!response) {
    console.log("webviewclosed: empty response");
    return;
  }

  try {
    const payloadMatch = String(response).trim().match(/^[^{}]*[?#](.+)$/);
    const rawResponse = payloadMatch ? payloadMatch[1] : String(response).trim();
    const decodedResponse = rawResponse.match(/^\s*\{/) ? rawResponse : decodeURIComponent(rawResponse);
    console.log("webviewclosed: decoded prefix=" + decodedResponse.slice(0, 32));
    const parsedResponse = JSON.parse(decodedResponse);
    const parsed = parsedResponse && typeof parsedResponse === "object"
      ? Object.keys(parsedResponse).reduce((result: Record<string, any>, key) => {
          const value = (parsedResponse as Record<string, any>)[key];
          result[key] = value && typeof value === "object" && "value" in value ? value.value : value;
          return result;
        }, {})
      : {};

    let action = String(parsed.action || "").trim();
    const appleId = String(parsed.appleId || "").trim();
    const password = String(parsed.password || "");
    const code = String(parsed.twoFactorCode || parsed.code || "").trim();

    if (!action) {
      if (code) {
        action = "login_verify_2fa";
      } else if (password) {
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
      const resetState = resetAllToDefaults();
      sendResetSync(resetState);
      return;
    }

    if (action === "set_distance_unit") {
      const distanceUnit: DistanceUnit = parsed.distanceUnit === "kilometers" ? "kilometers" : "miles";
      writeStoredPreferences({ distanceUnit });
      sendDeviceSync(ensureState());
      return;
    }

    if (action === "set_launch_device") {
      const launchDeviceId = String(parsed.launchDeviceId || "");
      console.log("set_launch_device: " + (launchDeviceId ? "device selected" : "device list (default)"));
      writeStoredPreferences({ launchDeviceId });
      // Push a sync right away so the watch persists the new launch target.
      sendDeviceSync(ensureState());
      return;
    }

    if (action === "login_start") {
      if (readPendingAuthState()) {
        console.log("login_start: skipping — auth already in progress");
        return;
      }
      console.log("login_start: sign-in requested");
      loginErrorNotice = "";  // clear any error from a previous attempt
      setAuthBusy(true);        // show the "please wait" page if settings is reopened mid-flow
      writeState(loginSummaryState("Starting Apple sign-in on the phone...", {
        appleId: appleId,
        clientId: resolvedDirectAppleSettings().clientId || randomClientId(),
        defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
        playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
      }));
      sendDeviceSync(ensureState());
      void (async () => {
        try {
          console.log("login_start: calling startAppleLogin...");
          await startAppleLogin(appleId, password);
          console.log("login_start: startAppleLogin completed");
        } catch (error) {
          // Sign-in failed (wrong password, network, etc.) — fall back to the
          // sign-in page with the reason shown.
          console.log("login_start: ERROR: " + String(error));
          clearPendingAuthState();
          loginErrorNotice = error instanceof Error ? error.message : "Apple sign-in failed. Please try again.";
          writeState(loginSummaryState(loginErrorNotice, {
            appleId: appleId,
            clientId: resolvedDirectAppleSettings().clientId || randomClientId(),
            defaultDeviceId: resolvedDirectAppleSettings().defaultDeviceId || "",
            playSoundUrl: resolvedDirectAppleSettings().playSoundUrl || ""
          }));
        }
        setAuthBusy(false);  // done working — let the real page render
        await syncState();
        // Reopen settings whenever we're not signed in: the verify page if a 2FA
        // code is pending, otherwise the sign-in page (carrying any error notice).
        const postLoginSettings = resolvedDirectAppleSettings();
        const hasValidSession = postLoginSettings.sessionToken && postLoginSettings.serviceRoot && !containsPlaceholder(postLoginSettings.serviceRoot);
        if (!hasValidSession && typeof Pebble.openURL === "function") {
          console.log("login_start: reopening settings (" + (readPendingAuthState() ? "verify" : "sign-in") + ")");
          Pebble.openURL(buildClayUrl());
        }
      })();
      return;
    }

    if (action === "login_verify_2fa") {
      setAuthBusy(true);
      writeState(loginSummaryState("Submitting Apple verification code on the phone...", resolvedDirectAppleSettings()));
      sendDeviceSync(ensureState());
      void (async () => {
        try {
          await verifyAppleTwoFactorCode(code);
        } catch (error) {
          const pending = readPendingAuthState();
          // Wrong/expired code — keep the user on the verify page to retry.
          if (pending) {
            updatePendingAuthState({
              deliveryNotice: "That code wasn&#39;t accepted. Check it and try again, or tap Resend Code."
            });
          }
          writeState(loginSummaryState(error instanceof Error ? error.message : "Apple 2FA verification failed.", {
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
        }
        setAuthBusy(false);
        await syncState();
        // If the code was rejected, reopen the verify page so they can retry.
        const s = resolvedDirectAppleSettings();
        const hasValidSession = s.sessionToken && s.serviceRoot && !containsPlaceholder(s.serviceRoot);
        if (!hasValidSession && readPendingAuthState() && typeof Pebble.openURL === "function") {
          Pebble.openURL(buildClayUrl());
        }
      })();
      return;
    }

    if (action === "request_2fa_sms") {
      setAuthBusy(true);
      writeState(loginSummaryState("Requesting an Apple SMS verification code...", resolvedDirectAppleSettings()));
      sendDeviceSync(ensureState());
      void (async () => {
        try {
          await requestAppleSmsCode();
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
        } catch (error) {
          if (readPendingAuthState()) {
            updatePendingAuthState({
              deliveryNotice: "We couldn&#39;t send a new code. Wait a moment and tap Resend Code again."
            });
          }
          writeState(loginSummaryState(error instanceof Error ? error.message : "Apple could not send an SMS verification code.", {
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
        }
        setAuthBusy(false);
        // Reopen so the user can type the resent code without navigating back.
        if (readPendingAuthState() && typeof Pebble.openURL === "function") {
          Pebble.openURL(buildClayUrl());
        }
        sendDeviceSync(ensureState());
      })();
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

Pebble.addEventListener("appmessage", (event: any) => {
  const payload = event && typeof event === "object" && "payload" in event ? event.payload : undefined;
  if (payload && PKJS_READY_KEY in payload) {
    console.log("pkjs received watch ready probe");
    sendReadyAck();
    return;
  }

  const action = Number(payload && APP_MESSAGE_KEYS.action in payload ? payload[APP_MESSAGE_KEYS.action] : 0);
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
