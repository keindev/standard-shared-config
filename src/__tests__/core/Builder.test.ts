// @see https://github.com/facebook/jest/issues/9430
import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';

import Builder from '../../core/Builder.js';

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

package:
  manager: npm
  type: module
  types: './lib/index.d.ts'
  exports:
    ".": "./lib/index.js"
    "lib": "./lib/index.js"
  peerDependencies:
    "react": "18.x"
    "react-dom": "18.x"
`;

jest.spyOn(glob, 'sync').mockImplementation(() => ['.config/config1.json', '.config/test/config2.json']);
jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'unlink').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'mkdir').mockImplementation(() => Promise.resolve(''));
jest.spyOn(fs, 'readFile').mockImplementation(filePath => {
  const basename = path.basename(filePath as string);
  let content = '';

  if (basename === '.sharedconfig.yml') content = CONFIG;
  if (basename === 'package.json') content = JSON.stringify({ name: 'test' });

  return Promise.resolve(content);
});

describe('Builder', () => {
  it('build', async () => {
    const builder = new Builder();
    const files: [string, string][] = [];

    jest.spyOn(fs, 'writeFile').mockImplementation((name, data) => {
      files.push([path.relative(process.cwd(), name.toString()), data.toString()]);

      return Promise.resolve();
    });

    await builder.build('.sharedconfig.yml');

    expect(files).toMatchSnapshot();
  });
});
