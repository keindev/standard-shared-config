import { promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';

import Builder from '../../core/Builder';
import Config from '../../core/Config';
import { FileType } from '../../types';

const CONFIG_CONTENT = `
rootDir: ".config"
outDir: "."

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

dependencies:
  - "@types/jest": "1.x"
`;

jest.spyOn(glob, 'sync').mockImplementation(() => ['test/config1.json', 'test/config2.json']);
jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'unlink').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'mkdir').mockImplementation(() => Promise.resolve(''));
jest.spyOn(fs, 'chmod').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(filePath => {
  const basename = path.basename(filePath as string);
  let content = '';

  if (basename === '.sharedconfig.yml') content = CONFIG_CONTENT;
  if (basename === '.gitignore') content = 'logs\ncoverage\n*.log\nyarn-debug.log*\nyarn-error.log*\n.env';

  return Promise.resolve(content);
});

describe('Config', () => {
  const config = new Config();
  const builder = new Builder();
  let files: [string, string][] = [];

  jest.spyOn(fs, 'writeFile').mockImplementation((name, data) => {
    files.push([path.relative(process.cwd(), name.toString()), data.toString()]);

    return Promise.resolve();
  });

  it('build', async () => {
    files = [];

    await builder.build('test', config);

    expect(files).toMatchSnapshot();
  });

  it('process', async () => {
    files = [];

    await builder.process('.config', [
      {
        path: '../test/.gitignore',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        merge: true,
        executable: false,
        type: FileType.GLOB,
        content: 'logs\ncoverage\n*.log\nyarn-debug.log*\nyarn-error.log*',
      },
      {
        path: '../test/config2.json',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        merge: false,
        executable: false,
        type: FileType.JSON,
        content: '{}',
      },
    ]);

    expect(files).toMatchSnapshot();
  });
});
