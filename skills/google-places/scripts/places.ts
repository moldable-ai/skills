#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";

function usage(exitCode = 2): never {
  console.error(`Usage:
  places.ts search-text --query <text> [--field-mask <mask>] [--lat <num> --lng <num> --radius-m <num>] [--json]
  places.ts details --place-id <id> [--field-mask <mask>] [--json]
  places.ts autocomplete --query <text> [--field-mask <mask>] [--json]
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

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) usage(0);

  const cmd = argv.shift() as string;
  let jsonOutput = false;
  if (argv.includes("--json")) {
    argv.splice(argv.indexOf("--json"), 1);
    jsonOutput = true;
  }

  const argsMap: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (!a.startsWith("--")) throw new Error(`Unexpected arg: ${a}`);
    if (!next || next.startsWith("--")) throw new Error(`Missing value for ${a}`);
    argsMap[a.slice(2)] = next;
    i += 1;
  }

  const fieldMask = argsMap["field-mask"] || "";

  if (cmd === "search-text") {
    const query = argsMap.query || "";
    if (!query) throw new Error("--query is required");
    const lat = argsMap.lat ? Number(argsMap.lat) : undefined;
    const lng = argsMap.lng ? Number(argsMap.lng) : undefined;
    const radiusM = argsMap["radius-m"] ? Number(argsMap["radius-m"]) : undefined;
    if ((lat !== undefined || lng !== undefined || radiusM !== undefined) && (lat === undefined || lng === undefined)) {
      throw new Error("If specifying location bias, provide both --lat and --lng");
    }

    const body: any = { textQuery: query };
    if (lat !== undefined && lng !== undefined) {
      body.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusM ?? 2500,
        },
      };
    }

    const payload = runAivaultJson([
      "json",
      "google-places/search-text",
      "--method",
      "POST",
      "--path",
      "/v1/places:searchText",
      "--header",
      "Accept=application/json",
      "--header",
      "Content-Type=application/json",
      "--header",
      `X-Goog-FieldMask=${fieldMask || "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.googleMapsUri"}`,
      "--body",
      JSON.stringify(body),
    ]);
    const upstream = extractUpstreamJson(payload) as any;
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    const places = upstream?.places as any[] | undefined;
    if (!Array.isArray(places) || places.length === 0) {
      process.stdout.write("(no results)\n");
      return;
    }
    for (const p of places) {
      const name = p?.displayName?.text || "";
      const addr = p?.formattedAddress || "";
      process.stdout.write(`${p?.id}\t${name}\t${addr}\n`);
    }
    return;
  }

  if (cmd === "details") {
    const placeId = argsMap["place-id"] || "";
    if (!placeId) throw new Error("--place-id is required");
    const payload = runAivaultJson([
      "json",
      "google-places/details",
      "--method",
      "GET",
      "--path",
      `/v1/places/${placeId}`,
      "--header",
      "Accept=application/json",
      "--header",
      `X-Goog-FieldMask=${fieldMask || "id,displayName,formattedAddress,googleMapsUri,location,types,rating,userRatingCount,websiteUri"}`,
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    const p: any = upstream;
    const name = p?.displayName?.text || "";
    const addr = p?.formattedAddress || "";
    const maps = p?.googleMapsUri || "";
    process.stdout.write(`${placeId}\t${name}\t${addr}\n`);
    if (maps) process.stdout.write(`${maps}\n`);
    return;
  }

  if (cmd === "autocomplete") {
    const query = argsMap.query || "";
    if (!query) throw new Error("--query is required");
    const body: any = { input: query };
    const payload = runAivaultJson([
      "json",
      "google-places/autocomplete",
      "--method",
      "POST",
      "--path",
      "/v1/places:autocomplete",
      "--header",
      "Accept=application/json",
      "--header",
      "Content-Type=application/json",
      "--header",
      `X-Goog-FieldMask=${fieldMask || "*"}`,
      "--body",
      JSON.stringify(body),
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    process.stdout.write(JSON.stringify(upstream, null, 2) + "\n");
    return;
  }

  usage();
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

