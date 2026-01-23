import type { ILRMessage } from '../../../../../src/lib/utils/xml/xmlGenerator';

export const validMinimalXml = `<?xml version="1.0" encoding="utf-8"?>
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
      <Release>1.0.0</Release>
      <SerialNo>01</SerialNo>
      <DateTime>2026-01-23T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>ABC123</LearnRefNumber>
    <ULN>1234567890</ULN>
    <FamilyName>Smith</FamilyName>
    <GivenNames>John</GivenNames>
    <DateOfBirth>1995-03-15</DateOfBirth>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>2</LLDDHealthProb>
    <NINumber>AB123456C</NINumber>
    <PostcodePrior>E1 6AN</PostcodePrior>
    <Postcode>E2 8DP</Postcode>
    <Email>john@example.com</Email>
    <LearningDelivery>
      <LearnAimRef>ZPROG001</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <ProgType>25</ProgType>
      <StdCode>123</StdCode>
      <DelLocPostCode>E1 6AN</DelLocPostCode>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

export const malformedXml = `<?xml version="1.0" encoding="utf-8"?>
<Message xmlns="ESFA/ILR/2025-26">
  <Header>
    <CollectionDetails>
      <Collection>ILR</Collection>
    <!-- missing closing tags -->`;

export const missingMessageXml = `<?xml version="1.0" encoding="utf-8"?>
<SomethingElse>
  <NotAMessage>true</NotAMessage>
</SomethingElse>`;

export const multipleLearnersXml = `<?xml version="1.0" encoding="utf-8"?>
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
      <SerialNo>01</SerialNo>
      <DateTime>2026-01-23T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>L001</LearnRefNumber>
    <ULN>1111111111</ULN>
    <Ethnicity>31</Ethnicity>
    <Sex>M</Sex>
    <LLDDHealthProb>2</LLDDHealthProb>
    <PostcodePrior>E1 6AN</PostcodePrior>
    <Postcode>E1 6AN</Postcode>
    <LearningDelivery>
      <LearnAimRef>ZPROG001</LearnAimRef>
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
    <LearnRefNumber>L002</LearnRefNumber>
    <ULN>2222222222</ULN>
    <Ethnicity>32</Ethnicity>
    <Sex>F</Sex>
    <LLDDHealthProb>1</LLDDHealthProb>
    <PostcodePrior>N1 9GU</PostcodePrior>
    <Postcode>N1 9GU</Postcode>
    <LearningDelivery>
      <LearnAimRef>ZPROG001</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <DelLocPostCode>N1 9GU</DelLocPostCode>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

export const missingRequiredFieldsXml = `<?xml version="1.0" encoding="utf-8"?>
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
      <SerialNo>01</SerialNo>
      <DateTime>2026-01-23T10:00:00</DateTime>
    </Source>
  </Header>
  <LearningProvider>
    <UKPRN>10000001</UKPRN>
  </LearningProvider>
  <Learner>
    <LearnRefNumber>L001</LearnRefNumber>
    <!-- Missing ULN, Ethnicity, LLDDHealthProb -->
    <Sex>M</Sex>
    <PostcodePrior>E1 6AN</PostcodePrior>
    <Postcode>E1 6AN</Postcode>
    <LearningDelivery>
      <LearnAimRef>ZPROG001</LearnAimRef>
      <AimType>1</AimType>
      <AimSeqNumber>1</AimSeqNumber>
      <LearnStartDate>2025-09-01</LearnStartDate>
      <LearnPlanEndDate>2026-08-31</LearnPlanEndDate>
      <FundModel>36</FundModel>
      <DelLocPostCode>E1 6AN</DelLocPostCode>
      <CompStatus>1</CompStatus>
    </LearningDelivery>
  </Learner>
</Message>`;

export const roundTripMessage: ILRMessage = {
	header: {
		collectionDetails: {
			collection: 'ILR',
			year: '2526',
			filePreparationDate: '2026-01-23',
		},
		source: {
			protectiveMarking: 'OFFICIAL-SENSITIVE-Personal',
			ukprn: 10000001,
			softwareSupplier: 'Iris',
			softwarePackage: 'Iris',
			release: '1.0.0',
			serialNo: '01',
			dateTime: '2026-01-23T10:00:00',
		},
	},
	learningProvider: { ukprn: 10000001 },
	learners: [
		{
			learnRefNumber: 'TEST001',
			uln: 9876543210,
			familyName: 'Warren',
			givenNames: 'Jason',
			dateOfBirth: '1990-05-15',
			ethnicity: 31,
			sex: 'M',
			llddHealthProb: 2,
			postcodePrior: 'E1 6AN',
			postcode: 'E1 6AN',
			learningDeliveries: [
				{
					learnAimRef: 'ZPROG001',
					aimType: 1,
					aimSeqNumber: 1,
					learnStartDate: '2025-09-01',
					learnPlanEndDate: '2026-08-31',
					fundModel: 36,
					delLocPostCode: 'E1 6AN',
					compStatus: 1,
				},
			],
		},
	],
};
