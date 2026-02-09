# pi-extensions

Extensions for [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) that hook into the agent lifecycle, override tools, and add capabilities.

## Available Extensions

| Extension | Description |
|-----------|-------------|
| [gondolin](gondolin/) | Sandbox all file and bash operations inside a [Gondolin](https://github.com/earendil-works/gondolin) micro-VM |

## Installation

### Auto-discovery (recommended)

Symlink an extension directory so pi finds it on startup:

```bash
# Global (all projects)
ln -s /path/to/agent-skills/pi-extensions/gondolin ~/.pi/agent/extensions/gondolin

# Project-local
ln -s /path/to/agent-skills/pi-extensions/gondolin .pi/extensions/gondolin
```

### CLI flag

```bash
pi -e /path/to/agent-skills/pi-extensions/gondolin/index.ts
```

### Dependencies

Each extension may have its own dependencies. Install them before use:

```bash
cd pi-extensions/gondolin && pnpm install
```

## Extension Format

Each extension is a directory with:

- `package.json` — must include `"pi": { "extensions": ["./index.ts"] }` for auto-discovery
- `index.ts` — default-exports a factory function `(pi: ExtensionAPI) => void`

See the [pi extension docs](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs/extensions.md) for the full API.
