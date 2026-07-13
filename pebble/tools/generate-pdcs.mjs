/**
 * Generates PDC resources for FindMy Pebble:
 * - Copies device normal/vibrate PDCs from Downloads
 * - Creates shake animation sequences from vibrate PDCs
 * - Converts SVG action bar icons (volume, hearts) to PDC
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "resources", "images");
const DL = path.resolve(process.env.HOME, "Downloads");

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── PDC binary helpers ─────────────────────────────────────────────────────

const u8 = (v) => Buffer.from([v & 0xff]);
const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xffff, 0); return b; };
const i16 = (v) => { const b = Buffer.alloc(2); b.writeInt16LE(v, 0); return b; };
const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0, 0); return b; };

const gcolor = (r, g, b) => 0xc0 | ((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6);
const GColorBlack = gcolor(0, 0, 0);
const GColorClear = 0x00;
const GColorWhite = gcolor(255, 255, 255);

const TYPE_PATH = 1;

function drawCommand(type, strokeColor, strokeWidth, fillColor, pathOpen, points) {
  return Buffer.concat([
    u8(type), u8(0), u8(strokeColor), u8(strokeWidth), u8(fillColor),
    u16(pathOpen), u16(points.length),
    ...points.map(([x, y]) => Buffer.concat([i16(x), i16(y)])),
  ]);
}

function drawCommandList(commands) {
  return Buffer.concat([u16(commands.length), ...commands]);
}

function drawCommandImage(w, h, commands) {
  return Buffer.concat([u8(1), u8(0), i16(w), i16(h), drawCommandList(commands)]);
}

function wrapPdcImage(data) {
  return Buffer.concat([Buffer.from("PDCI"), u32(data.length), data]);
}

function drawCommandSequence(w, h, playCount, frames) {
  const frameBufs = frames.map(f =>
    Buffer.concat([u16(f.duration), drawCommandList(f.commands)])
  );
  return Buffer.concat([u8(1), u8(0), i16(w), i16(h), u16(playCount), u16(frames.length), ...frameBufs]);
}

function wrapPdcSequence(data) {
  return Buffer.concat([Buffer.from("PDCS"), u32(data.length), data]);
}

// ── Create shake animation from a static PDC image ─────────────────────────
// Read the PDCI, extract the draw command list, then create a PDCS with
// frames that shift the drawing left/right to simulate shaking.

function createShakeAnimation(pdciPath, outputPath) {
  const raw = fs.readFileSync(pdciPath);
  // Parse PDCI: magic(4) + size(4) + version(1) + reserved(1) + viewbox(4) + commandList
  if (raw.toString("ascii", 0, 4) !== "PDCI") throw new Error("Not a PDCI: " + pdciPath);
  const dataSize = raw.readUInt32LE(4);
  const version = raw[8];
  const viewW = raw.readInt16LE(10);
  const viewH = raw.readInt16LE(12);
  const commandListData = raw.subarray(14, 8 + dataSize);

  // For shaking: we offset all point X coordinates by a delta per frame
  // We'll parse the command list, clone it with offsets, and build frames
  const shakeOffsets = [0, 6, 0, -6, 0, 4, 0, -4]; // pixels of shake
  const frameDuration = 60; // ms per frame — fast shake

  const frames = shakeOffsets.map(dx => {
    const shifted = shiftCommandListX(commandListData, dx);
    return { duration: frameDuration, commands: [shifted] };
  });

  // Build the sequence — each frame is duration(2) + commandList (which already has its count)
  const frameBufs = frames.map(f =>
    Buffer.concat([u16(f.duration), f.commands[0]])
  );
  // Manually build sequence: version(1) + reserved(1) + viewbox(4) + playCount(2) + frameCount(2) + frames
  const seqData = Buffer.concat([
    u8(1), u8(0), i16(viewW), i16(viewH),
    u16(0xffff), // infinite loop
    u16(frames.length),
    ...frameBufs,
  ]);
  const output = Buffer.concat([Buffer.from("PDCS"), u32(seqData.length), seqData]);
  fs.writeFileSync(outputPath, output);
  console.log(`${path.basename(outputPath)}: ${output.length} bytes (${frames.length} frames)`);
}

// Shift X coordinates of DEVICE BODY commands only, leaving vibration lines in place.
// Vibration lines are identified by having fillColor=0x00 (GColorClear) — they're open stroke-only arcs.
// Device body commands have fillColor != 0x00 (filled shapes).
function shiftCommandListX(cmdListData, dx) {
  if (dx === 0) return Buffer.from(cmdListData);
  const buf = Buffer.from(cmdListData); // clone
  const count = buf.readUInt16LE(0);
  let offset = 2;
  for (let c = 0; c < count; c++) {
    const pointCount = buf.readUInt16LE(offset + 7);
    offset += 9;
    // First 4 commands are always vibration lines — keep them fixed.
    // Everything from cmd 4 onward is the device body — shake it.
    const isDeviceBody = c >= 4;
    for (let p = 0; p < pointCount; p++) {
      if (isDeviceBody) {
        const x = buf.readInt16LE(offset);
        buf.writeInt16LE(x + dx, offset);
      }
      offset += 4;
    }
  }
  return buf;
}

// ── Convert SVG path to PDC ────────────────────────────────────────────────
// Simple SVG path parser for M, L, Z commands (our icons are simple polygons)

function svgToPdc(svgPath, viewSize, outputPath, colorOverride) {
  const svg = fs.readFileSync(svgPath, "utf-8");
  const commands = [];

  // Extract viewBox
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  const [vbX, vbY, vbW, vbH] = vbMatch ? vbMatch[1].split(/\s+/).map(Number) : [0, 0, 24, 24];
  const scale = viewSize / Math.max(vbW, vbH);

  // Extract all <path> elements
  const pathMatches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*/g);
  for (const match of pathMatches) {
    const d = match[0];
    const fillMatch = d.match(/fill="([^"]+)"/);
    const strokeMatch = d.match(/stroke="([^"]+)"/);
    const strokeWMatch = d.match(/stroke-width="([^"]+)"/);
    const hasFill = fillMatch && fillMatch[1] !== "none";
    const hasStroke = strokeMatch && strokeMatch[1] !== "none";

    const points = parseSvgPath(match[1], scale, vbX, vbY);
    if (points.length < 2) continue;

    const baseColor = colorOverride || GColorBlack;
    const fillColor = hasFill ? baseColor : GColorClear;
    const strokeColor = baseColor;
    const strokeWidth = hasStroke ? Math.max(1, Math.round(Number(strokeWMatch?.[1] || 2) * scale)) : 1;

    commands.push(drawCommand(TYPE_PATH, strokeColor, strokeWidth, fillColor, 0, points));
  }

  const img = drawCommandImage(viewSize, viewSize, commands);
  const output = wrapPdcImage(img);
  fs.writeFileSync(outputPath, output);
  console.log(`${path.basename(outputPath)}: ${output.length} bytes (${commands.length} paths)`);
}

