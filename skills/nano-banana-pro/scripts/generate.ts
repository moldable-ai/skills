#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const CAPABILITY_ID = "gemini/models";
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

function usage(exitCode = 2): never {
  console.error(`Usage:
  generate.ts --prompt <text> --filename <out.png> [--resolution 1K|2K|4K] [--model <id>] [-i <input.png> ...] [--json]
`);
  process.exit(exitCode);
}

function runAivaultJson(args: string[]): unknown {
  const result = spawnSync("aivault", args, { encoding: "utf8" });
  if (result.error) throw new Error(`failed to execute aivault: ${result.error.message}`);
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

function guessMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function findInlineDataBase64(part: any): string | null {
  const inlineData = part?.inlineData ?? part?.inline_data;
  const data = inlineData?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) usage(0);

  let prompt = "";
  let filename = "";
  let resolution = "1K";
  let model = DEFAULT_MODEL;
  const inputs: string[] = [];
  let jsonOutput = false;

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case "--prompt":
      case "-p":
        prompt = next || "";
        i += 1;
        break;
      case "--filename":
      case "-f":
        filename = next || "";
        i += 1;
        break;
      case "--resolution":
      case "-r":
        resolution = next || "";
        i += 1;
        break;
      case "--model":
        model = next || "";
        i += 1;
        break;
      case "--input-image":
      case "-i":
        if (!next) throw new Error("Missing value for -i/--input-image");
        inputs.push(next);
        i += 1;
        break;
      case "--json":
        jsonOutput = true;
        break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }

  if (!prompt) throw new Error("--prompt is required");
  if (!filename) throw new Error("--filename is required");
  if (!model) throw new Error("--model is required");
  if (!["1K", "2K", "4K"].includes(resolution)) {
    throw new Error("--resolution must be one of: 1K, 2K, 4K");
  }

  const parts: any[] = [];
  for (const p of inputs) {
    if (!existsSync(p)) throw new Error(`File not found: ${p}`);
    const bytes = readFileSync(p);
    parts.push({
      inline_data: {
        mime_type: guessMimeType(p),
        data: bytes.toString("base64"),
      },
    });
  }
  parts.push({ text: prompt });

  const requestBody = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        imageSize: resolution,
      },
    },
  };

  const invokeArgs = [
    "json",
    CAPABILITY_ID,
    "--method",
    "POST",
    "--path",
    `/v1beta/models/${model}:generateContent`,
    "--header",
    "Accept=application/json",
    "--header",
    "Content-Type=application/json",
    "--body",
    JSON.stringify(requestBody),
  ];

  const payload = runAivaultJson(invokeArgs);
  const upstreamJson = extractUpstreamJson(payload) as any;
  const status = extractStatus(payload);
  if (status < 200 || status >= 300) {
    const detail = JSON.stringify(upstreamJson);
    throw new Error(detail ? detail : `aivault invoke failed with status ${status}`);
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(upstreamJson));
    return;
  }

  // Extract image data (base64) from the first candidate.
  const partsOut =
    upstreamJson?.candidates?.[0]?.content?.parts ??
    upstreamJson?.candidates?.[0]?.content?.Parts ??
    [];

  let textOut = "";
  let imageB64: string | null = null;
  if (Array.isArray(partsOut)) {
    for (const part of partsOut) {
      if (typeof part?.text === "string" && part.text.trim()) {
        textOut += (textOut ? "\n" : "") + part.text.trim();
      }
      if (!imageB64) imageB64 = findInlineDataBase64(part);
    }
  }

  if (textOut) process.stdout.write(`${textOut}\n`);
  if (!imageB64) throw new Error("No image was generated in the response");

  const outPath = resolve(filename);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(imageB64, "base64"));
  process.stdout.write(`Wrote: ${outPath}\n`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

