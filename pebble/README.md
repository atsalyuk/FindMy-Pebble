# Pebble App

This package contains the Pebble watch app build.

## What Ships

The bundled runtime is:

- native watch UI from [`src/c`](src/c)
- PKJS phone runtime from [`src/pkjs/index.js`](src/pkjs/index.js)

The bundle entry is defined in [`wscript`](wscript), which points at
`src/pkjs/index.js`.

## Active Behavior

- app mode defaults to `direct_apple`
- watch targets `aplite`, `basalt`, `chalk`, `diorite`, `emery`, `flint`, and
  `gabbro`
- PKJS owns Apple sign-in, 2FA, local session state, device sync, and ping
- the settings page includes sign-in, verify, sign-out, an "Open at launch"
  device picker (shown once signed in), and a collapsible sanitized-log viewer
  with copy-to-clipboard
- SRP sign-in math runs in a small WASM module (with a pure-JS fallback) —
  see [`tools/wasm`](tools/wasm)

## Build

```bash
npm run build    # tsc + Babel: src-ts/ → committed ES5 in src/
npm run bundle   # stages the package in a temp dir and runs `pebble build`
```

Re-run `npm run build` after any `.ts` change — CI fails if the committed JS
drifts from the TypeScript. Don't run `pebble build` directly inside the
repo: the SDK's npm step sees the parent npm-workspaces root and empties
`pebble/node_modules`; `npm run bundle` exists to sidestep that and drops the
result in `build/pebble.pbw`.

## Install

```bash
npm run install:emery   # bundle + emulator install; one script per platform
```

If Pebble thinks an emulator is already running when it is not, reset stale
launcher state with:

```bash
pebble kill --force
```

For a real watch, enable the developer connection in the phone app and use
`pebble install --phone <phone-ip> --logs`.

## Source Layout

- [`src-ts/pkjs`](src-ts/pkjs): TypeScript source for the PKJS runtime
- [`src/pkjs`](src/pkjs): compiled PKJS output used by the Pebble build
- [`src/c`](src/c): watch UI and AppMessage bridge
- [`resources/images`](resources/images): icons and draw command assets
- [`tools/wasm`](tools/wasm): C source and build script for the SRP crypto
  WASM module (the compiled bytes are embedded in `src-ts/pkjs/wasm-crypto-bytes.ts`)
