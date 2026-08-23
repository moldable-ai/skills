---
name: imessage
description: Legacy iMessage skill migration notice. Use when an older Moldable setup still references the retired script-based iMessage integration.
---

# iMessage moved to Plugins

This legacy script-based integration is retired. Do not recreate or run its old SQLite and AppleScript helpers.

If the iMessage plugin is already installed, stop here and use the `imsg` skill instead.

Ask the user to open **Moldable Settings → Plugins → iMessage** and select **Install**. The plugin installs the official signed `imsg` CLI and enables the current `imsg` skill. After installation, follow that skill and use `imsg status --json` for permission guidance.

Canonical documentation: https://imsg.sh/
