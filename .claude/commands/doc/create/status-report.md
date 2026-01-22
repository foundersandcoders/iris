---
description: "{{ Iris • Haiku }} Create a status report that knows what you've done since the last one"
argument-hint: [version number]
model: claude-haiku-4-5
disable-model-invocation: true
---

# Project Status Report

Generate a project status report for Iris by analyzing the current state of the codebase, roadmaps, and recent work. Save it to `docs/status-reports/`

## Filename Format

`{PROJECT-REPORT-NUMBER}_{YY-MM-DD-HHMM}_{RECENT}.md`

| Component | Description | Example |
|-----------|-------------|---------|
| PROJECT-REPORT-NUMBER | 3-digit incrementing number across all reports | `001`, `002`, `015` |
| YY-MM-DD-HHMM | Date and time (24hr) | `26-01-13-1430` |
| RECENT | Most significant change, max 3 words, kebab-case | `csv-parser-complete` |

**Example:** `003_26-01-13-1545_xml-validation-added.md`

To determine PROJECT-REPORT-NUMBER, check existing reports in the output directory.

## Instructions
1. **Read the roadmap** at `docs/roadmaps/mvp.md` to understand milestones and progress
2. **Check recent work records** in `docs/dev-log/work-records/` for recent activity
3. **Review git history** for recent commits and changes
4. **Identify blockers** from any TODO comments, failing tests, or documented issues
5. **Read the previous status report** in `docs/dev-log/status-reports/` to understand what was last reported as completed, in progress, and upcoming

## Output Format
Generate a report in this exact format:

```markdown
# Iris Status Update
## 1. TL;DR
{ One sentence: what changed and where we are now }

---
## 2. Completed
- { High-level features only, 3-6 bullets max }

---
## 3. Radar
### 3a. In Progress
- { Current milestone with percentage, one line }

### 3b. Up Next
- { 2-4 upcoming tasks, brief }

---
## 4. Blockers
{ "None" or brief list }
```

## Guidelines
- **Brevity is paramount** - this is a status snapshot, not a changelog
- TL;DR must be exactly one sentence, big-picture only
- Maximum 5-6 completed items; group related work (e.g. "CSV parser with tests" not separate bullets)
- One line per in-progress milestone
- No implementation details (papaparse, RFC 4180, etc.) - just "CSV parser"
- No sub-bullets or nested lists
- Use British English
