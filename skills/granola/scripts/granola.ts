#!/usr/bin/env -S npx -y tsx
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type PatternType = "topics" | "participants" | "frequency";

interface MeetingMetadata {
  id: string;
  title: string;
  date: Date;
  duration?: number;
  participants: string[];
  meetingType?: string;
  platform?: string;
}

interface MeetingDocument {
  id: string;
  meetingId: string;
  title: string;
  content: string;
  documentType: string;
  createdAt: Date;
  tags: string[];
}

interface MeetingTranscript {
  meetingId: string;
  content: string;
  speakers: string[];
  language?: string;
  confidence?: number;
}

interface CacheData {
  meetings: Record<string, MeetingMetadata>;
  documents: Record<string, MeetingDocument>;
  transcripts: Record<string, MeetingTranscript>;
  lastUpdated?: Date;
}

const DEFAULT_CACHE_PATH = "~/Library/Application Support/Granola/cache-v3.json";
const TOPIC_STOP_WORDS = new Set(["meeting", "call", "sync", "with"]);

function usage(exitCode = 2): never {
  console.error(`Usage:
  granola.ts search-meetings --query <text> [--limit N] [--cache-path <path>] [--timezone <tz>] [--no-panels] [--json]
  granola.ts get-meeting-details --meeting-id <id> [--cache-path <path>] [--timezone <tz>] [--no-panels] [--json]
  granola.ts get-meeting-transcript --meeting-id <id> [--cache-path <path>] [--timezone <tz>] [--no-panels] [--json]
  granola.ts get-meeting-documents --meeting-id <id> [--cache-path <path>] [--timezone <tz>] [--no-panels] [--json]
  granola.ts analyze-meeting-patterns --pattern-type topics|participants|frequency [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--cache-path <path>] [--timezone <tz>] [--no-panels] [--json]

Aliases:
  search_meetings, get_meeting_details, get_meeting_transcript,
  get_meeting_documents, analyze_meeting_patterns
`);
  process.exit(exitCode);
}

function expandHome(pathValue: string): string {
  if (pathValue === "~") return homedir();
  if (pathValue.startsWith("~/")) return join(homedir(), pathValue.slice(2));
  return pathValue;
}

function normalizeCommand(input: string): string {
  return input.trim().toLowerCase().replaceAll("_", "-");
}

function parseIsoDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

function parseRangeDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return parsed;
}

function formatLocalTime(date: Date, timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const byType: Record<string, string> = {};
  for (const part of parts) byType[part.type] = part.value;
  return `${byType.year}-${byType.month}-${byType.day} ${byType.hour}:${byType.minute}`;
}

function extractStructuredNotes(notesData: unknown): string {
  function extract(content: unknown): string[] {
    const out: string[] = [];
    if (!Array.isArray(content)) return out;
    for (const item of content) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      if (entry.type === "paragraph" && Array.isArray(entry.content)) {
        out.push(extract(entry.content).join(" "));
        continue;
      }
      if (entry.type === "text" && typeof entry.text === "string") {
        out.push(entry.text);
        continue;
      }
      if (Array.isArray(entry.content)) {
        out.push(extract(entry.content).join(" "));
      }
    }
    return out;
  }

  if (!notesData || typeof notesData !== "object") return "";
  const notes = notesData as Record<string, unknown>;
  if (!Array.isArray(notes.content)) return "";
  return extract(notes.content).join(" ").trim();
}

function extractDocumentPanelContent(panelData: unknown): string {
  if (!panelData) return "";
  const textParts: string[] = [];

  function walk(node: unknown) {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    if (record.type === "text" && typeof record.text === "string" && record.text.trim()) {
      textParts.push(record.text.trim());
    }
    if (record.content !== undefined) {
      walk(record.content);
    }
  }

  if (Array.isArray(panelData)) {
    for (const panel of panelData) walk(panel);
  } else if (panelData && typeof panelData === "object") {
    const panels = panelData as Record<string, unknown>;
    for (const panelId of Object.keys(panels).sort()) {
      const panel = panels[panelId];
      if (panel && typeof panel === "object") {
        walk((panel as Record<string, unknown>).content);
      }
    }
  }

  return textParts.join("\n\n").trim();
}

