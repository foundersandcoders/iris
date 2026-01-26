import type {
	ILRMessage,
	Learner,
	LearningDelivery,
} from '../../../../../src/lib/utils/xml/xmlGenerator.legacy';

export const minimalMessage: ILRMessage = {
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

export const minimalLearner: Learner = {
	learnRefNumber: 'ABC123',
	uln: 1234567890,
	ethnicity: 31,
	sex: 'M',
	llddHealthProb: 2,
	postcodePrior: 'SW1A 1AA',
	postcode: 'SW1A 1AA',
	learningDeliveries: [],
};

export const minimalDelivery: LearningDelivery = {
	learnAimRef: 'ZPROG001',
	aimType: 1,
	aimSeqNumber: 1,
	learnStartDate: '2025-09-01',
	learnPlanEndDate: '2026-08-31',
	fundModel: 36,
	delLocPostCode: 'SW1A 1AA',
	compStatus: 1,
};
