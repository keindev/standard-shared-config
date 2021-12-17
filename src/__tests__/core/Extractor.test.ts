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
  if (basename === 'package.json') {
    content = JSON.stringify({ name: 'test', devDependencies: { '@types/jest': '^1.x', 'ts-jest': '^26.x' } });
  }

  return Promise.resolve(content);
});

describe('Extractor', () => {
  const extractor = new Extractor('.config');
  const files: [string, string][] = [];
  const appendFile = (name: any, data: any): void => {
    files.push([path.relative(process.cwd(), name.toString()), data.toString()]);
  };

  jest.spyOn(fs, 'writeFile').mockImplementation((name, data) => Promise.resolve(appendFile(name, data)));
  jest
    .spyOn(Package.prototype, 'install')
    .mockImplementation(dependencies =>
      Promise.resolve(appendFile('package.json', JSON.stringify([...dependencies.entries()])))
    );

  it('extract', async () => {
    await extractor.extract({
      dependencies: [
        ['@types/jest', '1.x'],
        ['ts-jest', '26.x'],
        ['jest', '8.x'],
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
    });

    expect(files).toMatchSnapshot();
  });
});
