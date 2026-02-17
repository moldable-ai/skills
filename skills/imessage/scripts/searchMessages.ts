#!/usr/bin/env npx tsx
/**
 * Search iMessages by text content
 * 
 * Usage: npx tsx searchMessages.ts --query "search term" [--contact "email@example.com"] [--limit N] [--from "YYYY-MM-DD"] [--to "YYYY-MM-DD"]
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString, isoToAppleTimestamp } from "./db.js";

interface SearchResult {
  date: string;
  contact: string;
  sender: string;
  isFromMe: boolean;
  text: string;
}

function searchMessages(options: {
  query: string;
  contact?: string;
  limit?: number;
  from?: string;
  to?: string;
}): SearchResult[] {
  const { query, contact, limit = 30, from, to } = options;
  
  const conditions: string[] = [
    "m.text IS NOT NULL",
    `m.text LIKE '%${escapeSqlString(query)}%'`
  ];
  
  if (contact) {
    conditions.push(`h.id = '${escapeSqlString(contact)}'`);
  }
  
  if (from) {
    const timestamp = isoToAppleTimestamp(from);
    conditions.push(`m.date >= ${timestamp}`);
  }
  
  if (to) {
    const timestamp = isoToAppleTimestamp(to + "T23:59:59");
    conditions.push(`m.date <= ${timestamp}`);
  }
  
  const whereClause = conditions.join(" AND ");
  
  const sql = `
    SELECT 
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      h.id as contact,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE h.id END as sender,
      m.is_from_me as isFromMe,
      m.text
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE ${whereClause}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;
  
  return queryJson<SearchResult>(sql);
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.query) {
  console.error(JSON.stringify({ error: "Missing required --query argument" }));
  process.exit(1);
}

const results = searchMessages({
  query: args.query as string,
  contact: args.contact as string | undefined,
  limit: args.limit ? parseInt(args.limit as string, 10) : 30,
  from: args.from as string | undefined,
  to: args.to as string | undefined,
});

console.log(JSON.stringify(results, null, 2));
