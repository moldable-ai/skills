#!/usr/bin/env -S npx -y tsx
import { spawnSync } from "node:child_process";

function usage(exitCode = 2): never {
  console.error(`Usage:
  todoist.ts tasks-list [--project-id <id>] [--json]
  todoist.ts tasks-create --content <text> [--due <string>] [--priority 1-4] [--project-id <id>] [--labels <a,b,c>] [--json]
  todoist.ts tasks-close --id <task-id>
  todoist.ts tasks-delete --id <task-id>
  todoist.ts projects-list [--json]
  todoist.ts comments-add --task-id <id> --content <text> [--json]
`);
  process.exit(exitCode);
}

function runAivault(args: string[]): unknown {
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

function extractInvokeStatus(payload: unknown): number {
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

  if (cmd === "tasks-list") {
    const projectId = argsMap["project-id"];
    const payload = runAivault([
      "json",
      "todoist/tasks",
      "--method",
      "GET",
      "--path",
      `/rest/v2/tasks${encodeQuery({ project_id: projectId })}`,
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
    const tasks = upstream as any[];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      process.stdout.write("(no tasks)\n");
      return;
    }
    for (const t of tasks) {
      const due = t?.due?.string || t?.due?.date || "";
      process.stdout.write(`${t?.id}\t${t?.content || ""}${due ? `\t(due: ${due})` : ""}\n`);
    }
    return;
  }

  if (cmd === "tasks-create") {
    const content = argsMap.content || "";
    if (!content) throw new Error("--content is required");
    const due = argsMap.due || "";
    const priority = argsMap.priority ? Number(argsMap.priority) : undefined;
    const projectId = argsMap["project-id"] || "";
    const labels = argsMap.labels ? argsMap.labels.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (priority !== undefined && (!Number.isFinite(priority) || priority < 1 || priority > 4)) {
      throw new Error("--priority must be 1-4");
    }

    const body: any = { content };
    if (due) body.due_string = due;
    if (priority !== undefined) body.priority = priority;
    if (projectId) body.project_id = projectId;
    if (labels.length > 0) body.labels = labels;

    const payload = runAivault([
      "json",
      "todoist/tasks",
      "--method",
      "POST",
      "--path",
      "/rest/v2/tasks",
      "--header",
      "Accept=application/json",
      "--header",
      "Content-Type=application/json",
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
    process.stdout.write(`created\t${(upstream as any)?.id}\t${(upstream as any)?.content || ""}\n`);
    return;
  }

  if (cmd === "tasks-close" || cmd === "tasks-delete") {
    const id = argsMap.id || "";
    if (!id) throw new Error("--id is required");

    if (cmd === "tasks-close") {
      // Todoist close returns 204 (empty body), so use `invoke` rather than `json`.
      const payload = runAivault([
        "invoke",
        "todoist/tasks",
        "--method",
        "POST",
        "--path",
        `/rest/v2/tasks/${id}/close`,
      ]);
      const status = extractInvokeStatus(payload);
      if (status < 200 || status >= 300) throw new Error(JSON.stringify(payload));
      process.stdout.write(`closed\t${id}\n`);
      return;
    }

    const payload = runAivault([
      "invoke",
      "todoist/tasks",
      "--method",
      "DELETE",
      "--path",
      `/rest/v2/tasks/${id}`,
    ]);
    const status = extractInvokeStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(payload));
    process.stdout.write(`deleted\t${id}\n`);
    return;
  }

  if (cmd === "projects-list") {
    const payload = runAivault([
      "json",
      "todoist/projects",
      "--method",
      "GET",
      "--path",
      "/rest/v2/projects",
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
    const projects = upstream as any[];
    if (!Array.isArray(projects) || projects.length === 0) {
      process.stdout.write("(no projects)\n");
      return;
    }
    for (const p of projects) {
      process.stdout.write(`${p?.id}\t${p?.name || ""}\n`);
    }
    return;
  }

  if (cmd === "comments-add") {
    const taskId = argsMap["task-id"] || "";
    const content = argsMap.content || "";
    if (!taskId) throw new Error("--task-id is required");
    if (!content) throw new Error("--content is required");
    const payload = runAivault([
      "json",
      "todoist/comments",
      "--method",
      "POST",
      "--path",
      "/rest/v2/comments",
      "--header",
      "Accept=application/json",
      "--header",
      "Content-Type=application/json",
      "--body",
      JSON.stringify({ task_id: taskId, content }),
    ]);
    const upstream = extractUpstreamJson(payload);
    const status = extractStatus(payload);
    if (status < 200 || status >= 300) throw new Error(JSON.stringify(upstream) || `status ${status}`);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(upstream));
      return;
    }
    process.stdout.write(`commented\t${(upstream as any)?.id}\t(task ${taskId})\n`);
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

