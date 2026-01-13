# Project Status Report

Generate a project status report for Iris by analyzing the current state of the codebase, roadmaps, and recent work. Save it to `docs/dev-log/status-reports/`

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
{ Brief summary of what's changed since last report in  and what's important to note }

---
## 2. Completed
- { List completed features, components, and milestones }
- { Include infrastructure, tests, documentation }

---
## 3. Radar
### 3a. In Progress
- { Current milestone with estimated completion percentage }
- { Active work items }

### 3b. Up Next
- { Upcoming tasks in priority order }
- { Features queued for implementation }

---
## 4. Blockers
{ List any blockers, or "None" if clear }
```

## Guidelines
- Keep the TL;DR to 2-3 sentences max
- Be specific about completion percentages where possible
- List completed items in rough chronological order (oldest first)
- Blockers should include actionable context if present
- Use British English
