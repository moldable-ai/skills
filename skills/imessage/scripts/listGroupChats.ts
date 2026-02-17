#!/usr/bin/env npx tsx
/**
 * List all group chat conversations
 * 
 * Usage: npx tsx listGroupChats.ts [--limit N]
 */

import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";

interface GroupChat {
  id: number;
  chatIdentifier: string;
  displayName: string;
  participantCount: number;
  participants: string[];
  messageCount: number;
  lastMessageDate: string;
}

function listGroupChats(limit: number = 50): GroupChat[] {
  // Get group chats (chats with multiple participants)
  const sql = `
    SELECT 
      c.ROWID as id,
      c.chat_identifier as chatIdentifier,
      c.display_name as displayName,
      (SELECT COUNT(*) FROM chat_handle_join chj WHERE chj.chat_id = c.ROWID) as participantCount,
      (SELECT COUNT(*) FROM chat_message_join cmj WHERE cmj.chat_id = c.ROWID) as messageCount,
      (
        SELECT MAX(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime'))
        FROM message m
        JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
        WHERE cmj.chat_id = c.ROWID
      ) as lastMessageDate
    FROM chat c
    WHERE c.chat_identifier LIKE 'chat%'
    ORDER BY lastMessageDate DESC
    LIMIT ${limit}
  `;
  
  const chats = queryJson<GroupChat>(sql);
  
  // Get participants for each chat
  return chats.map(chat => {
    const participantsSql = `
      SELECT h.id
      FROM handle h
      JOIN chat_handle_join chj ON chj.handle_id = h.ROWID
      WHERE chj.chat_id = ${chat.id}
    `;
    
    const participants = queryJson<{ id: string }>(participantsSql).map(p => p.id);
    
    return {
      ...chat,
      displayName: chat.displayName || participants.slice(0, 3).join(", ") + (participants.length > 3 ? "..." : ""),
      participants
    };
  });
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const limit = args.limit ? parseInt(args.limit as string, 10) : 50;

const groupChats = listGroupChats(limit);
console.log(JSON.stringify(groupChats, null, 2));
