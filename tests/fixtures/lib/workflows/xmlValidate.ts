export const validIlrXml = `<?xml version="1.0" encoding="utf-8"?>
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
      <Release>1.1.0</Release>
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
    <PostcodePrior>E1 6AN</PostcodePrior>
    <Postcode>E2 8DP</Postcode>
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
