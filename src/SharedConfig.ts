import { TaskTree } from 'tasktree-cli';

import Builder from './core/Builder';
import Config from './core/Config';
import Package from './core/Package';
import { EntityName, IDependency, IScript, ISnapshot } from './types';

export type IBuildOptions = { conf?: string };
export type IShareOptions = Partial<{
  [EntityName.Dependencies]: IDependency[];
  [EntityName.Scripts]: IScript[];
  [EntityName.Snapshots]: ISnapshot[];
}>;

export class SharedConfig {
  #builder = new Builder();

  async build({ conf }: IBuildOptions): Promise<void> {
    const task = TaskTree.add('Building...');
    const pkg = new Package();

    await this.#builder.build(pkg.name, new Config(conf));
    await pkg.update();
    task.complete('Shared config package is builded!');
  }

  async share({ dependencies = [], scripts = [], snapshots = [] }: IShareOptions): Promise<void> {
    const task = TaskTree.add('Share configs:');
    const pkg = new Package();

    pkg.lint(dependencies);
    await this.#builder.process(snapshots);
    await pkg.insert(scripts);
    task.complete('Shared configs:');
  }
}

export default SharedConfig;
