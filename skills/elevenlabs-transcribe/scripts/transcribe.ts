#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const CAPABILITY_ID = "elevenlabs/transcription";

function usage(): never {
  console.error(`Usage:
  transcribe.ts <audio-file> [--json]
  transcribe.ts --url <https-media-url> [--json]`);
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
  let mediaUrl = "";
  let jsonOutput = false;

  if (args[0] !== "--url") {
    inputFile = args.shift() || "";
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    switch (arg) {
      case "--url":
        mediaUrl = next || "";
        i += 1;
        break;
      case "--json":
        jsonOutput = true;
        break;
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (inputFile && mediaUrl) {
    throw new Error("Use either a local file or --url, not both");
  }
  if (!inputFile && !mediaUrl) {
    throw new Error("Provide an audio/video file path or --url");
  }
  if (inputFile && !existsSync(inputFile)) {
    throw new Error(`File not found: ${inputFile}`);
  }

  const invokeArgs = [
    "json",
    CAPABILITY_ID,
    "--path",
    "/v1/speech-to-text?enable_logging=true",
    "--multipart-field",
    "model_id=scribe_v2",
    "--multipart-field",
    "diarize=false",
    "--multipart-field",
    "timestamps_granularity=word",
    "--multipart-field",
    "use_multi_channel=false",
    "--header",
    "Accept=application/json",
  ];

  if (mediaUrl) {
    invokeArgs.push("--multipart-field", `cloud_storage_url=${mediaUrl}`);
  } else {
    invokeArgs.push("--multipart-file", `file=${inputFile}`);
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

  let text = "";
  try {
    const parsed = upstreamJson as { transcripts?: Array<{ text?: string }>; text?: string };
    if (Array.isArray(parsed.transcripts) && parsed.transcripts.length > 0) {
      text = parsed.transcripts.map((t) => t.text || "").filter(Boolean).join("\n");
    } else {
      text = parsed.text || "";
    }
  } catch {
    text = "";
  }
  process.stdout.write(`${text}\n`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
