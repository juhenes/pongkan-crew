# Contributing

Thanks for considering a contribution to Pongkan Crew. Keep changes focused, explain user-visible behavior, and include the checks you ran.

## Before you start

- Check the README and [`docs/COMMANDS.md`](docs/COMMANDS.md) for existing behavior and terminology.
- For substantial changes, open an issue or discussion first so the scope can be agreed.
- Do not include credentials, personal conversation state, or `.pongkan-crew` data in a contribution.
- Only submit material you created or have permission to contribute under this repository's MIT License.

## Local development

Requirements: Node.js 22 or newer and a working Codex CLI installation for live integration checks. The application has no npm runtime dependencies.

```powershell
node --test
node .\scripts\preview-display.js
```

Tests and offline previews do not require a Codex login. Live checks may use your Codex account and should only be run when you intend to make those requests; see the README for details.

## Pull requests

- Describe the problem and the resulting behavior.
- Mention relevant commands and their outcomes; distinguish checks you did not run.
- Update the README or command reference when behavior or usage changes.
- Keep generated output, local state, dependencies, and secrets out of the diff.
