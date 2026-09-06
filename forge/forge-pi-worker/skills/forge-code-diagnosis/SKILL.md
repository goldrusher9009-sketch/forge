---
name: forge-code-diagnosis
description: Diagnose code supplied in the isolated workspace using concrete call paths and focused reproduction.
---

Use this workflow for a bug, failing command, or architecture question about code already supplied in the Forge workspace.

1. Inspect the actual workspace with `sandbox_file`. Establish the trigger, observed failure, relevant entry point, and expected behavior. Trace the shortest path from the entry point to the failing operation; distinguish the calling component from the component that owns the failure.
2. Use `sandbox_shell` for bounded local searches and focused reproductions. The shell has no direct network or host access. Prefer the project's existing commands when the required runtime is present. A missing dependency or runtime is a verification limitation, not evidence that the application is broken.
3. If the user requested a fix, make the smallest supported change through the supplied tools and run a focused check covering the actual failure. Preserve unrelated user files. For a research-only request, deliver findings without changing the supplied source.
4. Write a diagnostic note with `sandbox_file`: trigger, direct failure point, evidence with file paths/lines, proposed or actual fix, and the checks performed. Separate source evidence from runtime evidence. Do not claim deployment or production acceptance from a local reproduction.
5. Commit the final note and any requested output with `sandbox_artifact`. State checks that were blocked or not run. Publishing, pushing code, deploying, or changing a remote service remains subject to the available Forge capability and its approval state.
