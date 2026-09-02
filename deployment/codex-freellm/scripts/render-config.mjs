#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(process.argv[2] ?? `${root}/.env`);
const templatePath = resolve(root, "config/config.toml.template");
const outputPath = resolve(process.argv[3] ?? `${root}/generated/config.toml`);

function parseEnv(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Copy .env.example to .env and edit it first.`);
  }
  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals < 1) throw new Error(`Invalid .env line: ${rawLine}`);
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const allowed = [
  "FREELLM_MODEL",
  "FREELLM_BASE_URL",
  "CODEX_HOME_DIR",
  "MODEL_CATALOG_JSON",
  "CODEX_CLI_PATH",
  "FREELLM_DESKTOP_RESOURCES",
];
const values = {
  ...Object.fromEntries(allowed.flatMap((key) => process.env[key] ? [[key, process.env[key]]] : [])),
  ...parseEnv(envPath),
};

for (const key of allowed) {
  if (!values[key]) throw new Error(`Missing required value: ${key}`);
  if (/["\r\n]/.test(values[key])) throw new Error(`Unsafe TOML value for ${key}`);
}

let output = readFileSync(templatePath, "utf8");
for (const key of allowed) output = output.replaceAll(`{{${key}}}`, values[key]);
const unresolved = output.match(/{{[A-Z0-9_]+}}/g);
if (unresolved) throw new Error(`Unresolved placeholders: ${[...new Set(unresolved)].join(", ")}`);

mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
writeFileSync(outputPath, output, { mode: 0o600 });
console.log(`Generated ${outputPath}`);
