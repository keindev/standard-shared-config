import fs from 'fs';
import path from 'path';
import { coerce, lt } from 'semver';
import { TaskTree } from 'tasktree-cli';
import { PackageJson } from 'type-fest';
import writePkg from 'write-pkg';

import { IDependency, IScript } from '../types';

export default class Package {
  #data: PackageJson;

  constructor() {
    this.#data = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) as PackageJson;
  }

  get name(): string {
    return this.#data.name ?? '';
  }

  async update(): Promise<void> {
    this.#data.main = 'index.js';
    this.#data.bin = { [this.name]: `bin/${this.name}` };
    await this.write();
  }

  lint(dependencies: IDependency[]): void {
    if (dependencies.length) {
      const task = TaskTree.add('Lint package devDependencies:');

      dependencies.forEach(([name, version]) => {
        const currentVersion = coerce((this.#data.devDependencies ?? {})[name]);
        const requiredVersion = coerce(version);

        if (!currentVersion) {
          task.error(`${name} is not presented!`, false);
        } else if (requiredVersion && lt(currentVersion, requiredVersion)) {
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

      this.#data.scripts = currentScripts;
      await this.write();
      task.complete('Inserting the required scripts');
    }
  }

  private async write(): Promise<void> {
    await writePkg({ ...(this.#data as { [key: string]: string }) });
  }
}
