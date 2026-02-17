#!/usr/bin/env npx tsx
/**
 * Get a single message by ID with full metadata
 * 
 * Usage: npx tsx getMessage.ts --id <messageId>
 */

import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";

interface MessageDetail {
  id: number;
  date: string;
  sender: string;
  isFromMe: boolean;
  text: string;
  contact: string;
  service: string;
  hasAttachment: boolean;
  attachmentCount: number;
  isRead: boolean;
}

function getMessage(messageId: number): MessageDetail | null {
  const sql = `
    SELECT 
      m.ROWID as id,
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE h.id END as sender,
      m.is_from_me as isFromMe,
      m.text,
      h.id as contact,
      h.service,
      (SELECT COUNT(*) FROM message_attachment_join maj WHERE maj.message_id = m.ROWID) as attachmentCount,
      m.is_read as isRead
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE m.ROWID = ${messageId}
  `;
  
  const results = queryJson<MessageDetail>(sql);
  
  if (results.length === 0) {
    return null;
  }
  
  const msg = results[0];
  return {
    ...msg,
    hasAttachment: msg.attachmentCount > 0
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

const message = getMessage(parseInt(args.id as string, 10));

if (!message) {
  console.error(JSON.stringify({ error: `Message with ID ${args.id} not found` }));
  process.exit(1);
}

console.log(JSON.stringify(message, null, 2));
