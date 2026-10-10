# Pongkan Crew

[Complete command reference: purposes and examples](docs/COMMANDS.md) · [Todo website walkthrough](docs/TODO_WEBSITE_WALKTHROUGH.md)

[Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) · [MIT license](LICENSE)

Work with named Codex teammates from your terminal, inside a project folder you choose. Chat with one teammate, assign a task to the whole crew, and follow their work in a separate Activity tab.

Each project keeps its own conversations, crew settings, task history, and saved sessions. No npm dependencies or Git repository are required.

## Quick start on Windows

### 1. Check the requirements

You need **Node.js 22 or newer**, a **Codex CLI installation**, and a **signed-in Codex account**. Open PowerShell or Windows Terminal and run:

```powershell
node --version
codex --version
codex login
```

If a command is not found, install that tool and reopen your terminal. If Codex is already signed in, check it with `codex login status`.

### 2. Open Pongkan Crew

If you saved this project in the folder below, run:

```powershell
cd "C:\Projects\pongkan-crew"
node .\src\cli.js
```

This opens the crew **for the current folder**, so tasks can work on Pongkan Crew itself. Replace the path if you saved it somewhere else.

You do not need to run `npm install`.

### 3. Send your first task

These commands go **inside Pongkan Crew**, in its input line. Press Enter to send each one:

```text
/chat researcher
Explain this project's structure and how to run it.
```

To make a change, select Developer:

```text
/chat developer
Improve the README instructions for new users.
```

To let Chief coordinate several teammates:

```text
/task Review the project, improve the README, and check the result.
```

Open `/activity` to watch the team work. Use `/chat` to return to the conversation, `?` for help, and `/quit` to exit.

## Work on a different folder

For a complete practice project, follow the [Local Todo Website Walkthrough](docs/TODO_WEBSITE_WALKTHROUGH.md). It uses Next.js and shadcn/ui preset b0, with single-teammate and whole-crew flows, browser-only saving, design-system review, and local run checks.

The app's location and the folder it works on can be different. From the Pongkan Crew repository, pass the target folder with `--folder`:

```powershell
node .\src\cli.js --folder "C:\Projects\My Project"
```

Or launch it from any folder using the full path to the app:

```powershell
node "C:\Projects\pongkan-crew\src\cli.js" --folder "C:\Projects\My Project"
```

Replace `My Project` with an existing folder you want the crew to work in. Keep quotes around paths containing spaces. Use `/folder` inside the app to confirm the active folder.

Reopen the same folder to continue its saved conversations. Different folders have separate crew state. Only one Pongkan Crew instance can open a given folder at a time.

## Choose a crew preset

Choose a team for the kind of work you do. Run these inside Pongkan Crew:

```text
/preset list
/preset show web
/preset apply web
```

`show` previews each role and its file access without changing your crew. `apply` replaces the crew for the current folder, archives the previous crew and conversations, and starts fresh sessions. Project files and task history are preserved. Finish or cancel running and queued work first; `/stop all` cancels work and pauses dispatch. After applying, use `/queue resume` when ready to start tasks.

| Preset | Members |
| --- | --- |
| `default` | Chief, Researcher, Developer, Reviewer |
| `web` | Project Lead, Architect, UI/UX Designer, Frontend Developer, Backend Developer, Database Developer, DevOps, Test Engineer, Security Reviewer, SEO/AEO/GEO Specialist, Version Control, QA Reviewer |
| `mobile` | Project Lead, Architect, UI/UX Designer, Mobile Developer, Backend Developer, Database Developer, DevOps, Test Engineer, Security Reviewer, Accessibility Reviewer, Version Control, QA Reviewer |
| `social` | Social Manager, Researcher, Content Strategist, Copywriter, Creative Designer, Community Manager, SEO/AEO/GEO Specialist, Analytics Reviewer |
| `content` | Editor, Researcher, Content Strategist, Writer, Creative Designer, SEO/AEO/GEO Specialist, Content Reviewer |

For example, after applying `web`:

```text
/chat frontend-dev
Explain the current interface and suggest improvements.
/task Build a responsive contact form and review it.
/discuss How should frontend and backend handle form validation?
```

`/task` uses the preset's lead for planning and summaries, and its designated read-only reviewer for review. Crew Chat also uses that lead for its final summary. Writer roles can edit files; leads and reviewers are read-only by default. Social and content teams produce local briefs, calendars, drafts, and reviews. Publishing to accounts requires a separate integration.

