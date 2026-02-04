import type { SubmissionHistory } from '../../../../src/lib/types/storageTypes';

// Valid ILR XML with 2 learners
export const validXmlTwoLearners = `<?xml version="1.0" encoding="utf-8"?>
<Message xmlns="ESFA/ILR/2025-26">
  <Header>
    <CollectionDetails>
      <Collection>ILR</Collection>
      <Year>2526</Year>
      <FilePreparationDate>2026-01-23</FilePreparationDate>
    </CollectionDetails>
    <Source>
      <ProtectiveMarking>OFFICIAL-SENSITIVE-Personal</ProtectiveMarking>
      <UKPRN>10000001</UKPRN>
      <SoftwareSupplier>Iris</SoftwareSupplier>
      <SoftwarePackage>Iris</SoftwarePackage>
      <Release>2.0.0</Release>
      <SerialNo>01</SerialNo>
      <DateTime>2026-01-23T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>LEARN001</LearnRefNumber>
    <ULN>1111111111</ULN>
    <FamilyName>Jones</FamilyName>
    <GivenNames>Alice</GivenNames>
    <DateOfBirth>1995-03-15</DateOfBirth>
    <Ethnicity>31</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>2</LLDDHealthProb>
    <PostcodePrior>E1 6AN</PostcodePrior>
    <Postcode>E2 8DP</Postcode>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <DelLocPostCode>E1 6AN</DelLocPostCode>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>LEARN002</LearnRefNumber>
    <ULN>2222222222</ULN>
    <FamilyName>Brown</FamilyName>
    <GivenNames>Bob</GivenNames>
    <DateOfBirth>1998-07-20</DateOfBirth>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <PostcodePrior>SW1A 1AA</PostcodePrior>
    <Postcode>SW1A 1AA</Postcode>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <DelLocPostCode>SW1A 1AA</DelLocPostCode>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

// Valid ILR XML with 5 learners (significant increase)
export const validXmlFiveLearners = `<?xml version="1.0" encoding="utf-8"?>
<Message xmlns="ESFA/ILR/2025-26">
  <Header>
    <CollectionDetails>
      <Collection>ILR</Collection>
      <Year>2526</Year>
      <FilePreparationDate>2026-02-01</FilePreparationDate>
    </CollectionDetails>
    <Source>
      <ProtectiveMarking>OFFICIAL-SENSITIVE-Personal</ProtectiveMarking>
      <UKPRN>10000001</UKPRN>
      <SoftwareSupplier>Iris</SoftwareSupplier>
      <SoftwarePackage>Iris</SoftwarePackage>
      <Release>2.0.0</Release>
      <SerialNo>02</SerialNo>
      <DateTime>2026-02-01T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>LEARN001</LearnRefNumber>
    <ULN>1111111111</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>2</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>LEARN002</LearnRefNumber>
    <ULN>2222222222</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>LEARN003</LearnRefNumber>
    <ULN>3333333333</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>LEARN004</LearnRefNumber>
    <ULN>4444444444</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>LEARN005</LearnRefNumber>
    <ULN>5555555555</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

// XML with schema change (different year)
// Note: Schema detection uses the Year element (2627), not the xmlns
export const validXmlDifferentSchema = `<?xml version="1.0" encoding="utf-8"?>
<Message xmlns="ESFA/ILR/2026-27">
  <Header>
    <CollectionDetails>
      <Collection>ILR</Collection>
      <Year>2627</Year>
      <FilePreparationDate>2026-09-01</FilePreparationDate>
    </CollectionDetails>
    <Source>
      <ProtectiveMarking>OFFICIAL-SENSITIVE-Personal</ProtectiveMarking>
      <UKPRN>10000001</UKPRN>
      <SoftwareSupplier>Iris</SoftwareSupplier>
      <SoftwarePackage>Iris</SoftwarePackage>
      <Release>2.0.0</Release>
      <SerialNo>03</SerialNo>
      <DateTime>2026-09-01T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>LEARN006</LearnRefNumber>
    <ULN>6666666666</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2026-09-01</LearnStartDate>
      <LearnPlanEndDate>2027-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

// XML with duplicate learner references (should trigger error)
export const xmlWithDuplicateLearners = `<?xml version="1.0" encoding="utf-8"?>
<Message xmlns="ESFA/ILR/2025-26">
  <Header>
    <CollectionDetails>
      <Collection>ILR</Collection>
      <Year>2526</Year>
      <FilePreparationDate>2026-01-23</FilePreparationDate>
    </CollectionDetails>
    <Source>
      <ProtectiveMarking>OFFICIAL-SENSITIVE-Personal</ProtectiveMarking>
      <UKPRN>10000001</UKPRN>
      <SoftwareSupplier>Iris</SoftwareSupplier>
      <SoftwarePackage>Iris</SoftwarePackage>
      <Release>2.0.0</Release>
      <SerialNo>04</SerialNo>
      <DateTime>2026-01-23T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>DUPLICATE</LearnRefNumber>
    <ULN>7777777777</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
  <Learner>
    <LearnRefNumber>DUPLICATE</LearnRefNumber>
    <ULN>8888888888</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <LearningDelivery>
      <LearnAimRef>60161533</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

// Mock submission history - empty
export const emptyHistory: SubmissionHistory = {
	version: 1,
	submissions: [],
};

// Mock submission history - with 1 previous submission
export const historyWithOnePrevious: SubmissionHistory = {
	version: 1,
	submissions: [
		{
			filename: 'ILR-2026-01-15T10-00-00.xml',
			timestamp: '2026-01-15T10:00:00',
			learnerCount: 2,
			checksum: 'abc123',
			schema: '2526',
			learnerRefs: ['LEARN001', 'LEARN002'],
		},
	],
};

// Mock submission history - with different schema
export const historyWithDifferentSchema: SubmissionHistory = {
	version: 1,
	submissions: [
		{
			filename: 'ILR-2025-09-01T10-00-00.xml',
			timestamp: '2025-09-01T10:00:00',
			learnerCount: 1,
			checksum: 'def456',
			schema: '2425',
			learnerRefs: ['OLDLEARN001'],
		},
	],
};
