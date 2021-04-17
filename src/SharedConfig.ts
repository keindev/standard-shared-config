import { TaskTree } from 'tasktree-cli';

import Builder from './core/Builder';
import Config, { IConfigOptions } from './core/Config';
import Package from './core/Package';
import { EntityName, IDependency, IScript, ISnapshot } from './types';

export type IBuildOptions = IConfigOptions;
export type IShareOptions = Partial<{
  [EntityName.Dependencies]: IDependency[];
  [EntityName.Scripts]: IScript[];
  [EntityName.Snapshots]: ISnapshot[];
}>;

export class SharedConfig {
  async build(options: IBuildOptions): Promise<void> {
    const task = TaskTree.add('Building...');
    const config = new Config(options);
    const pkg = new Package();
    const builder = new Builder(config, pkg);

    await config.init();
    await builder.build();
    task.complete('Shared config package is builded!');
  }

  async share({ dependencies = [], scripts = [], snapshots = [] }: IShareOptions): Promise<void> {
    const task = TaskTree.add('Share configs:');
    const pkg = new Package();

    pkg.lint(dependencies);
    await pkg.insert(scripts);

    await Promise.resolve({ snapshots });
    task.complete('Shared configs:');
  }
}

export default SharedConfig;
