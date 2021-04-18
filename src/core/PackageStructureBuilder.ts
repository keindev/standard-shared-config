import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import strip from 'strip-comments';

import { EntityName, FileType, ISnapshot } from '../types';
import Config from './Config';

export default class PackageStructureBuilder {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  async build(name: string): Promise<void> {
    const { dependencies, scripts, outDir } = this.#config;
    const snapshots: ISnapshot[] = await Promise.all(this.#config.paths.map(filePath => this.getSnapshot(filePath)));
    const entities = await Promise.all([
      this.writeEntity(EntityName.Dependencies, dependencies),
      this.writeEntity(EntityName.Scripts, scripts),
      this.writeEntity(
        EntityName.Snapshots,
        snapshots.sort((a, b) => b.path.split('/').length - a.path.split('/').length || a.path.localeCompare(b.path))
      ),
    ]);

    await fs.writeFile(
      `${outDir}/index.js`,
      [
        '/* --------------------------------------------------------------- */',
        '/* This file generated automatically                               */',
        '/* @see https://www.npmjs.com/package/standard-shared-config       */',
        '/* --------------------------------------------------------------- */',
        '',
        '/* eslint-disable */',
        "const sharedConfig = require('standard-shared-config');",
        ...entities.map(entity => `const ${entity} = require('./${entity}');`),
        '',
        `sharedConfig.share({ ${entities.join(', ')} });`,
      ].join('\n')
    );

    await fs.writeFile(`${outDir}/bin/${name}`, ['#!/usr/bin/env node', "require('../index.js');"].join('\n'));
  }

  private async writeEntity<T>(name: EntityName, values: T[]): Promise<string> {
    const filePath = `${this.#config.outDir}/${name}.js`;

    if (values.length) {
      await fs.writeFile(
        filePath,
        [
          '/* eslint-disable */',
          '/* prettier-ignore */',
          `module.exports = ${JSON.stringify(values, undefined, 2)}`,
        ].join('\n')
      );
    } else {
      await fs.unlink(filePath);
    }

    return values.length ? name : '';
  }

  private async getSnapshot(filePath: string): Promise<ISnapshot> {
    const extname = path.extname(filePath).substring(1).toLowerCase();
    const content = await fs.readFile(filePath, 'utf8');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const relativePath = path.relative(this.#config.root, filePath);
    const merge = this.#config.findRule(relativePath) ?? false;
    let type: FileType;

    switch (true) {
      case extname === 'json':
        type = FileType.JSON;
        break;
      case ['yaml', 'yml'].includes(extname):
        type = FileType.YAML;
        break;
      case /\.[a-z]+ignore/i.test(path.basename(filePath, path.extname(filePath))):
        type = FileType.GLOB;
        break;
      default:
        type = FileType.Text;
        break;
    }

    return { path: relativePath, hash, merge, type, content: strip(content) };
  }
}
