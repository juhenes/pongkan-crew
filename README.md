# Pongkan Crew

[Command reference](docs/COMMANDS.md) · [Todo website walkthrough](docs/TODO_WEBSITE_WALKTHROUGH.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE)

Pongkan Crew runs named Codex teammates from a terminal. Chat with one teammate, ask the lead to coordinate a task, and follow the work in Activity. Each target folder has its own crew, conversations, and task history.

## Quick start

You need Node.js 22 or newer, the Codex CLI, and a signed-in Codex account. From the Pongkan Crew repository, run:

```powershell
node --version
codex --version
codex login
node .\src\cli.js
```

No `npm install` is needed. The default target is the current folder. To work on another existing project, pass its path:

```powershell
node .\src\cli.js --folder "C:\Projects\My Project"
```

Inside the CLI, use `/folder` to confirm the target. Enter `?` or `/help` for command help; press Ctrl+C to stop work and exit.

## Give the crew work

Plain text in Chat goes to the selected teammate. For example:

```text
/chat researcher
Explain this project's structure.
```

Use `/task GOAL` to let the lead plan assignments, arrange an independent review, and summarize results:

```text
/task Improve the README, check the instructions, and review the changes.
```

For the full command list and examples, see the [command reference](docs/COMMANDS.md).

## Choose a crew

The default crew is Chief, Researcher, Developer, and Reviewer. Built-in presets add specialists for web, mobile, social, or content work. Preview and apply a preset with:

```text
/preset list
/preset show web
/preset apply web
```

Applying a preset archives the current crew and starts fresh conversations; it preserves project files and task history. Finish or cancel active work first. Use `/undo` to restore the previous crew. Use `/roles list` and `/crew add NAME --role ROLE` to add a specialist without replacing your crew. The command reference explains access and preset behavior.

## Chat, Crew Chat, and Activity

Chat is a direct conversation with one teammate. Crew Chat is for shared read-only discussions. Activity follows work across the team. Switch views with F2; use Tab to cycle teammates and Crew Chat. PgUp/PgDn scroll while work continues.

### Task workflows and Crew Chat are separate

`/task GOAL` asks the lead to plan sequential assignments, send work to individual teammates, arrange an independent review, and summarize their results. Read each teammate's work in their individual Chat and the final summary in the lead's Chat. Use `/activity` to follow the whole workflow.

Crew Chat shows shared conversations started with `/discuss TOPIC` and directed replies requested with `@NAME MESSAGE`. Task assignments, handoffs, and results are not automatically copied into Crew Chat, so it can remain blank even while a `/task` workflow is running or has finished.

| What you want | Command | Where to follow it |
| --- | --- | --- |
| Coordinated implementation and review | `/task GOAL` | Individual Chat, lead's summary, and Activity |
| Read-only discussion with the crew | `/discuss TOPIC` | Crew Chat |
| One read-only reply using shared discussion context | `@NAME MESSAGE` | Crew Chat |

Tab cycles through individual teammates and Crew Chat; Shift+Tab reverses that cycle. F2 cycles the Chat, Crew Chat, and Activity views. Switching views does not copy messages between them or stop running work.

Start a read-only group discussion from any view:

```text
/discuss How should we improve the navigation?
```

Each teammate speaks in turn for two rounds, seeing earlier replies. The current lead then summarizes agreements, disagreements, and next steps. Discussions support up to twelve teammates. Discussion and mention replies appear in **Crew Chat** with separate Codex sessions. They do not add messages or change the session in an individual chat. Teammates cannot trigger extra turns through mentions in their replies.

## Everyday controls

| Need | Command |
| --- | --- |
| Check crew and progress | `/status`, `/crew list`, `/progress NAME` |
| Watch work | `/activity` |
| Inspect changes | `/changes`, `/diff` |
| Pause or resume queued work | `/queue pause`, `/queue resume` |
| Ask or answer a clarification | `/questions list`, `/answer TASK_ID TEXT` |
| Check Codex and folder access | `/doctor` |

Stopping work does not undo edits already made; inspect `/diff` before retrying. See the [command reference](docs/COMMANDS.md) for recovery, permissions, models, keyboard shortcuts, and every command.

## Saved data and access

Crew state lives in `<target-folder>/.pongkan-crew/state.json` and includes conversations, task results, archives, and Codex session IDs. Keep it private and add `.pongkan-crew/` to the **target project's** `.gitignore`; the `.gitignore` in this repository cannot ignore state created in a different target folder. Pongkan Crew uses your existing Codex login and does not store credentials.

Writers receive workspace-write access to the selected folder. Readers, reviewers, planning, and Crew Chat discussions use read-only access. Codex approval and sandbox settings still control command execution; role instructions do not grant operating-system permissions.

## Troubleshooting

Run a startup check from the repository:

```powershell
node .\src\cli.js --doctor --folder "C:\Projects\My Project"
```

- If `node` or `codex` is not found, install it and reopen the terminal; use `codex login` to sign in.
- If the folder is already open, close its other Pongkan Crew instance.
- If a stale lock is reported, confirm the old process stopped, then delete only the reported `app.lock`. Keep `state.json`.
- If Codex discovery fails on Windows, set `PONGKAN_CODEX_BIN` to the full path of `codex.exe`.
- Use PgUp/PgDn to scroll; mouse-wheel scrolling is not supported.

## Development checks

From the repository, run the automated tests and offline display preview:

```powershell
node --test
node .\scripts\preview-display.js
node .\scripts\preview-display.js --activity
```

The offline previews do not call Codex or access crew state. Optional live integration checks use your signed-in account:

```powershell
node .\scripts\check-codex.js
node .\scripts\check-workflow.js
```

See the [command reference](docs/COMMANDS.md) for CLI commands and detailed behavior.

## License

Pongkan Crew is released under the [MIT License](LICENSE). Confirm you have the rights to publish all included work before distributing it.
