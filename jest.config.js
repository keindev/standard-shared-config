const modules = require('./jest.esModules');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['text-summary', 'lcov'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.(tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/lib/', '/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!${modules.join('|')})`],
};
