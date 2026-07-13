/**
 * Apple auth module for Node.js — ported from pebble/src-ts/pkjs/index.ts
 * Uses native fetch + crypto instead of XMLHttpRequest.
 */

import crypto from "node:crypto";

// ── Constants ──────────────────────────────────────────────────────────────────

const APPLE_AUTH_ENDPOINT = "https://idmsa.apple.com/appleauth/auth";
const APPLE_SETUP_ENDPOINT = "https://setup.icloud.com/setup/ws/1";
const APPLE_WIDGET_KEY =
  "d39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d";

const SRP_2048_N_HEX =
  "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050" +
  "A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50" +
  "E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B8" +
  "55F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773B" +
  "CA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748" +
  "544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6" +
  "AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB6" +
  "94B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73";
const SRP_N_LEN = 256;

const APPLE_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Safari/605.1.15",
  origin: "https://www.icloud.com",
  referer: "https://www.icloud.com/",
  accept: "application/json, text/javascript, */*; q=0.01",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();

const randomClientId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const buildQuery = (params) => {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
};

const parseResponseHeaders = (headers) => {
  const out = {};
  headers.forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  return out;
};

async function requestJson(method, url, params = {}, headers = {}, body) {
  const query = buildQuery(params);
  const fullUrl = query ? `${url}?${query}` : url;
  const init = { method, headers: { ...headers }, redirect: "manual" };
  if (body) {
    init.body = JSON.stringify(body);
    if (!init.headers["Content-Type"] && !init.headers["content-type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }
  console.log(`[apple-auth] ${method} ${url.replace(APPLE_AUTH_ENDPOINT, "/auth")} → ...`);
  const resp = await fetch(fullUrl, init);
  const text = await resp.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = undefined;
  }
  console.log(`[apple-auth]   ← ${resp.status} (${text.length} bytes)`);
  return {
    status: resp.status,
    body: parsed,
    text,
    headers: parseResponseHeaders(resp.headers),
  };
}

const parseAppleError = (response) => {
  const body =
    response.body && typeof response.body === "object" ? response.body : {};
  const serviceErrors = Array.isArray(body.serviceErrors)
    ? body.serviceErrors
    : [];
  const first = serviceErrors[0];
  const bodyMsg =
    (first && (first.message || first.errorMessage)) ||
    body.errorMessage ||
    body.reason ||
    body.error ||
    "";
  const textMsg =
    response.text && response.text.length < 240 ? response.text : "";
  return String(bodyMsg || textMsg || `HTTP ${response.status}`);
};

const updateSessionFromHeaders = (target, headers) =>
  Object.assign({}, target, {
    accountCountry: String(
      headers["x-apple-id-account-country"] ||
        target.accountCountry ||
        ""
    ),
    sessionId: String(
      headers["x-apple-id-session-id"] || target.sessionId || ""
    ),
    authAttributes: String(
      headers["x-apple-auth-attributes"] || target.authAttributes || ""
    ),
    sessionToken: String(
      headers["x-apple-session-token"] || target.sessionToken || ""
    ),
    trustToken: String(
      headers["x-apple-twosv-trust-token"] || target.trustToken || ""
    ),
    scnt: String(headers.scnt || target.scnt || ""),
  });

// ── Apple auth headers ─────────────────────────────────────────────────────────

const baseAppleAuthHeaders = (clientId) => ({
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
    F: "",
  }),
});

const buildAppleAuthHeaders = (clientId, authState, overrides) => {
  const h = { ...baseAppleAuthHeaders(clientId) };
  if (authState?.scnt) h.scnt = authState.scnt;
  if (authState?.sessionId) h["X-Apple-ID-Session-Id"] = authState.sessionId;
  if (authState?.authAttributes)
    h["X-Apple-Auth-Attributes"] = authState.authAttributes;
  if (overrides) Object.assign(h, overrides);
  return h;
};

// ── SRP math (matches pyicloud: rfc5054_enable + no_username_in_x) ─────────

const srpPrimeN = BigInt(`0x${SRP_2048_N_HEX}`);
const srpGenerator = 2n;

const sha256 = (...parts) => {
  const h = crypto.createHash("sha256");
  for (const p of parts) h.update(Buffer.from(p));
  return h.digest();
};

