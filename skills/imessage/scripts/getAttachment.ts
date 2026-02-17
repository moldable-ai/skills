#!/usr/bin/env npx tsx
/**
 * Get attachment details and file path by ID
 * 
 * Usage: npx tsx getAttachment.ts --id <attachmentId>
 */

import { checkDatabaseAccess, queryJson, parseArgs } from "./db.js";
import { existsSync } from "fs";
import { homedir } from "os";

interface AttachmentDetail {
  id: number;
  messageId: number;
  date: string;
  contact: string;
  isFromMe: boolean;
  filename: string;
  mimeType: string;
  transferName: string;
  filePath: string;
  resolvedPath: string;
  fileSize: number;
  fileExists: boolean;
  messageText: string;
}

function getAttachment(attachmentId: number): AttachmentDetail | null {
  const sql = `
    SELECT 
      a.ROWID as id,
      m.ROWID as messageId,
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      h.id as contact,
      m.is_from_me as isFromMe,
      a.filename,
      a.mime_type as mimeType,
      a.transfer_name as transferName,
      a.filename as filePath,
      a.total_bytes as fileSize,
      m.text as messageText
    FROM attachment a
    JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
    JOIN message m ON m.ROWID = maj.message_id
    LEFT JOIN handle h ON h.ROWID = m.handle_id
    WHERE a.ROWID = ${attachmentId}
  `;
  
  const results = queryJson<AttachmentDetail>(sql);
  
  if (results.length === 0) {
    return null;
  }
  
  const attachment = results[0];
  
  // Resolve the file path (replace ~ with home directory)
  let resolvedPath = attachment.filePath || "";
  if (resolvedPath.startsWith("~")) {
    resolvedPath = resolvedPath.replace("~", homedir());
  }
  
  return {
    ...attachment,
    resolvedPath,
    fileExists: resolvedPath ? existsSync(resolvedPath) : false
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

const attachment = getAttachment(parseInt(args.id as string, 10));

if (!attachment) {
  console.error(JSON.stringify({ error: `Attachment with ID ${args.id} not found` }));
  process.exit(1);
}

console.log(JSON.stringify(attachment, null, 2));
