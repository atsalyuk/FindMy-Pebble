import http from "node:http";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import {
  startAppleLogin,
  verifyTwoFactorCode,
  requestSmsCode,
} from "./apple-auth.mjs";

const port = 8790;

const compiledModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), "src", "pkjs", "settings-page.js")
).href;

const { buildSettingsPageQuery, renderSettingsPageHtml } = await import(compiledModuleUrl);

let lastPayload = "";
let pending;
let settings = {
  appleId: "",
  defaultDeviceId: "",
  serviceRoot: "",
  dsid: "",
  clientId: "desktop-preview-client",
  cookieHeader: "",
  playSoundUrl: "",
  sessionToken: "",
  trustToken: "",
  accountCountry: "",
  scnt: "",
  sessionId: "",
  authAttributes: ""
};

const decodeQueryJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(String(value));
  } catch (_error) {
    return fallback;
  }
};

const defaultSettings = () => ({
  appleId: "",
  defaultDeviceId: "",
  serviceRoot: "",
  dsid: "",
  clientId: "desktop-preview-client",
  cookieHeader: "",
  playSoundUrl: "",
  sessionToken: "",
  trustToken: "",
  accountCountry: "",
  scnt: "",
  sessionId: "",
  authAttributes: ""
});

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${port}`}`);

  if (req.method === "POST" && url.pathname === "/submit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      lastPayload = body;

      const respond = (result) => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify(result));
      };

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        respond({ ok: false, error: "Invalid JSON" });
        return;
      }

      lastPayload = JSON.stringify({ capturedAt: new Date().toISOString(), payload }, null, 2);

      if (payload.action === "login_start") {
        settings.appleId = payload.appleId || settings.appleId;
        console.log(`[apple-auth] login_start for ${settings.appleId}`);
        startAppleLogin(payload.appleId, payload.password, settings)
          .then((result) => {
            if (result.pending) {
              pending = result.pending;
              console.log(`[apple-auth] 2FA required: mode=${pending.mode || pending.deliveryMethod}`);
              respond({ ok: true, action: "login_start", pending });
            } else {
              pending = undefined;
              settings = Object.assign({}, settings, result.session);
              console.log(`[apple-auth] login succeeded, serviceRoot=${settings.serviceRoot}`);
              respond({ ok: true, action: "login_start", verified: true });
            }
          })
          .catch((error) => {
            console.error(`[apple-auth] login_start failed:`, error.message);
            respond({ ok: false, action: "login_start", error: error.message });
          });
        return;
      }

      if (payload.action === "login_verify_2fa") {
        console.log(`[apple-auth] login_verify_2fa`);
        verifyTwoFactorCode(pending, payload.code)
          .then((result) => {
            pending = undefined;
            settings = Object.assign({}, settings, result.session);
            console.log(`[apple-auth] 2FA verified, serviceRoot=${settings.serviceRoot}`);
            respond({ ok: true, action: "login_verify_2fa", verified: true });
          })
          .catch((error) => {
            console.error(`[apple-auth] verify failed:`, error.message);
            respond({ ok: false, action: "login_verify_2fa", error: error.message });
          });
        return;
      }

      if (payload.action === "request_2fa_sms") {
        console.log(`[apple-auth] request_2fa_sms`);
        requestSmsCode(pending)
          .then((updatedPending) => {
            pending = updatedPending;
            console.log(`[apple-auth] SMS code requested`);
            respond({ ok: true, action: "request_2fa_sms", pending });
          })
          .catch((error) => {
            console.error(`[apple-auth] SMS request failed:`, error.message);
            respond({ ok: false, action: "request_2fa_sms", error: error.message });
          });
        return;
      }

      if (payload.action === "save") {
        settings = Object.assign({}, settings, payload);
        respond({ ok: true, action: "save" });
        return;
      }

      if (payload.action === "clear") {
        pending = undefined;
        settings = defaultSettings();
        respond({ ok: true, action: "clear" });
        return;
      }

      respond({ ok: false, error: `Unknown action: ${payload.action}` });
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    settings = decodeQueryJson(url.searchParams.get("settings"), settings);
    pending = decodeQueryJson(url.searchParams.get("pending"), pending);
    const previewPayload = decodeQueryJson(url.searchParams.get("previewPayload"), null);
    lastPayload = previewPayload ? JSON.stringify(previewPayload, null, 2) : lastPayload;

    const nextPending = url.searchParams.get("pendingMode");
    if (nextPending) {
      pending = {
        clientId: settings.clientId || "desktop-preview-client",
        mode: nextPending,
        trustedPhoneNumber: url.searchParams.get("phone")
          ? { numberWithDialCode: url.searchParams.get("phone") }
          : undefined
      };
    } else if (url.searchParams.has("pendingMode")) {
      pending = undefined;
    }

    const closeMode = url.searchParams.get("closeMode") === "pebble" ? "pebble" : "preview";
    const html = renderSettingsPageHtml({
      settings,
      pending,
      closeMode,
      previewPayload: lastPayload
    });
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`settings preview running at http://127.0.0.1:${port}`);
  console.log(`pebble config URL http://127.0.0.1:${port}/?${buildSettingsPageQuery({ settings, pending, closeMode: "pebble" })}`);
});
