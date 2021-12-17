import Package from 'package-json-helper';
import path from 'path';
import TaskTree from 'tasktree-cli';
import yaml from 'yaml';

import {
    CONFIG_FILE, EntityName, FileType, IDependency, IExtractionConfig, IExtractionOptions, INormalizedExtractionConfig,
    IScript, ISnapshot,
} from '../types';
import { getHash, mergeFiles, readFile, writeFile } from '../utils/file';

export default class Extractor {
  #sharedDir: string;

  constructor(sharedDir: string) {
    this.#sharedDir = sharedDir;
  }

  async extract({ snapshots = [], ...options }: IExtractionOptions, pkg: Package): Promise<void> {
    const { dependencies, scripts } = await this.readConfig(options);

    await this.extractFiles(snapshots);
    this.insertScripts(scripts, pkg);
    this.installDependencies(dependencies, pkg);
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

    pkg.save();
    task.complete('Package scripts have been updated!');
  }

  private installDependencies(dependencies: IDependency[], pkg: Package): void {
    const task = TaskTree.add('Lint package devDependencies:');
    const installationMap = new Map<string, string | undefined>();

    dependencies.forEach(([name, version]) => {
      const dependency = pkg.devDependencies.get(name);

      if (!dependency) installationMap.set(name, version);
      else if (version && !dependency.isSatisfy(version)) task.error(`${name} version is must be: ${version}`, false);
    });

    if (task.haveErrors) task.fail('Some dependencies are missing or have wrong version:');
    if (installationMap.size) pkg.install(installationMap);

    task.complete('All dependencies from shared config is presented in package.json');
  }

  private async readConfig({
    dependencies = [],
    scripts = [],
  }: Pick<IExtractionOptions, EntityName.Dependencies | EntityName.Scripts>): Promise<INormalizedExtractionConfig> {
    const content = await readFile(path.resolve(process.cwd(), this.#sharedDir, CONFIG_FILE));
    const config: IExtractionConfig = content ? yaml.parse(content) : {};
    const overrideScripts = new Map(Object.entries(config.overrideScripts ?? {}));
    const ignoreDependencies = new Set(config.ignoreDependencies ?? []);

    return {
      scripts: scripts.map(([key, value]) => [key, overrideScripts.get(key) ?? value]),
      dependencies: dependencies.filter(([key]) => !ignoreDependencies.has(key)),
    };
  }
}
