import { describe, it, expect } from 'vitest';
import {
	FAM_PATHS,
	APP_FIN_PATHS,
	LLDD_PATHS,
	EMPLOYMENT_PATHS,
	ALL_BUILDER_PATHS,
} from '../../../src/lib/mappings/builderPaths';

describe('mappings/builderPaths', () => {
	describe('FAM_PATHS', () => {
		it('should contain all FAM field paths', () => {
			expect(FAM_PATHS).toHaveLength(4);
			expect(FAM_PATHS).toContain(
				'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMType'
			);
			expect(FAM_PATHS).toContain(
				'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMCode'
			);
			expect(FAM_PATHS).toContain(
				'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMDateFrom'
			);
			expect(FAM_PATHS).toContain(
				'Message.Learner.LearningDelivery.LearningDeliveryFAM.LearnDelFAMDateTo'
			);
		});
	});

	describe('APP_FIN_PATHS', () => {
		it('should contain all AppFin field paths', () => {
			expect(APP_FIN_PATHS).toHaveLength(4);
			expect(APP_FIN_PATHS).toContain('Message.Learner.LearningDelivery.AppFinRecord.AFinType');
			expect(APP_FIN_PATHS).toContain('Message.Learner.LearningDelivery.AppFinRecord.AFinCode');
			expect(APP_FIN_PATHS).toContain('Message.Learner.LearningDelivery.AppFinRecord.AFinDate');
			expect(APP_FIN_PATHS).toContain('Message.Learner.LearningDelivery.AppFinRecord.AFinAmount');
		});
	});

	describe('LLDD_PATHS', () => {
		it('should contain all LLDD field paths', () => {
			expect(LLDD_PATHS).toHaveLength(3);
			expect(LLDD_PATHS).toContain('Message.Learner.LLDDHealthProb');
			expect(LLDD_PATHS).toContain('Message.Learner.LLDDandHealthProblem.LLDDCat');
			expect(LLDD_PATHS).toContain('Message.Learner.LLDDandHealthProblem.PrimaryLLDD');
		});
	});

	describe('EMPLOYMENT_PATHS', () => {
		it('should contain all employment status field paths', () => {
			expect(EMPLOYMENT_PATHS).toHaveLength(5);
			expect(EMPLOYMENT_PATHS).toContain('Message.Learner.LearnerEmploymentStatus.EmpStat');
			expect(EMPLOYMENT_PATHS).toContain(
				'Message.Learner.LearnerEmploymentStatus.DateEmpStatApp'
			);
			expect(EMPLOYMENT_PATHS).toContain('Message.Learner.LearnerEmploymentStatus.EmpId');
			expect(EMPLOYMENT_PATHS).toContain(
				'Message.Learner.LearnerEmploymentStatus.EmploymentStatusMonitoring.ESMType'
			);
			expect(EMPLOYMENT_PATHS).toContain(
				'Message.Learner.LearnerEmploymentStatus.EmploymentStatusMonitoring.ESMCode'
			);
		});
	});

	describe('ALL_BUILDER_PATHS', () => {
		it('should contain all paths from all categories', () => {
			const expectedLength =
				FAM_PATHS.length + APP_FIN_PATHS.length + LLDD_PATHS.length + EMPLOYMENT_PATHS.length;
			expect(ALL_BUILDER_PATHS).toHaveLength(expectedLength);
		});

		it('should include paths from FAM_PATHS', () => {
			FAM_PATHS.forEach((path) => {
				expect(ALL_BUILDER_PATHS).toContain(path);
			});
		});

		it('should include paths from APP_FIN_PATHS', () => {
			APP_FIN_PATHS.forEach((path) => {
				expect(ALL_BUILDER_PATHS).toContain(path);
			});
		});

		it('should include paths from LLDD_PATHS', () => {
			LLDD_PATHS.forEach((path) => {
				expect(ALL_BUILDER_PATHS).toContain(path);
			});
		});

		it('should include paths from EMPLOYMENT_PATHS', () => {
			EMPLOYMENT_PATHS.forEach((path) => {
				expect(ALL_BUILDER_PATHS).toContain(path);
			});
		});
	});
});
