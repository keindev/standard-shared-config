import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import strip from 'strip-comments';

import { EntityName, FileType, ISnapshot } from '../types';
import Config from './Config';
import Package from './Package';

export default class Builder {
  #config: Config;
  #pkg: Package;

  constructor(config: Config, pkg: Package) {
    this.#config = config;
    this.#pkg = pkg;
  }

  async build(): Promise<void> {
    const { dependencies, scripts, output } = this.#config;
    const snapshots: ISnapshot[] = [];

    for await (const snapshot of this.getSnapshot()) {
      snapshots.push(snapshot);
    }

    const entities = await Promise.all([
      this.writeEntity(EntityName.Dependencies, dependencies),
      this.writeEntity(EntityName.Scripts, scripts),
      this.writeEntity(
        EntityName.Snapshots,
        snapshots.sort((a, b) => b.path.split('/').length - a.path.split('/').length || a.path.localeCompare(b.path))
      ),
    ]);

    await fs.writeFile(
      `${output}/index.js`,
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

    await fs.writeFile(
      `${output}/bin/${this.#pkg.name}`,
      ['#!/usr/bin/env node', "require('../index.js');"].join('\n')
    );

    await this.#pkg.update();
  }

  private async writeEntity<T>(name: EntityName, values: T[]): Promise<string> {
    const filePath = `${this.#config.output}/${name}.js`;

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

  private async *getSnapshot(root = this.#config.root): AsyncGenerator<ISnapshot> {
    const fileNames = await fs.readdir(root);

    for (const fileName of fileNames) {
      const filePath = path.resolve(root, fileName);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        yield* this.getSnapshot(filePath);
      } else {
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

        yield { path: relativePath, hash, merge, type, content: strip(content) };
      }
    }
  }
}
