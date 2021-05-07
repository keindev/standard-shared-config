import fs from 'fs';
import path from 'path';
import semver from 'semver';
import TaskTree from 'tasktree-cli';
import { PackageJson } from 'type-fest';
import writePkg from 'write-pkg';

import { IDependency, IScript } from '../types';

export default class Package {
  #data: PackageJson;

  constructor() {
    this.#data = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) as PackageJson;
  }

  get name(): string {
    return path.basename(this.#data.name ?? '');
  }

  async update(): Promise<void> {
    this.#data.main = 'index.js';
    this.#data.bin = { [this.name]: `bin/${this.name}.js` };
    await this.write();
  }

  lint(dependencies: IDependency[]): void {
    if (dependencies.length) {
      const task = TaskTree.add('Lint package devDependencies:');

      dependencies.forEach(([name, version]) => {
        const currentVersion = semver.coerce((this.#data.devDependencies ?? {})[name]);
        const requiredVersion = semver.coerce(version);

        if (!currentVersion) {
          task.error(`{bold ${name}} is not presented!`, false);
        } else if (requiredVersion && semver.lt(currentVersion, requiredVersion)) {
          task.error(`${name} version is must be >=${version}!`, false);
        }
      });

      if (task.haveErrors) {
        task.fail('Some dependencies are missing or have wrong version:');
      } else {
        task.complete('All dependencies from shared config is presented in package.json');
      }
    }
  }

  async insert(scripts: IScript[]): Promise<void> {
    if (scripts.length) {
      const task = TaskTree.add('Inserting the required scripts:');
      const currentScripts = { ...(this.#data.scripts ?? {}) };

      scripts.forEach(([key, value]) => {
        if (!currentScripts[key]) task.log(`{bold ${key}} script added`);
        if (currentScripts[key] && currentScripts[key] !== value) task.log(`{bold ${key}} script replaced`);

        currentScripts[key] = value;
      });

      this.#data.scripts = Object.keys(currentScripts)
        .sort((a, b) => a.localeCompare(b))
        .reduce((acc, key) => ({ ...acc, [key]: currentScripts[key] }), {});
      await this.write();

      task.complete('Package scripts have been updated!');
    }
  }

  private async write(): Promise<void> {
    await writePkg({ ...(this.#data as { [key: string]: string }) });
  }
}
