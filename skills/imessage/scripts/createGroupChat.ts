#!/usr/bin/env npx tsx
/**
 * Create a new group chat and send an initial message
 * 
 * Usage: npx tsx createGroupChat.ts --participants "id1,id2,id3" --message "Hello everyone!"
 * 
 * Note: Participants should be comma-separated emails or phone numbers
 * 
 * ⚠️ LIMITATION: Due to macOS Messages AppleScript limitations, this uses the 
 * imessage:// URL scheme which will open Messages with a compose window.
 * The message will be pre-filled but may require manual send confirmation.
 */

import { execSync } from "child_process";
import { parseArgs } from "./db.js";

interface CreateGroupChatResult {
  success: boolean;
  participants: string[];
  message: string;
  method?: string;
  error?: string;
}

function createGroupChat(participants: string[], message: string): CreateGroupChatResult {
  if (participants.length < 2) {
    return {
      success: false,
      participants,
      message,
      error: "Need at least 2 participants for a group chat"
    };
  }

  // Escape message for AppleScript
  const escapedMessage = message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");

  // Build buddy references
  const buddySetup = participants
    .map((p, i) => {
      const escaped = p.replace(/"/g, '\\"');
      return `set buddy${i + 1} to buddy "${escaped}" of targetService`;
    })
    .join("\n        ");

  const buddyList = participants.map((_, i) => `buddy${i + 1}`).join(", ");

  // Method 1: Try sending to a list of buddies (this should create a group in some macOS versions)
  const script1 = `
    tell application "Messages"
      set targetService to (service 1 whose service type is iMessage)
      ${buddySetup}
      send "${escapedMessage}" to {${buddyList}}
    end tell
  `;

  try {
    execSync(`osascript -e '${script1.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      timeout: 15000,
    });

    return {
      success: true,
      participants,
      message,
      method: "direct_send"
    };
  } catch (e1: any) {
    // Method 2: Use imessage:// URL scheme
    // This opens Messages with the recipients pre-filled
    const encodedParticipants = participants.map(p => encodeURIComponent(p)).join(",");
    const encodedMessage = encodeURIComponent(message);
    const url = `imessage://open?addresses=${encodedParticipants}&body=${encodedMessage}`;

    const script2 = `
      do shell script "open '${url}'"
      delay 1
      tell application "Messages"
        activate
      end tell
      delay 0.5
      tell application "System Events"
        tell process "Messages"
          -- Try to send with Enter key
          keystroke return
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script2.replace(/'/g, "'\"'\"'")}'`, {
        encoding: "utf-8",
        timeout: 20000,
      });

      return {
        success: true,
        participants,
        message,
        method: "url_scheme"
      };
    } catch (e2: any) {
      // Method 3: Just open the URL without auto-send (safest fallback)
      const script3 = `do shell script "open '${url}'"`;

      try {
        execSync(`osascript -e '${script3.replace(/'/g, "'\"'\"'")}'`, {
          encoding: "utf-8",
          timeout: 10000,
        });

        return {
          success: true,
          participants,
          message,
          method: "url_scheme_manual",
          error: "Message window opened. Press Enter/Return to send manually."
        };
      } catch (e3: any) {
        return {
          success: false,
          participants,
          message,
          error: e3.stderr || e3.message || "Failed to create group chat"
        };
      }
    }
  }
}

// Main
const args = parseArgs(process.argv.slice(2));

if (!args.participants) {
  console.error(JSON.stringify({ error: "Missing required --participants argument (comma-separated)" }));
  process.exit(1);
}

if (!args.message) {
  console.error(JSON.stringify({ error: "Missing required --message argument" }));
  process.exit(1);
}

const participants = (args.participants as string).split(",").map(p => p.trim());
const result = createGroupChat(participants, args.message as string);

console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exit(1);
}
