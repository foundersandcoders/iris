/**
  * ILR XML Generator
  *
  * Generates ILR-compliant XML from parsed CSV data.
  * Based on ESFA ILR 2025-26 specification (schemafile25.xsd)
  */

// === Header Types ===

export interface CollectionDetails {
  /** Fixed value: "ILR" */
  collection: 'ILR';
  /** Academic year: "2526" for 2025-26 */
  year: string;
  /** File preparation date (YYYY-MM-DD) */
  filePreparationDate: string;
}

export interface Source {
  /** Fixed: "OFFICIAL-SENSITIVE-Personal" */
  protectiveMarking: 'OFFICIAL-SENSITIVE-Personal';
  /** UKPRN (8 digits, 10000000-99999999) */
  ukprn: number;
  /** Software supplier name (max 40 chars) */
  softwareSupplier?: string;
  /** Software package name (max 30 chars) */
  softwarePackage?: string;
  /** Release version (max 20 chars) */
  release?: string;
  /** Serial number (1-2 digits) */
  serialNo: string;
  /** Submission datetime (ISO 8601) */
  dateTime: string;
}

export interface Header {
  collectionDetails: CollectionDetails;
  source: Source;
}

// === Learner Types ===

export interface Learner {
  /** Provider's learner reference (max 12 chars) */
  learnRefNumber: string;
  /** Unique Learner Number (10 digits) */
  uln: number;
  /** Family name (max 100 chars) */
  familyName?: string;
  /** Given names (max 100 chars) */
  givenNames?: string;
  /** Date of birth (YYYY-MM-DD) */
  dateOfBirth?: string;
  /** Ethnicity code (2 digits) */
  ethnicity: number;
  /** Sex code (1 char: M/F/I) */
  sex: string;
  /** LLDD and health problem flag (1 digit) */
  llddHealthProb: number;
  /** National Insurance number (max 9 chars) */
  niNumber?: string;
  /** Postcode prior to enrolment (max 8 chars) */
  postcodePrior: string;
  /** Current postcode (max 8 chars) */
  postcode: string;
  /** Email address */
  email?: string;
  /** Learning deliveries for this learner */
  learningDeliveries: LearningDelivery[];
}

// === Learning Delivery Types ===

export interface LearningDelivery {
  /** Learning aim reference (max 8 chars) */
  learnAimRef: string;
  /** Aim type code (1 digit) */
  aimType: number;
  /** Aim sequence number (1-98) */
  aimSeqNumber: number;
  /** Start date (YYYY-MM-DD) */
  learnStartDate: string;
  /** Planned end date (YYYY-MM-DD) */
  learnPlanEndDate: string;
  /** Funding model code (2 digits) */
  fundModel: number;
  /** Programme type (2 digits, for apprenticeships) */
  progType?: number;
  /** Standard code (5 digits) */
  stdCode?: number;
  /** Delivery location postcode (max 8 chars) */
  delLocPostCode: string;
  /** Completion status (1 digit) */
  compStatus: number;
  /** Actual end date if completed (YYYY-MM-DD) */
  learnActEndDate?: string;
  /** Outcome code (1 digit) */
  outcome?: number;
}

// === Learning Provider ===

export interface LearningProvider {
  /** UKPRN (8 digits) */
  ukprn: number;
}

// === Root Message Type ===

export interface ILRMessage {
  header: Header;
  learningProvider: LearningProvider;
  learners: Learner[];
}
