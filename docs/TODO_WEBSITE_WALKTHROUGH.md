# Local Todo Website Walkthrough

[Back to README](../README.md)

[Complete command reference: purposes and examples](COMMANDS.md)

Build a local todo website with **Next.js, shadcn/ui preset `b0`, and browser `localStorage`**. Choose either one teammate or the coordinated crew flow below. Both must follow the generated design system.

## Result video

[Open or download `todo-result.mp4`](../video/todo-result.mp4).

<video controls preload="metadata" width="100%">
  <source src="../video/todo-result.mp4" type="video/mp4">
  Your Markdown viewer cannot play this video inline. [Open the video file](../video/todo-result.mp4).
</video>

Use **Next.js as the overall application framework** and **shadcn/ui preset `b0` for the interface components and design system**. Initialize them with `npx shadcn@latest init --preset b0 --template next` using the folder instructions below.

No application backend, database server, account system, or cloud service is needed. Next.js runs a local development server, while todo data stays in the browser. Downloading tools and installing dependencies requires internet access; the finished todo interface should not depend on remote APIs or assets at runtime.

## 1. Understand the two folders

Your workspace has sibling folders like this. The path is a generic example:

```text
C:\Projects\
  pongkan-crew\     The terminal crew tool and this walkthrough
  todo-app\         The website you will build
```

Create and run the website in `todo-app`. Launch Pongkan Crew from its own folder with `--folder ..\todo-app` so it works on the website.

All shell examples below work in Windows Command Prompt. In PowerShell, use `npx.cmd` and `npm.cmd` if execution policy blocks the `.ps1` launchers. For example, `npx.cmd shadcn@latest init --preset b0 --template next`.

## 2. Initialize Next.js

From a normal PowerShell terminal inside the empty `todo-app` folder, run only this setup command:

```powershell
npx.cmd create-next-app@latest . --use-npm --yes
```

The dot installs Next.js directly in the existing folder. Wait for setup to finish successfully before opening Pongkan Crew. If it reports conflicting files, stop and inspect them; do not overwrite existing work.

This command creates Next.js and installs its dependencies. It does **not** install shadcn/ui or preset `b0`. The first crew task below explicitly assigns that remaining setup to Developer, so there is no second manual setup command here.

