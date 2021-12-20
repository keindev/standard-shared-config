import Package from 'package-json-helper';
import { PackageManager } from 'package-json-helper/lib/types';
import { cast } from 'package-json-helper/lib/utils/parsers';
import path from 'path';
import TaskTree from 'tasktree-cli';
import yaml from 'yaml';

import {
    CONFIG_FILE, EntityName, FileType, IDependency, IExtractionConfig, IExtractionOptions, INormalizedExtractionConfig,
    INormalizedPackageParams, IScript, ISnapshot,
} from '../types';
import { getHash, mergeFiles, readFile, writeFile } from '../utils/file';

export default class Extractor {
  #sharedDir: string;

  constructor(sharedDir: string) {
    this.#sharedDir = sharedDir;
  }

  async extract({ snapshots = [], ...options }: IExtractionOptions): Promise<void> {
    const config = await this.readConfig(options);
    const pkg = new Package(path.join(process.cwd(), 'package.json'), config.package.manager ?? PackageManager.NPM);

    await pkg.read();
    await this.extractFiles(snapshots);
    await this.installDependencies(config.dependencies, pkg);
    this.insertScripts(config.scripts, pkg);
    this.updatePackage(config.package, pkg);
    await pkg.save();
  }

  private async extractFiles(snapshots: ISnapshot[]): Promise<void> {
    const task = TaskTree.add('Processing config files...');
    const extract = async (snapshot: ISnapshot): Promise<void> => {
      const filePath = path.resolve(process.cwd(), snapshot.path);
      const extendFilePath =
        snapshot.type === FileType.GLOB ? snapshot.path : path.join(this.#sharedDir, snapshot.path);
      const extendFileData = snapshot.merge ? await readFile(path.resolve(process.cwd(), extendFilePath)) : false;

      if (extendFileData) {
        await writeFile(filePath, mergeFiles(snapshot, extendFileData), snapshot.executable);
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

  private insertScripts(scripts: IScript[], pkg: Package): void {
    const task = TaskTree.add('Inserting the required scripts:');

    scripts.forEach(([key, value]) => {
      const script = pkg.scripts.get(key);

      if (!script) task.log(`{bold ${key}} script added`);
      if (script && script !== value) task.log(`{bold ${key}} script replaced`);

      pkg.scripts.set(key, value);
    });

    task.complete('Package scripts was updated!');
  }

  private async installDependencies(dependencies: IDependency[], pkg: Package): Promise<void> {
    const task = TaskTree.add('Lint package devDependencies:');
    const installationMap = new Map<string, string | undefined>();

    dependencies.forEach(([name, version]) => {
      const dependency = pkg.devDependencies.get(name);

      if (!dependency) installationMap.set(name, version);
      else if (version && !dependency.isSatisfy(version)) task.error(`${name} version is must be: ${version}`, false);
    });

    if (task.haveErrors) task.fail('Some dependencies are missing or have wrong version:');
    if (installationMap.size) await pkg.install(installationMap, ['--save-dev']);

    task.complete('All dependencies from shared config is presented in package.json');
  }

  private async readConfig({
    dependencies = [],
    scripts = [],
    ...options
  }: Omit<IExtractionOptions, EntityName.Snapshots>): Promise<INormalizedExtractionConfig> {
    const content = await readFile(path.resolve(process.cwd(), this.#sharedDir, CONFIG_FILE));
    const config: IExtractionConfig = content ? yaml.parse(content) : {};
    const overrideScripts = new Map(Object.entries(config.overrideScripts ?? {}));
    const ignoreDependencies = new Set(config.ignoreDependencies ?? []);

    return {
      scripts: scripts.map(([key, value]) => [key, overrideScripts.get(key) ?? value]),
      dependencies: dependencies.filter(([key]) => !ignoreDependencies.has(key)),
      package: {
        manager: options.package?.manager ?? PackageManager.NPM,
        type: options.package?.type,
        exports: cast.toExportsMap(options.package?.exports),
        types: cast.toString(options.package?.types),
      },
    };
  }

  private updatePackage(config: INormalizedPackageParams, pkg: Package): void {
    const task = TaskTree.add('Update package params:');

    if (config.type && pkg.type !== config.type) pkg.type = config.type;
    if (config.types && pkg.types !== config.types) pkg.types = config.types;
    if (config.exports) {
      if (pkg.exports) {
        const { map } = pkg.exports;

        config.exports.map.forEach((value, key) => map.set(key, value));
      } else {
        pkg.exports = config.exports;
      }
    }

    task.complete('Package parameters was updated!');
  }
}