Presets and customizations are saved per folder. `/status` shows the active preset and coordination roles. Applying `default` creates fresh default conversations; use `/undo` to restore the previous crew with its conversations instead. To restore an older complete crew, find its preset archive ID in `/archives`, then run `/preset restore ARCHIVE_ID`. Restoration also archives the crew it replaces. Stop and cancel outstanding work before restoring.

### Save your own preset

Customize names, roles, and access with `/crew` commands, then save them:

```text
/preset save my-team chief reviewer
/preset show my-team
/preset apply my-team
```

Use actual teammate names for the lead and reviewer. After applying `web`, for example, use `/preset save my-web project-lead qa-reviewer`. If omitted, the lead and reviewer default to the current crew's coordination names. Saving captures roles and permissions without changing the active crew; applying starts fresh conversations. Saving again with the same custom name updates it. Built-in presets cannot be overwritten, and custom presets support two to twelve teammates with a separate read-only reviewer. Tab completes built-in and saved preset names.

The designated lead and reviewer can be renamed, but cannot be removed while designated. The designated reviewer must stay read-only. To change the structure, customize the default crew and save a new preset with your chosen lead and reviewer.

### Browse and add specialist roles

The catalog has 28 reusable roles. Each defines responsibilities, checks, collaboration partners, and a handoff format. Browse it before adding a role:

```text
/roles list
/roles list engineering
/roles show database-dev
/roles show seo-aeo-geo-specialist
/crew add data --role database-dev
/crew add search --role seo-aeo-geo-specialist
/crew add delivery --role version-control
```

These examples add specialists to your existing crew instead of replacing it. Names such as `data` and `search` are yours to choose. `/crew add NAME --role ROLE` applies the role's **default file access**, shown by `/roles show`: implementation roles usually have write access, while reviewers are read-only. Ordinary `/crew add NAME ROLE_TEXT` still starts read-only.

To change an existing teammate to a catalog role, use `/crew role NAME --role ROLE`; this updates both instructions and access. `/crew role NAME YOUR_INSTRUCTIONS` updates instructions only. Busy teammates must finish first, and the designated reviewer must stay read-only. Tab completes catalog role names.

| Area | Catalog role names |
| --- | --- |
| Planning and architecture | `project-lead`, `product-manager`, `architect` |
| Implementation and data | `frontend-dev`, `backend-dev`, `fullstack-dev`, `database-dev`, `mobile-dev` |
| Operations and delivery | `devops`, `version-control`, `technical-writer` |
| Quality and performance | `test-engineer`, `qa-reviewer`, `security-reviewer`, `accessibility-reviewer`, `performance-engineer` |
| Design | `ui-ux-designer`, `creative-designer` |
| Research and editorial | `researcher`, `editor`, `writer`, `content-strategist`, `copywriter`, `content-reviewer` |
| Growth and community | `social-manager`, `community-manager`, `analytics-reviewer`, `seo-aeo-geo-specialist` |

For collaborative implementation, use `/task GOAL`. The lead chooses relevant specialists and orders their work; it does not assign every role automatically. Each step receives earlier results and captured changed-file names. Every teammate sees the current roster and shared handoff rules: completed work, files, decisions, verification, blockers, and the next specialist needed. Use `/discuss TOPIC` for shared conversation, or `/handoff NAME TASK` to route an answer manually. Naming another teammate in a response does not send an automatic message.

The database role handles schema contracts, migrations, query behavior, and data integrity. The version-control role inspects changes and drafts issues, PR descriptions, commit plans, and release notes locally. Creating remote issues or PRs, committing, pushing, merging, deploying, or publishing requires an explicit user request and the necessary configured tools. The SEO/AEO/GEO role covers technical search visibility, structured data, answer extraction, and content discoverability without promising rankings.

Existing crews and custom presets retain their saved instructions after an app update. To use the expanded built-in team, restart, stop or finish outstanding work, and apply the preset again. Previous conversations are archived. You can instead add or update just the specialists you need. Saved presets and full discussions support up to 12 teammates; larger ad hoc crews can still use directed `@NAME` replies. A 12-person, two-round discussion plus its summary schedules 25 Codex turns; use a smaller crew or directed mentions for focused questions.

## Meet your default crew

