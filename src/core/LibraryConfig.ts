import glob from 'glob';
import path from 'path';
import TaskTree from 'tasktree-cli';
import yaml from 'yaml';

import { IDependency, IMergeRule, IScript } from '../types';
import { readFile } from '../utils/file';

export type ILibraryConfigOptions = { conf?: string };

export interface ILibraryConfig {
  rootDir?: string;
  outDir?: string;
  include?: string[];
  mergeRules?: { [key: string]: string[] | null | boolean };
  ignorePatterns?: { [key: string]: string[] };
  executableFiles?: string[];
  scripts?: { [key: string]: string };
  dependencies?: (string | { [key: string]: string })[];
}

export default class LibraryConfig {
  #rootDir: string;
  #outDir: string;
  #include: string[] = [];
  #ignorePatterns?: Map<string, string[]>;
  #executableFiles?: Set<string>;
  #mergeRules = new Map<string, IMergeRule>();
  #scripts: IScript[] = [];
  #dependencies: IDependency[] = [];
  #path: string;
  #isInitialized = false;

  constructor(conf = '.sharedconfig.yml') {
    this.#path = path.resolve(process.cwd(), conf);
    this.#rootDir = path.resolve(process.cwd(), '.config');
    this.#outDir = process.cwd();
  }

  get paths(): string[] {
    return this.#include.sort((a, b) => b.split('/').length - a.split('/').length || a.localeCompare(b));
  }

  get root(): string {
    return this.#rootDir;
  }

  get ignorePatterns(): [string, string[]][] {
    return this.#ignorePatterns ? [...this.#ignorePatterns.entries()] : [];
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
      const content = await readFile(this.#path);
      const {
        mergeRules,
        ignorePatterns,
        scripts,
        dependencies,
        executableFiles,
        rootDir,
        outDir,
        include,
      }: ILibraryConfig = content ? yaml.parse(content) : {};

      if (mergeRules) this.#mergeRules = this.normalizeMergeRules(mergeRules);
      if (ignorePatterns) this.#ignorePatterns = new Map(Object.entries(ignorePatterns));
      if (scripts) this.#scripts = Object.entries(scripts);
      if (dependencies) this.#dependencies = this.normalizeDependencies(dependencies);
      if (executableFiles) this.#executableFiles = new Set(executableFiles);
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

  findMergeRule(filePath: string): IMergeRule | undefined {
    return this.#mergeRules.get(filePath);
  }

  isExecutable(filePath: string): boolean {
    return !!this.#executableFiles?.size && this.#executableFiles.has(filePath);
  }

  private normalizeDependencies(dependencies: NonNullable<ILibraryConfig['dependencies']>): IDependency[] {
    return dependencies.map(
      dependency => (typeof dependency === 'string' ? [dependency] : Object.entries(dependency).pop()) as IDependency
    );
  }

  private normalizeMergeRules(rules: NonNullable<ILibraryConfig['mergeRules']>): Map<string, IMergeRule> {
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
