import { promises as fs } from 'fs';
import path from 'path';
import { TaskTree } from 'tasktree-cli';
import { Task } from 'tasktree-cli/lib/Task';

import { EntityName, FileType, ISnapshot } from '../types';
import { getHash, getType, readFile, writeFile } from '../utils/file';
import { merge, parse, stringify } from '../utils/json';
import Config from './Config';

export default class Builder {
  async build(name: string, config: Config): Promise<void> {
    if (!config.isInitialized) await config.init();

    const { dependencies, scripts, outDir } = config;
    const snapshots = await Promise.all(config.paths.map(filePath => this.createSnapshot(filePath, config)));
    const entities = (
      await Promise.all([
        this.writeScript(EntityName.Dependencies, dependencies, outDir),
        this.writeScript(EntityName.Scripts, scripts, outDir),
        this.writeScript(EntityName.Snapshots, snapshots, outDir),
      ])
    ).filter(Boolean);

    await writeFile(`${outDir}/index.js`, [
      '/* --------------------------------------------------------------- */',
      '/* This file generated automatically                               */',
      '/* @see https://www.npmjs.com/package/standard-shared-config       */',
      '/* --------------------------------------------------------------- */',
      '',
      '/* eslint-disable */',
      "const SharedConfig = require('standard-shared-config').default;",
      ...entities.map(entity => `const ${entity} = require('./${entity}');`),
      'const config = new SharedConfig();',
      '',
      `config.share("${path.relative(process.cwd(), config.root)}", { ${entities.join(', ')} });`,
    ]);

    await writeFile(`${outDir}/bin/${name}`, ['#!/usr/bin/env node', "require('../index.js');"]);
  }

  async process(rootDir: string, snapshots: ISnapshot[]): Promise<void> {
    const task = TaskTree.add('Processing config files...');

    await Promise.all(snapshots.map(snapshot => this.shareConfig(rootDir, snapshot, task)));
    task.complete('Processed configs:');
  }

  private async shareConfig(rootDir: string, snapshot: ISnapshot, task: Task): Promise<void> {
    const filePath = path.resolve(process.cwd(), snapshot.path);
    const extendFileData = snapshot.merge ? await readFile(path.resolve(process.cwd(), rootDir, snapshot.path)) : false;

    if (extendFileData) {
      await writeFile(filePath, this.mergeFilesContent(snapshot, extendFileData));
      task.log(`${snapshot.path} merged`);
    } else {
      const currentFileData = await readFile(filePath);
      const hash = currentFileData ? getHash(currentFileData) : undefined;

      if (hash !== snapshot.hash) {
        await writeFile(filePath, snapshot.content);
        task.log(`${snapshot.path} ${currentFileData ? 'updated' : 'created'}`);
      } else {
        task.log(`${snapshot.path} is not changed`);
      }
    }
  }

  private mergeFilesContent({ type, merge: rules, content: snapshot }: ISnapshot, content: string): string {
    const excludes = Array.isArray(rules) ? new Set(rules) : undefined;
    let result;

    switch (type) {
      case FileType.GLOB:
        result = [...new Set([...content.split('\n'), ...snapshot.split('\n')].filter(Boolean)).values()]
          .map(row => row.trim())
          .sort()
          .join('\n');
        break;
      case FileType.Text:
        result = [...snapshot.split('\n'), ...content.split('\n')].join('\n');
        break;
      case FileType.JSON:
      case FileType.YAML:
        result = stringify(merge({ left: parse(content, type), right: parse(snapshot, type), excludes }), type);
        break;
      default:
        result = snapshot;
        break;
    }

    return result;
  }

  private async writeScript<T>(name: EntityName, values: T[], outDir: string): Promise<string> {
    const filePath = `${outDir}/${name}.js`;

    if (values.length) {
      await writeFile(filePath, [
        '/* eslint-disable */',
        '/* prettier-ignore */',
        `module.exports = ${stringify(values)}`,
      ]);
    } else {
      await fs.unlink(filePath);
    }

    return values.length ? name : '';
  }

  private async createSnapshot(filePath: string, config: Config): Promise<ISnapshot> {
    const content = (await readFile(filePath)) ?? '';
    const relativePath = path.relative(config.root, filePath);
    const type = getType(filePath);
    const rule = config.findRule(relativePath);

    return {
      path: relativePath,
      hash: getHash(content),
      merge: [FileType.GLOB, FileType.Text].includes(type) && rule ? true : rule ?? false,
      type,
      content,
    };
  }
}