All teammates use Codex, with separate roles and conversations.

| Teammate | Main purpose | Default access |
| --- | --- | --- |
| `chief` | Plan work, assign steps, and summarize results | Read-only |
| `researcher` | Investigate the project and answer questions | Read-only |
| `developer` | Implement changes in the selected folder | Can edit files |
| `reviewer` | Review changes and identify problems | Read-only |

Sending a normal message assigns it to the selected teammate. `/send NAME TEXT` assigns work without switching conversations:

```text
/send developer Fix the navigation layout.
/send reviewer Review the navigation changes and report any problems.
```

Direct assignments are independent. Wait for the implementation to finish before requesting its review, or use `/task` for an ordered plan and review.

To pass the selected teammate's latest answer to another teammate:

```text
/handoff developer Implement this plan.
/handoff reviewer Review these changes.
```

## Chat, Crew Chat, and Activity tabs

| Action | Command or key |
| --- | --- |
| Open a teammate's conversation | `/chat developer` |
| Return to the selected conversation | `/chat` |
| Open the live activity feed | `/activity` or `/act` |
| Open shared Crew Chat | F2 from Chat, or `/group` |
| Select a view explicitly | `/switch chat`, `/switch group`, or `/switch activity` |
| Next tab: Chat → Crew Chat → Activity | F2 or `/switch` |
| Previous tab | Shift+F2 or `/switch prev` |
| Open help | `?`, F1, or `/help` |
| Search help | `/help queue` |
| Close a panel | Escape or `/close` |

Activity shows timestamped commands, searches, handoffs, and task updates from the whole team. Switching views keeps work running and preserves your selected teammate. The feed follows new events and retains the latest 50 events from the current app session.

Colored labels distinguish commands, file changes, searches, tools, queue events, completed work, and errors. Completed commands include exit codes and up to 1,200 characters of output when Codex supplies them. File events list affected paths. A pinned **LIVE NOW** section shows up to three working teammates, their latest reported actions, and elapsed time while you scroll the log. Command durations appear when matching start and completion events include an item ID. Activity uses reported events rather than private reasoning or continuous subprocess-output streaming; silent periods show Connecting or Thinking until a new event arrives. Set `NO_COLOR` to disable colors.

Use `/chat` before sending an ordinary message from Activity, or use `/send NAME TEXT` there to assign work explicitly.

Responses wrap to fit the terminal. Headings, lists, code blocks, and numbered link references are formatted for reading; tables appear as stacked entries. Working teammates show progress such as **Thinking**, **Running command**, **Updating files**, or **Preparing response**.

## Shared Crew Chat

To meet the current crew, ask every teammate to introduce themselves:

```text
/discuss Everyone in the current crew, introduce yourself. State your name, role, main responsibilities, current file access, and how you collaborate with the other teammates. Explain which tasks I should assign to you and give one short example. Cover every role in the current roster; do not invent absent teammates. Keep introductions concise and do not modify files. Lead: finish with a brief guide to who handles what.
```

Introductions appear in Crew Chat. Discussions are read-only for everyone, including teammates who can write files during implementation tasks. This introduces the current roster; use `/roles list` to browse additional roles available in the catalog.

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

Press F2 to cycle Chat → Crew Chat → Activity, or Shift+F2 to go backward. Your selected teammate stays selected while changing tabs. Individual chats keep direct conversation history. Older discussion entries that were mixed into those chats are automatically hidden when reopening the folder; the records remain saved and the previous mixed sessions are archived. Direct chats restart with their recovered direct history rather than resuming a session containing old group turns.

Use `/group` or `/switch group` to reopen the latest shared discussion. To ask a particular teammate for a follow-up, type:

```text
@developer, what do you think of the reviewer's suggestion?
```

Mentions work from any view and request one read-only reply using the latest shared discussion as context. Tab completes teammate names. Wait for the current discussion to finish, or use `/stop` in Crew Chat (or Ctrl+K) to cancel its remaining turns. `/stop all` also ends discussion work.

Plain text in Crew Chat starts a new two-round discussion. `/discuss TOPIC` also starts a new topic; directed mentions retain earlier shared context. `/chat` returns to your selected individual conversation, and `/activity` shows live progress. Changing views keeps the discussion running.

