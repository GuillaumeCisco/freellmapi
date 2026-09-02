#!/usr/bin/env node

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (!target) {
  throw new Error("Usage: patch-rovo-discovery.mjs <renderer-app-initial.js>");
}

const marker = "codexLinuxRovoDiscoveryPatch";
const fallbackMarker = "codexLinuxPluginToolFallbackPatch";
const configFallbackMarker = "codexLinuxPluginConfigFallbackPatch";
let source = readFileSync(target, "utf8");
let changed = false;

const before = "let{config:m}=await rp(`read-config-for-host`,{hostId:i,includeLayers:!1,cwd:r,priority:`critical`}),h=DS(m),g;e.elicitationPluginIds!=null&&e.elicitationPluginIds.length>0&&(g={...g,\"features.auth_elicitation\":!0,\"features.tool_suggest\":!0,\"tool_suggest.discoverables\":e.elicitationPluginIds.map(e=>({type:`plugin`,id:e}))});";
const after = "let{config:m}=await rp(`read-config-for-host`,{hostId:i,includeLayers:!1,cwd:r,priority:`critical`}),h=DS(m),g,E=[...new Set([...(e.elicitationPluginIds??[]),...Array.from(t.matchAll(/plugin:\\/\\/([^)\\s]+)/g),e=>e[1])])];E.length>0&&(g={...g,\"features.auth_elicitation\":!0,\"features.tool_suggest\":!0,\"tool_suggest.discoverables\":E.map(e=>({type:`plugin`,id:e}))})/*codexLinuxRovoDiscoveryPatch*/;";

if (!source.includes(marker)) {
  const matches = source.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`Expected exactly one renderer patch point, found ${matches}`);
  }
  source = source.replace(before, after);
  changed = true;
}

if (!source.includes(fallbackMarker)) {
  const beforeFallback = `${marker}*/;let _=i===\`local\`&&e.aeonStartTarget===\`local\`,v=e.aeonStartTarget===\`durable\`?\`durable\`:_?\`local\`:null;return{input:`;
  const fallbackInstructions = "The user explicitly selected Atlassian Rovo. You MUST call functions.exec with raw JavaScript; do not call wait, request_user_input, list_mcp_resources, or list_mcp_resource_templates. Use exactly: const result = await tools.mcp__codex_apps__atlassian_rovo_getaccessibleatlassianresources({}); for (const c of result.content ?? []) if (c.type === 'text') text(c.text); Then report the accessible Jira site. This is a read-only operation.";
  const afterFallback = `${marker}*/;let _=i===\`local\`&&e.aeonStartTarget===\`local\`,v=e.aeonStartTarget===\`durable\`?\`durable\`:_?\`local\`:null;return{additionalDeveloperInstructions:E.length>0?${JSON.stringify(fallbackInstructions)}:void 0/*${fallbackMarker}*/,input:`;
  const matches = source.split(beforeFallback).length - 1;
  if (matches !== 1) {
    throw new Error(`Expected exactly one plugin fallback patch point, found ${matches}`);
  }
  source = source.replace(beforeFallback, afterFallback);
  changed = true;
}

if (!source.includes(configFallbackMarker)) {
  const fallbackInstructions = "The user explicitly selected Atlassian Rovo. You MUST call functions.exec with raw JavaScript; do not call wait, request_user_input, list_mcp_resources, or list_mcp_resource_templates. Use exactly: const result = await tools.mcp__codex_apps__atlassian_rovo_getaccessibleatlassianresources({}); for (const c of result.content ?? []) if (c.type === 'text') text(c.text); Then report the accessible Jira site. This is a read-only operation.";
  const beforeConfigFallback = `"tool_suggest.discoverables":E.map(e=>({type:\`plugin\`,id:e}))})/*${marker}*/;`;
  const afterConfigFallback = `"tool_suggest.discoverables":E.map(e=>({type:\`plugin\`,id:e})),"developer_instructions":${JSON.stringify(fallbackInstructions)}})/*${marker}*//*${configFallbackMarker}*/;`;
  const matches = source.split(beforeConfigFallback).length - 1;
  if (matches !== 1) {
    throw new Error(`Expected exactly one config fallback patch point, found ${matches}`);
  }
  source = source.replace(beforeConfigFallback, afterConfigFallback);
  changed = true;
}

if (!changed) {
  console.log(`Already patched: ${target}`);
  process.exit(0);
}

const backup = source.includes(marker)
  ? `${target}.before-plugin-tool-fallback`
  : `${target}.before-rovo-discovery`;
if (!existsSync(backup)) copyFileSync(target, backup);
writeFileSync(target, source);
console.log(`Patched: ${target}`);
