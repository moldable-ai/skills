#!/usr/bin/env npx tsx
/**
 * List iMessage contacts with message counts
 * 
 * Usage: npx tsx listContacts.ts [--limit N]
 */

import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";

interface Contact {
  id: string;
  messageCount: number;
  lastMessageDate: string;
}

function listContacts(limit: number = 50): Contact[] {
  const sql = `
    SELECT 
      h.id,
      COUNT(m.ROWID) as messageCount,
      MAX(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as lastMessageDate
    FROM handle h
    LEFT JOIN message m ON m.handle_id = h.ROWID
    WHERE h.service = 'iMessage'
    GROUP BY h.id
    ORDER BY MAX(m.date) DESC
    LIMIT ${limit}
  `;
  
  return queryJson<Contact>(sql);
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const limit = args.limit ? parseInt(args.limit as string, 10) : 50;

const contacts = listContacts(limit);
console.log(JSON.stringify(contacts, null, 2));
