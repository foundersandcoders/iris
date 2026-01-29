# Airtable Export → ILR XSD Mapping Analysis

**Purpose:** Map Founders and Coders Airtable export columns to ILR 2025-26 XSD schema fields, identifying required transforms and formula columns that should be replaced with Iris logic.

**Source Files:**
- Airtable CSV: `docs/inputs/25-26 Export.csv`
- XSD Schema: `docs/schemas/schemafile25.xsd`

---

## Learner-Level Mappings

### Required Fields (minOccurs ≥ 1)

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `LearnRefNumber` | `LearnRefNum` | 224 | `trim` | ⚠️ **Last column** - likely Airtable formula |
| `ULN` | `ULN` | 3 | `stringToInt` | Unique Learner Number (10 digits) |
| `Ethnicity` | `Ethnic group` | 9 | `stringToInt` | 2-digit code |
| `Sex` | `Sex ` | 6 | `trim`, `uppercase` | ⚠️ **Trailing space in column name** |
| `LLDDHealthProb` | `Primary additional needs` | 14 | `stringToInt` | Single digit code |
| `PostcodePrior` | `Prior post code` | 10 | `trim`, `uppercase`, `removeSpaces` | UK postcode format |
| `Postcode` | `Post code` | 11 | `trim`, `uppercase`, `removeSpaces` | UK postcode format |

### Optional Fields (minOccurs = 0)

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `PrevLearnRefNumber` | `PrevLearnRefNum` | 223 | `trim` | Previous learner reference |
| `PrevUKPRN` | `Previous UKPRN` | 2 | `stringToInt` | Previous provider UKPRN |
| `FamilyName` | `Family name` | 5 | `trim` | Max 100 chars, no digits |
| `GivenNames` | `Given name` | 4 | `trim` | Max 100 chars, no digits |
| `DateOfBirth` | `Date of birth` | 7 | `isoDate` | ISO 8601 date format |
| `NINumber` | `NI number` | 8 | `trim`, `uppercase`, `removeSpaces` | 1-9 chars |
| `TelNo` | `Telephone number` | 13 | `digitsOnly` | Digits only, 1-18 chars |
| `AddLine1` | *(derived from `Street address `)* | 12 | `parseAddress` | ⚠️ **Needs splitting logic** |
| `Email` | *(not in export)* | - | - | ❌ **Missing from export** |

### Fields Not in Export (Optional)

- `PMUKPRN` - Partnership UKPRN
- `CampId` - Campus identifier
- `Accom` - Accommodation status
- `ALSCost` - Additional learning support cost
- `PlanLearnHours` - Planned learning hours
- `PlanEEPHours` - Planned employability hours
- `MathGrade` - Maths grade
- `EngGrade` - English grade
- `AddLine2`, `AddLine3`, `AddLine4` - Additional address lines

### Complex/Repeating Child Elements

#### PriorAttain (Repeating, Optional)

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `PriorLevel` | `Prior attainment` | 16 | `stringToInt` | 2-digit code |
| `DateLevelApp` | `Prior attainment date applies to` | 15 | `isoDate` | Application date |

---

## LearningDelivery-Level Mappings

**Structure:** Each CSV row contains up to 5 aims (programme aim 1-5). Each aim maps to a separate `<LearningDelivery>` element.

### Programme Aim 1 (Columns 35-66)

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `LearnAimRef` | `Programme aim 1 Learning ref ` | 36 | `trim`, `uppercase` | 1-8 chars (e.g., ZPROG001) |
| `AimType` | `Aim type (programme aim 1)` | 35 | `stringToInt` | Single digit |
| `AimSeqNumber` | *(fixed: 1)* | - | `constant(1)` | ⚠️ **Generate in Iris** |
| `LearnStartDate` | `Start date (aim 1)` | 37 | `isoDate` | |
| `LearnPlanEndDate` | `Planned end date (aim 1)` | 38 | `isoDate` | |
| `FundModel` | `Funding module (aim 1)` | 39 | `stringToInt` | 2-digit code |
| `ProgType` | `Programme type (aim 1)` | 40 | `stringToIntOptional` | 2-digit code, optional |
| `StdCode` | `Apprentice standard (aim 1)` | 41 | `stringToIntOptional` | 5-digit code, optional |
| `DelLocPostCode` | `Delivery postcode (aim 1)` | 42 | `trim`, `uppercase`, `removeSpaces` | Required |
| `PHours` | `Planned hours (aim 1)` | 43 | `stringToIntOptional` | 0-9999 |
| `OTJActHours` | `Actual hours (aim 1)` | 44 | `stringToIntOptional` | On-the-job training actual hours |
| `ConRefNumber` | `Contract Ref (aim 1)` | 45 | `trim` | 1-20 chars, optional |
| `EPAOrgID` | `EPAO ID (aim 1)` | 46 | `trim` | End-point assessment org, 1-7 chars |
| `CompStatus` | `Completion status (aim 1)` | 61 | `stringToInt` | Single digit, required |
| `LearnActEndDate` | `Actual end date (aim 1)` | 62 | `isoDate` | Optional |
| `Outcome` | `Outcome (aim 1)` | 64 | `stringToIntOptional` | Single digit |
| `WithdrawReason` | `Withdrawal reason (aim 1)` | 65 | `stringToIntOptional` | 2-digit code |
| `AchDate` | `Achievement date (aim 1)` | 63 | `isoDate` | Optional |
| `OutGrade` | `Outcome grade (aim 1)` | 66 | `trim` | 1-6 chars, optional |

