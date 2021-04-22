import { promises as fs } from 'fs';
import path from 'path';
import { TaskTree } from 'tasktree-cli';
import { Task } from 'tasktree-cli/lib/Task';

import { EntityName, FileType, ISnapshot } from '../types';
import { getFileContent, getFileHash, getFileType } from '../utils/file';
import { merge, parse, stringify } from '../utils/json';
import Config from './Config';

export default class Builder {
  async build(name: string, config: Config): Promise<void> {
    if (!config.isInitialized) await config.init();

    const { dependencies, scripts, outDir } = config;
    const snapshots = await Promise.all(config.paths.map(filePath => this.createSnapshot(filePath, config)));
    const entities = (
      await Promise.all([
        this.writeEntityScript(EntityName.Dependencies, dependencies, outDir),
        this.writeEntityScript(EntityName.Scripts, scripts, outDir),
        this.writeEntityScript(
          EntityName.Snapshots,
          snapshots.sort((a, b) => b.path.split('/').length - a.path.split('/').length || a.path.localeCompare(b.path)),
          outDir
        ),
      ])
    ).filter(Boolean);

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

  async process(snapshots: ISnapshot[]): Promise<void> {
    const task = TaskTree.add('Processing config files...');

    await Promise.all(snapshots.map(snapshot => this.shareConfig(snapshot, task)));
    task.complete('Processed configs:');
  }

  private async shareConfig(snapshot: ISnapshot, task: Task): Promise<void> {
    const filePath = path.resolve(process.cwd(), snapshot.path);
    const content = await getFileContent(filePath);

    if (content) {
      const hash = getFileHash(content);

      if (hash !== snapshot.hash) {
        if (snapshot.merge) {
          await fs.writeFile(filePath, this.mergeFilesContent(snapshot, content));
          task.log(`${snapshot.path} merged`);
        } else {
          await fs.writeFile(filePath, snapshot.content);
          task.log(`${snapshot.path} updated`);
        }
      } else {
        task.log(`${snapshot.path} is not changed`);
      }
    } else {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, snapshot.content);

      task.log(`${snapshot.path} created`);
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

  private async writeEntityScript<T>(name: EntityName, values: T[], outDir: string): Promise<string> {
    const filePath = `${outDir}/${name}.js`;

    if (values.length) {
      await fs.writeFile(
        filePath,
        ['/* eslint-disable */', '/* prettier-ignore */', `module.exports = ${stringify(values)}`].join('\n')
      );
    } else {
      await fs.unlink(filePath);
    }

    return values.length ? name : '';
  }

  private async createSnapshot(filePath: string, config: Config): Promise<ISnapshot> {
    const content = (await getFileContent(filePath)) ?? '';
    const relativePath = path.relative(config.root, filePath);
    const type = getFileType(filePath);
    const rule = config.findRule(relativePath);

    return {
      path: relativePath,
      hash: getFileHash(content),
      merge: [FileType.GLOB, FileType.Text].includes(type) && rule ? true : rule ?? false,
      type,
      content,
    };
  }
}
