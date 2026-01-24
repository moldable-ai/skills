#!/usr/bin/env npx tsx
/**
 * Export a conversation to JSON, Markdown, or plain text
 * 
 * Usage: npx tsx exportConversation.ts --contact "email@example.com" [--format json|markdown|text] [--output "/path/to/file"] [--limit N]
 */

import { writeFileSync } from "fs";
import { checkDatabaseAccess, queryJson, parseArgs, escapeSqlString } from "./db.js";

interface Message {
  date: string;
  sender: string;
  isFromMe: boolean;
  text: string;
}

interface ExportResult {
  success: boolean;
  contact: string;
  format: string;
  messageCount: number;
  outputPath?: string;
  content?: string;
  error?: string;
}

function getMessages(contact: string, limit: number): Message[] {
  const sql = `
    SELECT 
      datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date,
      CASE WHEN m.is_from_me = 1 THEN 'Me' ELSE '${escapeSqlString(contact)}' END as sender,
      m.is_from_me as isFromMe,
      m.text
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE h.id = '${escapeSqlString(contact)}'
      AND m.text IS NOT NULL
      AND m.text != ''
    ORDER BY m.date ASC
    LIMIT ${limit}
  `;
  
  return queryJson<Message>(sql);
}

function formatAsJson(contact: string, messages: Message[]): string {
  return JSON.stringify({
    contact,
    exportDate: new Date().toISOString(),
    messageCount: messages.length,
    messages
  }, null, 2);
}

function formatAsMarkdown(contact: string, messages: Message[]): string {
  const lines: string[] = [
    `# Conversation with ${contact}`,
    "",
    `*Exported on ${new Date().toLocaleString()}*`,
    "",
    `**Total messages:** ${messages.length}`,
    "",
    "---",
    ""
  ];
  
  let currentDate = "";
  
  for (const msg of messages) {
    const msgDate = msg.date.split(" ")[0];
    
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      lines.push(`## ${msgDate}`, "");
    }
    
    const time = msg.date.split(" ")[1];
    const sender = msg.isFromMe ? "**Me**" : `**${msg.sender}**`;
    const text = msg.text.replace(/\n/g, "\n> ");
    
    lines.push(`${time} ${sender}:`, `> ${text}`, "");
  }
  
  return lines.join("\n");
}

function formatAsText(contact: string, messages: Message[]): string {
  const lines: string[] = [
    `Conversation with ${contact}`,
    `Exported on ${new Date().toLocaleString()}`,
    `Total messages: ${messages.length}`,
    "",
    "=".repeat(50),
    ""
  ];
  
  let currentDate = "";
  
  for (const msg of messages) {
    const msgDate = msg.date.split(" ")[0];
    
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      lines.push("", `----- ${msgDate} -----`, "");
    }
    
    const time = msg.date.split(" ")[1];
    const sender = msg.isFromMe ? "Me" : msg.sender;
    
    lines.push(`[${time}] ${sender}: ${msg.text}`);
  }
  
  return lines.join("\n");
}

function exportConversation(options: {
  contact: string;
  format?: string;
  output?: string;
  limit?: number;
}): ExportResult {
  const { contact, format = "json", output, limit = 10000 } = options;
  
  const messages = getMessages(contact, limit);
  
  if (messages.length === 0) {
    return {
      success: false,
      contact,
      format,
      messageCount: 0,
      error: `No messages found for contact "${contact}"`
    };
  }
  
  let content: string;
  
  switch (format.toLowerCase()) {
    case "markdown":
    case "md":
      content = formatAsMarkdown(contact, messages);
      break;
    case "text":
    case "txt":
      content = formatAsText(contact, messages);
      break;
    case "json":
    default:
      content = formatAsJson(contact, messages);
      break;
  }
  
  if (output) {
    try {
      writeFileSync(output, content, "utf-8");
      return {
        success: true,
        contact,
        format,
        messageCount: messages.length,
        outputPath: output
      };
    } catch (e: any) {
      return {
        success: false,
        contact,
        format,
        messageCount: messages.length,
        error: `Failed to write file: ${e.message}`
      };
    }
  }
  
  return {
    success: true,
    contact,
    format,
    messageCount: messages.length,
    content
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

const result = exportConversation({
  contact: args.contact as string,
  format: args.format as string | undefined,
  output: args.output as string | undefined,
  limit: args.limit ? parseInt(args.limit as string, 10) : 10000
});

// If content is included and no output file, print just the content
if (result.success && result.content && !args.output) {
  console.log(result.content);
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.success) {
  process.exit(1);
}