Discussions use saved tasks and respect `/queue pause` and `/queue resume`. After restarting, unfinished discussions are marked interrupted and their remaining turns do not resume. Start a new `/discuss` or mention when ready. To implement an agreed plan, use `/task` or send it to Developer explicitly.

## Everyday commands

| What you want to do | Command |
| --- | --- |
| List teammates and permissions | `/crew list` |
| Show crew status | `/status` |
| Inspect a teammate's progress | `/progress developer` |
| List files changed by the latest writer task | `/changes` |
| View the latest writer's changes | `/diff` |
| View staged, unstaged, and untracked text changes with Git | `/diff git` |
| Repeat the selected teammate's last user message | `/retry` |
| Stop the selected teammate's work | `/stop` |
| Stop a specific teammate | `/stop developer` |
| Pause dispatch and cancel all queued and running tasks | `/stop all` |
| Check the Codex connection | `/doctor` |
| Exit and stop active work | `/quit` or `/exit` |

Stopping a task does not revert files it has already changed. Inspect `/diff` before retrying a task that may have made edits.

## Automatic tasks and the queue

### Let teammates ask questions, or let them decide

Questions are on by default and saved per project. Teammates make routine choices themselves; when a material requirement is missing, they can pause their assignment and ask you. The Chat view and footer show pending questions, and Activity records them.

```text
/questions on
/questions list
/answer TASK_ID Use a compact list layout.
```

Replace `TASK_ID` with the ID shown beside the question. Your answer continues the same task and its workflow; dependent assignments wait, and other teammates can continue independent work. Tasks for a teammate with a pending question wait until you answer or cancel it. If dispatch is paused, the answer is saved and `/queue resume` starts the continuation.

For autonomous routine decisions, use:

```text
/questions off
```

This tells future turns to decide within the authorized scope and report assumptions. It does not grant permissions or override missing prerequisites. Existing waiting questions remain waiting; answer them or cancel with `/queue cancel TASK_ID`. Changing the setting does not interrupt an active Codex turn. Read-only discussions and schema-constrained workflow planning do not use the waiting-question protocol.

Questions use an explicit final-response signal from the teammate, rather than guessing from every question mark. A final `PONGKAN_QUESTION: ...` pauses an eligible task; `PONGKAN_BLOCKED: ...` fails it and cancels dependent workflow work. Ordinary prose is not classified automatically. Direct questions survive restart; unfinished workflows retain the existing interrupted/retry recovery behavior. Inspect changed files before retrying.

### Permissions and verification commands

Clarification answers and operating-system approvals are separate. Teammates are instructed to use existing applicable approvals and request command-specific escalation after a sandbox access failure, without requiring you to rewrite the assignment. Automatic approval review can still deny a command; the teammate must report the exact failure and minimum user action. Questions off does not bypass that decision.

Reviewers keep their no-source-edit role. They can request scoped execution of builds and browser tests that create generated artifacts, with the exact exception reviewed by the approval mechanism. This does not grant blanket write access. Interactive third-party installers can still need a normal terminal, and unavailable devices or tools remain unverified.

Use `/task` when you want the current lead to organize work:

```text
/task Add a search feature, check that it works, and review the changes.
```

The lead creates a plan with one to twelve sequential assignments. The app validates the plan, sends each step the earlier results and changed-file names, runs a read-only review, and asks the lead for a summary. A failed step stops dependent work. Read the lead's summary and the review: a completed workflow means the steps finished, and may still include reported problems.

Every sent message becomes a saved task. Work waits when its teammate is busy or another writer is active. Use `/queue list` to find task IDs and `/workflow list` to find workflow IDs. Replace the placeholders below with those IDs:

| Action | Command |
| --- | --- |
| List tasks | `/queue list` |
| Read a task's prompt, result, or error | `/queue show TASK_ID` |
| Pause new task starts; let active work continue | `/queue pause` |
| Resume queued tasks | `/queue resume` |
| Move queued work to position 1 | `/queue move TASK_ID 1` |
| Cancel a queued or running task | `/queue cancel TASK_ID` |
| Repeat a finished task | `/queue retry TASK_ID` |
| List coordinated workflows | `/workflow list` |
| Read a workflow's plan, steps, and summary | `/workflow show WORKFLOW_ID` |
| Cancel a workflow and its remaining steps | `/workflow cancel WORKFLOW_ID` |
| Start a fresh attempt at a workflow | `/workflow retry WORKFLOW_ID` |

