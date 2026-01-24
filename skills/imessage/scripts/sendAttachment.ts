#!/usr/bin/env npx tsx
/**
 * Send an attachment (image or file) via iMessage
 * 
 * Usage: npx tsx sendAttachment.ts --to "email@example.com" --file "/path/to/file.jpg" [--message "optional caption"]
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import { parseArgs } from "./db.js";

interface SendResult {
  success: boolean;
  to: string;
  file: string;
  message?: string;
  error?: string;
}

function sendAttachment(to: string, filePath: string, message?: string): SendResult {
  // Resolve and validate file path
  const resolvedPath = resolve(filePath);
  
  if (!existsSync(resolvedPath)) {
    return {
      success: false,
      to,
      file: filePath,
      message,
      error: `File not found: ${resolvedPath}`
    };
  }
  
  // Escape for AppleScript
  const escapedTo = to.replace(/"/g, '\\"');
  const escapedPath = resolvedPath.replace(/"/g, '\\"');
  
  // Build AppleScript - send file as attachment
  let script = `
    tell application "Messages"
      set targetBuddy to buddy "${escapedTo}" of (service 1 whose service type is iMessage)
      set theFile to POSIX file "${escapedPath}"
      send theFile to targetBuddy
    end tell
  `;
  
  // If there's a message, send it separately after the file
  if (message) {
    const escapedMessage = message
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    
    script = `
      tell application "Messages"
        set targetBuddy to buddy "${escapedTo}" of (service 1 whose service type is iMessage)
        set theFile to POSIX file "${escapedPath}"
        send theFile to targetBuddy
        delay 0.5
        send "${escapedMessage}" to targetBuddy
      end tell
    `;
  }
  
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      timeout: 30000, // 30s timeout for larger files
    });
    
    return {
      success: true,
      to,
      file: resolvedPath,
      message
    };
  } catch (e: any) {
    let errorMessage = e.message || "Unknown error";
    
    if (errorMessage.includes("buddy") && errorMessage.includes("not found")) {
      errorMessage = `Contact "${to}" not found or not registered with iMessage`;
    } else if (errorMessage.includes("service")) {
      errorMessage = "iMessage service not available. Is Messages app signed in?";
    }
    
    return {
      success: false,
      to,
      file: resolvedPath,
      message,
      error: errorMessage
    };
  }
}

// Main
const args = parseArgs(process.argv.slice(2));

if (!args.to) {
  console.error(JSON.stringify({ error: "Missing required --to argument" }));
  process.exit(1);
}

if (!args.file) {
  console.error(JSON.stringify({ error: "Missing required --file argument" }));
  process.exit(1);
}

const result = sendAttachment(
  args.to as string,
  args.file as string,
  args.message as string | undefined
);

console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exit(1);
}
