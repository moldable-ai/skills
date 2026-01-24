#!/usr/bin/env npx tsx
/**
 * Get details about a specific contact
 * 
 * Usage: npx tsx getContact.ts --contact "email@example.com"
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString } from "./db.js";

interface ContactDetail {
  id: string;
  service: string;
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  firstMessageDate: string;
  lastMessageDate: string;
  attachmentCount: number;
  avgMessagesPerDay: number;
}

function getContact(contactId: string): ContactDetail | null {
  // Get basic stats
  const statsSql = `
    SELECT 
      h.id,
      h.service,
      COUNT(m.ROWID) as totalMessages,
      SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as messagesSent,
      SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as messagesReceived,
      MIN(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as firstMessageDate,
      MAX(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as lastMessageDate
    FROM handle h
    LEFT JOIN message m ON m.handle_id = h.ROWID
    WHERE h.id = '${escapeSqlString(contactId)}'
    GROUP BY h.ROWID
  `;
  
  const stats = queryJson<{
    id: string;
    service: string;
    totalMessages: number;
    messagesSent: number;
    messagesReceived: number;
    firstMessageDate: string;
    lastMessageDate: string;
  }>(statsSql);
  
  if (stats.length === 0) {
    return null;
  }
  
  const s = stats[0];
  
  // Get attachment count
  const attachmentSql = `
    SELECT COUNT(*) as count
    FROM message_attachment_join maj
    JOIN message m ON m.ROWID = maj.message_id
    JOIN handle h ON h.ROWID = m.handle_id
    WHERE h.id = '${escapeSqlString(contactId)}'
  `;
  
  const attachments = queryJson<{ count: number }>(attachmentSql);
  const attachmentCount = attachments[0]?.count || 0;
  
  // Calculate avg messages per day
  const firstDate = new Date(s.firstMessageDate);
  const lastDate = new Date(s.lastMessageDate);
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgMessagesPerDay = Math.round((s.totalMessages / daysDiff) * 100) / 100;
  
  return {
    id: s.id,
    service: s.service,
    totalMessages: s.totalMessages,
    messagesSent: s.messagesSent,
    messagesReceived: s.messagesReceived,
    firstMessageDate: s.firstMessageDate,
    lastMessageDate: s.lastMessageDate,
    attachmentCount,
    avgMessagesPerDay
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

const contact = getContact(args.contact as string);

if (!contact) {
  console.error(JSON.stringify({ error: `Contact "${args.contact}" not found` }));
  process.exit(1);
}

console.log(JSON.stringify(contact, null, 2));
