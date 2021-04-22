import glob from 'glob';
import path from 'path';
import { TaskTree } from 'tasktree-cli';
import yaml from 'yaml';

import { IDependency, IMergeRule, IScript } from '../types';
import { getFileContent } from '../utils/file';

export type IConfigOptions = { conf?: string };

export interface IConfigFile {
  rootDir?: string;
  outDir?: string;
  include?: string[];
  rules?: { [key: string]: string[] | null | boolean };
  scripts?: { [key: string]: string };
  dependencies?: (string | { [key: string]: string })[];
}

export default class Config {
  #rootDir: string;
  #outDir: string;
  #include: string[];
  #rules = new Map<string, IMergeRule>();
  #scripts: IScript[] = [];
  #dependencies: IDependency[] = [];
  #path: string;
  #isInitialized = false;

  constructor(conf = '.sharedconfig.yml') {
    this.#path = path.resolve(process.cwd(), conf);
    this.#rootDir = path.resolve(process.cwd(), '.config');
    this.#outDir = process.cwd();
    this.#include = [];
  }

  get paths(): string[] {
    return this.#include;
  }

  get root(): string {
    return this.#rootDir;
  }

  get outDir(): string {
    return this.#outDir;
  }

  get scripts(): IScript[] {
    return this.#scripts;
  }

  get dependencies(): IDependency[] {
    return this.#dependencies;
  }

  get isInitialized(): boolean {
    return this.#isInitialized;
  }

  async init(): Promise<void> {
    if (this.#isInitialized) return;

    try {
      const content = await getFileContent(this.#path);
      const { rules, scripts, dependencies, rootDir, outDir, include }: IConfigFile = content
        ? yaml.parse(content)
        : {};

      if (scripts) this.#scripts = this.normalizeScripts(scripts);
      if (dependencies) this.#dependencies = this.normalizeDependencies(dependencies);
      if (rules) this.#rules = this.normalizeRules(rules);
      if (rootDir) this.#rootDir = path.resolve(process.cwd(), rootDir);
      if (outDir) this.#outDir = path.resolve(process.cwd(), outDir);

      this.#include = (include ?? ['**/*'])
        .map(pattern => glob.sync(`${this.#rootDir}/${pattern}`, { dot: true, strict: true, nodir: true }))
        .flat();

      this.#isInitialized = true;
    } catch (error) {
      TaskTree.fail(error);
    }
  }

  findRule(filePath: string): IMergeRule | undefined {
    return this.#rules.get(filePath);
  }

  private normalizeScripts(scripts: NonNullable<IConfigFile['scripts']>): IScript[] {
    return Object.entries(scripts);
  }

  private normalizeDependencies(dependencies: NonNullable<IConfigFile['dependencies']>): IDependency[] {
    return dependencies.map(
      dependency => (typeof dependency === 'string' ? [dependency] : Object.entries(dependency).pop()) as IDependency
    );
  }

  private normalizeRules(rules: NonNullable<IConfigFile['rules']>): Map<string, IMergeRule> {
    return new Map(
      Object.entries(rules).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) acc.push([key, value.filter(item => typeof item === 'string')]);
        if (value === null) acc.push([key, !value]);
        if (typeof value === 'boolean') acc.push([key, value]);

        return acc;
      }, [] as [string, IMergeRule][])
    );
  }
}
