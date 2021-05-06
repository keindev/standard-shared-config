import fs from 'fs';
import stripAnsi from 'strip-ansi';
import TaskTree from 'tasktree-cli';
import { PackageJson } from 'type-fest';

import Package from '../../core/Package';
import { IDependency } from '../../types';

const PACKAGE_CONTENT = `
{
  "name": "@tagproject/standard-shared-config",
  "version": "0.1.0",
  "description": "One shared config to rule them all",
  "homepage": "https://github.com/keindev/standard-shared-config#readme",
  "license": "MIT",
  "scripts": {
    "F2": "run 2",
    "A1": "run 1"
  },
  "devDependencies": {
    "typescript": "4.2.4"
  }
}
`;

let data: PackageJson = {};

jest.spyOn(fs, 'readFileSync').mockImplementation(() => PACKAGE_CONTENT);
jest.mock('write-pkg', (): ((value: PackageJson) => Promise<void>) => (value): Promise<void> => {
  data = value;

  return Promise.resolve();
});

describe('Package', () => {
  const pkg = new Package();

  it('initialization', () => {
    expect(pkg.name).toBe('standard-shared-config');
  });

  it('update info', async () => {
    await pkg.update();

    expect(data?.main).toBe('index.js');
    expect(typeof data?.bin === 'object' ? data?.bin[pkg.name] : data?.bin).toBe(`bin/${pkg.name}.js`);
  });

  it('lint dependencies', () => {
    const task = TaskTree.tree();
    const errors: Error[] = [];
    const variations = [[['typescript', '4.x']], [['typescript', '5.x']]];

    variations.forEach(dependencies => {
      try {
        pkg.lint(dependencies as IDependency[]);
      } catch (error) {
        errors.push(error);
      }
    });

    expect(errors.length).toBe(1);
    expect(stripAnsi(task.render().join('\n'))).toMatchSnapshot();
  });

  it('insert scripts', async () => {
    await pkg.insert([['D3', 'run 3']]);

    expect(data.scripts).toEqual({ A1: 'run 1', D3: 'run 3', F2: 'run 2' });
  });
});
