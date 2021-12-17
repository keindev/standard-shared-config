import { promises as fs } from 'fs';
import Package from 'package-json-helper';
import path from 'path';
import yaml from 'yaml';

import {
    EntityName, IDependency, INormalizedSharedConfig, ISharedConfig, OUTPUT_DIR, PackageManager, SHARED_DIR,
} from '../types';
import { createSnapshots, readFile, writeFile } from '../utils/file';
import { stringify } from '../utils/json';

const PARTS_DIR_NAME = 'parts';

export default class Builder {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  async build(configPath: string, pkg: Package): Promise<void> {
    const { outputDir, sharedDir, ...config } = await this.readConfig(configPath);
    const entities = (
      await Promise.all([
        this.writeScript(EntityName.Dependencies, config.dependencies, outputDir),
        this.writeScript(EntityName.Scripts, config.scripts, outputDir),
        this.writeScript(EntityName.Snapshots, config.snapshots, outputDir),
      ])
    ).filter(Boolean);

    await writeFile(`${outputDir}/index.js`, [
      '/* --------------------------------------------------------------- */',
      '/* This file generated automatically                               */',
      '/* @see https://www.npmjs.com/package/standard-shared-config       */',
      '/* --------------------------------------------------------------- */',
      '',
      '/* eslint-disable */',
      "import SharedConfig from 'standard-shared-config'",
      ...entities.map(entity => `import ${entity} from './${PARTS_DIR_NAME}/${entity}'`),
      '',
      `await new SharedConfig().share("${sharedDir}", { ${entities.join(', ')} });`,
    ]);

    await writeFile(`bin/${this.name}.js`, ['#!/usr/bin/env node', `import '../${outputDir}/index.js';`]);

    pkg.exports.map.set('.', path.join(outputDir, 'index.js'));
    pkg.bin.set(this.name, `bin/${this.name}.js`);
    pkg.save();
  }

  private async readConfig(configPath: string): Promise<INormalizedSharedConfig> {
    const content = await readFile(path.relative(process.cwd(), configPath));
    const config: ISharedConfig = content ? yaml.parse(content) : {};
    const outputDir = path.relative(process.cwd(), config.outputDir ?? OUTPUT_DIR);
    const sharedDir = config.sharedDir ?? SHARED_DIR;
    const snapshots = await createSnapshots(process.cwd(), config);

    return {
      snapshots,
      sharedDir,
      outputDir,
      dependencies:
        (config.dependencies &&
          config.dependencies.map(
            dependency =>
              (typeof dependency === 'string' ? [dependency] : Object.entries(dependency).pop()) as IDependency
          )) ??
        [],
      scripts: Object.entries(config.scripts ?? {}),
      manager: config.manager ?? PackageManager.NPM,
    };
  }

  private async writeScript<T>(name: EntityName, values: T[], outputDir: string): Promise<string> {
    const filePath = `${outputDir}/${PARTS_DIR_NAME}/${name}.js`;

    if (values.length) {
      await writeFile(filePath, [
        '/* eslint-disable */',
        '/* prettier-ignore */',
        `export default ${stringify(values)}`,
      ]);
    } else {
      await fs.unlink(filePath);
    }

    return values.length ? name : '';
  }
}
