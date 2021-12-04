// @see https://github.com/facebook/jest/issues/9430
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';

import PackageConfig, { PackageManager } from '../../core/PackageConfig';

jest.useFakeTimers();

const CONFIG_CONTENT = `
sharedDir: ".config"
outputDir: "."
manager: "npm"
include: ['.github/**/*']

mergeRules:
  ".vscode/launch.json": [ "configurations" ]
  ".gitignore":
  ".npmignore": false
  ".husky/commit-msg": true

ignorePatterns:
  ".gitignore": [".env", "node_modules/"]

executableFiles: [
  ".husky/commit-msg"
]

scripts:
  "prepare": "husky install"
  "test": "jest"

dependencies:
  - "@types/jest"
  - "@types/node"
  - "husky": "6.x"
  - "typescript": "4.x"
`;

jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());
jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(CONFIG_CONTENT));
jest.spyOn(glob, 'sync').mockImplementation(() => ['.github/dependabot.yml', '.github/workflows/build.yml']);

describe('Config', () => {
  const config = new PackageConfig();

  it('initialization', async () => {
    expect(config.isInitialized).toBeFalsy();

    await config.init();

    expect(config.isInitialized).toBeTruthy();
    expect(config.manager).toBe(PackageManager.NPM);
    expect(config.findMergeRule('.vscode/launch.json')).toEqual(['configurations']);
    expect(config.ignorePatterns).toEqual([['.gitignore', ['.env', 'node_modules/']]]);
    expect(config.findMergeRule('.gitignore')).toBeTruthy();
    expect(config.findMergeRule('.npmignore')).toBeFalsy();
    expect(config.isExecutable('.husky/commit-msg')).toBeTruthy();
    expect(config.outputDir).toBe(process.cwd());
    expect(config.root).toBe(path.resolve(process.cwd(), '.config'));
    expect(config.paths).toEqual(['.github/workflows/build.yml', '.github/dependabot.yml']);
    expect(config.scripts).toEqual([
      ['prepare', 'husky install'],
      ['test', 'jest'],
    ]);
    expect(config.dependencies).toEqual([['@types/jest'], ['@types/node'], ['husky', '6.x'], ['typescript', '4.x']]);
  });
});
