# Pongkan Crew command reference

[README](../README.md) · [Todo website walkthrough](TODO_WEBSITE_WALKTHROUGH.md)

Enter commands **inside Pongkan Crew**, one message at a time, except for terminal commands below. Use names from your roster and replace uppercase placeholders with values shown by the app. `[Arguments]` are optional; omit the brackets.

Plain text goes to the selected teammate in Chat or starts a read-only discussion in Crew Chat. Activity accepts commands only. `/task` goes to the lead; include agreed decisions because Crew Chat is not copied into its prompt.

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

For ordered implementation and review, use `/task`; direct tasks are independent. Discussions and mentions are read-only. Workflow results stay in individual chats and Activity. Handoffs and retries can trigger edits; inspect changes first.

## Questions and autonomy

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/questions` | Show question mode and waiting questions | `/questions` |
| `/questions list` | Show pending questions with task IDs and reply instructions | `/questions list` |
| `/questions on` | Allow material clarification questions in future work turns; default | `/questions on` |
| `/questions off` | Let AI decide routine choices within the task and report assumptions | `/questions off` |
| `/answer TASK_ID TEXT` | Save your answer and continue the same waiting assignment | `/answer TASK_ID Use a compact list with inline editing.` |

Question mode is saved per folder and affects future turns. Answer waiting tasks or cancel them with `/queue cancel TASK_ID`. Waiting blocks dependent work and that teammate's other tasks; independent teammates can continue. Answers queue when dispatch is paused. Discussions and lead planning do not use this question protocol.

Questions off does not bypass permissions. Teammates can use existing approvals or request automatically reviewed, command-specific escalation. Denied/unavailable actions remain blockers. An explicit blocker signal fails the task and cancels dependent work; prose alone does not.

## Stop and cancel

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/stop` | Stop selected teammate's active work; in Crew Chat, stop the discussion | `/stop` |
| `/stop NAME` | Stop a named teammate's active task | `/stop developer` |
| `/stop all` | Pause dispatch and cancel all queued, waiting, and running work | `/stop all` |
| `/queue cancel TASK_ID` | Cancel a queued, waiting, or running task | `/queue cancel TASK_ID` |
| `/workflow cancel WORKFLOW_ID` | Cancel a workflow and its remaining assignments | `/workflow cancel WORKFLOW_ID` |
| `/quit` or `/exit` | Stop active work and exit the CLI | `/quit` |

Stopping preserves edits. Canceling a workflow task cancels dependent work. Use `/queue cancel TASK_ID` for waiting tasks; `/stop NAME` targets active work. After `/stop all`, use `/queue resume` to restart dispatch.

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

Moving tasks respects dependencies and the single-writer rule. Retry workflows with `/workflow retry`; restart discussions with `/discuss` or a mention. Retries may repeat edits. After restart, dispatch is paused, running tasks are interrupted, and unfinished workflows need explicit retry. Direct waiting questions survive. A completed workflow means turns finished; read the review and summary to assess delivery.

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

Views keep work running. Diffs are bounded and read-only; snapshots work without Git. Activity shows reported events, not private reasoning or continuous subprocess output.

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

Finish/cancel active workflows and affected tasks before changing members. The reviewer stays read-only; coordination members and the last teammate cannot be removed. Writer access does not grant command approvals, and discussions remain read-only.

## Presets

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/preset list` | List built-in and saved teams | `/preset list` |
| `/preset show NAME` | Preview members, instructions, access, and coordination | `/preset show web` |
| `/preset apply NAME` | Archive current crew and create fresh preset sessions | `/preset apply default` |
| `/preset save NAME [LEAD REVIEWER]` | Save current roles/access as a custom preset | `/preset save my-team chief reviewer` |
| `/preset restore ARCHIVE_ID` | Restore an archived complete crew | `/preset restore ARCHIVE_ID` |

Built-ins: `default`, `web`, `mobile`, `social`, `content`. Finish/cancel outstanding work before applying or restoring. Applying preserves files and task history but starts fresh conversations; `/undo` restores the prior crew. Saving does not replace the crew or overwrite built-ins.

## Conversations and recovery

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/clear` | Archive and clear selected transcript, retaining Codex session memory | `/clear` |
| `/new` | Archive and clear selected transcript and start a fresh Codex session | `/new` |
| `/archives` | List recoverable conversation/crew snapshots | `/archives` |
| `/archives restore ARCHIVE_ID [NAME]` | Restore a conversation as a teammate; choose a new name for a copy | `/archives restore ARCHIVE_ID recovered-dev` |
| `/undo` | Restore latest undoable conversation or crew change | `/undo` |

Recovery restores conversations/settings, not project files. Stop/cancel relevant work first. `/preset apply default` resets all conversations to the default crew. Keep `.pongkan-crew/state.json` to preserve history.

## Model settings

| Command | Purpose | Sample usage |
| --- | --- | --- |
| `/model [NAME]` | Inspect selected/named teammate's requested model and live status | `/model developer` |
| `/model list` | Browse the locally cached model catalog and supported effort levels | `/model list` |
| `/model set NAME MODEL_ID [EFFORT]` | Choose model and optional effort for future tasks | `/model set developer MODEL_ID medium` |
| `/model set all MODEL_ID [EFFORT]` | Set model for all teammates | `/model set all MODEL_ID` |
| `/model reset [NAME]` | Remove overrides for selected/named teammate | `/model reset developer` |
| `/model reset all` | Restore inherited Codex defaults for everyone | `/model reset all` |

Choose IDs and effort levels from `/model list`; cached entries may be unavailable to your account. Changes affect future tasks, preserving conversations and permissions.

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

The target defaults to the current directory; quote paths with spaces and confirm with `/folder`. Only one instance can target a folder. Run npm/npx in a terminal, not crew input. For a complete example, see the [todo walkthrough](TODO_WEBSITE_WALKTHROUGH.md).