#### LearningDeliveryFAM (Repeating, Optional)

**Airtable Columns:**
- `Contract type (aim 1)` - Column 47
- `Date applies from (aim1)` - Column 49 (⚠️ typo: no space before 1)
- `Date applies to (aim 1)` - Column 50

**Mapping:**
| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `LearnDelFAMType` | `Contract type (aim 1)` | 47 | `trim` | 1-3 chars (e.g., "ACT") |
| `LearnDelFAMCode` | `Contract type code (aim 1)` | 48 | `trim` | 1-5 chars |
| `LearnDelFAMDateFrom` | `Date applies from (aim1)` | 49 | `isoDate` | Optional |
| `LearnDelFAMDateTo` | `Date applies to (aim 1)` | 50 | `isoDate` | Optional |

**Additional FAM entries:**
- `Funding indicator (aim 1)` (Column 51) / `Source of funding (aim 1)` (Column 52)

#### AppFinRecord (Repeating, Optional)

**Airtable has 2 financial records per aim:**

**Financial Record 1:**
| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `AFinType` | `Financial type 1 (aim 1)` | 53 | `trim` | 1-3 chars (e.g., "TNP") |
| `AFinCode` | `Financial code 1 (aim 1)` | 54 | `stringToInt` | 2-digit code |
| `AFinDate` | `Financial start date 1 (aim 1)` | 55 | `isoDate` | Required |
| `AFinAmount` | `Training price (aim 1)` | 56 | `stringToInt` | 0-999999 |

**Financial Record 2:**
| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `AFinType` | `Financial type 2 (aim 1)` | 57 | `trim` | 1-3 chars |
| `AFinCode` | `Financial code 2 (aim 1)` | 58 | `stringToInt` | 2-digit code |
| `AFinDate` | `Financial start date 2 (aim 1)` | 59 | `isoDate` | Required |
| `AFinAmount` | `Total assessment price (aim 1)` | 60 | `stringToInt` | 0-999999 |

### Programme Aims 2-5

**Same structure repeats for aims 2-5:**
- **Aim 2:** Columns 67-98
- **Aim 3:** Columns 99-130
- **Aim 4:** Columns 131-162
- **Aim 5:** Columns 163-194

**AimSeqNumber for each:**
- Aim 1: 1
- Aim 2: 2
- Aim 3: 3
- Aim 4: 4
- Aim 5: 5

---

## LearnerEmploymentStatus Mappings

