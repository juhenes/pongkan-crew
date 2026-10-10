# Pongkan Crew command reference

[README](../README.md) · [Todo website walkthrough](TODO_WEBSITE_WALKTHROUGH.md)

Commands below are entered **inside Pongkan Crew**, one message at a time, unless labeled as terminal commands. Names such as `developer` refer to your current roster. With the web preset, use `frontend-dev`, `qa-reviewer`, and `project-lead` where appropriate. `TASK_ID`, `WORKFLOW_ID`, `ARCHIVE_ID`, and `MODEL_ID` are placeholders: replace them with actual values shown by the app. Square brackets in syntax mean optional arguments; do not type the brackets.

## Choose the right action

| Goal | Use | Where results appear |
| --- | --- | --- |
| Ask one teammate or assign direct work | `/chat developer`, then your message | That teammate's Chat |
| Assign without switching chats | `/send developer TASK` | Developer's Chat |
| Have the lead coordinate implementation and review | `/task GOAL` | Individual chats, lead summary, Activity |
| Discuss a plan without editing | `/discuss TOPIC` | Crew Chat |
| Ask one teammate using shared discussion context | `@developer QUESTION` | Crew Chat, read-only |
| Reply to a paused assignment | `/answer TASK_ID REPLY` | Continues the same task and workflow |

Plain text in Chat goes to the selected teammate. Plain text in Crew Chat starts a new read-only discussion. Activity accepts commands rather than ordinary chat messages. `/task` routes to the current lead automatically; it does not copy the latest Crew Chat into the task. Include the decisions you want implemented in the task prompt.

## Chat, assignments, and discussions

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/chat [NAME]` | Open Chat and optionally select a teammate | `/chat chief` |
| `/crew chat NAME` | Alias for selecting a teammate's Chat | `/crew chat developer` |
| `/next` | Cycle forward through teammates and Crew Chat | `/next` |
| `/prev` | Cycle backward through teammates and Crew Chat | `/prev` |
| `/task TEXT` | Lead plans sequential assignments, independent review, and summary | `/task Add todo filters, verify them, and review the changes.` |
| `/send NAME TEXT` | Queue a direct assignment without changing selection | `/send developer Fix the remaining count.` |
| `/handoff NAME [TASK]` | Pass the selected teammate's latest assistant answer to another teammate | `/handoff reviewer Review the implementation against the requirements.` |
| `/retry` | Resend the selected teammate's latest direct user message | `/retry` |
| `/discuss TOPIC` | Start two read-only rounds with the crew, then a lead summary | `/discuss Plan keyboard navigation for our todo app. Do not edit files.` |
| `/group` | Open the latest shared Crew Chat | `/group` |
| `@NAME MESSAGE` | Request one read-only reply using the latest shared discussion | `@developer How will you preserve invalid stored data?` |

Direct tasks are independent: wait for implementation before requesting review, or use `/task` for ordered work. Discussion and mentions do not implement their suggestions. Task workflow messages are not automatically copied into Crew Chat. Handoffs and retries may trigger edits if sent to a writer; inspect existing changes first.

## Questions and autonomy

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/questions` | Show question mode and waiting questions | `/questions` |
| `/questions list` | Show pending questions with task IDs and reply instructions | `/questions list` |
| `/questions on` | Allow material clarification questions in future work turns; default | `/questions on` |
| `/questions off` | Let AI decide routine choices within the task and report assumptions | `/questions off` |
| `/answer TASK_ID TEXT` | Save your answer and continue the same waiting assignment | `/answer TASK_ID Use a compact list with inline editing.` |

Question mode is saved per folder. Changes apply to future turns; they do not interrupt an active turn. Existing waiting tasks still need an answer or `/queue cancel TASK_ID`. While a task waits, dependent work and other tasks for that teammate wait; independent teammates can continue. Answers queue while dispatch is paused. Read-only discussions and schema-constrained lead planning do not use this pause/resume protocol.

Questions off does not grant operating-system access or bypass approvals. Teammates use existing applicable approvals and can request automatically reviewed, command-specific escalation for necessary sandbox exceptions. A denied or unavailable action is still a blocker. An explicit teammate blocker signal fails the task and cancels dependent workflow work; ordinary prose is not automatically classified as a blocker.

