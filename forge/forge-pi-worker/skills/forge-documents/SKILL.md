---
name: forge-documents
description: Create and verify Markdown, PDF, or spreadsheet deliverables in the Forge workspace.
---

Use this workflow when the requested outcome is a readable document or a spreadsheet file.

1. Identify the recipient, requested format, required source material, and deliverable. Reuse provided facts; mark assumptions in the artifact when they affect its meaning. Avoid including credentials or unnecessary personal information.
2. For prose, write the complete content with `sandbox_file`. Use clear headings, sensible tables, and source links. For a PDF, call `sandbox_document` with `operation: "render_markdown_pdf"`, `sourcePath`, and `outputPath` after the Markdown is complete.
3. For tabular data, use `sandbox_document` with `operation: "create_spreadsheet"`, a relative `path`, and `rows` containing consistent column names. Keep units and date formats explicit. Read an existing workbook using `operation: "inspect_spreadsheet"`; its preview covers at most 50 rows per sheet, so do not call it a complete row-level audit.
4. Verify the output actually exists with `sandbox_file` stat. Inspect spreadsheets again after creation. Check calculations against the supplied inputs and state whether verification was structural or visual. The document tool's successful response alone does not prove every PDF page has been visually reviewed.
5. Commit each finished deliverable with `sandbox_artifact`. Use the returned bytes, hash, path, and title as the delivery receipt. If the requested format is unsupported, deliver a useful supported format and state the limitation rather than renaming a file extension.

Paths are relative to the persistent workspace. Google Drive import or writeback remains a Forge-controlled operation; a local file or committed artifact does not mean a Drive upload has occurred.