The earlier shadcn new-project attempts failed with `dest already exists`; they are superseded by this Next.js-first flow. See the official [Next.js CLI reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and [shadcn existing-project guide](https://ui.shadcn.com/docs/installation/next).

## 3. Open Pongkan Crew for the website

From inside `todo-app`, run:

```cmd
node ..\pongkan-crew\src\cli.js --folder .
```

Or, from inside `pongkan-crew`, run:

```cmd
node .\src\cli.js --folder ..\todo-app
```

These launch the same target. Pick the command matching your current folder. Inside the app, confirm it:

```text
/folder
/crew list
```

The active folder should end in `todo-app`, not `pongkan-crew`.

A new folder has Chief, Researcher, Developer, and Reviewer. That small crew is enough. If you want the web specialists instead, preview and apply them before assigning work:

```text
/preset show web
/preset apply web
```

Applying replaces the current crew and archives its conversations. Finish or cancel outstanding work first. The examples below use the **default crew**; with `web`, replace `developer` with `frontend-dev`, `reviewer` with `qa-reviewer`, and `chief` with `project-lead`.

Commands and messages below go inside Pongkan Crew, one line at a time. Press Enter after each line; do not paste an entire multi-line block as a single message.

Tab cycles through individual teammates and then Crew Chat; Shift+Tab cycles backward. Crew Chat appears below the teammates in the sidebar. Enter the `/task` prompt in Chat (for example at `chief>`); the lead coordinates assignments and review. F2 still cycles Chat, Crew Chat, and Activity. Tab completes commands or mentions when the input starts with `/` or `@`.

## 4. Requirements and design rules

The todo website should:

- Add, edit, complete, and delete todos.
- Filter All, Active, and Completed; show the remaining count.
- Reject blank titles and safely display user-entered text.
- Restore saved todos after refresh using browser `localStorage`.
- Preserve invalid stored data for recovery, show storage errors, and never claim a failed save succeeded.
- Use accessible controls, visible keyboard focus, clear empty states, and responsive layouts.
- Keep todo data local. No backend endpoints, database server, login, cloud sync, analytics, or remote runtime services.

The implementation must follow the initialized **shadcn `b0` design system**:

- Read `components.json`, the generated global CSS, layout, and existing UI components before editing.
- Reuse its theme tokens, typography, spacing conventions, radius, icons, and supported variants. Do not invent a replacement palette or overwrite the preset with a different theme.
- Use shadcn components where appropriate, such as Button, Input, Checkbox, Card, Tabs, Dialog, Label, and Alert. Add only the components the design needs using the project's package manager.
- Prefer semantic theme utilities such as `bg-background`, `text-foreground`, and `border-border` over arbitrary color values.
- Keep interactions and todo persistence in an appropriate Next.js client component. Access browser storage after mounting, and avoid overwriting saved todos with the initial empty state before loading finishes.
- Keep generated fonts locally served at runtime. Do not add remote font links or remote placeholder images; document any font download needed during setup or build.
- Verify design consistency, keyboard behavior, persistence, and reported build/test results. Include exact run instructions in the website's README.

`localStorage` belongs to a browser profile and origin. Use the same address and port when returning. Another browser or port, private browsing, or clearing site data may show different or no todos. This is not cross-device sync or a backup system.

## 5. Choose how to communicate

| Goal | Command | Effect |
| --- | --- | --- |
| Talk to one implementer | `/chat developer`, then a normal message | Developer can implement changes |
| Assign without switching | `/send developer YOUR_TASK` | Queues an implementation task |
| Ask one shared-context question | `@developer YOUR_QUESTION` | One read-only reply in Crew Chat |
| Discuss with all members | `/discuss YOUR_TOPIC` | Two read-only rounds, then a lead summary |
| Have the crew build and review | `/task YOUR_GOAL` | Lead assigns relevant members, then review and summary |
| Pass the latest answer to someone | `/handoff reviewer YOUR_REQUEST` | Routes the selected teammate's latest answer |

Mentions and discussions are conversations. Send a normal task or `/task` to implement decisions. A coordinated task selects relevant specialists; the presence of backend or database roles does not mean they must be used.

## Option A: work with one teammate

Select Developer, then send this brief as one message:

```text
/chat developer
Build a local-only todo website in this initialized Next.js project. First inspect components.json, generated global CSS, layout, and UI components. Follow the existing shadcn/ui b0 design system: preserve its theme tokens, typography, radius, icons, and variants; use semantic theme utilities and shadcn components for controls. Add only needed components. Support add, edit, complete, delete, All/Active/Completed filters, and a remaining count. Reject blank titles and safely render user text. Persist with browser localStorage in an appropriate client component, load after mounting, and prevent initial empty state from overwriting saved todos. Preserve invalid stored data for recovery and visibly report storage failures. Make the UI responsive and keyboard accessible. No backend endpoints, database server, login, cloud sync, analytics, or remote runtime assets/services. Do not reinitialize shadcn or replace the b0 theme. Include exact npm run dev instructions and a verification checklist in README.md. Run available relevant checks and report any browser checks you cannot perform.
```

Wait for the reply. You can then request a focused improvement:

```text
Add Clear completed with an appropriate confirmation dialog, using the existing shadcn components and theme. Preserve local-only saving and verify the affected behavior.
```

For independent review, while Developer is selected:

```text
/handoff reviewer Review the actual todo website against the brief. Check shadcn b0 design consistency, semantic tokens, component usage, client hydration, localStorage persistence and failure handling, accessibility, and run instructions. Report concrete issues and unperformed checks; do not edit files.
/chat reviewer
```

Wait for the review. To send its findings back for fixes:

```text
/handoff developer Fix confirmed review findings. Preserve the initialized shadcn b0 design system and browser-only storage, then verify the changed behavior.
/chat developer
```

## Option B: first crew task after Next.js setup

After the single manual Next.js setup command succeeds, launch Pongkan Crew as described in section 3. Paste this as one message in Chat, for example at `chief>`. The crew handles shadcn preset `b0`, missing dependencies, implementation, and review:

```text
/task Build a local todo website in this existing Next.js project. Chief: assign setup, implementation, documentation, and checks together to Developer, followed by independent Reviewer review. Inspect existing files first. Initialize shadcn with npx.cmd shadcn@latest init --preset b0 if components.json is missing; do not recreate Next.js or create a nested folder. Install missing dependencies. If npm encounters sandbox EPERM, request command-specific escalated execution through the approval mechanism. Preserve the generated b0 theme and reuse shadcn components. Implement add, edit, complete, delete, All/Active/Completed filters, remaining count, blank-title rejection, responsive layout, and keyboard access. Save todos in browser localStorage with safe startup, invalid-data preservation, and visible storage errors. No backend, database, login, cloud sync, or remote runtime assets. Preserve existing work and .pongkan-crew. Document run instructions in README.md, run relevant checks, and independently review. Report actual results and unperformed checks. If blocked, report the exact command, error, and minimum user action. Do not commit, push, deploy, or change system permissions.
```

Use `/activity` to follow progress. A completed workflow means its turns finished; inspect the review and lead summary to confirm delivery. Shadcn initialization and the website remain unverified until the crew reports actual results.

## Option C: discuss with the crew, then build

### Discuss the todo app after Next.js setup

Next.js setup was reported complete by the user. Before assigning implementation, paste this as one message inside Pongkan Crew to plan the todo app in Crew Chat:

```text
/discuss Next.js setup is complete. Plan our local todo app using shadcn/ui preset b0 and browser localStorage. Discuss the layout, add/edit/complete/delete interactions, All/Active/Completed filters, remaining count, accessibility, and safe persistence. Each teammate should contribute from their role. Chief, summarize the agreed plan, unresolved questions, and implementation handoff. Do not edit files or install anything yet.
```

Discussion result (user-supplied Chief summary): the crew agreed on a responsive b0 todo interface, trimmed nonblank titles, newest-first ordering, direct deletion, Enter to save edits, Escape to cancel, distinct empty states, and a global remaining count. Editing preserves IDs and completion. Storage key: `pongkan-todo:v1`; format: `{ version: 1, todos: [{ id, title, completed }] }`. Validate the envelope, unique nonempty IDs, titles, and completion flags. Load after mount and block persistence until validation completes. Preserve invalid/unsupported data until explicit reset, offer optional raw-data download, and keep in-memory tasks usable with an unsaved notice on storage failure.

Retry reconciliation: if current tasks changed and valid stored tasks exist, leave saving disabled until the user chooses Keep current tasks or Load stored tasks, with replacement consequences explained. Keeping current tasks explicitly authorizes overwriting stored tasks; Cancel preserves both collections and leaves current tasks unsaved. Missing storage retains current tasks and resumes saving; invalid data enters recovery. Require labeled keyboard-accessible controls, exposed selection/completion states, visible focus, and predictable focus restoration. No product decisions remain open. No files or runtime behavior were verified during discussion; implementation and independent review are next.

To assign implementation, enter `/chat chief` inside Pongkan Crew. At the `chief>` input in the **Chat** tab, paste the full `/task ...` prompt below as one message and press Enter. Chief coordinates Developer's implementation, independent Reviewer review, and the final summary. With the web preset, use `/chat project-lead` instead. Then enter `/activity` to follow progress.

The prompt repeats the discussion decisions because `/task` does not automatically inherit Crew Chat:

```text
/task Implement the agreed todo plan in this existing Next.js project. Chief: use one Developer assignment for inspection, setup if needed, implementation, documentation, and checks, followed by independent Reviewer review. Inspect package.json, components.json, CSS, layout, UI components, and available local Next.js docs. If shadcn is missing, initialize the existing project with npx.cmd shadcn@latest init --preset b0; do not recreate Next.js. Install missing dependencies using the existing package manager. Request command-specific escalation if sandboxed npm fails with EPERM. Preserve the generated b0 theme and use appropriate shadcn components and semantic tokens. Implement add/edit/complete/delete, newest-first order, trimmed nonblank titles, All/Active/Completed filters, distinct empty states, and a global remaining count. Delete directly; Enter saves edits and Escape cancels; editing preserves IDs and completion. Use localStorage key pongkan-todo:v1 and JSON envelope { version: 1, todos: [{ id, title, completed }] }; validate the envelope, unique nonempty IDs, nonblank titles, and boolean completion. Load after mount and prevent writes before validation finishes. Preserve malformed or unsupported data until explicit reset and offer raw-data download. Keep in-memory tasks usable with a visible unsaved notice on storage failures. On retry, if current tasks changed and valid stored tasks exist, keep saving disabled until an explicit Keep current tasks or Load stored tasks choice; explain replacement consequences. Keep current tasks authorizes overwriting stored tasks; Cancel preserves both collections and leaves current tasks unsaved. Missing storage keeps current tasks and resumes saving; invalid data enters recovery. Make the interface responsive and keyboard accessible with labels, exposed selection/completion states, visible focus, and predictable focus restoration. No backend, database, login, cloud sync, or remote runtime assets. Preserve existing work and .pongkan-crew. Document run commands and storage behavior in README.md. Run relevant checks and independently review interactions, accessibility, reload persistence, recovery, reconciliation, and storage failures; report actual results and unperformed browser checks. If blocked, stop dependent implementation and report exact commands, errors, and minimum user action. Do not commit, push, deploy, or change system permissions/configuration.
```

Implementation result (user-supplied Chief summary): Developer reported implementing the agreed interactions, `pongkan-todo:v1` storage, recovery, download/reset, and retry reconciliation. Reported changes include `components/todo-app.tsx`, `lib/todos.ts`, `next-env.d.ts`, `playwright.config.ts`, storage/browser tests, README.md, and HANDOFF.md. The b0 theme was reportedly retained, dependencies were present, and no backend or remote runtime assets were added.

Developer reported 28 desktop/mobile browser checks, lint, and TypeScript passing. Earlier five storage tests and production build reportedly passed; those were not rerun after documentation/test-only updates. Reviewer independently reported five storage tests, lint, TypeScript, and an in-memory recovery harness passing, with no concrete functional defects found. Independent browser/build checks, screen-reader, physical-device, and Firefox/WebKit checks remained unperformed; dependency advisories remained unresolved. Multi-tab writes use last-write-wins, a documented limitation. The assistant subsequently read the actual package.json and README.md: the dev script is `next dev`, and README documents the implementation and storage contract. The assistant has not independently run the app or these checks.

Next user step: open a separate terminal in `todo-app`, run `npm.cmd run dev`, and open the local URL printed by Next.js. Keep the server running and manually check add/edit/complete/delete, filters/count, refresh persistence, keyboard focus, and narrow-screen layout. Dependencies were reported installed; do not reinstall or reinitialize by default. Port 3100 belongs to browser test execution; the development server normally uses port 3000 or the next available port.

### Latest independent review and README correction

User-supplied Reviewer and Chief summaries report the production build, lint, TypeScript, five storage tests, and all 28 Chromium desktop/mobile checks passed after moving `shadcn@4.21.4` to `devDependencies`. This changes audit classification, not the affected version: the production-only npm audit reports 0 findings; the full development-inclusive audit still reports 9 high entries from the unresolved `braces@3.0.3` advisory. The reviewer found no concrete application defect, but identified a stale paragraph in `README.md` (reported at line 58) claiming 7 production findings and that manifests remain unchanged. The exact counts and updated dependency placement are recorded in `DEPENDENCY-ASSESSMENT.md` and `HANDOFF.md`; update README to match those current files. These are teammate-reported checks, not independently rerun here. Screen-reader, physical-device, Firefox, and WebKit checks remain unperformed. No command was reported blocked or denied.

To fix the documentation, enter `/chat chief` in Pongkan Crew. At the `chief>` prompt in Chat, paste the following as one message:

```text
/task Update README.md to match the latest dependency assessment and handoff. Inspect package.json, package-lock.json, DEPENDENCY-ASSESSMENT.md, HANDOFF.md, and the README paragraph around line 58. Correct only stale audit counts/classification: shadcn is now a build-time devDependency; npm audit --omit=dev reports 0 findings, while the full audit reports 9 high development-tooling findings from unresolved braces@3.0.3. Explain that moving shadcn changed production audit scope but did not fix the development advisory. Preserve current package versions and the b0 app. Reviewer: independently confirm README matches the assessment and report any remaining stale statement. Do not change dependencies, application code, or permissions; do not commit or deploy.
```

Afterward, capture the updated README text and reviewer result here. The unresolved advisory is a development-tooling risk without an identified compatible patched version; it is not a blocked app run. Keep the unperformed platform/accessibility checks listed separately.

Follow-up result (user-supplied Chief summary): README now reports the current package classification and audit split; Reviewer independently confirmed it. No dependencies, lockfile, app source, or tests changed for the README correction, and no tests were rerun. The reviewer noted that older audit figures remain in historical sections of `HANDOFF.md` and `DEPENDENCY-ASSESSMENT.md`, though later sections supersede them. Read-only inspection confirms those older statements are still present. For a clean handoff, send a documentation-only follow-up to Developer to mark earlier audit counts as historical/superseded and put current status prominently at the top of both files, then ask Reviewer to confirm. No app defect or implementation blocker is currently reported.

Suggested final documentation cleanup, from Chat at `chief>`:

```text
/task Clean up dependency status history in HANDOFF.md and DEPENDENCY-ASSESSMENT.md. Inspect the complete documents and current package.json/lockfile first. Clearly label chronological sections and superseded findings as historical; put the current audit state near the top: shadcn@4.21.4 is a build-time devDependency, production-only npm audit has 0 findings, and the full audit has 9 high development-tooling entries through unresolved braces@3.0.3. State that reclassification changes production audit scope but does not fix the development advisory. Preserve detailed historical evidence and source references; do not alter dependencies, app code, or README.md. Reviewer: confirm a reader can distinguish current status from prior 7-production-finding results. Documentation only; do not run unrelated checks, change permissions, commit, or deploy.
```

Start with a read-only discussion:

```text
/discuss Plan a local-only todo website in our initialized Next.js project using the existing shadcn/ui b0 design system. Discuss add/edit/complete/delete, filters, remaining count, accessible responsive UI, theme-token and component consistency, localStorage loading after mount, invalid data recovery, and storage failures. No backend, database server, login, cloud sync, or remote runtime services. Choose only relevant specialists and define handoffs and verification. Do not implement or reinitialize shadcn yet.
```

The discussion opens Crew Chat automatically. Press F2 to cycle Chat, Crew Chat, and Activity; Shift+F2 cycles backward. Group replies stay in Crew Chat, separate from your direct teammate conversations. Wait for the discussion to finish before a directed follow-up:

```text
@developer How will you preserve the generated b0 design system and load localStorage safely without hydration issues or overwriting existing todos?
```

Then assign implementation. `/task` does not automatically copy Crew Chat into its planning prompt, so this assignment repeats the requirements:

```text
/task Build and independently review a local-only todo website in this initialized Next.js project. Inspect components.json, generated global CSS, layout, and UI components first. Follow the existing shadcn/ui b0 design system with its tokens, typography, radius, icons, and variants. Use semantic theme utilities and appropriate shadcn controls; add only needed components. Do not reinitialize shadcn or replace its theme. Implement add/edit/complete/delete, All/Active/Completed filters, and a remaining count. Reject blank titles and safely render text. Use browser localStorage in a client component: load after mounting, prevent initial empty-state overwrites, preserve invalid data for recovery, and visibly handle failed saves. Make the UI responsive and keyboard accessible. No backend endpoints, database server, login, cloud sync, analytics, or remote runtime assets/services. Assign only relevant members; include design-system and persistence review, exact npm run dev instructions in README.md, verification results, and unresolved or unperformed checks.
```

A default-crew workflow ends with Chief's summary. A web-preset workflow ends with Project Lead's summary. Inspect the review: completion means the steps ran, not that all issues were resolved.

## 6. Follow progress

The CLI uses direct keyboard input. Mouse and wheel handling are disabled after an input-freeze report; use PgUp/PgDn to scroll, Tab/Shift+Tab for teammates and Crew Chat, and F2 for views. Restart the CLI to load this change. Syntax validation and all 89 automated tests passed; interactive typing in the user's Command Prompt still needs confirmation.

### Discuss the first setup attempt

Observed results from the first attempt (reported in the crew's replies): Researcher inspected the target folder; Developer reported creating only README.md; no Next.js app, package manifest, or generated shadcn theme was present. Node/npm initialization attempts failed with `EPERM: operation not permitted, lstat '<user profile directory>'`. Reviewer could not verify application behavior, and Chief reported that the website was not built. These are reported results from the session, not an independent verification of the target folder. The `/task` results appeared in individual chats; Crew Chat remained empty because no shared discussion had been started.

To discuss that attempt, paste this as one message inside Pongkan Crew. `/discuss` opens Crew Chat automatically:

```text
/discuss Review our most recent todo website workflow and discuss what actually happened. First consult available saved task and workflow records plus current project files; do not assume individual chat histories are included in this discussion. The reported outcome was that only README.md was created, no Next.js app or shadcn b0 theme was generated, and setup/npm commands failed with EPERM: operation not permitted, lstat <user profile directory>. Have relevant teammates explain attempted work, evidence, handoffs, and unperformed checks. Distinguish observed failures from hypotheses about sandbox permissions, filesystem access, or tool configuration; do not claim a root cause without evidence. Discuss why dependent implementation/review steps continued after setup failed and whether their reports accurately described the blocked outcome. Agree on the smallest recovery steps, which steps require me to run commands in a normal terminal, and the checks needed before implementation resumes. Preserve Next.js, shadcn/ui preset b0, browser-only localStorage, existing files, and the original requirements. Do not edit files, install dependencies, retry initialization, or change permissions/configuration during this discussion. End with an agreed action list, unresolved questions, and a proposed continuation prompt; clearly state any records you could not access.
```

Discussion result (checked against `todo-app/README.md` and saved state): workflow `6f4b6c76` and discussion `34ece2a0` are marked completed, but the website remains unimplemented. Direct directory inspection found only README.md and `.pongkan-crew`. Saved results report three initialization failures, with README creation between attempts and the third attempt after review. No app checks ran. The discussion accepted the storage behavior contract; storage key and format remain undecided. Historical EPERM reports do not establish a root cause.

The workflow continued because blocked setup was reported in a successfully completed assistant turn. The scheduler checks task status, not whether the response describes an unmet prerequisite. A completed workflow therefore does not establish successful delivery.

The discussion's concern about Developer being read-only is expected for Crew Chat: discussion tasks force read-only access for every member. Saved roster settings still give Developer write access for implementation tasks. No permission change is required based on that discussion alone.

Agreed next step: run `npx.cmd shadcn@latest init --preset b0 --template next` in a normal terminal inside `todo-app`, capture output and choices, preserve existing work, and stop if setup requires nesting or overwriting. Actual installer prompts and successful setup remain unverified. Then request implementation and independent review with `/task`; discussion alone does not resume implementation. The user also confirmed that removing the mouse/input helper resolved the terminal input freeze.

```text
/activity
/queue list
/progress developer
/changes
/diff
```

Use `/group` for discussion replies, `/chat developer` for implementation replies, and `/chat chief` for the default crew's final summary. With the web preset, use `/progress frontend-dev`, `/chat frontend-dev`, and `/chat project-lead` instead.

If dispatch says PAUSED, inspect `/queue list`, then `/queue resume`. Resume starts all queued tasks, including old assignments. Cancel unwanted work with `/queue cancel TASK_ID`. `/stop` in Crew Chat ends its discussion; `/stop all` cancels work and pauses dispatch. Stopping does not revert file edits.

Discussions may produce replies without running npm. Implementation may run npm to install needed components or verify the app. Replies appear when each turn finishes.

## 7. Run the website in a second terminal

### Finish verification and assess dependency advisories

New crew controls: restart Pongkan Crew to load them; no conversation reset is needed. `/questions on` (default) lets an implementation/review task ask for a material missing requirement. Use `/questions list`, then `/answer TASK_ID YOUR_REPLY` to continue that same task and workflow. `/questions off` tells future turns to make routine choices autonomously. Existing waiting tasks still need an answer or cancellation, and operating-system approval decisions remain separate. Shared task instructions now request scoped escalation on sandbox failures and an explicit blocker signal to stop dependent workflow work. This reduces repeated prompting but does not guarantee approval, third-party noninteractive setup, or unavailable device checks. All 101 automated tests passed; live question/answer behavior in the user's terminal remains to be confirmed.

Pongkan Crew currently explicitly launches Developer with `workspace-write` and Reviewer with `read-only`, using `on-request` approvals and automatic approval review. Selecting full access in another Codex session does not automatically replace these child-process arguments. Existing approval should be used when applicable; a rejected or differently scoped action can still need approval. Browser tests and builds create generated artifacts, even when application source is not edited. Reviewer should request a scoped exception for those commands while preserving its no-source-edit role. No new permission UI or full-access mode has been implemented here.

At `chief>` in Chat, use:

```text
/task Finish the remaining todo verification and dependency assessment. Reviewer: independently run the documented production build and browser suite. I authorize the local test server and generated artifacts required by these checks, including .next, test-results, playwright-report, and browser test downloads/cache where needed; do not edit application source or package manifests. Use existing applicable approvals and request command-specific escalation only when required. If approval is denied or unavailable, report the exact command, denial, and affected check. Developer: assess current dependency advisories, report affected packages, applicability and compatible fixes, apply justified compatible updates, and rerun affected checks; do not force major upgrades. Reviewer: independently verify any dependency changes. Chief: distinguish confirmed defects, dependency findings, documented multi-tab limitations, and checks requiring screen-reader/physical-device or unavailable browser access. Update the local handoff through Developer and report what remains unverified. Do not commit, push, deploy, or change global permissions.
```

Result: pending. Existing evidence does not establish that every unperformed check was caused by sandbox denial; obtain exact failures before changing permissions.

Open another terminal in `todo-app`. Keep Pongkan Crew in its own terminal. Follow the generated website README; for the npm-based Next.js template, the development command is:

```cmd
npm run dev
```

Use `npm.cmd run dev` in PowerShell if script execution is blocked. If dependencies were not installed during setup, install them with `npm install` first. Open the local URL printed by the server, usually `http://localhost:3000`. Keep that terminal running while using the website. If the port changes, browser storage belongs to the new origin and your existing todos may not appear there.

Check the following:

1. Add two todos, edit one, and complete the other.
2. Check all filters and the remaining count.
3. Refresh: saved todos and completion states remain.
4. Delete a todo and refresh: it stays deleted.
5. Try a blank title and `<b>example</b>`: blank input is rejected and markup displays as text.
6. Navigate with the keyboard and resize the window.
7. Confirm buttons, inputs, dialogs, colors, typography, and focus styles follow the generated shadcn design system.
8. Verify storage failure and invalid-data behavior using a disposable browser profile or appropriate tests.
9. Reopen the same local URL in the same profile: saved todos remain.

Ask the crew to fix reproducible issues with the exact behavior observed. Inspect `/diff` before retrying interrupted tasks because retries can repeat edits.

## 8. Add a backend only if the scope changes

The original sample needs none. Shared todos across users/devices or server-side account permissions change the requirements and may justify one. A bigger local dataset may call for different browser storage without adding a backend.

Discuss a changed scope before implementation:

```text
/discuss The todo website now needs shared data across devices. Compare options, explain why localStorage alone cannot satisfy this requirement, and propose the smallest backend and migration plan while preserving the shadcn b0 design system. Do not implement or deploy yet.
```
