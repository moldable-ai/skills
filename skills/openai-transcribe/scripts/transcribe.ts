#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const CAPABILITY_ID = "openai/transcription";

function usage(): never {
  console.error(`Usage:
  transcribe.ts <audio-file> [--json]`);
  process.exit(2);
}

function runAivault(args: string[]): unknown {
  const result = spawnSync("aivault", args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(`failed to execute aivault: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "aivault invoke failed").trim();
    throw new Error(message);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(
      `invalid JSON from aivault: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function extractUpstreamJson(payload: unknown): unknown {
  return (payload as { response?: { json?: unknown } }).response?.json;
}

function extractStatus(payload: unknown): number {
  const status = (payload as { response?: { status?: number } }).response?.status;
  return typeof status === "number" ? status : 0;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    usage();
  }

  const inputFile = args.shift() as string;
  // Always request JSON from upstream so the response shape is stable.
  // We control whether we print raw JSON (--json) or just the extracted text.
  const responseFormat = "json";
  let jsonOutput = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--json":
        jsonOutput = true;
        break;
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (!inputFile || !existsSync(inputFile)) {
    throw new Error(`File not found: ${inputFile}`);
  }

  const invokeArgs = [
    "json",
    CAPABILITY_ID,
    "--multipart-field",
    "model=whisper-1",
    "--multipart-field",
    `response_format=${responseFormat}`,
    "--header",
    "Accept=application/json",
    "--multipart-file",
    `file=${inputFile}`,
  ];

  const payload = runAivault(invokeArgs);
  const upstreamJson = extractUpstreamJson(payload);
  const status = extractStatus(payload);
  if (status < 200 || status >= 300) {
    const detail = JSON.stringify(upstreamJson);
    throw new Error(detail ? detail : `aivault invoke failed with status ${status}`);
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(upstreamJson));
    return;
  }

  const text = (upstreamJson as { text?: string } | undefined)?.text || "";
  process.stdout.write(`${text}\n`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
