import { Package } from 'package-json-helper';
import { ManagerType } from 'package-json-helper/types/package';
import { cast } from 'package-json-helper/utils/parsers';
import path from 'path';
import TaskTree from 'tasktree-cli';
import yaml from 'yaml';

import { EntityName, FileType, ISnapshot } from '../types/base.js';
import { IExtractionConfig, INormalizedExtractionConfig } from '../types/config.js';
import { CONFIG_FILE } from '../types/constants.js';
import { IExtractionOptions } from '../types/options.js';
import { getHash, mergeFiles, readFile, writeFile } from '../utils/file.js';

export default class Extractor {
  readonly #sharedDir: string;

  constructor(sharedDir: string) {
    this.#sharedDir = sharedDir;
  }

  async extract({ snapshots = [], name = '', ...options }: IExtractionOptions): Promise<void> {
    const config = await this.readConfig(options);
    const pkg = new Package(path.join(process.cwd(), 'package.json'), config.package.manager ?? ManagerType.NPM);

    await pkg.read();
    await this.extractFiles(name, snapshots);
    this.updatePackage(config, pkg);
    await pkg.save();
  }

  private async extractFiles(name: string, snapshots: ISnapshot[]): Promise<void> {
    const task = TaskTree.add('Processing config files...');
    const extract = async (snapshot: ISnapshot): Promise<void> => {
      const filePath = path.resolve(process.cwd(), snapshot.path);
      const extendFilePath =
        snapshot.type === FileType.GLOB ? snapshot.path : path.join(this.#sharedDir, snapshot.path);
      const content = snapshot.merge ? await readFile(path.resolve(process.cwd(), extendFilePath)) : false;

      if (content) {
        await writeFile(filePath, mergeFiles(name, content, snapshot), snapshot.executable);
        task.log(`${snapshot.path} merged`);
      } else {
        const currentFileData = await readFile(filePath);
        const hash = currentFileData ? getHash(currentFileData) : undefined;

        if (hash !== snapshot.hash) {
          await writeFile(filePath, snapshot.content, snapshot.executable);
          task.log(`${snapshot.path} ${currentFileData ? 'updated' : 'created'}`);
        }
      }
    };

    await Promise.all(snapshots.map(extract));
    task.complete('Processed configs:');
  }

  private async readConfig({
    scripts = [],
    ...options
  }: Omit<IExtractionOptions, EntityName.Snapshots>): Promise<INormalizedExtractionConfig> {
    const content = await readFile(path.resolve(process.cwd(), this.#sharedDir, CONFIG_FILE));
    const config: IExtractionConfig = content ? yaml.parse(content) : {};
    const overrideScripts = new Map(Object.entries(config.overrideScripts ?? {}));

    return {
      scripts: scripts.map(([key, value]) => [key, overrideScripts.get(key) ?? value]),
      package: {
        exports: cast.toExportsMap(options.package?.exports),
        manager: options.package?.manager ?? ManagerType.NPM,
        peerDependencies: options.package?.peerDependencies,
        type: options.package?.type,
        types: cast.toString(options.package?.types),
      },
    };
  }

  private updatePackage(
    { scripts, package: { type, types, exports, peerDependencies = {} } }: INormalizedExtractionConfig,
    pkg: Package
  ): void {
    let task = TaskTree.add('Inserting the required scripts:');

    scripts.forEach(([key, value]) => {
      const script = pkg.scripts.get(key);

      if (!script) task.log(`{bold ${key}} script added`);
      if (script && script !== value) task.log(`{bold ${key}} script replaced`);

      pkg.scripts.set(key, value);
    });

    cast.toDependencyMap(peerDependencies, pkg.peerDependencies);
    task.complete('Package scripts was updated!');
    task = TaskTree.add('Update package params:');

    if (type && pkg.type !== type) pkg.type = type;
    if (types && pkg.types !== types) pkg.types = types;
    if (exports) {
      if (pkg.exports) {
        const { map } = pkg.exports;

        exports.map.forEach((value, key) => map.set(key, value));
      } else {
        pkg.exports = exports;
      }
    }

    task.complete('Package parameters was updated!');
  }
}