**Structure:** Airtable has 5 employment status entries per learner (Employment #1-5).

### Employment Status #1 (Columns 18-26)

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `EmpStat` | `Employment status #1` | 19 | `stringToInt` | 2-digit code |
| `DateEmpStatApp` | `Employment #1 date applies to` | 18 | `isoDate` | Required |
| `EmpId` | `Employer identifier #1 ` | 20 | `stringToIntOptional` | 9 digits, optional |

#### EmploymentStatusMonitoring (Repeating, Optional)

**Note:** Airtable stores these as individual boolean/numeric columns:

| XSD Field | Airtable Column | Column # | Transform | Notes |
|-----------|-----------------|----------|-----------|-------|
| `ESMType` | *(derived)* | - | `constant("SEI")` | Self-employed indicator |
| `ESMCode` | `Is the learner self employed? #1` | 22 | `boolToInt` | Checkbox → 0/1 |
| - | - | - | - | - |
| `ESMType` | *(derived)* | - | `constant("EII")` | Employment intensity |
| `ESMCode` | `Employment intensity indicator #1` | 25 | `stringToInt` | Code |
| - | - | - | - | - |
| `ESMType` | *(derived)* | - | `constant("LOE")` | Length of employment |
| `ESMCode` | `Length of employment #1` | 24 | `stringToInt` | Months |
| - | - | - | - | - |
| `ESMType` | *(derived)* | - | `constant("LOU")` | Length of unemployment |
| `ESMCode` | `Length of unemployment #1` | 26 | `stringToInt` | Months |
| - | - | - | - | - |
| `ESMType` | *(derived)* | - | `constant("SEM")` | Small employer |
| `ESMCode` | `Small employer #1` | 21 | `boolToInt` | Checkbox → 0/1 |
| - | - | - | - | - |
| `ESMType` | *(derived)* | - | `constant("REI")` | Redundancy indicator |
| `ESMCode` | `Has the learner been made redundant? #1` | 23 | `boolToInt` | Checkbox → 0/1 |

⚠️ **This is complex Airtable formula logic that should move to Iris!**

### Employment Status #2-5

**Same structure repeats:**
- **#2:** Columns 27-34 + 195 (Length of unemployment #2)
- **#3:** Columns 196-204
- **#4:** Columns 205-213
- **#5:** Columns 214-222

---

## Airtable Formula Columns (Move Logic to Iris)

### Identified Formula Columns

1. **`LearnRefNum` (Column 224)**
   - **Purpose:** Generates learner reference number
   - **Likely logic:** Auto-increment or based on record ID
   - **Action:** Generate in Iris from row number or existing ID

2. **`PrevLearnRefNum` (Column 223)**
   - **Purpose:** Previous learner reference
   - **Likely logic:** Copy from previous submission or manual entry
   - **Action:** May be legitimate data field, needs verification

3. **`AimSeqNumber` (Not in export, should be columns per aim)**
   - **Purpose:** Sequence number for each learning delivery
   - **Logic:** Fixed values 1-5 for each aim
   - **Action:** Generate in Iris (1 for aim 1, 2 for aim 2, etc.)

4. **Employment Status Monitoring Type Codes**
   - **Current:** Likely hardcoded in Airtable formulas
   - **Action:** Generate in Iris based on which checkbox fields are populated

5. **Address Parsing** (`AddLine1-4` from `Street address `)
   - **Current:** Single text field in Airtable
   - **Action:** Split in Iris if needed (may not be essential for MVP)

---

## Column Name Issues

### Trailing Spaces
- `Sex ` (Column 6) - **Has trailing space**
- `Programme aim 1 Learning ref ` (Column 36) - **Has trailing space**
- `Street address ` (Column 12) - **Has trailing space**
- `Employer identifier #1 ` (Column 20) - **Has trailing space**
- `Small employer #2 ` (Column 33) - **Has trailing space**
- `Programme aim 5 learning ref ` (Column 164) - **Has trailing space**

### Inconsistent Capitalization
- Most aims use lowercase "aim" but XML uses uppercase patterns
- "Ethnic group" vs "Ethnicity" in XSD
- "Post code" vs "Postcode" in XSD

### Column Name Typos
- `Date applies from (aim1)` - **Missing space before 1**
- `Planned hours (aim2)` - **Missing space before 2**

---

## Required Transforms Summary

### String Transforms
- `trim` - Remove leading/trailing whitespace (apply to ALL string fields)
- `uppercase` - Convert to uppercase (Sex, postcodes, NI number, ref codes)
- `removeSpaces` - Remove internal spaces (postcodes)
- `digitsOnly` - Extract only digits (TelNo)

### Numeric Transforms
- `stringToInt` - Convert string to integer (required numeric fields)
- `stringToIntOptional` - Convert to int, allow empty/null (optional numeric)
- `boolToInt` - Convert checkbox boolean to 0/1

### Date Transforms
- `isoDate` - Ensure ISO 8601 format (YYYY-MM-DD)

### Constant Injection
- `constant(value)` - Inject fixed value (ESM types, AimSeqNumber)

### Complex Transforms
- `parseAddress` - Split street address into AddLine1-4 (optional, low priority)

---

## Implementation Strategy

### Phase 1: Core Learner Fields (MVP)
Map the 7 required Learner fields + ULN, names, DOB:
- LearnRefNumber, ULN, Ethnicity, Sex, LLDDHealthProb, PostcodePrior, Postcode
- FamilyName, GivenNames, DateOfBirth, NINumber

### Phase 2: Single LearningDelivery (Aim 1)
Map Programme Aim 1 core fields:
- LearnAimRef, AimType, AimSeqNumber (constant 1), dates, FundModel
- ProgType, StdCode, DelLocPostCode, CompStatus

### Phase 3: Financial Records (Aim 1)
Implement AppFinRecord repeating structure with 2 financial entries

### Phase 4: Multiple Aims
Extend to handle aims 2-5 as additional LearningDelivery elements

### Phase 5: Employment Status
Implement LearnerEmploymentStatus with ESM monitoring records

### Phase 6: Optional Fields
Add remaining optional fields as needed

---

## Critical Issues to Address

1. **LearnRefNum generation** - How should Iris generate this? Options:
   - Use existing column value if present
   - Generate from row index + prefix
   - Use Airtable Record ID if available

2. **Multiple LearningDelivery elements per row** - Current columnMapper only handles one row = one Learner. Need logic to:
   - Detect which aim columns have data
   - Create multiple LearningDelivery array entries
   - Set correct AimSeqNumber for each

3. **EmploymentStatusMonitoring expansion** - Need to transform:
   - 6 boolean/numeric columns per employment status
   - Into up to 6 ESM child elements with Type + Code pairs

4. **Missing Email field** - Not in current export, may need adding to Airtable

5. **Column name cleanup** - Trailing spaces will cause mapping failures unless handled

---

## Next Steps

1. Create new `fac-airtable-2025.ts` mapping with actual column names
2. Add new transforms: `removeSpaces`, `digitsOnly`, `boolToInt`, `constant`
3. Extend columnMapper to handle repeating LearningDelivery from single row
4. Implement EmploymentStatusMonitoring expansion logic
5. Update test fixtures to use real Airtable column names
