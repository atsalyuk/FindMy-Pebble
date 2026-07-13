import { transformFileSync } from "@babel/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const configFile = path.join(rootDir, "babel.config.json");

const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
      return;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      return;
    }

    const result = transformFileSync(entryPath, {
      configFile,
      babelrc: false,
      sourceMaps: false,
      comments: true
    });

    if (!result || typeof result.code !== "string") {
      throw new Error(`Babel did not return output for ${entryPath}`);
    }

    fs.writeFileSync(entryPath, result.code);
  });
};

walk(srcDir);