## Stop and cancel

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/stop` | Stop selected teammate's active work; in Crew Chat, stop the discussion | `/stop` |
| `/stop NAME` | Stop a named teammate's active task | `/stop developer` |
| `/stop all` | Pause dispatch and cancel all queued, waiting, and running work | `/stop all` |
| `/queue cancel TASK_ID` | Cancel a queued, waiting, or running task | `/queue cancel TASK_ID` |
| `/workflow cancel WORKFLOW_ID` | Cancel a workflow and its remaining assignments | `/workflow cancel WORKFLOW_ID` |
| `/quit` or `/exit` | Stop active work and exit the CLI | `/quit` |

Stopping does not revert edits already made. Canceling a workflow task cancels dependent workflow work. Use `/queue cancel TASK_ID` for a waiting question; `/stop NAME` targets active execution. After `/stop all`, dispatch stays paused until `/queue resume`.

## Tasks and workflow history

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/queue` or `/queue list` | List task IDs, statuses, and dispatch state | `/queue list` |
| `/queue show TASK_ID` | Read prompt, result, error, dependency, and timing | `/queue show TASK_ID` |
| `/queue pause` | Stop new dispatch while active work continues | `/queue pause` |
| `/queue resume` | Resume dispatch of eligible queued tasks | `/queue resume` |
| `/queue move TASK_ID POSITION` | Move a queued task to a one-based queue position | `/queue move TASK_ID 1` |
| `/queue retry TASK_ID` | Create a retry of a finished standalone task | `/queue retry TASK_ID` |
| `/workflow` or `/workflow list` | List coordinated workflows | `/workflow list` |
| `/workflow show WORKFLOW_ID` | Inspect goal, assignments, statuses, summary, and error | `/workflow show WORKFLOW_ID` |
| `/workflow retry WORKFLOW_ID` | Start a new attempt at a finished/interrupted workflow | `/workflow retry WORKFLOW_ID` |

Moving tasks does not bypass dependencies or the single-writer rule. Workflow tasks require workflow retry; discussion tasks require a new discussion or mention. Retries can repeat edits. After restart, queued work is paused, running tasks become interrupted, and unfinished workflows require explicit retry. Direct waiting questions survive restart. Workflow completion describes finished turns; read the review and summary to assess actual delivery.

## Views, progress, and changes

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/activity` or `/act` | Open the team's live activity feed | `/activity` |
| `/switch` | Cycle Chat → Crew Chat → Activity | `/switch` |
| `/switch prev` | Cycle views backward | `/switch prev` |
| `/switch chat` | Select individual Chat view | `/switch chat` |
| `/switch group` | Select Crew Chat view | `/switch group` |
| `/switch activity` | Select Activity view | `/switch activity` |
| `/status` | Show preset, lead/reviewer, question mode, dispatch, and member status | `/status` |
| `/progress [NAME]` | Inspect current action, elapsed time, files, and errors | `/progress developer` |
| `/changes` | List captured changed files from the latest writer task | `/changes` |
| `/diff` or `/diff last` | View latest writer snapshot; bare `/diff` falls back to Git if no snapshot exists | `/diff last` |
| `/diff TASK_ID` | View a particular task's writer snapshot | `/diff TASK_ID` |
| `/diff git` | View staged, unstaged, and untracked text changes using Git | `/diff git` |
| `/folder` | Show the target project folder and state-file location | `/folder` |
| `/doctor` | Check Codex availability and login | `/doctor` |
| `/close` | Close an overlay panel | `/close` |

Changing views keeps work running. Diff views are read-only and bounded; writer snapshots do not require Git. Activity reflects reported events rather than private reasoning or continuous subprocess output.

## Crew members and role catalog

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/crew list` | List current teammates, roles, and access | `/crew list` |
| `/crew info [NAME]` | Inspect role, access, model, status, and direct session | `/crew info developer` |
| `/roles list [QUERY]` | Browse or filter reusable roles | `/roles list engineering` |
| `/roles show ROLE` | Read a catalog role's responsibilities and default access | `/roles show frontend-dev` |
| `/crew add NAME [ROLE_TEXT]` | Add a read-only teammate with optional custom instructions | `/crew add designer Review layouts and accessibility.` |
| `/crew add NAME --role ROLE` | Add a catalog specialist with its default access | `/crew add frontend --role frontend-dev` |
| `/crew role NAME ROLE_TEXT` | Replace role instructions while keeping access | `/crew role designer Focus on keyboard navigation.` |
| `/crew role NAME --role ROLE` | Apply catalog instructions and default access | `/crew role designer --role ui-ux-designer` |
| `/crew access NAME read` | Set future tasks to read-only access | `/crew access designer read` |
| `/crew access NAME write` | Allow future implementation tasks to write in the project | `/crew access designer write` |
| `/crew rename NAME NEWNAME` | Rename a teammate and update coordination names if needed | `/crew rename designer artist` |
| `/crew remove NAME` | Archive and remove a teammate's conversation and role | `/crew remove artist` |

Finish/cancel active workflows and affected queued/waiting work before changing existing members. The designated reviewer must stay read-only, designated coordination members cannot be removed, and the last teammate cannot be removed. Writer access is separate from command escalation approval; discussions remain read-only regardless of roster access.

## Presets

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/preset list` | List built-in and saved teams | `/preset list` |
| `/preset show NAME` | Preview members, instructions, access, and coordination | `/preset show web` |
| `/preset apply NAME` | Archive current crew and create fresh preset sessions | `/preset apply default` |
| `/preset save NAME [LEAD REVIEWER]` | Save current roles/access as a custom preset | `/preset save my-team chief reviewer` |
| `/preset restore ARCHIVE_ID` | Restore an archived complete crew | `/preset restore ARCHIVE_ID` |

Built-ins: `default`, `web`, `mobile`, `social`, `content`. Finish or cancel outstanding work before applying/restoring. Project files and task history remain intact. Applying creates fresh conversations; `/undo` can restore the previous crew. Saving a preset alone does not replace the crew, and built-ins cannot be overwritten.

## Conversations and recovery

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/clear` | Archive and clear selected transcript, retaining Codex session memory | `/clear` |
| `/new` | Archive and clear selected transcript and start a fresh Codex session | `/new` |
| `/archives` | List recoverable conversation/crew snapshots | `/archives` |
| `/archives restore ARCHIVE_ID [NAME]` | Restore a conversation as a teammate; choose a new name for a copy | `/archives restore ARCHIVE_ID recovered-dev` |
| `/undo` | Restore latest undoable conversation or crew change | `/undo` |

