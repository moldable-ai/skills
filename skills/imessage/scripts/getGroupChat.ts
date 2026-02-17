#!/usr/bin/env npx tsx
/**
 * Get messages from a specific group chat
 * 
 * Usage: npx tsx getGroupChat.ts --id <chatId> [--limit N]
 */

import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";

interface Message {
  id: number;
  date: string;
  sender: string;
  isFromMe: boolean;
  text: string;
  hasAttachment: boolean;
}

interface GroupChatDetail {
  id: number;
  chatIdentifier: string;
  displayName: string;
  participants: string[];
  messageCount: number;
  messages: Message[];
}

function getGroupChat(chatId: number, limit: number = 100): GroupChatDetail | null {
  // Get chat info
  const chatSql = `
    SELECT 
      c.ROWID as id,
      c.chat_identifier as chatIdentifier,
      c.display_name as displayName
    FROM chat c
    WHERE c.ROWID = ${chatId}
  `;
  
  const chats = queryJson<{ id: number; chatIdentifier: string; displayName: string }>(chatSql);
  
  if (chats.length === 0) {
    return null;
  }
  
  const chat = chats[0];
  
  // Get participants
  const participantsSql = `
    SELECT h.id
    FROM handle h
    JOIN chat_handle_join chj ON chj.handle_id = h.ROWID
    WHERE chj.chat_id = ${chatId}
  `;
  
  const participants = queryJson<{ id: string }>(participantsSql).map(p => p.id);
  
  // Get messages
  const messagesSql = `
    SELECT 
      m.ROWID as id,
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE COALESCE(h.id, 'Unknown') END as sender,
      m.is_from_me as isFromMe,
      m.text,
      (SELECT COUNT(*) FROM message_attachment_join maj WHERE maj.message_id = m.ROWID) > 0 as hasAttachment
    FROM message m
    JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE cmj.chat_id = ${chatId}
      AND m.text IS NOT NULL
      AND m.text != ''
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;
  
  const messages = queryJson<Message>(messagesSql).reverse();
  
  return {
    id: chat.id,
    chatIdentifier: chat.chatIdentifier,
    displayName: chat.displayName || participants.slice(0, 3).join(", "),
    participants,
    messageCount: messages.length,
    messages
  };
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.id) {
  console.error(JSON.stringify({ error: "Missing required --id argument" }));
  process.exit(1);
}

const groupChat = getGroupChat(
  parseInt(args.id as string, 10),
  args.limit ? parseInt(args.limit as string, 10) : 100
);

if (!groupChat) {
  console.error(JSON.stringify({ error: `Group chat with ID ${args.id} not found` }));
  process.exit(1);
}

console.log(JSON.stringify(groupChat, null, 2));
