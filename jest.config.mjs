/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(.{1,2}/.*).js$': '$1',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};