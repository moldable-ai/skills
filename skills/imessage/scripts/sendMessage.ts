#!/usr/bin/env npx tsx
/**
 * Send an iMessage to a contact via AppleScript
 * 
 * Usage: npx tsx sendMessage.ts --to "email@example.com" --message "Hello!"
 */

import { execSync } from "child_process";
import { parseArgs } from "./db.js";

interface SendResult {
  success: boolean;
  to: string;
  message: string;
  error?: string;
}

function sendMessage(to: string, message: string): SendResult {
  // Escape for AppleScript
  const escapedMessage = message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  
  const escapedTo = to.replace(/"/g, '\\"');
  
  const script = `
    tell application "Messages"
      set targetBuddy to buddy "${escapedTo}" of (service 1 whose service type is iMessage)
      send "${escapedMessage}" to targetBuddy
    end tell
  `;
  
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    
    return {
      success: true,
      to,
      message,
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
      message,
      error: errorMessage,
    };
  }
}

// Main
const args = parseArgs(process.argv.slice(2));

if (!args.to) {
  console.error(JSON.stringify({ error: "Missing required --to argument" }));
  process.exit(1);
}

if (!args.message) {
  console.error(JSON.stringify({ error: "Missing required --message argument" }));
  process.exit(1);
}

const result = sendMessage(args.to as string, args.message as string);
console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exit(1);
}
