# Pongkan Crew improvements

Implement the eight improvements authorized by the user: automatic coordination, folder locking, progress, queues, diff review, recoverable history, UI controls, and startup checks.

## Decisions

- Remain dependency-free on Node 22 with the existing Codex JSON event adapter.
- Acquire an exclusive folder lock before reading or saving application state in the CLI; report stale locks rather than guessing whether they are safe to remove.
- Persist tasks and workflows. On startup, mark unfinished execution as interrupted and leave queued work paused until explicitly resumed.
- Chief creates a bounded JSON plan using only current teammate names. Validate the complete plan before any worker runs. Execute its steps sequentially, review, and summarize; never recursively delegate.
- Preserve snapshots for remove/clear/new. Undo restores the latest snapshot only when no work is active or queued.
- Use Git for tracked and untracked text diffs where available; report missing Git/repository clearly. Keep views read-only and cap output.

## Ordered implementation

1. Foundation: folder lock, startup validation, state migration and archives. Verify two launches cannot share a lock, malformed state is preserved, and undo restores transcripts.
2. Tasks: durable scheduler, cancel/reorder/pause/resume, interruption handling, event progress. Verify one writer, queue ordering, and cancellation.
3. Coordination: validated plan, sequential handoffs, review and summary, failure/cancel behavior. Verify real scheduler with deterministic fake Codex responses.
4. Views: progress, task details, diffs and diagnostics. Verify temporary Git fixtures and command outcomes.
5. UI: autocomplete, searchable help, sidebar scrolling and input controls. Verify pure helpers plus interactive smoke checks.
6. Documentation and complete regression run. Live Codex checks remain optional and bounded.

## Risks

- AI plans can be malformed: reject invalid/oversized plans before dispatch.
- Reviews can observe changing files: workflow steps are sequential; standalone readers may still overlap edits.
- Crash recovery can repeat edits: never automatically rerun interrupted tasks.
- Diff output can contain terminal controls or large/binary content: sanitize and bound rendering.
- Stale locks and corrupt state must not cause data deletion: provide actionable errors and retain files.