const positiveMod = (v, m) => {
  const r = v % m;
  return r >= 0n ? r : r + m;
};

const modPow = (base, exp, mod) => {
  let result = 1n;
  let b = positiveMod(base, mod);
  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % mod;
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
};

const bigIntFromBuffer = (buf) => {
  const hex = Buffer.from(buf).toString("hex");
  return BigInt(`0x${hex || "00"}`);
};

const bufferFromBigInt = (value, len) => {
  let hex = value.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  let buf = Buffer.from(hex, "hex");
  if (len && buf.length < len)
    buf = Buffer.concat([Buffer.alloc(len - buf.length), buf]);
  return buf;
};

/** Zero-pad buffer to SRP_N_LEN (256 bytes) — rfc5054 compat */
const padToN = (value) => {
  const buf =
    typeof value === "bigint" ? bufferFromBigInt(value) : Buffer.from(value);
  return buf.length >= SRP_N_LEN
    ? buf
    : Buffer.concat([Buffer.alloc(SRP_N_LEN - buf.length), buf]);
};

/** long_to_bytes — no zero-padding, just raw bigint→bytes */
const longToBytes = (value) => bufferFromBigInt(value);

/** k = H(pad(N) || pad(g))  — rfc5054 pads both to N width */
const computeK = () =>
  bigIntFromBuffer(sha256(padToN(srpPrimeN), padToN(srpGenerator)));

/** HNxorg = H(N) XOR H(pad(g)) — used in M1 */
const computeHNxorg = () => {
  const hN = sha256(padToN(srpPrimeN));
  const hg = sha256(padToN(srpGenerator));
  const result = Buffer.alloc(hN.length);
  for (let i = 0; i < hN.length; i++) result[i] = hN[i] ^ hg[i];
  return result;
};

const deriveSrpPassword = (password, salt, iterations, protocol) => {
  const pwHash = crypto.createHash("sha256").update(password, "utf8").digest();
  let digest = pwHash;
  if (protocol === "s2k_fo") digest = Buffer.from(pwHash.toString("hex"), "utf8");
  if (protocol !== "s2k" && protocol !== "s2k_fo")
    throw new Error(`Unsupported SRP protocol: ${protocol}`);
  return crypto.pbkdf2Sync(digest, salt, iterations, 32, "sha256");
};

// ── HSA2 boot context parser ───────────────────────────────────────────────────

