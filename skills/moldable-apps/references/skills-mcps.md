# Skills and MCPs in Moldable

Skills extend the AI agent's capabilities. MCPs (Model Context Protocol) connect Moldable to external services.

## Skills

Skills are stored in `~/.moldable/shared/skills/` and provide specialized knowledge or executable tools to the AI agent.

### Types of Skills

1. **Instruction-based** (SKILL.md) — Teach the agent domain knowledge
2. **Executable** (bin/) — CLI tools the agent can invoke

### Skill Directory Structure

```
~/.moldable/shared/skills/
├── anthropic-skills/           # Synced from anthropic/skills repo
│   ├── pdf/
│   │   ├── SKILL.md            # Instructions for PDF work
│   │   ├── scripts/            # Python scripts
│   │   └── references/         # Additional docs
│   └── skill-creator/
│       └── SKILL.md
│
├── skills/                     # Other skill repositories
│   └── remotion/
│       ├── SKILL.md
│       └── rules/              # Domain-specific rules
│
└── custom-tools/               # Custom executable skills
    └── translate-text/
        ├── skill.json          # Skill manifest
        ├── package.json
        └── bin/translate.js    # Executable
```

### Instruction-Based Skills (SKILL.md)

These provide context and procedures to the AI:

```markdown
---
name: my-skill
description: When to use this skill. Include specific triggers and use cases.
---

# Skill Name

## When to Use

Use this skill when dealing with X.

## Procedures

1. Step one
2. Step two

## References

See [references/detailed-guide.md](references/detailed-guide.md) for more.
```

### Executable Skills (skill.json)

CLI tools the agent invokes directly:

```json
{
  "name": "translate-text",
  "description": "Translate text between languages",
  "version": "1.0.0",
  "input": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "from": { "type": "string" },
      "to": { "type": "string" }
    }
  }
}
```

**Usage**: `echo '{"text":"Hello","to":"fr"}' | translate-text`

### Managing Skills (Agent Tools)

The AI agent has tools for managing skills:

```
# List all configured skill repositories
listSkillRepos()
// Returns: repositories with name, url, enabled status, installed skills

# List available skills in a repository
listAvailableSkills({ repoName: 'anthropic-skills' })
// Returns: available skills, selected skills, mode

# Add a new skill repository
addSkillRepo({
  url: 'anthropic/skills',       // GitHub owner/repo format
  name: 'anthropic-skills',      // Optional custom name
  mode: 'include',               // 'all', 'include', or 'exclude'
  skills: ['pdf', 'skill-creator']  // Skills to include/exclude
})

# Sync/download skills from a repository
syncSkills({ repoName: 'anthropic-skills' })
// Downloads selected skills to ~/.moldable/shared/skills/

# Update which skills are enabled
updateSkillSelection({
  repoName: 'anthropic-skills',
  mode: 'include',
  skills: ['pdf', 'docx', 'pptx']
})

# Initialize skills configuration with defaults
initSkillsConfig()
```

### Workspace-Specific Skill Enabling

Skills are shared but can be enabled/disabled per workspace:

**Path**: `~/.moldable/workspaces/{workspace-id}/config/skills.json`

```json
{
  "enabledSkills": ["pdf", "remotion", "translate-text"],
  "disabledSkills": ["company-internal-tool"]
}
```

## MCPs (Model Context Protocol)

MCPs connect Moldable to external services and tools. They're defined in `mcp.json`.

### MCP Configuration

**Shared MCPs**: `~/.moldable/shared/config/mcp.json`
**Workspace MCPs**: `~/.moldable/workspaces/{workspace-id}/config/mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/Users/me/Documents"]
    },
    "google-calendar": {
      "type": "http",
      "url": "https://calendar-mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GOOGLE_CALENDAR_TOKEN}"
      }
    },
    "custom-api": {
      "type": "stdio",
      "command": "node",
      "args": ["~/.moldable/shared/mcps/custom-api/server.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

### MCP Types

| Type | Description | Use Case |
|------|-------------|----------|
| `stdio` | Local process via stdin/stdout | Custom servers, CLI wrappers |
| `http` | Remote MCP server via HTTP | SaaS integrations, hosted MCPs |
| `sse` | Server-sent events | Streaming data sources |

### Creating Custom MCP Servers

Custom MCPs live in `~/.moldable/shared/mcps/`:

```
~/.moldable/shared/mcps/
└── my-api/
    ├── server.js       # MCP server implementation
    └── package.json
```

**Example MCP Server (stdio)**:

```javascript
// server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({
  name: 'my-api',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// Define tools
server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'get_data',
    description: 'Fetch data from my API',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      },
      required: ['query']
    }
  }]
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params
  
  if (name === 'get_data') {
    const result = await fetchFromApi(args.query)
    return { content: [{ type: 'text', text: JSON.stringify(result) }] }
  }
  
  throw new Error(`Unknown tool: ${name}`)
})

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)
```

### Managing MCPs

MCPs are typically configured via the **Moldable Settings UI** (not by the AI agent). The agent uses MCPs that are already configured.

**To add an MCP manually**, edit `~/.moldable/shared/config/mcp.json`:

```json
{
  "mcpServers": {
    "my-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["~/.moldable/shared/mcps/my-mcp/server.js"]
    }
  }
}
```

**To create a custom MCP**, the agent can:

1. Create the MCP server code in `~/.moldable/shared/mcps/{name}/`
2. Add the entry to `mcp.json`
3. The desktop will connect on next reload

### Using MCPs from Agent

Once configured, MCPs appear as tools the agent can call. MCP tools are prefixed with the server name:

```
# If you have an MCP called "weather", its tools appear as:
weather__get_forecast({ location: "San Francisco" })
weather__get_current({ location: "New York" })
```

The agent sees all MCP tools in its available tools list and can invoke them directly.

## Environment Variable Interpolation

MCP configs support `${VAR}` syntax for secrets:

```json
{
  "mcpServers": {
    "my-api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

Variables are resolved from:
1. Process environment
2. `~/.moldable/shared/.env`
3. Workspace `.env` overrides

## Agent Tools for Skills/MCPs

The AI agent has these tools available:

| Tool | Description |
|------|-------------|
| `listSkillRepos` | List configured skill repositories |
| `listAvailableSkills` | List skills in a repository |
| `syncSkills` | Download/update skills from repository |
| `addSkillRepo` | Add a new skill repository |
| `updateSkillSelection` | Enable/disable specific skills |
| `initSkillsConfig` | Initialize skills configuration |

## Best Practices

1. **Use shared MCPs** for services used across workspaces
2. **Use workspace MCPs** for context-specific integrations
3. **Store secrets in .env** files, not mcp.json
4. **Test MCP connections** before relying on them
5. **Version your custom MCPs** with package.json
6. **Keep skills focused** — one domain per skill
