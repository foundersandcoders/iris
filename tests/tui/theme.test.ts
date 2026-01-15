import { describe, it, expect } from 'vitest';
import { THEMES, symbols, borders, spinners } from '../../src/tui/theme';

const theme = THEMES.themeLight;

describe('theme', () => {
  it('exports status colors', () => {
    expect(theme.success).toBeDefined();
    expect(theme.warning).toBeDefined();
    expect(theme.error).toBeDefined();
    expect(theme.info).toBeDefined();
  });

  it('exports UI colors', () => {
    expect(theme.primary).toBeDefined();
    expect(theme.secondary).toBeDefined();
    expect(theme.accent).toBeDefined();
    expect(theme.highlight).toBeDefined();
  });

  it('exports neutral colors', () => {
    expect(theme.text).toBeDefined();
    expect(theme.textMuted).toBeDefined();
    expect(theme.border).toBeDefined();
    expect(theme.background).toBeDefined();
  });

  it('all colors are valid hex codes', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    Object.values(theme).forEach(color => { expect(color).toMatch(hexPattern) });
  });
});

describe('symbols', () => {
  it('exports all required symbols', () => {
    expect(symbols.success).toBe('✓');
    expect(symbols.error).toBe('✗');
    expect(symbols.warning).toBe('⚠');
    expect(symbols.arrow).toBe('→');
    expect(symbols.bullet).toBe('•');
    expect(symbols.loading).toBe('⋯');
    expect(symbols.progressFilled).toBe('█');
    expect(symbols.progressEmpty).toBe('░');
  });
});

describe('borders', () => {
  it('exports heavy border characters', () => {
    expect(borders.heavy.topLeft).toBe('┏');
    expect(borders.heavy.topRight).toBe('┓');
    expect(borders.heavy.bottomLeft).toBe('┗');
    expect(borders.heavy.bottomRight).toBe('┛');
    expect(borders.heavy.horizontal).toBe('━');
    expect(borders.heavy.vertical).toBe('┃');
  });

  it('exports light border characters', () => {
    expect(borders.light.topLeft).toBe('┌');
    expect(borders.light.topRight).toBe('┐');
    expect(borders.light.bottomLeft).toBe('└');
    expect(borders.light.bottomRight).toBe('┘');
    expect(borders.light.horizontal).toBe('─');
    expect(borders.light.vertical).toBe('│');
  });
});

describe('spinners', () => {
  it('exports dots spinner with 10 frames', () => {
    expect(spinners.dots).toHaveLength(10);
    expect(spinners.dots[0]).toBe('⠋');
  });

  it('exports arrow spinner with 8 frames', () => {
    expect(spinners.arrow).toHaveLength(8);
    expect(spinners.arrow[0]).toBe('←');
  });
});