function parseCacheData(rawData: Record<string, unknown>, parsePanels: boolean): CacheData {
  const cacheData: CacheData = { meetings: {}, documents: {}, transcripts: {} };

  const rawDocuments =
    rawData.documents && typeof rawData.documents === "object"
      ? (rawData.documents as Record<string, unknown>)
      : {};

  for (const [meetingId, meetingRaw] of Object.entries(rawDocuments)) {
    if (!meetingRaw || typeof meetingRaw !== "object") continue;
    const meetingData = meetingRaw as Record<string, unknown>;

    const people = Array.isArray(meetingData.people) ? meetingData.people : [];
    const participants = people
      .map((person) => {
        if (!person || typeof person !== "object") return "";
        const name = (person as Record<string, unknown>).name;
        return typeof name === "string" ? name : "";
      })
      .filter((name) => name.trim().length > 0);

    let meetingDate = new Date();
    if (typeof meetingData.created_at === "string" && meetingData.created_at.trim()) {
      try {
        meetingDate = parseIsoDate(meetingData.created_at.replace(/Z$/, "+00:00"));
      } catch {
        // Keep fallback.
      }
    }

    cacheData.meetings[meetingId] = {
      id: meetingId,
      title: typeof meetingData.title === "string" && meetingData.title.trim()
        ? meetingData.title
        : "Untitled Meeting",
      date: meetingDate,
      duration: undefined,
      participants,
      meetingType: typeof meetingData.type === "string" ? meetingData.type : "meeting",
      platform: undefined,
    };
  }

  const rawTranscripts =
    rawData.transcripts && typeof rawData.transcripts === "object"
      ? (rawData.transcripts as Record<string, unknown>)
      : {};
  for (const [transcriptId, transcriptRaw] of Object.entries(rawTranscripts)) {
    const contentParts: string[] = [];
    const speakers = new Set<string>();

    if (Array.isArray(transcriptRaw)) {
      for (const segment of transcriptRaw) {
        if (!segment || typeof segment !== "object") continue;
        const seg = segment as Record<string, unknown>;
        if (typeof seg.text === "string" && seg.text.trim()) {
          contentParts.push(seg.text.trim());
        }
        if (typeof seg.source === "string" && seg.source.trim()) {
          speakers.add(seg.source.trim());
        }
      }
    } else if (transcriptRaw && typeof transcriptRaw === "object") {
      const transcriptData = transcriptRaw as Record<string, unknown>;
      const contentCandidate = ["content", "text", "transcript"]
        .map((k) => transcriptData[k])
        .find((v) => typeof v === "string" && v.trim());
      if (typeof contentCandidate === "string") {
        contentParts.push(contentCandidate);
      }
      if (Array.isArray(transcriptData.speakers)) {
        for (const speaker of transcriptData.speakers) {
          if (typeof speaker === "string" && speaker.trim()) {
            speakers.add(speaker.trim());
          }
        }
      }
    }

    if (contentParts.length > 0) {
      cacheData.transcripts[transcriptId] = {
        meetingId: transcriptId,
        content: contentParts.join(" ").trim(),
        speakers: Array.from(speakers),
        language: undefined,
        confidence: undefined,
      };
    }
  }

  const documentPanels =
    rawData.documentPanels && typeof rawData.documentPanels === "object"
      ? (rawData.documentPanels as Record<string, unknown>)
      : {};

  for (const [docId, docRaw] of Object.entries(rawDocuments)) {
    if (!docRaw || typeof docRaw !== "object") continue;
    const docData = docRaw as Record<string, unknown>;
    const contentParts: string[] = [];

    if (typeof docData.notes_plain === "string" && docData.notes_plain.trim()) {
      contentParts.push(docData.notes_plain);
    } else if (typeof docData.notes_markdown === "string" && docData.notes_markdown.trim()) {
      contentParts.push(docData.notes_markdown);
    } else if (docData.notes && typeof docData.notes === "object") {
      const structured = extractStructuredNotes(docData.notes);
      if (structured) contentParts.push(structured);
    }

    const hasContent = contentParts.some((item) => item.trim().length > 0);
    if (parsePanels && !hasContent) {
      const panelText = extractDocumentPanelContent(documentPanels[docId]);
      if (panelText) contentParts.push(panelText);
    }

    if (typeof docData.overview === "string" && docData.overview.trim()) {
      contentParts.push(`Overview: ${docData.overview}`);
    }
    if (typeof docData.summary === "string" && docData.summary.trim()) {
      contentParts.push(`Summary: ${docData.summary}`);
    }

    if (!cacheData.meetings[docId]) continue;
    const meeting = cacheData.meetings[docId];
    cacheData.documents[docId] = {
      id: docId,
      meetingId: docId,
      title: meeting.title,
      content: contentParts.join("\n\n").trim(),
      documentType: "meeting_notes",
      createdAt: meeting.date,
      tags: [],
    };
  }

  cacheData.lastUpdated = new Date();
  return cacheData;
}

