// @see https://github.com/facebook/jest/issues/9430
import { promises as fs } from 'fs';
import { glob } from 'glob';

// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';

import { FileType, IMergeRule } from '../../types/base.js';
import { createSnapshot, createSnapshots, getHash, getType, mergeFiles, readFile } from '../../utils/file.js';

enum FilePath {
  BASE = 'file.yml',
  SNAPSHOT = 'snapshot.json',
}

const DIR = '.config';
const CONTENT = {
  [FilePath.BASE]: `
  // Comment 1
  # Comment 2
  /* Comment 3 */
  test: true
  `,
  [FilePath.SNAPSHOT]: JSON.stringify({
    configurations: [
      {
        name: 'Build configs map',
        type: 'node',
        request: 'launch',
        outputCapture: 'std',
        console: 'integratedTerminal',
        runtimeExecutable: 'node',
        runtimeArgs: ['--nolazy', '--inspect-brk=9229', '--loader', 'ts-node/esm', 'src/cli/bin.ts', 'build'],
      },
    ],
  }),
};

jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'chmod').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(path => Promise.resolve(CONTENT[path as FilePath] ?? ''));
jest.spyOn(glob, 'sync').mockImplementation(() => [FilePath.BASE, FilePath.SNAPSHOT]);

describe('File utils', () => {
  it('Get file content', async () => {
    const content = await readFile(FilePath.BASE);

    expect(content).toBe(CONTENT[FilePath.BASE]);
  });

  it('Get file hash', () => {
    expect(getHash(CONTENT[FilePath.BASE])).toMatchSnapshot();
  });

  it('Get file type', () => {
    expect(getType('.gitignore')).toBe(FileType.GLOB);
    expect(getType('test.json')).toBe(FileType.JSON);
    expect(getType('test')).toBe(FileType.Text);
    expect(getType('test.yaml')).toBe(FileType.YAML);
    expect(getType('test.yml')).toBe(FileType.YAML);
  });

  it('Create snapshot', async () => {
    const relativePath = `../${FilePath.SNAPSHOT}`;
    const mergeRules = new Map<string, IMergeRule>([[relativePath, ['configurations']]]);
    const snapshotBase = {
      path: relativePath,
      hash: 'd3ad7d184db5cd15a795d0713fe5c5115743f52d44776a130ed53a5e3a60124d',
      type: FileType.JSON,
      content: CONTENT[FilePath.SNAPSHOT],
    };

    const snapshot1 = await createSnapshot(FilePath.SNAPSHOT, DIR, new Map(), new Set());
    const snapshot2 = await createSnapshot(FilePath.SNAPSHOT, '.config', mergeRules, new Set([relativePath]));

    expect(snapshot1).toEqual({ ...snapshotBase, merge: false, executable: false });
    expect(snapshot2).toEqual({ ...snapshotBase, merge: mergeRules.get(relativePath), executable: true });
  });

  it('Create snapshots', async () => {
    const relativePath = `../${FilePath.SNAPSHOT}`;
    const mergeRules = ['configurations'];
    const snapshots = await createSnapshots(DIR, { include: ['.shared'], mergeRules: { [relativePath]: mergeRules } });

    expect(snapshots).toMatchSnapshot();
  });

  it('Merge JSON files', () => {
    const source = {
      text: 'text',
      object1: {
        value1: false,
        value2: true,
      },
      object2: {
        value1: true,
        value2: false,
        value3: null,
      },
      list: [1, 2, 3],
    };
    const current = {
      ...source,
      object1: {
        value1: true,
        value2: false,
        value3: null,
      },
      list: [1, 2, 3, 4, 5],
    };

    expect(
      mergeFiles(
        {
          path: '',
          hash: '',
          executable: false,
          type: FileType.JSON,
          merge: ['object1.value1', 'list'],
          content: JSON.stringify(source),
        },
        JSON.stringify(current)
      )
    ).toMatchSnapshot();
  });

  it('Merge YAML files', () => {
    const source = `
    version: 2
    updates:
    - package-ecosystem: npm
      directory: "/"
      schedule:
        interval: weekly
        day: friday
        time: "22:00"
    `;
    const current = `
    version: 2
    updates:
    - package-ecosystem: yarn
      schedule:
        interval: weekly
        time: "23:00"
    `;

    expect(
      mergeFiles(
        {
          path: '',
          hash: '',
          executable: false,
          type: FileType.YAML,
          merge: ['updates.0.schedule.time', 'updates.0.package-ecosystem'],
          content: source,
        },
        current
      )
    ).toMatchSnapshot();
  });

  it('Merge GLOB files', () => {
    const source = `
      *.log
      *.pid
      *.pid.lock
      *.seed
      *.tgz
      .editorconfig
      .env
      .eslintcache
      .eslintignore
      .eslintrc`;
    const current = `
      *.pid.lock
      *.seed
      *.seed
      *.tgz
      *.log
      .eslintignore
      .eslintrc
      media/
      node_modules/
      src/`;

    expect(
      mergeFiles(
        {
          path: '',
          hash: '',
          executable: false,
          type: FileType.GLOB,
          merge: true,
          content: source,
        },
        current
      )
    ).toMatchSnapshot();
  });
});
