// TODO: move declarations to fixtures

import { describe, it, expect } from 'vitest';
import {
  generateILR,
  type ILRMessage,
  type Learner,
  type LearningDelivery,
} from '../../src/lib/generator';

describe('generateILR', () => {
  const minimalMessage: ILRMessage = {
    header: {
      collectionDetails: {
        collection: 'ILR',
        year: '2526',
        filePreparationDate: '2026-01-13',
      },
      source: {
        protectiveMarking: 'OFFICIAL-SENSITIVE-Personal',
        ukprn: 10000001,
        serialNo: '01',
        dateTime: '2026-01-13T10:00:00',
      },
    },
    learningProvider: {
      ukprn: 10000001,
    },
    learners: [],
  };

  const minimalLearner: Learner = {
    learnRefNumber: 'ABC123',
    uln: 1234567890,
    ethnicity: 31,
    sex: 'M',
    llddHealthProb: 2,
    postcodePrior: 'SW1A 1AA',
    postcode: 'SW1A 1AA',
    learningDeliveries: [],
  };

  const minimalDelivery: LearningDelivery = {
    learnAimRef: 'ZPROG001',
    aimType: 1,
    aimSeqNumber: 1,
    learnStartDate: '2025-09-01',
    learnPlanEndDate: '2026-08-31',
    fundModel: 36,
    delLocPostCode: 'SW1A 1AA',
    compStatus: 1,
  };

  it('should generate valid XML declaration and root element', () => {
    const xml = generateILR(minimalMessage);

    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<Message xmlns="ESFA/ILR/2025-26">');
    expect(xml).toContain('</Message>');
  });

  it('should generate header with collection details', () => {
    const xml = generateILR(minimalMessage);

    expect(xml).toContain('<Collection>ILR</Collection>');
    expect(xml).toContain('<Year>2526</Year>');
    expect(xml).toContain('<FilePreparationDate>2026-01-13</FilePreparationDate>');
  });

  it('should generate header with source details', () => {
    const xml = generateILR(minimalMessage);

    expect(xml).toContain('<ProtectiveMarking>OFFICIAL-SENSITIVE-Personal</ProtectiveMarking>');
    expect(xml).toContain('<UKPRN>10000001</UKPRN>');
    expect(xml).toContain('<SerialNo>01</SerialNo>');
  });

  it('should include optional source fields when provided', () => {
    const message: ILRMessage = {
      ...minimalMessage,
      header: {
        ...minimalMessage.header,
        source: {
          ...minimalMessage.header.source,
          softwareSupplier: 'Founders and Coders',
          softwarePackage: 'Iris',
          release: '1.0.0',
        },
      },
    };

    const xml = generateILR(message);

    expect(xml).toContain('<SoftwareSupplier>Founders and Coders</SoftwareSupplier>');
    expect(xml).toContain('<SoftwarePackage>Iris</SoftwarePackage>');
    expect(xml).toContain('<Release>1.0.0</Release>');
  });

  it('should omit optional source fields when not provided', () => {
    const xml = generateILR(minimalMessage);

    expect(xml).not.toContain('<SoftwareSupplier>');
    expect(xml).not.toContain('<SoftwarePackage>');
    expect(xml).not.toContain('<Release>');
  });

  it('should generate learning provider', () => {
    const xml = generateILR(minimalMessage);

    expect(xml).toContain('<LearningProvider>');
    expect(xml).toContain('</LearningProvider>');
  });

  it('should generate learner with required fields', () => {
    const message: ILRMessage = {
      ...minimalMessage,
      learners: [minimalLearner],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<LearnRefNumber>ABC123</LearnRefNumber>');
    expect(xml).toContain('<ULN>1234567890</ULN>');
    expect(xml).toContain('<Ethnicity>31</Ethnicity>');
    expect(xml).toContain('<Sex>M</Sex>');
    expect(xml).toContain('<LLDDHealthProb>2</LLDDHealthProb>');
    expect(xml).toContain('<PostcodePrior>SW1A 1AA</PostcodePrior>');
    expect(xml).toContain('<Postcode>SW1A 1AA</Postcode>');
  });

  it('should include optional learner fields when provided', () => {
    const learner: Learner = {
      ...minimalLearner,
      familyName: 'Smith',
      givenNames: 'John',
      dateOfBirth: '1990-05-15',
      email: 'john@example.com',
    };

    const message: ILRMessage = {
      ...minimalMessage,
      learners: [learner],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<FamilyName>Smith</FamilyName>');
    expect(xml).toContain('<GivenNames>John</GivenNames>');
    expect(xml).toContain('<DateOfBirth>1990-05-15</DateOfBirth>');
    expect(xml).toContain('<Email>john@example.com</Email>');
  });

  it('should generate learning delivery with required fields', () => {
    const learner: Learner = {
      ...minimalLearner,
      learningDeliveries: [minimalDelivery],
    };

    const message: ILRMessage = {
      ...minimalMessage,
      learners: [learner],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<LearnAimRef>ZPROG001</LearnAimRef>');
    expect(xml).toContain('<AimType>1</AimType>');
    expect(xml).toContain('<AimSeqNumber>1</AimSeqNumber>');
    expect(xml).toContain('<LearnStartDate>2025-09-01</LearnStartDate>');
    expect(xml).toContain('<LearnPlanEndDate>2026-08-31</LearnPlanEndDate>');
    expect(xml).toContain('<FundModel>36</FundModel>');
    expect(xml).toContain('<DelLocPostCode>SW1A 1AA</DelLocPostCode>');
    expect(xml).toContain('<CompStatus>1</CompStatus>');
  });

  it('should escape XML special characters in text fields', () => {
    const learner: Learner = {
      ...minimalLearner,
      familyName: 'O\'Brien & Sons',
      givenNames: '<Test>',
    };

    const message: ILRMessage = {
      ...minimalMessage,
      learners: [learner],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<FamilyName>O&apos;Brien &amp; Sons</FamilyName>');
    expect(xml).toContain('<GivenNames>&lt;Test&gt;</GivenNames>');
  });

  it('should handle multiple learners', () => {
    const message: ILRMessage = {
      ...minimalMessage,
      learners: [
        { ...minimalLearner, learnRefNumber: 'L001' },
        { ...minimalLearner, learnRefNumber: 'L002' },
      ],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<LearnRefNumber>L001</LearnRefNumber>');
    expect(xml).toContain('<LearnRefNumber>L002</LearnRefNumber>');
    expect((xml.match(/<Learner>/g) || []).length).toBe(2);
  });

  it('should handle multiple learning deliveries per learner', () => {
    const learner: Learner = {
      ...minimalLearner,
      learningDeliveries: [
        { ...minimalDelivery, aimSeqNumber: 1 },
        { ...minimalDelivery, aimSeqNumber: 2 },
      ],
    };

    const message: ILRMessage = {
      ...minimalMessage,
      learners: [learner],
    };

    const xml = generateILR(message);

    expect(xml).toContain('<AimSeqNumber>1</AimSeqNumber>');
    expect(xml).toContain('<AimSeqNumber>2</AimSeqNumber>');
    expect((xml.match(/<LearningDelivery>/g) || []).length).toBe(2);
  });
});
