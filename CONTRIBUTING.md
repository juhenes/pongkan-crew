# Contributing

Keep changes focused, explain their effect, and report your checks.

## Before you start

- Read the [README](README.md) and [command reference](docs/COMMANDS.md).
- Discuss substantial changes in an issue first.
- Exclude credentials and `.pongkan-crew` conversation data.
- Submit only material you may contribute under the MIT License.

## Local development

Use Node.js 22 or newer. No npm runtime dependencies are needed.

```powershell
node --test
node .\scripts\preview-display.js
```

These checks run offline. Optional [live checks](README.md#development-checks) require Codex CLI and use your signed-in account.

## Pull requests

- Explain the problem and resulting behavior.
- Report check results and anything not checked.
- Update usage docs when behavior changes.
- Exclude generated output, local state, installed dependencies, and secrets.