Moving a task does not bypass dependencies. Canceling a workflow task also cancels its dependent steps. Retrying a task or workflow can repeat file edits.

After restarting, saved queued tasks stay paused. Inspect them with `/queue list`, then use `/queue resume` when ready. Previously running tasks become interrupted. Unfinished workflows require an explicit `/workflow retry WORKFLOW_ID`; they do not resume editing automatically.

Only one writer runs at a time. Ordinary readers can run alongside it and may see edits in progress. Automatic workflow reviews wait for writers to finish and block new writes while reviewing. The lead's planning and summary always use read-only access. Coordination has no recursive delegation or automatic repair loops.

## Customize teammates

```text
/crew add designer Review layouts and accessibility.
/crew info designer
/crew role designer Focus on keyboard navigation and readability.
/crew access designer write
/crew access designer read
/crew rename designer artist
/crew remove artist
```

Added teammates start read-only. Grant `write` access when they need to edit project files. Role and access changes apply to future turns and are saved for this folder.

Finish or cancel active workflows and the affected teammate's queued and running work before changing that teammate. You must keep at least one teammate. Removing a teammate archives its conversation; `/undo` can restore it.

## Conversations and recovery

| Command | Effect |
| --- | --- |
| `/clear` | Clear the selected local transcript while keeping Codex's session memory |
| `/new` | Clear the selected transcript and start a fresh Codex conversation |
| `/archives` | List saved conversation snapshots |
| `/undo` | Restore the latest undoable conversation or teammate change |
| `/archives restore ARCHIVE_ID NEWNAME` | Restore an archived conversation as a teammate |

Remove, clear, and new-conversation actions save an archive first. Undo preserves unrelated teammates' conversations, and replaced newer conversations remain recoverable from archives. Stop running work and cancel queued work before using undo.

These actions restore conversations and crew settings. They do not restore project files or remove sessions from Codex storage. If an archived session is already used by another teammate, restoring a copy starts a separate session with up to 20 recovered messages (24,000 characters) as context.

## Keyboard shortcuts

Long input wraps into an area of up to five lines and scrolls with the cursor. Use Up/Down to move between wrapped input lines, Left/Right to edit, and Home/End to jump to the start/end of the full prompt. Enter sends the complete prompt. With a single input line, Up/Down keeps its usual teammate or view behavior; open panels retain their scroll controls.

| Key | Action |
| --- | --- |
| Enter | Send input |
| Tab / Shift+Tab | Cycle teammates and Crew Chat; Tab completes a typed slash command or teammate argument |
| Up / Down | Scroll chat history, Activity, or an open panel |
| PgUp / PgDn | Scroll chats, Activity, or an open panel while teammates work |
| Left click | Select a teammate or view in the sidebar, or a tab in the header |
| Page Up / Page Down | Scroll the conversation, Activity, or a panel |
| F1 | Help |
| F2 / Shift+F2 | Next / previous tab |
| Escape | Close a panel, return from Activity to Chat, or clear input |
| Left / Right, Home / End | Move the input cursor |
| Backspace / Delete | Delete text |
| Ctrl+U / Ctrl+W | Clear input / delete the previous word |
| Ctrl+P / Ctrl+N | Previous / next input history entry |
| Ctrl+K | Stop the selected teammate |
| Ctrl+L | Redraw the screen |
| Ctrl+C | Stop active work and exit |

## Saved data and file changes

Each target folder stores its crew state in:

```text
<your-project>/.pongkan-crew/state.json
```

This includes conversations, roles, tasks, results, archives, and Codex session IDs. Keep it private. For a Git project, add this line to that project's `.gitignore`:

```gitignore
.pongkan-crew/
```

The app uses your existing Codex login; it does not store credentials. Each teammate inherits Codex's configured model unless you select one inside Pongkan Crew:

```text
/model list
/model set developer gpt-6.1-sol high
/model set all gpt-6.1-sol medium
/model developer
/status
/progress developer
/model reset developer
```

Run each command separately. `/model list` shows the installed Codex model cache, including supported reasoning efforts; the cache may be stale. You can also enter a provider model ID. The optional effort inherits Codex's default when omitted. `/model` shows the selected teammate; `/status` shows all teammates' requested settings and activity; `/progress` shows the settings captured for the last or running turn. Inherited defaults are labeled explicitly because Codex resolves user and project configuration. These are requested settings, not confirmation from the model server. Unavailable models fail through Codex with an error.

