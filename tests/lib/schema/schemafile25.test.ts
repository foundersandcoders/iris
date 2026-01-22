import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import { join } from 'path';

describe('schemafile25.xsd (ILR 2025-26)', () => {
	const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
	const xsdContent = readFileSync(xsdPath, 'utf-8');
	const registry = buildSchemaRegistry(xsdContent);

	describe('registry structure', () => {
		it('should parse without errors', () => {
			expect(registry).toBeDefined();
		});

		it('should have correct namespace', () => {
			expect(registry.namespace).toBe('ESFA/ILR/2025-26');
		});

		it('should have Message as root element', () => {
			expect(registry.rootElement.name).toBe('Message');
			expect(registry.rootElement.isComplex).toBe(true);
		});

		it('should have expected top-level structure', () => {
			const childNames = registry.rootElement.children.map((c) => c.name);
			expect(childNames).toContain('Header');
			expect(childNames).toContain('LearningProvider');
			expect(childNames).toContain('Learner');
		});

		it('should extract all elements', () => {
			// Real schema has ~147 elements (may vary with schema version)
			expect(registry.elementsByPath.size).toBeGreaterThan(100);
		});
	});

	describe('named types', () => {
		it('should extract RestrictedString named type', () => {
			const restrictedString = registry.namedTypes.get('RestrictedString');

			expect(restrictedString).toBeDefined();
			expect(restrictedString?.baseType).toBe('string');
			expect(restrictedString?.constraints.pattern).toBeDefined();
		});
	});

	describe('Header structure', () => {
		it('should have Header element', () => {
			const header = registry.elementsByPath.get('Message/Header');

			expect(header).toBeDefined();
			expect(header?.isComplex).toBe(true);
		});

		it('should have CollectionDetails within Header', () => {
			const collectionDetails = registry.elementsByPath.get('Message/Header/CollectionDetails');

			expect(collectionDetails).toBeDefined();
			expect(collectionDetails?.isComplex).toBe(true);
		});

		it('should have Collection field with enumeration constraint', () => {
			const collection = registry.elementsByPath.get('Message/Header/CollectionDetails/Collection');

			expect(collection).toBeDefined();
			expect(collection?.baseType).toBe('string');
			expect(collection?.constraints.enumeration).toContain('ILR');
		});

		it('should have Year field with enumeration constraint', () => {
			const year = registry.elementsByPath.get('Message/Header/CollectionDetails/Year');

			expect(year).toBeDefined();
			expect(year?.baseType).toBe('string');
			expect(year?.constraints.enumeration).toContain('2526');
		});

		it('should have FilePreparationDate as date type', () => {
			const fileDate = registry.elementsByPath.get(
				'Message/Header/CollectionDetails/FilePreparationDate'
			);

			expect(fileDate).toBeDefined();
			expect(fileDate?.baseType).toBe('date');
		});

		it('should have Source within Header', () => {
			const source = registry.elementsByPath.get('Message/Header/Source');

			expect(source).toBeDefined();
			expect(source?.isComplex).toBe(true);
		});

		it('should have UKPRN with numeric range constraints', () => {
			const ukprn = registry.elementsByPath.get('Message/Header/Source/UKPRN');

			expect(ukprn).toBeDefined();
			expect(ukprn?.baseType).toBe('int');
			expect(ukprn?.constraints.minInclusive).toBe(10000000);
			expect(ukprn?.constraints.maxInclusive).toBe(99999999);
		});

		it('should have optional SoftwareSupplier with length constraints', () => {
			const softwareSupplier = registry.elementsByPath.get(
				'Message/Header/Source/SoftwareSupplier'
			);

			expect(softwareSupplier).toBeDefined();
			expect(softwareSupplier?.cardinality.min).toBe(0);
			expect(softwareSupplier?.constraints.minLength).toBe(1);
			expect(softwareSupplier?.constraints.maxLength).toBe(40);
		});

		it('should have DateTime as dateTime type', () => {
			const dateTime = registry.elementsByPath.get('Message/Header/Source/DateTime');

			expect(dateTime).toBeDefined();
			expect(dateTime?.baseType).toBe('dateTime');
		});

		it('should have SerialNo with pattern constraint', () => {
			const serialNo = registry.elementsByPath.get('Message/Header/Source/SerialNo');

			expect(serialNo).toBeDefined();
			expect(serialNo?.baseType).toBe('string');
			expect(serialNo?.constraints.pattern).toBe('[0-9]{1,2}');
		});
	});

	describe('LearningProvider structure', () => {
		it('should have LearningProvider element', () => {
			const learningProvider = registry.elementsByPath.get('Message/LearningProvider');

			expect(learningProvider).toBeDefined();
			expect(learningProvider?.isComplex).toBe(true);
		});

		it('should have UKPRN within LearningProvider', () => {
			const ukprn = registry.elementsByPath.get('Message/LearningProvider/UKPRN');

			expect(ukprn).toBeDefined();
			expect(ukprn?.baseType).toBe('int');
			expect(ukprn?.constraints.minInclusive).toBe(10000000);
			expect(ukprn?.constraints.maxInclusive).toBe(99999999);
		});
	});

	describe('Learner structure', () => {
		it('should have Learner as repeating element', () => {
			const learner = registry.elementsByPath.get('Message/Learner');

			expect(learner).toBeDefined();
			expect(learner?.cardinality.min).toBe(1);
			expect(learner?.cardinality.max).toBe(Infinity);
		});

		it('should have Learner as complex type with children', () => {
			const learner = registry.elementsByPath.get('Message/Learner');

			expect(learner?.isComplex).toBe(true);
			expect(learner?.children.length).toBeGreaterThan(10);
		});

		it('should have LearnRefNumber with pattern and length', () => {
			const learnRef = registry.elementsByPath.get('Message/Learner/LearnRefNumber');

			expect(learnRef).toBeDefined();
			expect(learnRef?.baseType).toBe('string');
			expect(learnRef?.constraints.pattern).toBe('[A-Za-z0-9 ]{1,12}');
		});

		it('should have ULN field', () => {
			const uln = registry.elementsByPath.get('Message/Learner/ULN');

			expect(uln).toBeDefined();
			expect(uln?.baseType).toBe('long');
		});

		it('should have optional PrevLearnRefNumber', () => {
			const prevRef = registry.elementsByPath.get('Message/Learner/PrevLearnRefNumber');

			expect(prevRef).toBeDefined();
			expect(prevRef?.cardinality.min).toBe(0);
			expect(prevRef?.constraints.pattern).toBe('[A-Za-z0-9 ]{1,12}');
		});

		it('should have optional PrevUKPRN with range constraints', () => {
			const prevUkprn = registry.elementsByPath.get('Message/Learner/PrevUKPRN');

			expect(prevUkprn).toBeDefined();
			expect(prevUkprn?.cardinality.min).toBe(0);
			expect(prevUkprn?.baseType).toBe('int');
			expect(prevUkprn?.constraints.minInclusive).toBe(10000000);
		});
	});

	describe('lookup maps', () => {
		it('should find elements by path', () => {
			expect(registry.elementsByPath.get('Message/Learner/ULN')).toBeDefined();
			expect(registry.elementsByPath.get('Message/Header/Source/UKPRN')).toBeDefined();
		});

		it('should find elements by name (returns array)', () => {
			const ukprnElements = registry.elementsByName.get('UKPRN');

			// UKPRN appears in multiple places (Header/Source, LearningProvider, Learner/PrevUKPRN)
			expect(ukprnElements).toBeDefined();
			expect(Array.isArray(ukprnElements)).toBe(true);
			expect(ukprnElements!.length).toBeGreaterThan(1);
		});

		it('should distinguish elements with same name by path', () => {
			const ukprnElements = registry.elementsByName.get('UKPRN');
			const paths = ukprnElements?.map((el) => el.path);

			expect(paths).toContain('Message/Header/Source/UKPRN');
			expect(paths).toContain('Message/LearningProvider/UKPRN');
		});
	});

	describe('SourceFiles structure (optional repeating container)', () => {
		it('should have optional SourceFiles element', () => {
			const sourceFiles = registry.elementsByPath.get('Message/SourceFiles');

			expect(sourceFiles).toBeDefined();
			expect(sourceFiles?.cardinality.min).toBe(0);
		});

		it('should have repeating SourceFile within SourceFiles', () => {
			const sourceFile = registry.elementsByPath.get('Message/SourceFiles/SourceFile');

			expect(sourceFile).toBeDefined();
			expect(sourceFile?.cardinality.max).toBe(Infinity);
		});

		it('should have SourceFileName with length constraints', () => {
			const fileName = registry.elementsByPath.get('Message/SourceFiles/SourceFile/SourceFileName');

			expect(fileName).toBeDefined();
			expect(fileName?.constraints.minLength).toBe(1);
			expect(fileName?.constraints.maxLength).toBe(50);
		});
	});
});