function loadCache(cachePathInput: string, parsePanels: boolean): CacheData {
  const cachePath = expandHome(cachePathInput);
  if (!existsSync(cachePath)) {
    return { meetings: {}, documents: {}, transcripts: {}, lastUpdated: new Date() };
  }

  const rawFile = readFileSync(cachePath, "utf8");
  let rawData = JSON.parse(rawFile) as Record<string, unknown>;
  if (typeof rawData.cache === "string") {
    const nested = JSON.parse(rawData.cache) as Record<string, unknown>;
    rawData = nested.state && typeof nested.state === "object"
      ? (nested.state as Record<string, unknown>)
      : nested;
  }
  return parseCacheData(rawData, parsePanels);
}

function searchMeetings(data: CacheData, query: string, limit: number) {
  const queryLower = query.toLowerCase();
  const scored: Array<{ score: number; meeting: MeetingMetadata }> = [];

  for (const [meetingId, meeting] of Object.entries(data.meetings)) {
    let score = 0;
    if (meeting.title.toLowerCase().includes(queryLower)) score += 2;
    for (const participant of meeting.participants) {
      if (participant.toLowerCase().includes(queryLower)) score += 1;
    }
    const transcript = data.transcripts[meetingId];
    if (transcript && transcript.content.toLowerCase().includes(queryLower)) score += 1;
    if (score > 0) scored.push({ score, meeting });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(0, limit));
}

function parseDateRange(startDateRaw?: string, endDateRaw?: string): { start: Date; end: Date } | null {
  if (!startDateRaw && !endDateRaw) return null;
  const start = parseRangeDate(startDateRaw || "1900-01-01");
  const end = parseRangeDate(endDateRaw || "2100-01-01");
  return { start, end };
}

