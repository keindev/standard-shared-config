// @see https://github.com/facebook/jest/issues/9430
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import glob from 'glob';
import Package from 'package-json-helper';
import path from 'path';

import Builder from '../../core/Builder';

jest.useFakeTimers();

const CONFIG = `
sharedDir: ".config"
outputDir: "lib"

mergeRules:
  ".vscode/launch.json": [ "configurations" ]
  ".gitignore":

ignorePatterns:
  ".gitignore": [".env", "node_modules/"]

executableFiles: [
  ".husky/commit-msg"
]

scripts:
  "test": "jest"
  "build": "tsc"

dependencies:
  - "@types/jest": "1.x"
  - "ts-jest": "26.x"
`;

jest.spyOn(glob, 'sync').mockImplementation(() => ['config1.json', 'test/config2.json']);
jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'unlink').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'mkdir').mockImplementation(() => Promise.resolve(''));
jest.spyOn(fs, 'readFile').mockImplementation(filePath => {
  const basename = path.basename(filePath as string);
  let content = '';

  if (basename === '.sharedconfig.yml') content = CONFIG;

  return Promise.resolve(content);
});

describe('Builder', () => {
  const builder = new Builder('test');
  const pkg = new Package();
  let files: [string, string][] = [];

  jest.spyOn(fs, 'writeFile').mockImplementation((name, data) => {
    files.push([path.relative(process.cwd(), name.toString()), data.toString()]);

    return Promise.resolve();
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  jest.spyOn(pkg, 'save').mockImplementation(() => {});

  it('build', async () => {
    files = [];

    await builder.build('.sharedconfig.yml', pkg);

    expect(files).toMatchSnapshot();
  });
});
