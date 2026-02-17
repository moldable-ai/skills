#!/usr/bin/env npx tsx
/**
 * List attachments (images, files, voice memos) with optional filters
 * 
 * Usage: npx tsx listAttachments.ts [--contact "email@example.com"] [--type "image|video|audio|document"] [--limit N]
 */

import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString } from "./db.js";

interface Attachment {
  id: number;
  messageId: number;
  date: string;
  contact: string;
  isFromMe: boolean;
  filename: string;
  mimeType: string;
  filePath: string;
  fileSize: number;
  type: string;
}

const TYPE_FILTERS: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/heic", "image/webp", "image/tiff"],
  video: ["video/mp4", "video/quicktime", "video/mov", "video/avi"],
  audio: ["audio/mpeg", "audio/mp3", "audio/m4a", "audio/aac", "audio/wav", "audio/caf"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats", "text/plain", "text/csv"]
};

function categorizeType(mimeType: string): string {
  if (!mimeType) return "unknown";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("text/") || mimeType.includes("document") || mimeType.includes("pdf")) return "document";
  return "other";
}

function listAttachments(options: {
  contact?: string;
  type?: string;
  limit?: number;
}): Attachment[] {
  const { contact, type, limit = 50 } = options;
  
  const conditions: string[] = ["a.filename IS NOT NULL"];
  
  if (contact) {
    conditions.push(`h.id = '${escapeSqlString(contact)}'`);
  }
  
  if (type && TYPE_FILTERS[type]) {
    const mimeTypes = TYPE_FILTERS[type].map(t => `'${t}'`).join(", ");
    conditions.push(`(a.mime_type IN (${mimeTypes}) OR a.mime_type LIKE '${type}/%')`);
  }
  
  const whereClause = conditions.join(" AND ");
  
  const sql = `
    SELECT 
      a.ROWID as id,
      m.ROWID as messageId,
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      h.id as contact,
      m.is_from_me as isFromMe,
      a.filename,
      a.mime_type as mimeType,
      a.filename as filePath,
      a.total_bytes as fileSize
    FROM attachment a
    JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
    JOIN message m ON m.ROWID = maj.message_id
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE ${whereClause}
    ORDER BY m.date DESC
    LIMIT ${limit}
  `;
  
  const results = queryJson<Attachment>(sql);
  
  return results.map(r => ({
    ...r,
    type: categorizeType(r.mimeType)
  }));
}

// Main
const access = checkDatabaseAccess();
if (!access.ok) {
  console.error(JSON.stringify({ error: access.error }));
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

const attachments = listAttachments({
  contact: args.contact as string | undefined,
  type: args.type as string | undefined,
  limit: args.limit ? parseInt(args.limit as string, 10) : 50,
});

console.log(JSON.stringify(attachments, null, 2));
