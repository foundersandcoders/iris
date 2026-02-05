/**
 * XSD paths used by builder functions.
 * These paths are implicitly output by FAM, AppFin, LLDD, and Employment builders.
 * They must exist in the loaded schema for the mapping to be compatible.
 */

export const FAM_PATHS = [
	'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMType',
	'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMCode',
	'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMDateFrom',
	'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMDateTo',
] as const;

export const APP_FIN_PATHS = [
	'Message.Learner.LearningDelivery.AppFinRecord.AFinType',
	'Message.Learner.LearningDelivery.AppFinRecord.AFinCode',
	'Message.Learner.LearningDelivery.AppFinRecord.AFinDate',
	'Message.Learner.LearningDelivery.AppFinRecord.AFinAmount',
] as const;

export const LLDD_PATHS = [
	'Message.Learner.LLDDHealthProb',
	'Message.Learner.LLDDandHealthProblem.LLDDCat',
	'Message.Learner.LLDDandHealthProblem.PrimaryLLDD',
] as const;

export const EMPLOYMENT_PATHS = [
	'Message.Learner.LearnerEmploymentStatus.EmpStat',
	'Message.Learner.LearnerEmploymentStatus.DateEmpStatApp',
	'Message.Learner.LearnerEmploymentStatus.EmpId',
	'Message.Learner.LearnerEmploymentStatus.EmploymentStatusMonitoring.ESMType',
	'Message.Learner.LearnerEmploymentStatus.EmploymentStatusMonitoring.ESMCode',
] as const;

export const ALL_BUILDER_PATHS = [
	...FAM_PATHS,
	...APP_FIN_PATHS,
	...LLDD_PATHS,
	...EMPLOYMENT_PATHS,
] as const;
