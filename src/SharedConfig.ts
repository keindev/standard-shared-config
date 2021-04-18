import { TaskTree } from 'tasktree-cli';

import Config from './core/Config';
import Package from './core/Package';
import PackageStructureBuilder from './core/PackageStructureBuilder';
import SnapshotProcessor from './core/SnapshotProcessor';
import { EntityName, IDependency, IScript, ISnapshot } from './types';

export type IBuildOptions = { conf?: string };
export type IShareOptions = Partial<{
  [EntityName.Dependencies]: IDependency[];
  [EntityName.Scripts]: IScript[];
  [EntityName.Snapshots]: ISnapshot[];
}>;

export class SharedConfig {
  async build({ conf }: IBuildOptions): Promise<void> {
    const task = TaskTree.add('Building...');
    const config = new Config(conf);
    const pkg = new Package();
    const builder = new PackageStructureBuilder(config);

    await config.init();
    await builder.build(pkg.name);
    await pkg.update();
    task.complete('Shared config package is builded!');
  }

  async share({ dependencies = [], scripts = [], snapshots = [] }: IShareOptions): Promise<void> {
    const task = TaskTree.add('Share configs:');
    const pkg = new Package();
    const processor = new SnapshotProcessor();

    pkg.lint(dependencies);
    await processor.process(snapshots, task);
    await pkg.insert(scripts);
    task.complete('Shared configs:');
  }
}

export default SharedConfig;
