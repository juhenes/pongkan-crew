# Pongkan Crew

[Command reference](docs/COMMANDS.md) · [Todo website walkthrough](docs/TODO_WEBSITE_WALKTHROUGH.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [License](LICENSE)

Pongkan Crew runs named Codex teammates from a terminal. Chat with one teammate, ask the lead to coordinate a task, and follow the work in Activity. Each target folder has its own crew, conversations, and task history.

![Pongkan Crew terminal interface](assets/images/pongkan-crew-cli.png)

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

## Sample approach: local todo website

The walkthrough demonstrates a local-only todo app built with Next.js and shadcn/ui preset `b0`, using browser storage. See the [todo website walkthrough](docs/TODO_WEBSITE_WALKTHROUGH.md) for setup and the crew prompts.

![Animated preview of the local todo website](assets/images/todo-result.gif)

[Open or download the full MP4](assets/video/todo-result.mp4).

## Choose a crew

The default crew is Chief, Researcher, Developer, and Reviewer. Built-in presets add specialists for web, mobile, social, or content work. Preview and apply a preset with:

```text
/preset list
/preset show web
/preset apply web
```

Applying a preset archives the crew and starts fresh conversations, preserving project files and task history. Finish or cancel active work first; `/undo` restores the previous crew. To add one specialist instead, use `/roles list` and `/crew add NAME --role ROLE`.

The default crew tracks Chief and Reviewer as its coordinators. Renaming either preserves routing, and Reviewer remains read-only. Coordinators cannot be removed directly. Existing default crews upgrade automatically when reopened; see [upgrading and recovery](docs/UPGRADING.md) for legacy custom names.

The todo walkthrough uses the default crew; the web preset is optional.

## Chat, Crew Chat, and Activity

Chat holds individual conversations, Crew Chat holds shared discussions, and Activity follows the team's work.

### Task workflows and Crew Chat are separate

`/task GOAL` asks the lead to plan sequential assignments, send work to individual teammates, arrange an independent review, and summarize their results. Read each teammate's work in their individual Chat and the final summary in the lead's Chat. Use `/activity` to follow the whole workflow.

Crew Chat shows shared conversations started with `/discuss TOPIC` and directed replies requested with `@NAME MESSAGE`. Task assignments, handoffs, and results are not automatically copied into Crew Chat, so it can remain blank even while a `/task` workflow is running or has finished.

| What you want | Command | Where to follow it |
| --- | --- | --- |
| Coordinated implementation and review | `/task GOAL` | Individual Chat, lead's summary, and Activity |
| Read-only discussion with the crew | `/discuss TOPIC` | Crew Chat |
| One read-only reply using shared discussion context | `@NAME MESSAGE` | Crew Chat |

Tab/Shift+Tab cycles teammates and Crew Chat. F2 cycles views; PgUp/PgDn scroll. Switching views keeps work running.

To meet the current crew, ask every teammate to introduce themselves. Paste this as one command:

```text
/discuss Everyone in the current crew, introduce yourself. State your name, role, main responsibilities, current file access, and how you collaborate with the other teammates. Explain which tasks I should assign to you and give one short example. Cover every role in the current roster; do not invent absent teammates. Keep introductions concise and do not modify files. Lead: finish with a brief guide to who handles what.
```

Introductions appear in Crew Chat and use the current roster. Discussions are read-only for everyone, including teammates who can write files during implementation tasks. Use `/roles list` to browse additional specialist roles.

For a planning discussion, try:

```text
/discuss How should we improve the navigation?
```

Teammates discuss for two rounds, then the lead summarizes. Discussions support up to twelve members and use separate sessions from individual chats.

## Everyday controls

| Need | Command |
| --- | --- |
| Check crew and progress | `/status`, `/crew list`, `/progress NAME` |
| Watch work | `/activity` |
| Inspect changes | `/changes`, `/diff` |
| Pause or resume queued work | `/queue pause`, `/queue resume` |
| Ask or answer a clarification | `/questions list`, `/answer TASK_ID TEXT` |
| Check Codex and folder access | `/doctor` |

Stopping does not undo edits; inspect `/diff` before retrying. The [command reference](docs/COMMANDS.md) covers recovery, permissions, models, and shortcuts.

## Saved data and access

Conversations, task results, archives, and session IDs live in `<target-folder>/.pongkan-crew/state.json`. Keep it private and add `.pongkan-crew/` to the **target project's** `.gitignore`. Pongkan Crew uses your Codex login without storing credentials.

Writers use workspace-write access; readers, reviewers, planning, and discussions use read-only access. Codex sandbox and approval settings control command execution.

## Troubleshooting

Run a startup check from the repository:

```powershell
node .\src\cli.js --doctor --folder "C:\Projects\My Project"
```

- If `node` or `codex` is not found, install it and reopen the terminal; use `codex login` to sign in.
- If the folder is already open, close its other Pongkan Crew instance.
- Locks left by stopped processes recover automatically. If another instance is running, close it before reopening the folder.
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

## Custom teams and command help

Use `/preset create NAME [LEAD REVIEWER]` to capture your current crew, `/preset title NAME TEXT` to name it, and `/preset delete NAME` to remove only its saved definition. Customize members with `/crew add`, `/crew rename`, and `/crew role`. `/preset improve MEMBER [GOALS]` asks Codex for read-only suggestions about skills and descriptions; review and apply the wording yourself.

Every command category in `/help` includes usage examples. Search with `/help model` for all-crew and individual model settings. See the [command reference](docs/COMMANDS.md) for a complete custom-team walkthrough and recovery behavior.

See [security boundaries](SECURITY.md) before running agents on a project. Preset deletion never removes project files. Writer tasks can edit or delete project files within their permissions; keep version control and backups.

For publication checks and the latest local findings, see the [release security audit](docs/RELEASE_SECURITY_AUDIT.md) and [public release checklist](SECURITY.md#public-release-checks).

Simple greetings and acknowledgements use brief conversational replies. Clarification questions and your answers appear as readable messages; internal continuation instructions stay out of the conversation view. Use `/queue show TASK_ID` when you need the original task prompt or result.

## Optional context optimization

Use `/context on` to shorten long assistant replies included in handoffs, Crew Chat, and recovered conversations. `/context status` shows character counts before and after; `/context off` restores the previous behavior. The setting is saved per project and defaults to off. User messages, current requirements and full saved records are preserved. This is lossy local clipping, not control over Codex's internal session context; see the [command guide](docs/COMMANDS.md#local-context-optimizer) for limits.

## License

Released under the [MIT License](LICENSE).
