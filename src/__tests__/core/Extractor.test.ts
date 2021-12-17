// @see https://github.com/facebook/jest/issues/9430
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import glob from 'glob';
import Package from 'package-json-helper';
import path from 'path';

import Extractor from '../../core/Extractor';
import { FileType } from '../../types';

jest.useFakeTimers();

jest.spyOn(glob, 'sync').mockImplementation(() => ['config1.json', 'test/config2.json']);
jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'unlink').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'mkdir').mockImplementation(() => Promise.resolve(''));
jest.spyOn(fs, 'readFile').mockImplementation(filePath => {
  const basename = path.basename(filePath as string);
  let content = '';

  if (basename === '.gitignore') content = 'logs\ncoverage\n*.log\nyarn-debug.log*\nyarn-error.log*\n.env';

  return Promise.resolve(content);
});

describe('Extractor', () => {
  const extractor = new Extractor('.config');
  const pkg = new Package({
    name: 'test',
    dependencies: {
      '@types/jest': '1.x',
      'ts-jest': '26.x',
    },
  });
  let files: [string, string][] = [];

  jest.spyOn(fs, 'writeFile').mockImplementation((name, data) => {
    files.push([path.relative(process.cwd(), name.toString()), data.toString()]);

    return Promise.resolve();
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  jest.spyOn(pkg, 'save').mockImplementation(() => {});
  jest.spyOn(pkg, 'install').mockImplementation(() => Promise.resolve());

  it('extract', async () => {
    files = [];

    await extractor.extract(
      {
        dependencies: [
          ['@types/jest', '1.x'],
          ['ts-jest', '26.x'],
        ],
        scripts: [
          ['test', 'jest'],
          ['build', 'tsc'],
        ],
        snapshots: [
          {
            path: 'test/config2.json',
            hash: '1',
            merge: false,
            executable: false,
            type: FileType.JSON,
            content: JSON.stringify({}),
          },
          {
            path: 'config1.json',
            hash: '2',
            merge: false,
            executable: false,
            type: FileType.JSON,
            content: JSON.stringify({}),
          },
          {
            path: '.gitignore',
            hash: '3',
            merge: true,
            executable: false,
            type: FileType.GLOB,
            content: '.env\nnode_modules/',
          },
        ],
      },
      pkg
    );

    expect(files).toMatchSnapshot();
  });
});
