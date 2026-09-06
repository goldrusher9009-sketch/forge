---
name: forge-planning
description: Track a bounded multi-step task with explicit deliverables, dependencies, and completion evidence.
---

Use a plan when the task has meaningful dependencies or several independently verifiable deliverables. Skip planning overhead for a one-step request.

Use `forge_plan` with `operation: "replace"` to record three to seven concrete steps. Give each step a stable `id`, a short `title`, and a status of `pending`, `in_progress`, or `completed`. Keep at most one step in progress. Frame steps as outcomes that can be checked, not vague activities such as "handle everything".

Use `operation: "update"` with a step's `id` as work progresses. A completed step requires a short `evidence` string identifying the observed result: a verified file, returned tool receipt, test result, or source finding. The plan records declared progress; it does not replace actual execution receipts or Forge run completion.

When an external action is waiting for approval, preserve the pending dependency and continue useful work that does not depend on it. Do not mark a step complete because approval was requested or because a model response said the action happened. If scope changes, replace the plan with an accurate remaining plan and explain the change briefly.

At delivery, name completed outputs and any unresolved dependency. Use only capabilities supplied in the current session; a plan does not install tools or authorize additional actions.
