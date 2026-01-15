import { vi } from 'vitest';

// Helper to create mock Dirents
const createDirent = (name: string, isDirectory: boolean) => ({
  name,
  isDirectory: vi.fn(() => isDirectory),
  isFile: vi.fn(() => !isDirectory),
  isBlockDevice: vi.fn(() => false),
  isCharacterDevice: vi.fn(() => false),
  isSymbolicLink: vi.fn(() => false),
  isFIFO: vi.fn(() => false),
  isSocket: vi.fn(() => false),
  parentPath: '/tmp',
});

export const mixedDirectory = [
  createDirent('data.csv', false),
  createDirent('styles.css', false),
  createDirent('nested', true),
  createDirent('.hidden.csv', false),
  createDirent('image.png', false),
];

export const onlyDirectories = [
  createDirent('docs', true),
  createDirent('src', true),
  createDirent('tests', true),
];

export const emptyDirectory = [];

export const messyCsvDirectory = [
  createDirent('z_last.csv', false),
  createDirent('a_first.csv', false),
  createDirent('Folder B', true),
  createDirent('Folder A', true),
];
