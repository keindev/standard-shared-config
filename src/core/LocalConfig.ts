import path from 'path';
import { TaskTree } from 'tasktree-cli';
import yaml from 'yaml';

import { IScript } from '../types';
import { readFile } from '../utils/file';

export interface ILocalConfig {
  overrideScripts?: { [key: string]: string };
  ignoreDependencies?: string[];
}

export default class LocalConfig {
  #path: string;
  #scripts = new Map<string, string>();
  #dependencies = new Set<string>();
  #isInitialized = false;

  constructor() {
    this.#path = path.resolve(process.cwd(), '.sharedconfig.override.yml');
  }

  get overrideScripts(): IScript[] {
    return [...this.#scripts.entries()];
  }

  get ignoreDependencies(): string[] {
    return [...this.#dependencies.values()];
  }

  get isInitialized(): boolean {
    return this.#isInitialized;
  }

  async init(): Promise<void> {
    if (this.#isInitialized) return;

    try {
      const content = await readFile(this.#path);
      const { ignoreDependencies, overrideScripts }: ILocalConfig = content ? yaml.parse(content) : {};

      if (overrideScripts) this.#scripts = new Map(Object.entries(overrideScripts));
      if (ignoreDependencies) this.#dependencies = new Set(ignoreDependencies);

      this.#isInitialized = true;
    } catch (error) {
      TaskTree.fail(error);
    }
  }

  findScript(name: string): string | undefined {
    return this.#scripts.get(name);
  }

  isIgnoreDependency(name: string): boolean {
    return this.#dependencies.has(name);
  }
}
