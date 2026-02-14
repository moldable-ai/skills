#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";

function usage(exitCode = 2): never {
  console.error(`Usage:
  trello.ts boards-list [--json]
  trello.ts lists-list --board-id <id> [--json]
  trello.ts cards-list --list-id <id> [--json]
  trello.ts card-create --list-id <id> --name <text> [--desc <text>] [--json]
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

function encodeQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    qs.set(k, v);
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
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

  if (cmd === "boards-list") {
    const payload = runAivaultJson([
      "json",
      "trello/members",
      "--method",
      "GET",
      "--path",
      `/1/members/me/boards${encodeQuery({ fields: "name,url" })}`,
      "--header",
      "Accept=application/json",
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    const boards = upstream as any[];
    if (!Array.isArray(boards) || boards.length === 0) {
      process.stdout.write("(no boards)\n");
      return;
    }
    for (const b of boards) {
      process.stdout.write(`${b?.id}\t${b?.name || ""}\t${b?.url || ""}\n`);
    }
    return;
  }

  if (cmd === "lists-list") {
    const boardId = argsMap["board-id"] || "";
    if (!boardId) throw new Error("--board-id is required");
    const payload = runAivaultJson([
      "json",
      "trello/boards",
      "--method",
      "GET",
      "--path",
      `/1/boards/${boardId}/lists${encodeQuery({ fields: "name" })}`,
      "--header",
      "Accept=application/json",
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    const lists = upstream as any[];
    if (!Array.isArray(lists) || lists.length === 0) {
      process.stdout.write("(no lists)\n");
      return;
    }
    for (const l of lists) {
      process.stdout.write(`${l?.id}\t${l?.name || ""}\n`);
    }
    return;
  }

  if (cmd === "cards-list") {
    const listId = argsMap["list-id"] || "";
    if (!listId) throw new Error("--list-id is required");
    const payload = runAivaultJson([
      "json",
      "trello/lists",
      "--method",
      "GET",
      "--path",
      `/1/lists/${listId}/cards${encodeQuery({ fields: "name,url" })}`,
      "--header",
      "Accept=application/json",
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    const cards = upstream as any[];
    if (!Array.isArray(cards) || cards.length === 0) {
      process.stdout.write("(no cards)\n");
      return;
    }
    for (const c of cards) {
      process.stdout.write(`${c?.id}\t${c?.name || ""}\t${c?.url || ""}\n`);
    }
    return;
  }

  if (cmd === "card-create") {
    const listId = argsMap["list-id"] || "";
    const name = argsMap.name || "";
    const desc = argsMap.desc || "";
    if (!listId) throw new Error("--list-id is required");
    if (!name) throw new Error("--name is required");

    const payload = runAivaultJson([
      "json",
      "trello/cards",
      "--method",
      "POST",
      "--path",
      `/1/cards${encodeQuery({ idList: listId, name, desc: desc || undefined })}`,
      "--header",
      "Accept=application/json",
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    process.stdout.write(`created\t${(upstream as any)?.id}\t${(upstream as any)?.name || ""}\n`);
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