const parseHsa2BootContext = (htmlText) => {
  const match = htmlText.match(
    /<script[^>]*class=["'][^"']*boot_args[^"']*["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) throw new Error("Missing HSA2 boot args payload.");
  const payload = JSON.parse(match[1]);
  const direct = payload?.direct || {};
  const twoSV = direct?.twoSV || {};
  const bridgeInitiateData =
    typeof twoSV.bridgeInitiateData === "object"
      ? { ...twoSV.bridgeInitiateData }
      : {};
  const phoneNumberVerification =
    typeof bridgeInitiateData.phoneNumberVerification === "object"
      ? { ...bridgeInitiateData.phoneNumberVerification }
      : {};
  const trustedPhoneNumber =
    phoneNumberVerification.trustedPhoneNumber || twoSV.trustedPhoneNumber;
  return {
    authInitialRoute: String(direct.authInitialRoute || ""),
    hasTrustedDevices: Boolean(direct.hasTrustedDevices),
    authFactors: Array.isArray(twoSV.authFactors)
      ? twoSV.authFactors.filter((v) => typeof v === "string")
      : [],
    bridgeInitiateData,
    phoneNumberVerification,
    sourceAppId: twoSV.sourceAppId ? String(twoSV.sourceAppId) : undefined,
    trustedPhoneNumber,
    mode: String(twoSV.mode || phoneNumberVerification.mode || ""),
  };
};

// ── Core auth functions ────────────────────────────────────────────────────────

export async function startAppleLogin(appleId, password, previous = {}) {
  const trimmedId = String(appleId || "").trim();
  if (!trimmedId || !password) throw new Error("Apple ID and password are required.");

  const clientId = previous.clientId || randomClientId();
  const authHeaders = buildAppleAuthHeaders(clientId);

  // Step 1: authorize/signin bootstrap
  const authResp = await requestJson(
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
      authVersion: "latest",
    },
    authHeaders
  );
  if (authResp.status !== 200)
    throw new Error(`Apple sign-in bootstrap failed: ${parseAppleError(authResp)}`);

  // Step 2: SRP init
  const privateA = bigIntFromBuffer(crypto.randomBytes(32));
  const publicAInt = modPow(srpGenerator, privateA, srpPrimeN);
  const publicA = longToBytes(publicAInt);

  const initResp = await requestJson(
    "POST",
    `${APPLE_AUTH_ENDPOINT}/signin/init`,
    {},
    authHeaders,
    {
      a: publicA.toString("base64"),
      accountName: trimmedId,
      protocols: ["s2k", "s2k_fo"],
    }
  );
  if (initResp.status !== 200 || !initResp.body)
    throw new Error(`SRP init failed: ${parseAppleError(initResp)}`);

  // Step 3: SRP complete (matches pyicloud: rfc5054 + no_username_in_x)
  const challenge = initResp.body;
  const saltBuf = Buffer.from(String(challenge.salt || ""), "base64");
  const serverPublicBuf = Buffer.from(String(challenge.b || ""), "base64");
  const pwBuf = deriveSrpPassword(
    password,
    saltBuf,
    Number(challenge.iteration || 0),
    String(challenge.protocol || "s2k")
  );

  // x: pyicloud uses no_username_in_x → username replaced with b''
  // x = H(salt, H(b'' + b':' + derived_password))
  const identityHash = sha256(Buffer.from(":"), pwBuf);
  const x = bigIntFromBuffer(sha256(saltBuf, identityHash));

  // u: rfc5054 pads both A and B to N width (256 bytes)
  const serverPublic = bigIntFromBuffer(serverPublicBuf);
  const u = bigIntFromBuffer(sha256(padToN(publicAInt), padToN(serverPublic)));

  const k = computeK();
  const gx = modPow(srpGenerator, x, srpPrimeN);
  const exponent = privateA + u * x;
  const base = positiveMod(serverPublic - k * gx, srpPrimeN);
  const S = modPow(base, exponent, srpPrimeN);

  // K (session key): SHA256(S) — NO zero-padding on S per pyicloud
  const sessionKey = sha256(longToBytes(S));

  // M1: full SRP-6a = H( HNxorg || H(username) || salt || A_bytes || B_bytes || K )
  const hNxorg = computeHNxorg();
  const hUser = sha256(Buffer.from(trimmedId, "utf8"));
  const m1 = sha256(hNxorg, hUser, saltBuf, publicA, serverPublicBuf, sessionKey);

  // M2: H( A_bytes || M1 || K )
  const m2 = sha256(publicA, m1, sessionKey);

  const completeResp = await requestJson(
    "POST",
    `${APPLE_AUTH_ENDPOINT}/signin/complete`,
    { isRememberMeEnabled: "true" },
    authHeaders,
    {
      accountName: trimmedId,
      c: challenge.c,
      m1: m1.toString("base64"),
      m2: m2.toString("base64"),
      rememberMe: true,
      trustTokens: previous.trustToken ? [previous.trustToken] : [],
    }
  );

  let session = updateSessionFromHeaders(
    {
      provider: "direct_apple",
      appleId: trimmedId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      defaultDeviceId: previous.defaultDeviceId || "",
      playSoundUrl: previous.playSoundUrl || "",
      cookieHeader: previous.cookieHeader || "",
      serviceRoot: previous.serviceRoot || "",
      dsid: previous.dsid || "",
      clientId,
    },
    completeResp.headers
  );

  // 409 = 2FA required
  if (completeResp.status === 409) {
    let pending = updateSessionFromHeaders(
      {
        appleId: trimmedId,
        clientId,
        sessionToken: session.sessionToken,
        trustToken: session.trustToken,
        accountCountry: session.accountCountry,
        scnt: session.scnt,
        sessionId: session.sessionId,
        authAttributes: session.authAttributes,
      },
      completeResp.headers
    );
    pending = await fetchMfaBootState(pending);

    // Try trusted-device bridge (APNS push) if supported
    const boot = {
      authInitialRoute: pending.authInitialRoute || "",
      hasTrustedDevices: Boolean(pending.hasTrustedDevices),
      bridgeInitiateData: pending.bridgeInitiateData || {},
    };
    if (supportsTrustedDeviceBridge(boot)) {
      try {
        console.log("[apple-auth] attempting trusted-device bridge...");
        await startTrustedDeviceBridge(pending);
        pending.deliveryMethod = "trusted_device";
        pending.deliveryNotice = "A verification prompt was sent to your trusted Apple devices. Enter the 6-digit code shown on your iPhone, iPad, or Mac.";
        return { session: null, pending };
      } catch (bridgeErr) {
        console.log(`[apple-auth] trusted-device bridge failed: ${bridgeErr.message}`);
        // Fall through to SMS or manual
      }
    }

    // Bridge failed — don't auto-send SMS, let the user click Send SMS Code
    const phoneHint = pending.trustedPhoneNumber?.obfuscatedNumber
      ? ` Or click Send SMS Code to get a text to ${pending.trustedPhoneNumber.obfuscatedNumber}.`
      : "";
    pending.deliveryMethod = "trusted_device";
    pending.deliveryNotice =
      `Check your trusted Apple devices for a verification prompt. Enter the 6-digit code shown on your iPhone, iPad, or Mac.${phoneHint}`;
    return { session: null, pending };
  }

  if (completeResp.status !== 200)
    throw new Error(`Apple login failed: ${parseAppleError(completeResp)}`);

  // No 2FA — complete account login
  session = await ensureAccountLogin(session);
  return { session, pending: null };
}

async function fetchMfaBootState(pending) {
  console.log("[apple-auth] fetchMfaBootState: fetching 2FA boot page...");
  const resp = await requestJson(
    "GET",
    APPLE_AUTH_ENDPOINT,
    {},
    buildAppleAuthHeaders(pending.clientId, pending, { Accept: "text/html" })
  );
  console.log(`[apple-auth] fetchMfaBootState: status=${resp.status} textLen=${resp.text?.length || 0}`);
  if (resp.status !== 200 || !resp.text) {
    console.log(`[apple-auth] fetchMfaBootState: non-200 or empty, returning pending as-is`);
    return pending;
  }
  try {
    const boot = parseHsa2BootContext(resp.text);
    console.log(`[apple-auth] fetchMfaBootState: mode=${boot.mode} hasTrustedDevices=${boot.hasTrustedDevices} trustedPhone=${JSON.stringify(boot.trustedPhoneNumber || null)}`);
    return Object.assign({}, pending, {
      mode: String(boot.mode || pending.mode || ""),
      hasTrustedDevices: Boolean(boot.hasTrustedDevices),
      trustedPhoneNumber: boot.trustedPhoneNumber,
      authInitialRoute: boot.authInitialRoute,
      authFactors: boot.authFactors,
      bridgeInitiateData: boot.bridgeInitiateData,
      phoneNumberVerification: boot.phoneNumberVerification,
      sourceAppId: boot.sourceAppId,
    });
  } catch (err) {
    console.log(`[apple-auth] fetchMfaBootState: parse failed: ${err.message}`);
    // Log a snippet of the HTML to debug
    if (resp.text) {
      const snippet = resp.text.slice(0, 500);
      console.log(`[apple-auth] fetchMfaBootState: HTML snippet: ${snippet}`);
    }
    return pending;
  }
}

export async function ensureAccountLogin(session) {
  if (!session.sessionToken) throw new Error("Apple session token is missing.");
  const resp = await requestJson(
    "POST",
    `${APPLE_SETUP_ENDPOINT}/accountLogin`,
    {},
    {
      Accept: "application/json, text/javascript",
      "Content-Type": "application/json",
      Origin: "https://www.icloud.com",
      Referer: "https://www.icloud.com/",
    },
    {
      accountCountryCode: session.accountCountry || "",
      dsWebAuthToken: session.sessionToken,
      extended_login: true,
      trustToken: session.trustToken || "",
    }
  );
  if (resp.status !== 200 || !resp.body)
    throw new Error(`Apple account bootstrap failed: ${parseAppleError(resp)}`);
  const dsInfo = resp.body.dsInfo || {};
  const findMe = (resp.body.webservices || {}).findme || {};
  const merged = updateSessionFromHeaders(session, resp.headers);
  return Object.assign({}, merged, {
    updatedAt: nowIso(),
    serviceRoot: String(findMe.url || merged.serviceRoot || ""),
    dsid: String(dsInfo.dsid || merged.dsid || ""),
    accountCountry: String(merged.accountCountry || dsInfo.countryCode || ""),
  });
}

export async function verifyTwoFactorCode(pending, code) {
  if (!pending) throw new Error("No Apple 2FA challenge is pending.");
  if (!code) throw new Error("The Apple verification code is required.");

  let resp;
  if (pending.mode === "sms" && pending.trustedPhoneNumber) {
    resp = await requestJson(
      "POST",
      `${APPLE_AUTH_ENDPOINT}/verify/phone/securitycode`,
      {},
      buildAppleAuthHeaders(pending.clientId, pending, {
        Accept: "application/json, plain/text",
      }),
      {
        phoneNumber: { id: pending.trustedPhoneNumber.id },
        securityCode: { code },
        mode: pending.trustedPhoneNumber.pushMode || "sms",
      }
    );
  } else {
    resp = await requestJson(
      "POST",
      `${APPLE_AUTH_ENDPOINT}/verify/trusteddevice/securitycode`,
      {},
      buildAppleAuthHeaders(pending.clientId, pending, {
        Accept: "application/json",
      }),
      { securityCode: { code } }
    );
  }

  if (resp.status !== 200 && resp.status !== 204)
    throw new Error("The Apple 2FA code was not accepted.");

  // Trust this session
  let session = updateSessionFromHeaders(
    {
      provider: "direct_apple",
      appleId: pending.appleId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      defaultDeviceId: "",
      playSoundUrl: "",
      cookieHeader: "",
      serviceRoot: "",
      dsid: "",
      clientId: pending.clientId,
      sessionToken: pending.sessionToken,
      trustToken: pending.trustToken,
      accountCountry: pending.accountCountry,
      scnt: pending.scnt,
      sessionId: pending.sessionId,
      authAttributes: pending.authAttributes,
    },
    resp.headers
  );

  const trustResp = await requestJson(
    "GET",
    `${APPLE_AUTH_ENDPOINT}/2sv/trust`,
    {},
    buildAppleAuthHeaders(session.clientId || pending.clientId, session)
  );
  if (trustResp.status !== 200 && trustResp.status !== 204)
    throw new Error(`Apple did not trust this session: ${parseAppleError(trustResp)}`);

  session = updateSessionFromHeaders(session, trustResp.headers);
  session = await ensureAccountLogin(session);
  return { session };
}

export async function requestSmsCode(pending) {
  if (!pending) throw new Error("No Apple 2FA challenge is pending.");
  if (!pending.trustedPhoneNumber)
    throw new Error("Apple did not expose an SMS verification route.");

  const resp = await requestJson(
    "PUT",
    `${APPLE_AUTH_ENDPOINT}/verify/phone`,
    {},
    buildAppleAuthHeaders(pending.clientId, pending, {
      Accept: "application/json",
    }),
    {
      phoneNumber: { id: pending.trustedPhoneNumber.id },
      mode: "sms",
    }
  );

  if (resp.status !== 200 && resp.status !== 204)
    throw new Error(`Apple could not send SMS code: ${parseAppleError(resp)}`);

  return Object.assign({}, pending, {
    mode: "sms",
    deliveryMethod: "sms",
    deliveryNotice: "Apple sent an SMS verification code.",
  });
}

// ── Trusted-device bridge (APNS WebSocket) ─────────────────────────────────

const WEBSOCKET_TIMEOUT_MS = 30000;
const BRIDGE_SIGNATURE_PREFIX = Buffer.from([0x01, 0x03]);
const NEW_CONNECTION_EXPIRATION_SECONDS = 86400;
const WEBSOCKET_HOSTS = { prod: "websocket.push.apple.com", sandbox: "websocket.sandbox.push.apple.com" };
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const subtle = crypto.webcrypto.subtle;

const sha1Hex = (v) => crypto.createHash("sha1").update(v, "utf8").digest("hex");

const encodeVarint = (value) => {
  const parts = [];
  let cur = value >>> 0;
  while (true) {
    const next = cur & 0x7f;
    cur >>>= 7;
    if (cur) { parts.push(next | 0x80); } else { parts.push(next); return Buffer.from(parts); }
  }
};

const readVarint = (data, offset) => {
  let value = 0, shift = 0, idx = offset;
  while (true) {
    if (idx >= data.length) throw new Error("Truncated varint");
    const byte = data[idx++];
    value |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return { value, offset: idx };
    shift += 7;
  }
};

const encodeField = (fn, wt, v) => Buffer.concat([encodeVarint((fn << 3) | wt), v]);
const encodeBytesField = (fn, v) => encodeField(fn, 2, Buffer.concat([encodeVarint(v.length), v]));
const encodeStringField = (fn, v) => encodeBytesField(fn, Buffer.from(v, "utf8"));
const encodeUint32Field = (fn, v) => encodeField(fn, 0, encodeVarint(v));

const decodeFields = (data) => {
  const fields = {};
  let offset = 0;
  while (offset < data.length) {
    const key = readVarint(data, offset); offset = key.offset;
    const fn = key.value >> 3, wt = key.value & 0x07;
    let value;
    if (wt === 0) { const p = readVarint(data, offset); value = p.value; offset = p.offset; }
    else if (wt === 2) { const l = readVarint(data, offset); offset = l.offset; value = data.slice(offset, offset + l.value); offset += l.value; }
    else throw new Error(`Unsupported wire type: ${wt}`);
    (fields[fn] ||= []).push(value);
  }
  return fields;
};

const decodeServerMessage = (msg) => {
  const f = decodeFields(msg);
  const connResp = f[1] ? (() => { const cf = decodeFields(f[1][0]); return { pushTokenB64: cf[1] ? textDecoder.decode(cf[1][0]) : "", status: Number(cf[2]?.[0] || 0), serverTimestampSeconds: cf[3] ? Number(cf[3][0]) : undefined }; })() : undefined;
  const pushMsg = f[2] ? (() => { const pf = decodeFields(f[2][0]); return { topic: Buffer.from(pf[1]?.[0] || []), messageId: Number(pf[2]?.[0] || 0), payload: Buffer.from(pf[4]?.[0] || []) }; })() : undefined;
  return { connectionResponse: connResp, pushMessage: pushMsg };
};

const rawEcdsaToDer = (sig) => {
  const trim = (v) => { let c = Buffer.from(v); while (c.length > 1 && c[0] === 0) c = c.subarray(1); if (c[0] & 0x80) c = Buffer.concat([Buffer.from([0]), c]); return c; };
  const half = sig.length / 2;
  const r = trim(sig.subarray(0, half)), s = trim(sig.subarray(half));
  const body = Buffer.concat([Buffer.from([0x02, r.length]), r, Buffer.from([0x02, s.length]), s]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
};

const encodeBridgeSignature = (sig) => sig.subarray(0, 2).equals(BRIDGE_SIGNATURE_PREFIX) ? sig : Buffer.concat([BRIDGE_SIGNATURE_PREFIX, sig]);

const encodeConnectionMessage = (pubKey, nonce, signature) =>
  encodeBytesField(1, Buffer.concat([
    encodeBytesField(1, pubKey),
    encodeBytesField(2, nonce),
    encodeBytesField(3, encodeBridgeSignature(signature)),
    encodeBytesField(5, encodeUint32Field(1, NEW_CONNECTION_EXPIRATION_SECONDS)),
  ]));

const encodeWebFilterMessage = (topics) =>
  encodeBytesField(3, Buffer.concat(topics.map((t) => encodeStringField(1, t))));

const encodeAckMessage = (topic, messageId) =>
  encodeBytesField(2, Buffer.concat([encodeBytesField(1, topic), encodeUint32Field(2, messageId)]));

const resolveWebsocketHost = (boot) => {
  const wsUrl = boot.bridgeInitiateData?.webSocketUrl;
  if (typeof wsUrl === "string" && wsUrl) return wsUrl.includes("://") ? new URL(wsUrl).hostname : wsUrl.split("/", 1)[0];
  const env = boot.bridgeInitiateData?.apnsEnvironment;
  if (typeof env === "string" && WEBSOCKET_HOSTS[env]) return WEBSOCKET_HOSTS[env];
  throw new Error("Missing APNS websocket host.");
};

const resolveApnsTopic = (boot) => {
  const topic = boot.bridgeInitiateData?.apnsTopic;
  if (typeof topic === "string" && topic) return topic;
  throw new Error("Missing APNS topic.");
};

const supportsTrustedDeviceBridge = (boot) =>
  Boolean(boot?.authInitialRoute === "auth/bridge/step" && boot?.hasTrustedDevices && boot?.bridgeInitiateData && Object.keys(boot.bridgeInitiateData).length);

class NodeWebSocket {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";
    this.queue = [];
    this.waiters = [];
    this.closed = false;
    this.openPromise = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", (e) => reject(new Error("WebSocket failed: " + (e.message || "connection error"))));
    });
    this.ws.addEventListener("message", (event) => {
      const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : new Uint8Array(Buffer.from(event.data, "binary"));
      const waiter = this.waiters.shift();
      if (waiter) waiter(data); else this.queue.push(data);
    });
    this.ws.addEventListener("close", () => { this.closed = true; });
  }
  async sendBinary(payload) { await this.openPromise; this.ws.send(Buffer.from(payload)); }
  async readMessage(timeoutMs = WEBSOCKET_TIMEOUT_MS) {
    await this.openPromise;
    if (this.queue.length) return this.queue.shift();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("WebSocket read timed out.")), timeoutMs);
      this.waiters.push((v) => { clearTimeout(timeout); resolve(v); });
    });
  }
  close() { if (!this.closed) { this.ws.close(); this.closed = true; } }
}