function analyzeParticipantPatterns(meetings: MeetingMetadata[]) {
  const counts: Record<string, number> = {};
  for (const meeting of meetings) {
    for (const participant of meeting.participants) {
      counts[participant] = (counts[participant] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    meetingCount: meetings.length,
    topParticipants: sorted.map(([name, count]) => ({ name, count })),
  };
}

function analyzeFrequencyPatterns(meetings: MeetingMetadata[]) {
  const byMonth: Record<string, number> = {};
  for (const meeting of meetings) {
    const y = meeting.date.getUTCFullYear();
    const m = String(meeting.date.getUTCMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  const monthCount = Object.keys(byMonth).length;
  return {
    meetingCount: meetings.length,
    byMonth,
    averagePerMonth: monthCount > 0 ? meetings.length / monthCount : 0,
  };
}

function analyzeTopicPatterns(meetings: MeetingMetadata[]) {
  const counts: Record<string, number> = {};
  for (const meeting of meetings) {
    const words = meeting.title.toLowerCase().split(/\s+/);
    for (const rawWord of words) {
      const word = rawWord.replace(/[^a-z0-9_-]/g, "");
      if (word.length <= 3) continue;
      if (TOPIC_STOP_WORDS.has(word)) continue;
      counts[word] = (counts[word] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    meetingCount: meetings.length,
    topics: sorted.map(([topic, count]) => ({ topic, count })),
  };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) usage(0);

  const command = normalizeCommand(argv.shift() as string);
  let jsonOutput = false;
  let parsePanels = true;

  function takeFlag(flag: string): boolean {
    const idx = argv.indexOf(flag);
    if (idx === -1) return false;
    argv.splice(idx, 1);
    return true;
  }

  if (takeFlag("--json")) jsonOutput = true;
  if (takeFlag("--no-panels")) parsePanels = false;

  const argsMap: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const v = argv[i + 1];
    if (!a.startsWith("--")) throw new Error(`Unexpected argument: ${a}`);
    if (!v || v.startsWith("--")) throw new Error(`Missing value for ${a}`);
    argsMap[a.slice(2)] = v;
    i += 1;
  }

  const cachePath = argsMap["cache-path"] || DEFAULT_CACHE_PATH;
  const timezone = argsMap.timezone || undefined;
  const data = loadCache(cachePath, parsePanels);

  if (command === "search-meetings") {
    const query = argsMap.query || "";
    const limit = argsMap.limit ? Number(argsMap.limit) : 10;
    if (!query) throw new Error("--query is required");
    if (Number.isNaN(limit) || limit <= 0) throw new Error("--limit must be a positive number");

    const results = searchMeetings(data, query, limit);
    if (jsonOutput) {
      process.stdout.write(
        JSON.stringify({
          query,
          count: results.length,
          results: results.map((r) => ({
            score: r.score,
            id: r.meeting.id,
            title: r.meeting.title,
            date: r.meeting.date.toISOString(),
            participants: r.meeting.participants,
          })),
        })
      );
      return;
    }

    if (results.length === 0) {
      process.stdout.write(`No meetings found matching '${query}'\n`);
      return;
    }

    process.stdout.write(`Found ${results.length} meeting(s) matching '${query}':\n\n`);
    for (const { meeting } of results) {
      process.stdout.write(`- ${meeting.title} (${meeting.id})\n`);
      process.stdout.write(`  Date: ${formatLocalTime(meeting.date, timezone)}\n`);
      if (meeting.participants.length > 0) {
        process.stdout.write(`  Participants: ${meeting.participants.join(", ")}\n`);
      }
      process.stdout.write("\n");
    }
    return;
  }

  if (command === "get-meeting-details") {
    const meetingId = argsMap["meeting-id"] || "";
    if (!meetingId) throw new Error("--meeting-id is required");
    const meeting = data.meetings[meetingId];
    if (!meeting) {
      const msg = `Meeting '${meetingId}' not found`;
      if (jsonOutput) process.stdout.write(JSON.stringify({ error: msg }));
      else process.stdout.write(`${msg}\n`);
      return;
    }

    const docCount = Object.values(data.documents).filter((doc) => doc.meetingId === meetingId).length;
    const payload = {
      id: meeting.id,
      title: meeting.title,
      date: meeting.date.toISOString(),
      participants: meeting.participants,
      meetingType: meeting.meetingType,
      platform: meeting.platform,
      duration: meeting.duration,
      documents: docCount,
      transcriptAvailable: Boolean(data.transcripts[meetingId]),
    };

    if (jsonOutput) {
      process.stdout.write(JSON.stringify(payload));
      return;
    }

    process.stdout.write(`# Meeting Details: ${meeting.title}\n\n`);
    process.stdout.write(`ID: ${meeting.id}\n`);
    process.stdout.write(`Date: ${formatLocalTime(meeting.date, timezone)}\n`);
    if (meeting.duration) process.stdout.write(`Duration: ${meeting.duration} minutes\n`);
    if (meeting.participants.length > 0) process.stdout.write(`Participants: ${meeting.participants.join(", ")}\n`);
    if (meeting.meetingType) process.stdout.write(`Type: ${meeting.meetingType}\n`);
    if (meeting.platform) process.stdout.write(`Platform: ${meeting.platform}\n`);
    if (docCount > 0) process.stdout.write(`Documents: ${docCount}\n`);
    if (data.transcripts[meetingId]) process.stdout.write("Transcript: Available\n");
    return;
  }

  if (command === "get-meeting-transcript") {
    const meetingId = argsMap["meeting-id"] || "";
    if (!meetingId) throw new Error("--meeting-id is required");
    const transcript = data.transcripts[meetingId];
    if (!transcript) {
      const msg = `No transcript available for meeting '${meetingId}'`;
      if (jsonOutput) process.stdout.write(JSON.stringify({ error: msg }));
      else process.stdout.write(`${msg}\n`);
      return;
    }

    const meeting = data.meetings[meetingId];
    const payload = {
      meetingId,
      title: meeting?.title || meetingId,
      speakers: transcript.speakers,
      language: transcript.language,
      confidence: transcript.confidence,
      content: transcript.content,
    };

    if (jsonOutput) {
      process.stdout.write(JSON.stringify(payload));
      return;
    }

    process.stdout.write(`# Transcript: ${meeting?.title || meetingId}\n\n`);
    if (transcript.speakers.length > 0) {
      process.stdout.write(`Speakers: ${transcript.speakers.join(", ")}\n`);
    }
    if (transcript.language) process.stdout.write(`Language: ${transcript.language}\n`);
    if (typeof transcript.confidence === "number") {
      process.stdout.write(`Confidence: ${(transcript.confidence * 100).toFixed(2)}%\n`);
    }
    process.stdout.write("\n## Transcript Content\n\n");
    process.stdout.write(`${transcript.content}\n`);
    return;
  }

  if (command === "get-meeting-documents") {
    const meetingId = argsMap["meeting-id"] || "";
    if (!meetingId) throw new Error("--meeting-id is required");

    const documents = Object.values(data.documents).filter((doc) => doc.meetingId === meetingId);
    if (documents.length === 0) {
      const msg = `No documents found for meeting '${meetingId}'`;
      if (jsonOutput) process.stdout.write(JSON.stringify({ error: msg }));
      else process.stdout.write(`${msg}\n`);
      return;
    }

    if (jsonOutput) {
      process.stdout.write(
        JSON.stringify({
          meetingId,
          title: data.meetings[meetingId]?.title || meetingId,
          count: documents.length,
          documents: documents.map((doc) => ({
            id: doc.id,
            meetingId: doc.meetingId,
            title: doc.title,
            type: doc.documentType,
            createdAt: doc.createdAt.toISOString(),
            tags: doc.tags,
            content: doc.content,
          })),
        })
      );
      return;
    }

    process.stdout.write(`# Documents: ${data.meetings[meetingId]?.title || meetingId}\n\n`);
    process.stdout.write(`Found ${documents.length} document(s):\n\n`);
    for (const doc of documents) {
      process.stdout.write(`## ${doc.title}\n`);
      process.stdout.write(`Type: ${doc.documentType}\n`);
      process.stdout.write(`Created: ${formatLocalTime(doc.createdAt, timezone)}\n`);
      if (doc.tags.length > 0) process.stdout.write(`Tags: ${doc.tags.join(", ")}\n`);
      process.stdout.write(`\n${doc.content}\n\n---\n\n`);
    }
    return;
  }

  if (command === "analyze-meeting-patterns") {
    const patternTypeRaw = argsMap["pattern-type"] || "";
    if (!patternTypeRaw) throw new Error("--pattern-type is required");
    if (!["participants", "frequency", "topics"].includes(patternTypeRaw)) {
      throw new Error("--pattern-type must be one of: topics, participants, frequency");
    }
    const patternType = patternTypeRaw as PatternType;

    const range = parseDateRange(argsMap["start-date"], argsMap["end-date"]);
    const meetings = Object.values(data.meetings).filter((meeting) => {
      if (!range) return true;
      return meeting.date >= range.start && meeting.date <= range.end;
    });

    if (patternType === "participants") {
      const analysis = analyzeParticipantPatterns(meetings);
      if (jsonOutput) {
        process.stdout.write(JSON.stringify(analysis));
        return;
      }
      if (analysis.topParticipants.length === 0) {
        process.stdout.write("No participant data found\n");
        return;
      }
      process.stdout.write(`# Participant Analysis (${analysis.meetingCount} meetings)\n\n`);
      process.stdout.write("## Most Active Participants\n\n");
      for (const participant of analysis.topParticipants.slice(0, 10)) {
        process.stdout.write(`- ${participant.name}: ${participant.count} meetings\n`);
      }
      return;
    }

    if (patternType === "frequency") {
      const analysis = analyzeFrequencyPatterns(meetings);
      if (jsonOutput) {
        process.stdout.write(JSON.stringify(analysis));
        return;
      }
      if (analysis.meetingCount === 0) {
        process.stdout.write("No meetings found for analysis\n");
        return;
      }
      process.stdout.write(`# Meeting Frequency Analysis (${analysis.meetingCount} meetings)\n\n`);
      process.stdout.write("## Meetings by Month\n\n");
      for (const [month, count] of Object.entries(analysis.byMonth).sort((a, b) => a[0].localeCompare(b[0]))) {
        process.stdout.write(`- ${month}: ${count} meetings\n`);
      }
      process.stdout.write(`\nAverage per month: ${analysis.averagePerMonth.toFixed(1)}\n`);
      return;
    }

    const analysis = analyzeTopicPatterns(meetings);
    if (jsonOutput) {
      process.stdout.write(JSON.stringify(analysis));
      return;
    }
    if (analysis.topics.length === 0) {
      process.stdout.write("No significant topics found in meeting titles\n");
      return;
    }
    process.stdout.write(`# Topic Analysis (${analysis.meetingCount} meetings)\n\n`);
    process.stdout.write("## Most Common Topics (from titles)\n\n");
    for (const topic of analysis.topics.slice(0, 15)) {
      process.stdout.write(`- ${topic.topic}: ${topic.count} mentions\n`);
    }
    return;
  }

  usage();
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
