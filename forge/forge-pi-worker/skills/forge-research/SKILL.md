---
name: forge-research
description: Research public sources and deliver an evidence-backed brief with traceable URLs and a committed artifact.
---

Use this workflow for product, technical, or business research that needs current public evidence.

1. Turn the request into a small set of decision questions. Identify facts that would change the recommendation. Prefer the project's official documentation, source repository, release notes, pricing, or license before secondary commentary.
2. Use `sandbox_browser` to navigate and extract the relevant pages. Keep each source URL with the claim it supports. A page loading successfully does not prove that a feature works or is deployed.
3. Distinguish source statements, direct observations, and your inference. Record the release/version or date when it matters. If a source is inaccessible, state what remains unverified; do not fill the gap with assumed facts.
4. Write a concise brief with `sandbox_file`: conclusion, evidence, tradeoffs, and a practical next step. Include links and any compatibility or licensing condition that changes the decision. Use tables only for actual comparisons.
5. Commit the brief with `sandbox_artifact`. Report its returned path and the evidence limitations. Do not describe a local artifact as published or an untested integration as working.

Public navigation and extraction can proceed through the supplied browser tool. Interactions that change an external system follow Forge's approval response. A blocked or pending tool result is not permission to reproduce the action using another path.
