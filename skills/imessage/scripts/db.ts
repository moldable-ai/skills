/**
 * Shared database utilities for iMessage scripts
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const CHAT_DB_PATH = join(homedir(), "Library/Messages/chat.db");

// Apple Core Data epoch: 2001-01-01 00:00:00 UTC
const APPLE_EPOCH_OFFSET = 978307200;

/**
 * Check if chat.db exists and is accessible
 */
export function checkDatabaseAccess(): { ok: boolean; error?: string } {
  if (!existsSync(CHAT_DB_PATH)) {
    return { ok: false, error: "chat.db not found. Is this macOS with Messages?" };
  }
  
  try {
    execSync(`sqlite3 "${CHAT_DB_PATH}" "SELECT 1"`, { encoding: "utf-8" });
    return { ok: true };
  } catch (e: any) {
    if (e.message?.includes("authorization denied") || e.message?.includes("EPERM")) {
      return { 
        ok: false, 
        error: "Permission denied. Grant Full Disk Access to Terminal/Moldable in System Preferences > Privacy & Security > Full Disk Access" 
      };
    }
    return { ok: false, error: e.message };
  }
}

/**
 * Execute a SQL query against chat.db
 */
export function query(sql: string): string {
  const result = execSync(`sqlite3 -json "${CHAT_DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large results
  });
  return result;
}

/**
 * Execute a SQL query and parse JSON result
 */
export function queryJson<T = any>(sql: string): T[] {
  const result = query(sql);
  if (!result.trim()) return [];
  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

/**
 * Convert Apple timestamp (nanoseconds since 2001-01-01) to ISO string
 */
export function appleTimestampToIso(timestamp: number): string {
  const unixMs = (timestamp / 1_000_000_000 + APPLE_EPOCH_OFFSET) * 1000;
  return new Date(unixMs).toISOString();
}

/**
 * Convert ISO date string to Apple timestamp
 */
export function isoToAppleTimestamp(isoDate: string): number {
  const unixSeconds = new Date(isoDate).getTime() / 1000;
  return (unixSeconds - APPLE_EPOCH_OFFSET) * 1_000_000_000;
}

/**
 * Escape string for SQL LIKE queries
 */
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Parse command line arguments into a simple object
 */
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith("--")) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    } else if (i === 0 || !args[i - 1]?.startsWith("--")) {
      // Positional argument
      const posIndex = Object.keys(result).filter(k => k.startsWith("_")).length;
      result[`_${posIndex}`] = arg;
    }
  }
  
  return result;
}

/**
 * Output result as JSON to stdout
 */
export function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output error and exit
 */
export function error(message: string): never {
  console.error(JSON.stringify({ error: message }));
  process.exit(1);
}

/**
 * Execute AppleScript and return the result
 */
export function runAppleScript(script: string): string {
  const cmd = `osascript -e '${script.replace(/'/g, "'\\''")}'`;
  return execSync(cmd, { encoding: "utf-8" }).trim();
}
