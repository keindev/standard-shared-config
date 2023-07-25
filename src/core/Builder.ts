import { existsSync, promises as fs } from 'fs';
import { ExportMap, Package } from 'package-json-helper';
import { JSONObject, JSONValue } from 'package-json-helper/types/base';
import { PackageType } from 'package-json-helper/types/package';
import path from 'path';
import yaml from 'yaml';

import { EntityName } from '../types/base.js';
import { INormalizedSharedConfig, ISharedConfig } from '../types/config.js';
import { OUTPUT_DIR, SHARED_DIR } from '../types/constants.js';
import { createSnapshots, readFile, writeFile } from '../utils/file.js';
import { stringify } from '../utils/json.js';

const PARTS_DIR_NAME = 'parts';

export default class Builder {
  async build(configPath: string): Promise<void> {
    const { outputDir, sharedDir, ...config } = await this.readConfig(configPath);
    const entities = (
      await Promise.all([
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
      ...entities.map(entity => `import ${entity} from './${PARTS_DIR_NAME}/${entity}.js'`),
      '',
      `await new SharedConfig().share("${sharedDir}", { ${entities.join(', ')}, package: ${stringify(
        config.package as JSONObject
      )} });`,
    ]);

    await this.createBinCallback(outputDir);
  }

  private async createBinCallback(outputDir: string): Promise<void> {
    const pkg = new Package();
    const indexPath = `./${path.join(outputDir, 'index.js')}`;

    await pkg.read();
    await writeFile(`bin/${pkg.nameWithoutScope}.js`, ['#!/usr/bin/env node', `import '../${outputDir}/index.js';`]);

    if (pkg.exports) pkg.exports.map.set('.', indexPath);
    else pkg.exports = new ExportMap({ map: new Map([['.', indexPath]]) });

    pkg.type = PackageType.Module;
    pkg.bin.set(pkg.nameWithoutScope, `bin/${pkg.nameWithoutScope}.js`);
    await pkg.save();
  }

  private async readConfig(configPath: string): Promise<INormalizedSharedConfig> {
    const content = await readFile(configPath);
    const config: ISharedConfig = content ? yaml.parse(content) : {};
    const outputDir = config.outputDir ?? OUTPUT_DIR;
    const sharedDir = config.sharedDir ?? SHARED_DIR;
    const snapshots = await createSnapshots(sharedDir, config);

    return {
      snapshots,
      sharedDir,
      outputDir,
      scripts: Object.entries(config.scripts ?? {}),
      package: config.package ?? {},
    };
  }

  private async writeScript<T>(name: EntityName, values: T[], outputDir: string): Promise<string> {
    const filePath = `${outputDir}/${PARTS_DIR_NAME}/${name}.js`;

    if (values.length) {
      await writeFile(filePath, [
        '/* eslint-disable */',
        '/* prettier-ignore */',
        `export default ${stringify(values as JSONValue[])}`,
      ]);
    } else {
      if (existsSync(filePath)) await fs.unlink(filePath);
    }

    return values.length ? name : '';
  }
}
