const tsPreset = require('ts-jest/jest-preset');
const puppeteerPreset = require('jest-puppeteer/jest-preset');

module.exports = {
  // if implementing unit test:
  // collectCoverageFrom: ['src/**/*.ts'],
  ...tsPreset,
  ...puppeteerPreset,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tests/tsconfig.json',
    },
  },
};
