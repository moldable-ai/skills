#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const CAPABILITY_ID = "openai/image-generation";

function usage(exitCode = 2): never {
  console.error(`Usage:
  generate.ts [--prompt <text>] [--count N] [--model <id>] [--size <WxH|auto>] [--quality <q>] [--background <transparent|opaque|auto>] [--output-format <png|jpeg|webp>] [--style <vivid|natural>] [--out-dir <dir>] [--json]
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

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  );
}

function defaultOutDir(): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const ts = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${pad2(
    d.getHours()
  )}-${pad2(d.getMinutes())}-${pad2(d.getSeconds())}`;
  return resolve("tmp", `openai-image-gen-${ts}`);
}

function pickPrompts(count: number): string[] {
  const subjects = [
    "a lobster astronaut",
    "a brutalist lighthouse",
    "a cozy reading nook",
    "a cyberpunk noodle shop",
    "a Vienna street at dusk",
    "a minimalist product photo",
    "a surreal underwater library",
  ];
  const styles = [
    "ultra-detailed studio photo",
    "35mm film still",
    "isometric illustration",
    "editorial photography",
    "soft watercolor",
    "architectural render",
    "high-contrast monochrome",
  ];
  const lighting = [
    "golden hour",
    "overcast soft light",
    "neon lighting",
    "dramatic rim light",
    "candlelight",
    "foggy atmosphere",
  ];
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];
    out.push(`${pick(styles)} of ${pick(subjects)}, ${pick(lighting)}`);
  }
  return out;
}

function getModelDefaults(model: string): { size: string; quality: string } {
  if (model === "dall-e-2") return { size: "1024x1024", quality: "standard" };
  if (model === "dall-e-3") return { size: "1024x1024", quality: "standard" };
  return { size: "1024x1024", quality: "high" };
}

async function downloadToFile(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

function writeGallery(outDir: string, items: Array<{ prompt: string; file: string }>) {
  const thumbs = items
    .map(
      (it) => `
<figure>
  <a href="${it.file}"><img src="${it.file}" loading="lazy" /></a>
  <figcaption>${escapeHtml(it.prompt)}</figcaption>
</figure>`.trim()
    )
    .join("\n");

  const html = `<!doctype html>
<meta charset="utf-8" />
<title>openai-image-gen</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 24px; font: 14px/1.4 ui-sans-serif, system-ui; background: #0b0f14; color: #e8edf2; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  figure { margin: 0; padding: 12px; border: 1px solid #1e2a36; border-radius: 14px; background: #0f1620; }
  img { width: 100%; height: auto; border-radius: 10px; display: block; }
  figcaption { margin-top: 10px; color: #b7c2cc; }
  code { color: #9cd1ff; }
</style>
<h1>openai-image-gen</h1>
<p>Output: <code>${escapeHtml(outDir)}</code></p>
<div class="grid">
${thumbs}
</div>
`;
  writeFileSync(join(outDir, "index.html"), html, "utf8");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) usage(0);

  let prompt = "";
  let count = 8;
  let model = "gpt-image-1";
  let size = "";
  let quality = "";
  let background = "";
  let outputFormat = "";
  let style = "";
  let outDir = "";
  let jsonOutput = false;

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case "--prompt":
        prompt = next || "";
        i += 1;
        break;
      case "--count":
        count = Number(next || "");
        i += 1;
        break;
      case "--model":
        model = next || "";
        i += 1;
        break;
      case "--size":
        size = next || "";
        i += 1;
        break;
      case "--quality":
        quality = next || "";
        i += 1;
        break;
      case "--background":
        background = next || "";
        i += 1;
        break;
      case "--output-format":
        outputFormat = next || "";
        i += 1;
        break;
      case "--style":
        style = next || "";
        i += 1;
        break;
      case "--out-dir":
        outDir = next || "";
        i += 1;
        break;
      case "--json":
        jsonOutput = true;
        break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }

  if (!model) throw new Error("--model is required");
  if (!Number.isFinite(count) || count <= 0) throw new Error("--count must be a positive number");
  if (model === "dall-e-3" && count > 1) {
    // DALL-E 3 typically limits to 1; keep user from wasting time.
    count = 1;
  }

  const defaults = getModelDefaults(model);
  if (!size) size = defaults.size;
  if (!quality) quality = defaults.quality;

  const finalOutDir = resolve(outDir || defaultOutDir());
  mkdirSync(finalOutDir, { recursive: true });

  const prompts = prompt ? Array.from({ length: count }, () => prompt) : pickPrompts(count);

  // Determine extension.
  let fileExt = "png";
  if (model.startsWith("gpt-image") && outputFormat) fileExt = outputFormat;

  const items: Array<{ prompt: string; file: string }> = [];
  const rawResponses: unknown[] = [];

  for (let idx = 0; idx < prompts.length; idx += 1) {
    const p = prompts[idx];
    const body: Record<string, unknown> = {
      model,
      prompt: p,
      size,
      n: 1,
    };
    if (model !== "dall-e-2") body.quality = quality;
    if (model.startsWith("gpt-image")) {
      if (background) body.background = background;
      if (outputFormat) body.output_format = outputFormat;
    }
    if (model === "dall-e-3" && style) body.style = style;

    const invokeArgs = [
      "json",
      CAPABILITY_ID,
      "--method",
      "POST",
      "--path",
      "/v1/images/generations",
      "--header",
      "Accept=application/json",
      "--header",
      "Content-Type=application/json",
      "--body",
      JSON.stringify(body),
    ];

    const payload = runAivaultJson(invokeArgs);
    const upstreamJson = extractUpstreamJson(payload) as any;
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) {
      throw new Error(JSON.stringify(upstreamJson) || `aivault invoke failed with status ${status}`);
    }

    rawResponses.push(upstreamJson);

    const data0 = Array.isArray(upstreamJson?.data) ? upstreamJson.data[0] : undefined;
    const imageB64 = data0?.b64_json as string | undefined;
    const imageUrl = data0?.url as string | undefined;
    if (!imageB64 && !imageUrl) {
      throw new Error(`unexpected response: ${JSON.stringify(upstreamJson).slice(0, 400)}`);
    }

    const filename = `${String(idx + 1).padStart(3, "0")}-${slugify(p).slice(0, 40)}.${fileExt}`;
    const outPath = join(finalOutDir, filename);
    if (imageB64) {
      writeFileSync(outPath, Buffer.from(imageB64, "base64"));
    } else if (imageUrl) {
      await downloadToFile(imageUrl, outPath);
    }

    items.push({ prompt: p, file: filename });
  }

  writeFileSync(join(finalOutDir, "prompts.json"), JSON.stringify(items, null, 2), "utf8");
  writeGallery(finalOutDir, items);

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(rawResponses));
    return;
  }
  process.stdout.write(join(finalOutDir, "index.html") + "\n");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