let activeBridgeState = null;

export async function startTrustedDeviceBridge(pending) {
  const boot = {
    authInitialRoute: pending.authInitialRoute || "",
    hasTrustedDevices: Boolean(pending.hasTrustedDevices),
    authFactors: pending.authFactors || [],
    bridgeInitiateData: pending.bridgeInitiateData || {},
    phoneNumberVerification: pending.phoneNumberVerification || {},
    sourceAppId: pending.sourceAppId,
    trustedPhoneNumber: pending.trustedPhoneNumber,
    mode: pending.mode,
  };

  if (!supportsTrustedDeviceBridge(boot)) {
    throw new Error("Trusted-device bridge is not supported for this account.");
  }

  const topic = resolveApnsTopic(boot);
  const wsHost = resolveWebsocketHost(boot);
  const topicsByHash = { [sha1Hex(topic)]: topic };
  const sourceAppId = boot.sourceAppId;

  const keyPair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const publicKey = Buffer.from(await subtle.exportKey("raw", keyPair.publicKey));

  let timestampMs;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const nonce = Buffer.concat([Buffer.from([0]), bufferFromBigInt(BigInt(timestampMs || Date.now()), 8), crypto.randomBytes(8)]);
    const sigRaw = Buffer.from(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keyPair.privateKey, nonce));
    const signature = rawEcdsaToDer(sigRaw);
    const connMsg = encodeConnectionMessage(publicKey, nonce, signature);
    const wsUrl = `wss://${wsHost}/v2/${connMsg.toString("hex")}`;
    console.log(`[apple-auth] bridge: connecting to APNS WebSocket at ${wsHost}...`);
    const ws = new NodeWebSocket(wsUrl);
    let keepOpen = false;
    try {
      // Wait for push token
      let pushToken;
      while (true) {
        const msg = await ws.readMessage();
        const decoded = decodeServerMessage(msg);
        if (!decoded.connectionResponse) continue;
        if (decoded.connectionResponse.status === 0 && decoded.connectionResponse.pushTokenB64) {
          pushToken = Buffer.from(decoded.connectionResponse.pushTokenB64, "base64");
          break;
        }
        if (decoded.connectionResponse.status === 2 && decoded.connectionResponse.serverTimestampSeconds !== undefined) {
          const err = new Error("Invalid nonce");
          err.serverTimestampMs = decoded.connectionResponse.serverTimestampSeconds * 1000;
          throw err;
        }
        throw new Error(`APNS returned status ${decoded.connectionResponse.status}`);
      }
      console.log(`[apple-auth] bridge: got push token, subscribing to topic...`);
      await ws.sendBinary(encodeWebFilterMessage([topic]));

      // POST step/0 to trigger push to trusted devices
      const sessionUUID = `${crypto.randomUUID()}-${Math.floor(Date.now() / 1000)}`;
      const headers = buildAppleAuthHeaders(pending.clientId, pending, { Accept: "application/json" });
      if (sourceAppId) headers["X-Apple-App-Id"] = sourceAppId;
      console.log(`[apple-auth] bridge: posting step/0 to trigger trusted device push...`);
      const step0Resp = await requestJson("POST", `${APPLE_AUTH_ENDPOINT}/bridge/step/0`, {}, headers, { sessionUUID, ptkn: pushToken.toString("hex") });
      if (![200, 204, 409].includes(step0Resp.status))
        throw new Error(`Bridge step/0 failed: ${step0Resp.status}`);

      console.log(`[apple-auth] bridge: waiting for trusted device push notification...`);
      // Wait for push from Apple (user taps Allow on their device)
      let pushPayload;
      while (true) {
        const msg = await ws.readMessage(60000); // 60s timeout for user to approve
        const decoded = decodeServerMessage(msg);
        if (decoded.pushMessage) {
          await ws.sendBinary(encodeAckMessage(decoded.pushMessage.topic, decoded.pushMessage.messageId));
          const topicHex = decoded.pushMessage.topic.toString("hex");
          const topicName = topicsByHash[topicHex] || textDecoder.decode(decoded.pushMessage.topic);
          if (topicName !== topic) continue;
          // Parse the push payload
          let jsonPayload;
          try {
            jsonPayload = JSON.parse(textDecoder.decode(decoded.pushMessage.payload));
          } catch {
            const text = textDecoder.decode(decoded.pushMessage.payload);
            const start = text.indexOf("{"), end = text.lastIndexOf("}");
            if (start >= 0 && end > start) jsonPayload = JSON.parse(text.slice(start, end + 1));
            else throw new Error("Could not decode bridge push payload.");
          }
          if (!jsonPayload.sessionUUID) throw new Error("Push payload missing sessionUUID.");
          if (jsonPayload.sessionUUID !== sessionUUID) throw new Error("Push payload sessionUUID mismatch.");
          pushPayload = jsonPayload;
          break;
        }
      }

      console.log(`[apple-auth] bridge: received push! nextStep=${pushPayload.nextStep}`);
      activeBridgeState = {
        pushToken: pushToken.toString("hex"),
        sessionUUID,
        websocket: ws,
        topic,
        topicsByHash,
        sourceAppId,
        nextStep: pushPayload.nextStep ? String(pushPayload.nextStep) : undefined,
        salt: pushPayload.salt ? String(pushPayload.salt) : undefined,
        mid: pushPayload.mid ? String(pushPayload.mid) : undefined,
        idmsdata: pushPayload.idmsdata ? String(pushPayload.idmsdata) : undefined,
        akdata: pushPayload.akdata,
        data: pushPayload.data ? String(pushPayload.data) : undefined,
        encryptedCode: pushPayload.encryptedCode ? String(pushPayload.encryptedCode) : undefined,
        txnid: pushPayload.txnid ? String(pushPayload.txnid) : undefined,
        usesLegacyTrustedDeviceVerifier: Boolean(pushPayload.txnid && String(pushPayload.txnid).endsWith("_W")),
      };
      keepOpen = true;
      return activeBridgeState;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error?.serverTimestampMs) { timestampMs = error.serverTimestampMs; }
      else break;
    } finally {
      if (!keepOpen) ws.close();
    }
  }
  throw lastError || new Error("Failed to start trusted-device bridge.");
}

export function getActiveBridgeState() { return activeBridgeState; }
export function clearBridgeState() { if (activeBridgeState?.websocket) activeBridgeState.websocket.close(); activeBridgeState = null; }
