#!/usr/bin/env npx tsx
/**
 * Get message statistics and insights
 * 
 * Usage: npx tsx getStats.ts [--contact "email@example.com"] [--year YYYY]
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString } from "./db.js";

interface Stats {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  totalContacts: number;
  totalAttachments: number;
  firstMessageDate: string;
  lastMessageDate: string;
  topContacts: { contact: string; count: number }[];
  messagesByMonth: { month: string; count: number }[];
  messagesByDayOfWeek: { day: string; count: number }[];
  averageMessagesPerDay: number;
  longestStreak: number;
}

function getStats(options: { contact?: string; year?: number }): Stats {
  const { contact, year } = options;
  
  let whereClause = "m.text IS NOT NULL";
  if (contact) {
    whereClause += ` AND h.id = '${escapeSqlString(contact)}'`;
  }
  if (year) {
    whereClause += ` AND strftime('%Y', datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) = '${year}'`;
  }
  
  // Basic stats
  const basicSql = `
    SELECT 
      COUNT(*) as totalMessages,
      SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as messagesSent,
      SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as messagesReceived,
      MIN(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as firstMessageDate,
      MAX(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as lastMessageDate
    FROM message m
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
  `;
  
  const basic = queryJson<{
    totalMessages: number;
    messagesSent: number;
    messagesReceived: number;
    firstMessageDate: string;
    lastMessageDate: string;
  }>(basicSql)[0];
  
  // Contact count
  const contactCountSql = `
    SELECT COUNT(DISTINCT h.id) as count
    FROM handle h
    JOIN message m ON m.handle_id = h.ROWID
    WHERE ${whereClause}
  `;
  const totalContacts = queryJson<{ count: number }>(contactCountSql)[0]?.count || 0;
  
  // Attachment count
  const attachmentSql = `
    SELECT COUNT(*) as count
    FROM attachment a
    JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
    JOIN message m ON m.ROWID = maj.message_id
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause.replace("m.text IS NOT NULL", "1=1")}
  `;
  const totalAttachments = queryJson<{ count: number }>(attachmentSql)[0]?.count || 0;
  
  // Top contacts
  const topContactsSql = `
    SELECT h.id as contact, COUNT(*) as count
    FROM message m
    JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
    GROUP BY h.id
    ORDER BY count DESC
    LIMIT 10
  `;
  const topContacts = queryJson<{ contact: string; count: number }>(topContactsSql);
  
  // Messages by month
  const byMonthSql = `
    SELECT 
      strftime('%Y-%m', datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as month,
      COUNT(*) as count
    FROM message m
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;
  const messagesByMonth = queryJson<{ month: string; count: number }>(byMonthSql).reverse();
  
  // Messages by day of week
  const byDayOfWeekSql = `
    SELECT 
      CASE strftime('%w', datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime'))
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
      END as day,
      COUNT(*) as count
    FROM message m
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
    GROUP BY strftime('%w', datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime'))
    ORDER BY strftime('%w', datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime'))
  `;
  const messagesByDayOfWeek = queryJson<{ day: string; count: number }>(byDayOfWeekSql);
  
  // Calculate average messages per day
  const firstDate = new Date(basic.firstMessageDate);
  const lastDate = new Date(basic.lastMessageDate);
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageMessagesPerDay = Math.round((basic.totalMessages / daysDiff) * 100) / 100;
  
  // Longest streak (consecutive days with messages)
  const streakSql = `
    SELECT date(datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime')) as day
    FROM message m
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
    GROUP BY day
    ORDER BY day
  `;
  const days = queryJson<{ day: string }>(streakSql).map(d => d.day);
  
  let longestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < days.length; i++) {
    const prevDate = new Date(days[i - 1]);
    const currDate = new Date(days[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  
  return {
    totalMessages: basic.totalMessages,
    messagesSent: basic.messagesSent,
    messagesReceived: basic.messagesReceived,
    totalContacts,
    totalAttachments,
    firstMessageDate: basic.firstMessageDate,
    lastMessageDate: basic.lastMessageDate,
    topContacts,
    messagesByMonth,
    messagesByDayOfWeek,
    averageMessagesPerDay,
    longestStreak
  };
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

const stats = getStats({
  contact: args.contact as string | undefined,
  year: args.year ? parseInt(args.year as string, 10) : undefined
});

console.log(JSON.stringify(stats, null, 2));
