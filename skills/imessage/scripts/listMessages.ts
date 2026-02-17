#!/usr/bin/env npx tsx
/**
 * List recent iMessages, optionally filtered by contact or search term
 * 
 * Usage: npx tsx listMessages.ts [--contact "email@example.com"] [--limit N] [--search "term"]
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString } from "./db.js";

interface Message {
  date: string;
  sender: string;
  isFromMe: boolean;
  text: string;
}

function listMessages(options: {
  contact?: string;
  limit?: number;
  search?: string;
}): Message[] {
  const { contact, limit = 20, search } = options;
  
  const conditions: string[] = ["m.text IS NOT NULL", "m.text != ''"];
  
  if (contact) {
    conditions.push(`h.id = '${escapeSqlString(contact)}'`);
  }
  
  if (search) {
    conditions.push(`m.text LIKE '%${escapeSqlString(search)}%'`);
  }
  
  const whereClause = conditions.join(" AND ");
  
  const sql = `
    SELECT 
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE h.id END as sender,
      m.is_from_me as isFromMe,
      m.text
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE ${whereClause}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;
  
  return queryJson<Message>(sql);
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

const messages = listMessages({
  contact: args.contact as string | undefined,
  limit: args.limit ? parseInt(args.limit as string, 10) : 20,
  search: args.search as string | undefined,
});

console.log(JSON.stringify(messages, null, 2));
