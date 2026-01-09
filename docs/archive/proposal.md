# Iris: _ILR Toolkit_

## The Current State

*The existing ILR export process is fragile, difficult to inspect, and increasingly hard to operate.*

Founders and Coders currently uses an internal Electron application to convert learner data from Airtable into ILR-compliant XML for submission to the ESFA. > The tool produces the required output, but routine changes are risky. Column mappings depend on CSV position rather than headers, so reordering fields can alter the output without producing an explicit error. Validation confirms that the XML is structurally valid, but does not surface logical inconsistencies.

Operational friction has accumulated over time. macOS security and signing requirements complicate distribution, and the codebase relies on several unmaintained dependencies, including components with known memory-management issues. > As a result, the system is difficult to maintain and reason about when something goes wrong.

## What Iris Does

*Replaces the existing ILR export workflow with explicit validation and transformation logic.*

**Iris** is intended to replace the current tool. It ingests CSV exports and produces ILR-compliant XML suitable for submission, while making transformation and validation behaviour explicit and inspectable. Validation extends beyond format checks to identify logical inconsistencies.
Transformation logic that currently lives in Airtable formulas is moved into the tool itself. This reduces reliance on implicit spreadsheet behaviour and centralises business rules in a form that can be tested and changed without affecting data entry workflows.

## How It Works

*Uses header-based matching and a shared processing core to tolerate changes in input structure.*

Rather than assuming a fixed schema, **Iris** interprets input data using column headers. Columns can be renamed, reordered, or extended without breaking transformation logic. Constraints still exist, but they are enforced explicitly rather than implicitly through position.

The tool provides two interfaces built on the same processing core. Both invoke identical logic, ensuring consistency. The CLI supports automation and avoids some macOS distribution constraints, while the desktop interface makes the same functionality accessible to non-technical users.

The system is organised into discrete, testable components with clear boundaries. This structure allows future extensions, such as cross-file validation, without entangling them with the core workflow.

## Beyond the Core

*Optional extensions supported by the underlying design.*

If time permits, the system could support:

- cross-report consistency checking across submission periods
- a small declarative layer for defining transformation rules
- basic trend reporting and post-submission report prediction

These are not required for the core submission workflow, but are feasible without restructuring the system.

## Why It Matters

*Errors or uncertainty in ILR submissions have direct funding implications.*

The current process produces valid submissions most of the time, but offers limited visibility into how results are derived. When issues arise, it is difficult to identify whether the cause lies in the source data, the transformation logic or submission format.

**Iris** is designed to make this process easier to inspect and explain. Validation failures surface specific causes, and successful outputs can be traced back through the logic that produced them. For a workflow where mistakes carry real cost, the value lies in understanding and verifying the result, not just generating it.
