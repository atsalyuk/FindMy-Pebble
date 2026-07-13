# Security

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting ("Report a vulnerability"
under the Security tab) rather than a public issue, so a fix can land before
details are public.

## What this app does with your credentials

- Your Apple ID and password are sent only to Apple's own endpoints
  (`idmsa.apple.com/appleauth`, iCloud Find My web services) over HTTPS,
  directly from the PebbleKit JS runtime inside the Pebble phone app. No
  third-party server is involved.
- Sign-in uses Apple's SRP-6a flow, so the raw password itself is never
  transmitted — a PBKDF2-derived proof is.
- The password and session tokens (including the 2FA trust token) are stored
  in the Pebble app's PKJS `localStorage` on your phone so the app can
  re-authenticate silently when the iCloud session expires. This storage is
  sandboxed to the Pebble app but is not additionally encrypted at rest —
  treat a phone that others can unlock accordingly. Signing out (or "Reset
  All" in settings) deletes the stored credentials and session state.
- The settings-page log viewer redacts passwords, tokens, cookies, and
  sensitive URL fragments before log lines are buffered. Logs are only shown
  in the page itself and never leave the phone unless you tap Copy and paste
  them somewhere.

## Scope notes

- The SRP/PBKDF2/SHA-256 math runs in a small WASM module built from
  [`pebble/tools/wasm/srpcrypto.c`](pebble/tools/wasm/srpcrypto.c) (with a
  pure-JS fallback on phones without WASM). `node pebble/tools/wasm/verify.cjs`
  checks both against Node's native crypto.
