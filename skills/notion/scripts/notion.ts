#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const NOTION_VERSION = "2025-09-03";

function usage(exitCode = 2): never {
  console.error(`Usage:
  notion.ts search --query <text> [--type page|database] [--limit N] [--json]
  notion.ts page-get --id <page-id> [--json]
  notion.ts page-create (--database-id <db-id> | --parent-page-id <page-id>) --title <title> [--title-property <Name>] [--properties-json <json>] [--properties-file <path>] [--json]
  notion.ts page-update --id <page-id> [--archived true|false] [--properties-json <json>] [--properties-file <path>] [--json]
  notion.ts block-children --id <block-id> [--page-size N] [--start-cursor <cursor>] [--json]
  notion.ts block-append --id <block-id> (--children-json <json> | --children-file <path>) [--json]
`);
  process.exit(exitCode);
}

function runAivaultJson(args: string[]): unknown {
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

function parseJsonArg(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(
      `invalid JSON for ${label}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function readJsonFile(path: string, label: string): unknown {
  if (!existsSync(path)) throw new Error(`File not found: ${path}`);
  return parseJsonArg(readFileSync(path, "utf8"), label);
}

function notionHeaders(): string[] {
  return [
    "--header",
    "Accept=application/json",
    "--header",
    "Content-Type=application/json",
    "--header",
    `Notion-Version=${NOTION_VERSION}`,
  ];
}

function encodeQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function pickTitleFromNotionPage(page: any): string {
  try {
    const props = page?.properties ?? {};
    for (const v of Object.values(props)) {
      const vv: any = v;
      if (vv?.type === "title" && Array.isArray(vv?.title)) {
        return vv.title.map((t: any) => t?.plain_text || "").join("").trim();
      }
    }
  } catch {
    // ignore
  }
  return "";
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") usage(0);

  const cmd = argv.shift() as string;
  let jsonOutput = false;

  function takeFlag(name: string): boolean {
    const idx = argv.indexOf(name);
    if (idx === -1) return false;
    argv.splice(idx, 1);
    return true;
  }
  if (takeFlag("--json")) jsonOutput = true;

  const argsMap: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`Unexpected arg: ${a}`);
    const v = argv[i + 1];
    if (!v || v.startsWith("--")) throw new Error(`Missing value for ${a}`);
    argsMap[a.slice(2)] = v;
    i += 1;
  }

  let capability = "";
  let method = "";
  let path = "";
  let body: unknown | null = null;

  switch (cmd) {
    case "search": {
      const query = argsMap.query || "";
      const type = argsMap.type || "";
      const limit = argsMap.limit ? Number(argsMap.limit) : 10;
      if (!query) throw new Error("--query is required");
      if (Number.isNaN(limit) || limit <= 0) throw new Error("--limit must be a positive number");
      if (type && type !== "page" && type !== "database") {
        throw new Error("--type must be one of: page, database");
      }

      capability = "notion/search";
      method = "POST";
      path = "/v1/search";
      body = {
        query,
        page_size: limit,
        ...(type
          ? { filter: { property: "object", value: type } }
          : {}),
      };
      break;
    }
    case "page-get": {
      const id = argsMap.id || "";
      if (!id) throw new Error("--id is required");
      capability = "notion/pages";
      method = "GET";
      path = `/v1/pages/${id}`;
      body = null;
      break;
    }
    case "page-create": {
      const databaseId = argsMap["database-id"] || "";
      const parentPageId = argsMap["parent-page-id"] || "";
      const title = argsMap.title || "";
      const titleProperty = argsMap["title-property"] || (databaseId ? "Name" : "title");
      const propertiesJson = argsMap["properties-json"] || "";
      const propertiesFile = argsMap["properties-file"] || "";

      if (!title) throw new Error("--title is required");
      if (!!databaseId === !!parentPageId) {
        throw new Error("Provide exactly one of --database-id or --parent-page-id");
      }

      let properties: any = {};
      if (propertiesJson) properties = parseJsonArg(propertiesJson, "--properties-json");
      if (propertiesFile) properties = readJsonFile(propertiesFile, "--properties-file");

      // If user didn't provide a title property, set a reasonable default.
      if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
        throw new Error("properties must be a JSON object");
      }
      if (!properties[titleProperty]) {
        properties[titleProperty] = { title: [{ text: { content: title } }] };
      }

      capability = "notion/pages";
      method = "POST";
      path = "/v1/pages";
      body = {
        parent: databaseId ? { database_id: databaseId } : { page_id: parentPageId },
        properties,
      };
      break;
    }
    case "page-update": {
      const id = argsMap.id || "";
      const archived = argsMap.archived;
      const propertiesJson = argsMap["properties-json"] || "";
      const propertiesFile = argsMap["properties-file"] || "";
      if (!id) throw new Error("--id is required");

      let properties: any | undefined;
      if (propertiesJson) properties = parseJsonArg(propertiesJson, "--properties-json");
      if (propertiesFile) properties = readJsonFile(propertiesFile, "--properties-file");
      if (properties && (typeof properties !== "object" || Array.isArray(properties))) {
        throw new Error("properties must be a JSON object");
      }

      capability = "notion/pages";
      method = "PATCH";
      path = `/v1/pages/${id}`;
      body = {
        ...(properties ? { properties } : {}),
        ...(archived !== undefined ? { archived: archived === "true" } : {}),
      };
      break;
    }
    case "block-children": {
      const id = argsMap.id || "";
      const pageSize = argsMap["page-size"] ? Number(argsMap["page-size"]) : 50;
      const startCursor = argsMap["start-cursor"] || "";
      if (!id) throw new Error("--id is required");
      if (Number.isNaN(pageSize) || pageSize <= 0) throw new Error("--page-size must be a positive number");

      capability = "notion/blocks";
      method = "GET";
      path = `/v1/blocks/${id}/children${encodeQuery({
        page_size: pageSize,
        start_cursor: startCursor || undefined,
      })}`;
      body = null;
      break;
    }
    case "block-append": {
      const id = argsMap.id || "";
      const childrenJson = argsMap["children-json"] || "";
      const childrenFile = argsMap["children-file"] || "";
      if (!id) throw new Error("--id is required");
      if (!!childrenJson === !!childrenFile) {
        throw new Error("Provide exactly one of --children-json or --children-file");
      }
      const children = childrenJson
        ? parseJsonArg(childrenJson, "--children-json")
        : readJsonFile(childrenFile, "--children-file");
      if (!Array.isArray(children)) throw new Error("children must be a JSON array");

      capability = "notion/blocks";
      method = "PATCH";
      path = `/v1/blocks/${id}/children`;
      body = { children };
      break;
    }
    default:
      usage();
  }

  const invokeArgs = [
    "json",
    capability,
    "--method",
    method,
    "--path",
    path,
    ...notionHeaders(),
  ];
  if (body !== null) {
    invokeArgs.push("--body", JSON.stringify(body));
  }

  const payload = runAivaultJson(invokeArgs);
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

  // Human-readable output per command.
  if (cmd === "search") {
    const results = (upstreamJson as any)?.results as any[] | undefined;
    if (!Array.isArray(results) || results.length === 0) {
      process.stdout.write("(no results)\n");
      return;
    }
    for (const r of results) {
      const object = r?.object || "";
      const url = r?.url || "";
      const title = pickTitleFromNotionPage(r) || r?.title?.plain_text || "";
      process.stdout.write(`${object}\t${title}\t${url}\n`);
    }
    return;
  }

  if (cmd === "page-get" || cmd === "page-create" || cmd === "page-update") {
    const title = pickTitleFromNotionPage(upstreamJson as any);
    const url = (upstreamJson as any)?.url || "";
    const id = (upstreamJson as any)?.id || "";
    process.stdout.write(`${title || "(untitled)"}\n`);
    if (id) process.stdout.write(`id: ${id}\n`);
    if (url) process.stdout.write(`url: ${url}\n`);
    return;
  }

  if (cmd === "block-children" || cmd === "block-append") {
    const results = (upstreamJson as any)?.results as any[] | undefined;
    if (!Array.isArray(results) || results.length === 0) {
      process.stdout.write("(no blocks)\n");
      return;
    }
    for (const b of results) {
      const type = b?.type || "";
      let text = "";
      try {
        const rich = b?.[type]?.rich_text;
        if (Array.isArray(rich)) {
          text = rich.map((t: any) => t?.plain_text || "").join("").trim();
        }
      } catch {
        text = "";
      }
      process.stdout.write(`${type}${text ? `\t${text}` : ""}\n`);
    }
    return;
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

