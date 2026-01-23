---
description: "{{ Iris • Haiku }} Create a status report that knows what you've done since the last one"
model: claude-haiku-4-5
disable-model-invocation: true
---
<task overview="Generate a project status report by analyzing the current state of the codebase, roadmaps, and recent work." destination="docs/status-reports/" >
<filename format="{PROJECT-REPORT-NUMBER}_{YY-MM-DD-HHMM}_{RECENT}.md" example="003_26-01-13-1545_xml-validation-added.md" >
| Component | Description | Example |
|-----------|-------------|---------|
| PROJECT-REPORT-NUMBER | 3-digit incrementing number across all reports | `001`, `002`, `015` |
| YY-MM-DD-HHMM | Date and time (24hr) | `26-01-13-1430` |
| RECENT | Most significant change, max 3 words, kebab-case | `csv-parser-complete` |
To determine PROJECT-REPORT-NUMBER, check existing reports in the output directory.
</filename>
<instructions>
1. **Read the roadmap** at `docs/roadmaps/mvp.md` to understand milestones and progress
2. **Check recent work records** in `docs/dev-log/work-records/` for recent activity
3. **Review git history** for recent commits and changes
4. **Identify blockers** from any TODO comments, failing tests, or documented issues
5. **Read the previous status report** in `docs/dev-log/status-reports/` to understand what was last reported as completed, in progress, and upcoming
</instructions>
<output-format template-path="~/.claude/doc-templates/doc/create/status-report.md">
Report should exactly mirror template structure.
</output-format>
<guidelines>
- **Brevity is paramount** - this is a status snapshot, not a changelog
- TL;DR must be exactly one sentence, big-picture only
- Maximum 5-6 completed items; group related work (e.g. "CSV parser with tests" not separate bullets)
- One line per in-progress milestone
- No implementation details (papaparse, RFC 4180, etc.) - just "CSV parser"
- No sub-bullets or nested lists
- Use British English
</guidelines>
</task>
