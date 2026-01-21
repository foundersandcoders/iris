---
description: "{{ Iris • Haiku }} Generate a work record summarizing today's development session"
model: claude-haiku-4-5
---

<task overview="Create a work record by analyzing today's git commits, code changes, and session context.">
    <template location="~/.claude/doc-templates/work-record.md" />
    <steps>
    1. Read the work record template from ~/.claude/doc-templates/work-record.md
    2. Establish period of work you need to cover
        - Check docs/work-records/ to see when last work record was created
        - Check date and time now
    2. Analyze relevant work work:
        - Git commits on main (and branches merged into main)
        - Diffs for each commit
        - Files changed and time patterns
    3. Ask user for context git doesn't capture (ONLY if necessary - this is a burden to the user):
        - Main/secondary goals
        - Session duration
        - Challenges and how they were resolved
        - Next steps
    4. Generate the work record following the template
    5. Suggest save location: docs/work-records/YYYY-MM-DD_HH-MM_[session-focus].md
    6. Show for approval; revise if needed
    </steps>
    <notes>
    - Focus on what was accomplished, not just what was committed
    - Include code snippets for significant changes
    - Tie work to larger goals when possible
    </notes>
</task>
