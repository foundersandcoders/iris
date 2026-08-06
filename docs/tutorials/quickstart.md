# Getting started with Iris

A first-time walkthrough for anyone submitting ILR data, no development experience required. If you're comfortable with the terminal already and just want the full workflow reference, see [workflows.md](workflows.md) instead.

## What you need before you start

- A CSV export of your learner data.
- Iris installed and runnable as the `iris` command. Ask whoever manages your team's tools for the install steps, or see the [README](../../README.md#quick-start) if you're setting it up yourself.

## 1. Launch Iris

Open a terminal and run:

```bash
iris
```

![Hello, Iris](../assets/hello.gif)

You'll land on the dashboard. Everything in Iris starts here: use the arrow keys to move between options and `Enter` to pick one.

## 2. Convert your CSV to an ILR submission

From the dashboard, select **Convert CSV to ILR XML**.

![Convert workflow](../assets/convert.gif)

1. Use the file picker to choose your CSV export.
2. Iris reads the file and checks it against the expected column layout automatically, you don't need to reorder or rename anything by hand.
3. Watch the progress through Parse → Validate → Generate → Save, each step completes on its own.
4. When it finishes, the **Conversion Complete** screen shows where the output XML file was saved, how many learners it covers, and how long the conversion took.

If everything on this screen looks right, your submission file is ready and you can skip to [step 4](#4-submit-your-file). If Iris found problems with the data, it'll route you to the validation explorer instead, covered next.

## 3. Resolve issues

Sometimes a CSV has gaps or inconsistencies Iris can't safely resolve on its own — missing fields, values that don't match the expected format, and similar issues. When that happens, you land on the interactive validation explorer instead of the completion screen.

![Validate workflow](../assets/validate.gif)

1. Issues are listed with a severity marker, most serious first.
2. Filter the list by severity if you want to work through blockers before warnings.
3. Select an issue to see exactly which row and field it affects, and why Iris flagged it.
4. Fix the problem in your source CSV, then re-run **Convert** from the dashboard. There's no in-place editing inside Iris — the CSV is always the source of truth.

Repeat this until conversion completes cleanly.

## 4. Submit your file

Iris doesn't submit to ESFA on your own behalf — that step happens through ESFA's own submission portal using the XML file Iris generated. Before you send it, it's worth running one more check.

![Cross-submission check workflow](../assets/check.gif)

1. From the dashboard, select **Cross-Submission Check**.
2. Pick your new submission, then the previous one you're comparing it against.
3. Iris compares the two and flags anything that looks off — a sudden drop in learner count, a schema mismatch, and similar red flags that are easy to miss by eye.
4. Review the results in the two-pane view (`Tab` and the arrow keys to navigate). Nothing here blocks you from submitting — it's a second pair of eyes before you do.

Once you're satisfied, upload the generated XML file through ESFA's submission portal as usual.

## Where to go next

- [workflows.md](workflows.md) has fuller reference detail on all four workflows, including the Mapping Builder for teams using a non-standard CSV layout.
- The [README](../../README.md) covers installation and the full feature set.
