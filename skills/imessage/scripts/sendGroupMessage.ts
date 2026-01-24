#!/usr/bin/env npx tsx
/**
 * Send a message to a group chat
 * 
 * Usage: npx tsx sendGroupMessage.ts --id <chatId> --message "Hello everyone!"
 * 
 * Note: You need the chat ID from listGroupChats.ts
 */

import { execSync } from "child_process";
import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";

interface SendResult {
  success: boolean;
  chatId: number;
  chatName: string;
  message: string;
  error?: string;
}

function getChatIdentifier(chatId: number): { identifier: string; displayName: string } | null {
  const sql = `
    SELECT 
      c.chat_identifier as identifier,
      c.display_name as displayName
    FROM chat c
    WHERE c.ROWID = ${chatId}
  `;
  
  const results = queryJson<{ identifier: string; displayName: string }>(sql);
  return results.length > 0 ? results[0] : null;
}

function sendGroupMessage(chatId: number, message: string): SendResult {
  const chat = getChatIdentifier(chatId);
  
  if (!chat) {
    return {
      success: false,
      chatId,
      chatName: "",
      message,
      error: `Chat with ID ${chatId} not found`
    };
  }
  
  // Escape for AppleScript
  const escapedMessage = message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  
  const escapedIdentifier = chat.identifier.replace(/"/g, '\\"');
  
  const script = `
    tell application "Messages"
      set targetChat to chat "${escapedIdentifier}"
      send "${escapedMessage}" to targetChat
    end tell
  `;
  
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    
    return {
      success: true,
      chatId,
      chatName: chat.displayName || chat.identifier,
      message
    };
  } catch (e: any) {
    let errorMessage = e.message || "Unknown error";
    
    if (errorMessage.includes("chat") && errorMessage.includes("not found")) {
      errorMessage = `Chat "${chat.identifier}" not found in Messages app`;
    }
    
    return {
      success: false,
      chatId,
      chatName: chat.displayName || chat.identifier,
      message,
      error: errorMessage
    };
  }
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.id) {
  console.error(JSON.stringify({ error: "Missing required --id argument (chat ID)" }));
  process.exit(1);
}

if (!args.message) {
  console.error(JSON.stringify({ error: "Missing required --message argument" }));
  process.exit(1);
}

const result = sendGroupMessage(
  parseInt(args.id as string, 10),
  args.message as string
);

console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exit(1);
}
