import { describe, it, expect } from 'vitest';
import { facAirtableMapping } from '../../../src/lib/mappings/fac-airtable-2025';

describe('mappings/fac-airtable-2025', () => {
  describe('facAirtableMapping', () => {
          it('should have correct metadata', () => {
                  expect(facAirtableMapping.id).toBe('fac-airtable-2025');
                  expect(facAirtableMapping.name).toBe('Founders and Coders Airtable Export (2025-26)');
                  expect(facAirtableMapping.version).toBe('2.0.0');
          });

          it('should target correct schema', () => {
                  expect(facAirtableMapping.targetSchema.namespace).toBe('ESFA/ILR/2025-26');
                  expect(facAirtableMapping.targetSchema.version).toBe('1.0');
                  expect(facAirtableMapping.targetSchema.displayName).toBe('ILR 2025-26 Schema');
          });

          it('should have mappings array', () => {
                  expect(Array.isArray(facAirtableMapping.mappings)).toBe(true);
                  expect(facAirtableMapping.mappings.length).toBeGreaterThan(0);
          });

          it('should have valid mapping structure', () => {
                  for (const mapping of facAirtableMapping.mappings) {
                          expect(mapping.csvColumn).toBeTypeOf('string');
                          expect(mapping.xsdPath).toBeTypeOf('string');

                          if (mapping.transform) {
                                  expect(mapping.transform).toBeTypeOf('string');
                          }
                  }
          });

          it('should include learner fields', () => {
                  const learnerFields = facAirtableMapping.mappings.filter(
                          m => m.xsdPath.includes('Message.Learner') && !m.xsdPath.includes('LearningDelivery')
                  );

                  expect(learnerFields.length).toBeGreaterThan(0);

                  const fieldNames = learnerFields.map(f => f.csvColumn);
                  expect(fieldNames).toContain('LearnRefNum');
                  expect(fieldNames).toContain('ULN');
                  expect(fieldNames).toContain('Family name');
          });

          it('should include learning delivery fields', () => {
                  const deliveryFields = facAirtableMapping.mappings.filter(
                          m => m.xsdPath.includes('LearningDelivery')
                  );

                  expect(deliveryFields.length).toBeGreaterThan(0);

                  const fieldNames = deliveryFields.map(f => f.csvColumn);
                  expect(fieldNames).toContain('LearnAimRef');
                  expect(fieldNames).toContain('AimType');
                  expect(fieldNames).toContain('LearnStartDate');
          });

          it('should use appropriate transforms for numeric fields', () => {
                  const numericFields = ['ULN', 'Ethnicity', 'AimType', 'FundModel'];

                  for (const fieldName of numericFields) {
                          const mapping = facAirtableMapping.mappings.find(m => m.csvColumn === fieldName);
                          expect(mapping?.transform).toMatch(/stringToInt/);
                  }
          });

          it('should use uppercase transform for postcode fields', () => {
                  const postcodeFields = ['Postcode', 'PostcodePrior', 'DelLocPostCode'];

                  for (const fieldName of postcodeFields) {
                          const mapping = facAirtableMapping.mappings.find(m => m.csvColumn === fieldName);
                          expect(mapping?.transform).toBe('uppercase');
                  }
          });
  });
});