Selections are saved per teammate in this project's crew state and apply to future turns, including Crew Chat and coordinated tasks, while retaining conversation history. Finish or cancel active workflows and the affected teammates' running/queued tasks before changing their models. Use `/model reset all` to restore inherited settings for everyone. Applying a different crew preset starts with that preset's settings.

Codex runs noninteractively with approval policy `on-request` and the automatic approval reviewer. When an authorized setup, install, or verification command needs to cross the sandbox boundary, Codex can request an automatically reviewed retry instead of immediately handing the command back to you. Writers retain workspace-write access; readers and discussions retain read-only access. Automatic review may deny actions, and managed organization requirements still apply. Project instructions and your installed Codex configuration still apply.

Writer snapshots work without Git. `/diff last` shows the latest writer snapshot; `/diff TASK_ID` shows one task's snapshot. Snapshots compare whole text files and exclude binary files, symlinks, app state, dependencies, and common build folders. Limits are 1,000 files, 128 KiB per file, 4 MiB total, and 200,000 displayed diff characters. Changes made by external editors during a task may also appear.

`/diff git` compares staged and unstaged changes against HEAD and includes untracked text files within the selected folder; repositories with no commits are supported. Diff views are read-only, have output limits, and do not apply or revert patches. Before any writer task, `/diff` falls back to Git changes when available.

## Troubleshooting

Run diagnostics from the Pongkan Crew repository:

```powershell
node .\src\cli.js --doctor --folder "C:\Projects\My Project"
```

Diagnostics check Codex availability, login, folder access, and saved state.

| Problem | What to do |
| --- | --- |
| `node` is not recognized | Install Node.js 22 or newer, then reopen the terminal. |
| Codex is unavailable | Confirm `codex --version` works, or set the native executable path below. |
| Login check fails | Run `codex login` in PowerShell, then restart Pongkan Crew. |
| App cannot find `src/cli.js` | Change to the Pongkan Crew repository, or use its full script path. |
| Folder cannot be opened or written | Confirm the target folder exists and your account can write to it. |
| App says it is already open | Close the other instance using that target folder. |
| A stale lock remains after a crash | Confirm the old app process has stopped, then delete only the `app.lock` file identified by the error. Keep `state.json`. |
| Saved state is invalid | The app preserves it. Back up `state.json` before investigating or repairing it. |
| Tasks wait after reopening | Inspect `/queue list`, then run `/queue resume`. |
| Display looks misaligned | Enlarge the terminal and press Ctrl+L. |

If automatic Codex discovery fails, set `PONGKAN_CODEX_BIN` to your actual native executable path before starting the app. For example:

```powershell
$env:PONGKAN_CODEX_BIN = "C:\Tools\Codex\codex.exe"
node .\src\cli.js
```

On Windows, use `codex.exe` rather than a `.cmd` shim. To disable terminal colors for this PowerShell session:

```powershell
$env:NO_COLOR = "1"
node .\src\cli.js
```

## Preview and development checks

Run these from the Pongkan Crew repository:

```powershell
# Offline sample: no Codex requests and no crew state access
node .\scripts\preview-display.js
node .\scripts\preview-display.js --activity

# Render once for a chosen folder without calling Codex
node .\src\cli.js --preview --folder "C:\Projects\My Project"

# Run the automated tests
node --test
```

The CLI preview loads or saves the chosen folder's crew state and uses a folder lock. The offline display samples do neither.

Optional live checks use your Codex account:

```powershell
# Two short read-only requests: connection and session resume
node .\scripts\check-codex.js

# Several read-only requests: planning, assignment, review, and summary
node .\scripts\check-workflow.js
```

The workflow check creates a temporary project and removes it afterward. The app displays progress events and completed assistant messages. The CLI reads keyboard input directly; mouse wheel scrolling and navigation clicks are disabled. Use PgUp/PgDn to scroll and Tab or F2 to navigate. Token-by-token streaming is not implemented.

Integration uses Codex non-interactive execution with JSON events and explicit session resume IDs. It was verified against the installed Codex CLI help for version 0.162.1.

## License

Pongkan Crew is released under the [MIT License](LICENSE). Review the license and confirm that you have the rights to publish all included work before distributing this repository.
