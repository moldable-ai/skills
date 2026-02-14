#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const CAPABILITY_ID = "deepgram/transcription";

function usage(): never {
  console.error(`Usage:
  transcribe.ts <audio-file> [--json]
  transcribe.ts --url <https-audio-url> [--json]`);
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

  let inputFile = "";
  let audioUrl = "";
  let jsonOutput = false;

  if (args[0] !== "--url") {
    inputFile = args.shift() || "";
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    switch (arg) {
      case "--url":
        audioUrl = next || "";
        i += 1;
        break;
      case "--json":
        jsonOutput = true;
        break;
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (inputFile && audioUrl) {
    throw new Error("Use either a local file or --url, not both");
  }
  if (!inputFile && !audioUrl) {
    throw new Error("Provide an audio file path or --url");
  }
  if (inputFile && !existsSync(inputFile)) {
    throw new Error(`File not found: ${inputFile}`);
  }

  const invokeArgs = [
    "json",
    CAPABILITY_ID,
    "--path",
    "/v1/listen?model=nova-3&diarize=false&punctuate=true&smart_format=true",
    "--header",
    "Accept=application/json",
  ];
  if (audioUrl) {
    invokeArgs.push("--header", "Content-Type=application/json");
    invokeArgs.push("--body", JSON.stringify({ url: audioUrl }));
  } else {
    invokeArgs.push("--header", "Content-Type=application/octet-stream");
    invokeArgs.push("--body-file-path", inputFile);
  }

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

  let transcript = "";
  try {
    const parsed = upstreamJson as {
      results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
    };
    transcript = parsed.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  } catch {
    transcript = "";
  }
  process.stdout.write(`${transcript}\n`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
