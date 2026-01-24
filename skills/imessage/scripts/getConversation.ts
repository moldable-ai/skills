#!/usr/bin/env npx tsx
/**
 * Get full threaded conversation with a contact in chronological order
 * 
 * Usage: npx tsx getConversation.ts --contact "email@example.com" [--limit N] [--before "YYYY-MM-DD"] [--after "YYYY-MM-DD"]
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString, isoToAppleTimestamp } from "./db.js";

interface Message {
  id: number;
  date: string;
  sender: string;
  isFromMe: boolean;
  text: string;
  hasAttachment: boolean;
}

interface Conversation {
  contact: string;
  messageCount: number;
  firstMessageDate: string;
  lastMessageDate: string;
  messages: Message[];
}

function getConversation(options: {
  contact: string;
  limit?: number;
  before?: string;
  after?: string;
}): Conversation {
  const { contact, limit = 100, before, after } = options;
  
  const conditions: string[] = [
    "m.text IS NOT NULL",
    "m.text != ''",
    `h.id = '${escapeSqlString(contact)}'`
  ];
  
  if (before) {
    const timestamp = isoToAppleTimestamp(before + "T23:59:59");
    conditions.push(`m.date <= ${timestamp}`);
  }
  
  if (after) {
    const timestamp = isoToAppleTimestamp(after);
    conditions.push(`m.date >= ${timestamp}`);
  }
  
  const whereClause = conditions.join(" AND ");
  
  // Get messages in reverse order (most recent first) then reverse for chronological
  const sql = `
    SELECT 
      m.ROWID as id,
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE '${escapeSqlString(contact)}' END as sender,
      m.is_from_me as isFromMe,
      m.text,
      (SELECT COUNT(*) FROM message_attachment_join maj WHERE maj.message_id = m.ROWID) > 0 as hasAttachment
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE ${whereClause}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;
  
  const messages = queryJson<Message>(sql).reverse();
  
  // Get conversation stats
  const statsSql = `
    SELECT 
      MIN(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as firstMessageDate,
      MAX(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as lastMessageDate,
      COUNT(*) as totalCount
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE h.id = '${escapeSqlString(contact)}' AND m.text IS NOT NULL AND m.text != ''
  `;
  
  const stats = queryJson<{ firstMessageDate: string; lastMessageDate: string; totalCount: number }>(statsSql)[0];
  
  return {
    contact,
    messageCount: messages.length,
    firstMessageDate: stats?.firstMessageDate || "",
    lastMessageDate: stats?.lastMessageDate || "",
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

if (!args.contact) {
  console.error(JSON.stringify({ error: "Missing required --contact argument" }));
  process.exit(1);
}

const conversation = getConversation({
  contact: args.contact as string,
  limit: args.limit ? parseInt(args.limit as string, 10) : 100,
  before: args.before as string | undefined,
  after: args.after as string | undefined,
});

console.log(JSON.stringify(conversation, null, 2));