These restore conversations and crew settings, not project files. Stop/cancel relevant work before resetting or restoring. To reset every default-crew conversation, use `/preset apply default` once outstanding work is finished/canceled. Keep `.pongkan-crew/state.json` to preserve history.

## Model settings

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/model [NAME]` | Inspect selected/named teammate's requested model and live status | `/model developer` |
| `/model list` | Browse the locally cached model catalog and supported effort levels | `/model list` |
| `/model set NAME MODEL_ID [EFFORT]` | Choose model and optional effort for future tasks | `/model set developer MODEL_ID medium` |
| `/model set all MODEL_ID [EFFORT]` | Set model for all teammates | `/model set all MODEL_ID` |
| `/model reset [NAME]` | Remove overrides for selected/named teammate | `/model reset developer` |
| `/model reset all` | Restore inherited Codex defaults for everyone | `/model reset all` |

Use an actual model ID and supported effort from `/model list`. Availability is validated by Codex; a cached entry does not guarantee account access. Changes apply to future tasks and preserve conversations. These commands change model selection, not permissions.

## Help and keyboard shortcuts

| Command or key | Purpose | Sample usage |
| --- | --- | --- |
| `/help`, `?`, or F1 | Open help | `/help` |
| `/help QUERY` | Search command help | `/help questions` |
| Enter | Send complete input | Paste one `/task ...` prompt, then Enter |
| Tab / Shift+Tab | Cycle teammates and Crew Chat; complete command/mention input | Type `/chat dev`, then Tab |
| F2 / Shift+F2 | Cycle views forward/backward | Chat → Crew Chat → Activity |
| Escape | Close panel, return from group/activity to Chat, or clear Chat input | Press Esc |
| Up / Down | Move through wrapped input; otherwise scroll content/panel | Press Up to inspect earlier content |
| PgUp / PgDn | Scroll history or an open panel | Press PgUp while work runs |
| Left / Right | Move input cursor | Edit a word in a prompt |
| Home / End | Move to beginning/end of complete input | Press Home |
| Backspace / Delete | Remove preceding/following character | Correct input before sending |
| Ctrl+U | Clear input | Start the prompt again |
| Ctrl+W | Delete preceding word | Remove the last word |
| Ctrl+P / Ctrl+N | Previous/next submitted input | Recall a previous command |
| Ctrl+K | Invoke `/stop` in the current view | Stop selected work or discussion |
| Ctrl+L | Redraw screen | Refresh after resizing |
| Ctrl+C | Stop work and exit | Close the CLI |

Mouse/wheel handling is disabled; use keyboard scrolling. Slash-command and mention completion take priority over Tab navigation when input begins with `/` or `@`.

## Terminal launch commands

Run these in PowerShell or Command Prompt, **outside the crew input**.

| Command | Purpose |
| --- | --- |
| `node .\src\cli.js` | Launch for the current folder from the Pongkan Crew repository |
| `node .\src\cli.js --folder ..\todo-app` | Launch from the tool repository targeting the sibling website |
| `node ..\pongkan-crew\src\cli.js --folder .` | Launch from `todo-app`, targeting that folder |
| `node .\src\cli.js --doctor --folder ..\todo-app` | Run startup diagnostics and exit |
| `node .\src\cli.js --preview --folder ..\todo-app` | Render once without Codex requests; loads/saves state and uses a lock |
| `node .\src\cli.js --help` | Print CLI usage and command help; `-h` is an alias |

The default target is the terminal's current directory. Quote paths with spaces. `/folder` confirms the active target after launch. Only one instance may target a folder at a time. For website setup, run commands in the [todo walkthrough](TODO_WEBSITE_WALKTHROUGH.md); npm/npx commands do not belong in the crew chat input.

## Example: plan, implement, and inspect the todo app

Enter each line separately, waiting for the discussion to finish before assigning implementation:

```text
/folder
/questions on
/discuss Plan the todo app's layout and safe browser storage. Do not edit files.
/chat chief
/task Implement add/edit/complete/delete, filters, and safe localStorage using our initialized shadcn b0 theme. Run checks and independently review. Include the agreed discussion decisions in this assignment.
/activity
```

If a task asks a question, use `/questions list` and `/answer TASK_ID YOUR_REPLY`. After implementation, inspect `/changes`, `/diff`, and the lead's summary. The [walkthrough](TODO_WEBSITE_WALKTHROUGH.md) contains the full implementation prompt and actual reported results.
