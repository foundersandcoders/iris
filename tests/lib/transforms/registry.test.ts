import { describe, it, expect } from 'vitest';
import { TRANSFORMS, getTransform, getTransformsByCategory, getTransformMetadata } from
'../../../src/lib/transforms/registry';

describe('transforms/registry', () => {
  describe('TRANSFORMS', () => {
          it('should contain all expected transforms', () => {
                  const transformNames = Object.keys(TRANSFORMS);

                  expect(transformNames).toContain('stringToInt');
                  expect(transformNames).toContain('stringToIntOptional');
                  expect(transformNames).toContain('isoDate');
                  expect(transformNames).toContain('uppercase');
                  expect(transformNames).toContain('trim');
                  expect(transformNames).toContain('uppercaseNoSpaces');
          });

          it('should have metadata for each transform', () => {
                  for (const [name, transform] of Object.entries(TRANSFORMS)) {
                          expect(transform.fn).toBeTypeOf('function');
                          expect(transform.description).toBeTypeOf('string');
                          expect(transform.example).toBeTypeOf('string');
                          expect(transform.category).toBeTypeOf('string');
                  }
          });
  });

  describe('getTransform', () => {
          it('should return transform function by name', () => {
                  const transform = getTransform('stringToInt');

                  expect(transform).toBeTypeOf('function');
                  expect(transform('123')).toBe(123);
                  expect(transform('invalid')).toBe(0);
          });

          it('should throw error for unknown transform', () => {
                  expect(() => getTransform('nonexistent')).toThrow(/Unknown transform/);
          });
  });

  describe('getTransformsByCategory', () => {
          it('should group transforms by category', () => {
                  const grouped = getTransformsByCategory();

                  expect(grouped.type).toContain('stringToInt');
                  expect(grouped.type).toContain('stringToIntOptional');
                  expect(grouped.date).toContain('isoDate');
                  expect(grouped.string).toContain('uppercase');
                  expect(grouped.string).toContain('trim');
          });
  });

  describe('getTransformMetadata', () => {
          it('should return metadata for valid transform', () => {
                  const meta = getTransformMetadata('stringToInt');

                  expect(meta).toBeDefined();
                  expect(meta?.description).toContain('integer');
                  expect(meta?.example).toBeDefined();
          });

          it('should return null for unknown transform', () => {
                  const meta = getTransformMetadata('nonexistent');

                  expect(meta).toBeNull();
          });
  });

  describe('transform functions', () => {
          describe('stringToInt', () => {
                  it('should convert valid strings to integers', () => {
                          const fn = getTransform('stringToInt');
                          expect(fn('123')).toBe(123);
                          expect(fn('0')).toBe(0);
                          expect(fn('-456')).toBe(-456);
                  });

                  it('should default to 0 for invalid strings', () => {
                          const fn = getTransform('stringToInt');
                          expect(fn('invalid')).toBe(0);
                          expect(fn('')).toBe(0);
                  });
          });

          describe('stringToIntOptional', () => {
                  it('should convert valid strings to integers', () => {
                          const fn = getTransform('stringToIntOptional');
                          expect(fn('123')).toBe(123);
                  });

                  it('should return undefined for empty strings', () => {
                          const fn = getTransform('stringToIntOptional');
                          expect(fn('')).toBeUndefined();
                  });
          });

          describe('uppercase', () => {
                  it('should convert to uppercase', () => {
                          const fn = getTransform('uppercase');
                          expect(fn('hello')).toBe('HELLO');
                          expect(fn('MiXeD')).toBe('MIXED');
                  });
          });

          describe('uppercaseNoSpaces', () => {
                  it('should convert to uppercase and remove spaces', () => {
                          const fn = getTransform('uppercaseNoSpaces');
                          expect(fn('sw1a 1aa')).toBe('SW1A1AA');
                          expect(fn('hello world')).toBe('HELLOWORLD');
                  });
          });

          describe('trim', () => {
                  it('should remove leading and trailing whitespace', () => {
                          const fn = getTransform('trim');
                          expect(fn('  hello  ')).toBe('hello');
                          expect(fn('\ttext\n')).toBe('text');
                  });
          });

          describe('isoDate', () => {
                  it('should pass through ISO date strings', () => {
                          const fn = getTransform('isoDate');
                          expect(fn('2025-01-28')).toBe('2025-01-28');
                  });
          });
  });
});
