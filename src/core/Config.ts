import { constants, promises as fs } from 'fs';
import path from 'path';
import { TaskTree } from 'tasktree-cli';
import yaml from 'yaml';

import { IDependency, IMergeRule, IScript } from '../types';

export type IConfigOptions = { conf?: string };

export interface IConfigFile {
  root?: string;
  rules?: { [key: string]: string[] | null };
  scripts?: { [key: string]: string };
  dependencies?: (string | { [key: string]: string })[];
}

export default class Config {
  #root?: string;
  #output?: string;
  #rules = new Map<string, IMergeRule>();
  #scripts: IScript[] = [];
  #dependencies: IDependency[] = [];
  #configPath: string;

  constructor({ conf = '.sharedconfig.yml' }: IConfigOptions) {
    this.#configPath = path.resolve(process.cwd(), conf);
  }

  get root(): string {
    return this.#root ?? '';
  }

  get output(): string {
    return this.#output ?? '';
  }

  get scripts(): IScript[] {
    return this.#scripts;
  }

  get dependencies(): IDependency[] {
    return this.#dependencies;
  }

  async init(): Promise<void> {
    try {
      const isExists = await fs
        .access(this.#configPath, constants.R_OK)
        .then(() => true)
        .catch(() => false);

      if (isExists) {
        const file = await fs.readFile(this.#configPath, 'utf8');
        const { rules, scripts, dependencies, root = '.config' }: IConfigFile = yaml.parse(file);
        const cwd = process.cwd();

        if (scripts) {
          this.#scripts = Object.entries(scripts);
        }

        if (dependencies) {
          this.#dependencies = dependencies.map(
            dependency =>
              (typeof dependency === 'string' ? [dependency] : Object.entries(dependency).pop()) as IDependency
          );
        }

        if (rules) {
          Object.entries(rules).forEach(([key, value]) => {
            if (Array.isArray(value) || value === null) {
              this.#rules.set(key, Array.isArray(value) ? value.filter(item => typeof item === 'string') : !!value);
            }
          });
        }

        this.#root = path.resolve(cwd, root);
        this.#output = cwd;
      }
    } catch (error) {
      TaskTree.fail(error);
    }
  }

  findRule(filePath: string): IMergeRule | undefined {
    return this.#rules.get(filePath);
  }
}
