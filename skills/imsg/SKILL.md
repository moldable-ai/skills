---
name: imsg
description: iMessage/SMS local history, contacts, live watch, and requested sends.
---

# imsg

`imsg` reads `~/Library/Messages/chat.db` directly and sends through Messages.app automation. Reading is local. Sending, reacting, marking read, typing indicators, and any other chat mutation require an explicit user request. Confirm the recipient, service, and content in the final summary.

The iMessage plugin installs the official signed `imsg` CLI. In Moldable, Full Disk Access must be granted to **Moldable** for message history, and macOS may ask for **Automation → Messages** permission the first time a send is requested. Check setup with `imsg status --json`; do not bypass the plugin with direct database scripts or custom AppleScript.

- If Full Disk Access is missing, guide the user to **System Settings → Privacy & Security → Full Disk Access → Moldable**, then have them quit and relaunch Moldable before retrying.
- Contacts access is optional. Without it, phone numbers and email addresses still work, but resolved names may be empty.

## Ground rules

- Every read command supports `--json` and emits NDJSON (one object per line). Pipe to `jq -s` to get an array. Stdout carries only JSON; progress and warnings go to stderr.
- Two capability tiers:
  - **Standard** (normal permissions): `chats`, `group`, `history`, `watch`, `search`, `send`, `react`, `nickname --local`, `account --local`, and `whois --local`.
  - **Bridge** (SIP disabled plus `imsg launch` dylib injection): `send-rich`, `send-multipart`, `send-attachment`, `send-sticker`, `tapback`, `poll`, `edit`, `unsend`, `delete-message`, `read`, `typing`, `notify-anyways`, `chat-*`, `name-photo`, and default-mode `account`/`whois`/`nickname`.
- Check availability with `imsg status --json` before using bridge commands. If the bridge is down, use a standard command only when it preserves the requested semantics; otherwise stop and explain. Never turn a reply, effect, or subject into a plain send, and never suggest disabling SIP unprompted.
- Treat `imsg completions llm` as the authoritative command and flag reference for the installed version.

## Reading

Resolve a person visible in Messages from `chats`, not `search`. The UI name usually appears as `contact_name`; it does not appear in message-body search results. No search hits is not proof that a contact does not exist.

```bash
imsg status --json
imsg chats --limit 200 --json | jq -s '.[] | select((.contact_name // .display_name // .name // .identifier // "" | ascii_downcase) | contains("beatrix"))'
imsg chats --unread-only --json | jq -s
```

Then inspect and read the chat by row ID:

```bash
imsg group --chat-id ID --json
imsg history --chat-id ID --limit 50 --json | jq -s
imsg history --chat-id ID --start 2025-01-01T00:00:00Z --end 2025-02-01T00:00:00Z --json
imsg stats --chat-id ID --time-zone UTC --media --json
imsg scheduled list --json
```

- Chat `id` is the local `chat.db` row ID and the preferred `--chat-id` handle. `identifier` and `guid` are portable across machines.
- `--start` is inclusive and `--end` is exclusive; both accept ISO 8601 timestamps.
- `--attachments` adds attachment metadata. `--convert-attachments` converts supported media for model consumption.
- `imsg search --query "pizza tonight" --json` searches message bodies only.
- Direct `sqlite3` queries are a last resort because they omit names and other resolution performed by `imsg`.

## Streaming

```bash
imsg watch --chat-id ID --json
imsg watch --since-rowid N --json
```

Message `id` doubles as the watch cursor. Persist the last-seen ID and pass it to `--since-rowid`. Add `--reactions` for tapback events and `--attachments` for attachment metadata.

## Sending (explicit request only)

```bash
imsg send --to "+15551234567" --text "message" --service auto
imsg send --chat-id ID --text "message"
imsg send --to "+15551234567" --file ~/Desktop/pic.jpg
```

- Prefer `--chat-id` for groups so there is no recipient ambiguity.
- `--service auto` prefers iMessage and falls back to SMS for text-only phone sends; `--no-sms-fallback` disables fallback.
- `imsg react --chat-id ID --reaction like` targets only the most recent incoming message and needs Accessibility permission. A GUID-targeted tapback requires the bridge.
- Destructive bridge commands such as `unsend`, `delete-message`, `chat-delete`, `chat-leave`, and `chat-remove-member` require per-action confirmation.

## Advanced bridge features

Only use these after `imsg status --json` confirms the bridge is loaded:

```bash
imsg send-rich --chat 'iMessage;-;+15551234567' --text 'hi' --reply-to MSG_GUID
imsg send-sticker --chat GUID --file ~/Pictures/sticker.png --attach-to MSG_GUID --target-part 0
imsg poll send --chat GUID --question 'Dinner?' --option 'Pizza' --option 'Sushi'
imsg edit --chat GUID --message MSG_GUID --new-text 'updated'
```

See `https://imsg.sh/` for canonical documentation and `imsg completions llm` for the exact installed command surface.