function parseSvgPath(d, scale, ox, oy) {
  const points = [];
  const tokens = d.match(/[MLZHVCSQTAmlzhvcsqta]|[-+]?[0-9]*\.?[0-9]+/g) || [];
  let cmd = "M";
  let cx = 0, cy = 0;
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++; continue; }
    const x = parseFloat(tokens[i] || "0");
    const y = parseFloat(tokens[i + 1] || "0");
    if (cmd === "M" || cmd === "L") {
      cx = x; cy = y;
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      if (cmd === "M") cmd = "L"; // subsequent coords after M are treated as L
      i += 2;
    } else if (cmd === "m" || cmd === "l") {
      cx += x; cy += y;
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      i += 2;
    } else if (cmd === "H") {
      cx = x;
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      i += 1;
    } else if (cmd === "h") {
      cx += x;
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      i += 1;
    } else if (cmd === "V") {
      cy = x; // V only takes one arg (y)
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      i += 1;
    } else if (cmd === "v") {
      cy += x;
      points.push([Math.round((cx - ox) * scale), Math.round((cy - oy) * scale)]);
      i += 1;
    } else if (cmd === "Z" || cmd === "z") {
      i++;
    } else {
      // Skip unsupported commands (C, S, Q, etc.) — consume coord pairs
      i += 2;
    }
  }
  return points;
}

// ── Generate everything ────────────────────────────────────────────────────

// 1. Copy device normal PDCs
for (const name of ["iphone-normal", "ipad-normal", "macbook-normal"]) {
  const src = path.join(DL, `${name}.pdc`);
  const dst = path.join(OUT_DIR, `${name}.pdc`);
  fs.copyFileSync(src, dst);
  console.log(`${name}.pdc: ${fs.statSync(dst).size} bytes (copied)`);
}

// 2. Copy vibrate PDCs (static versions)
for (const name of ["iphone-vibrate", "ipad-vibrate", "macbook-vibrate"]) {
  const src = path.join(DL, `${name}.pdc`);
  const dst = path.join(OUT_DIR, `${name}.pdc`);
  fs.copyFileSync(src, dst);
  console.log(`${name}.pdc: ${fs.statSync(dst).size} bytes (copied)`);
}

// 3. Create shake animations from vibrate PDCs
for (const device of ["iphone", "ipad", "macbook"]) {
  createShakeAnimation(
    path.join(DL, `${device}-vibrate.pdc`),
    path.join(OUT_DIR, `${device}-shake.pdc`)
  );
}

// 4. Convert SVG icons to PDC (action bar size: 20x20, WHITE for dark action bar)
svgToPdc(path.join(DL, "volume.svg"), 20, path.join(OUT_DIR, "volume.pdc"), GColorWhite);
svgToPdc(path.join(DL, "filled-heart.svg"), 20, path.join(OUT_DIR, "filled-heart.pdc"), GColorWhite);
svgToPdc(path.join(DL, "unfilled-heart.svg"), 20, path.join(OUT_DIR, "unfilled-heart.pdc"), GColorWhite);

console.log(`\nAll files written to: ${OUT_DIR}`);
