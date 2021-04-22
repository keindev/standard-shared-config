import { TaskTree } from 'tasktree-cli';

import Builder from './core/Builder';
import Config from './core/Config';
import Package from './core/Package';
import { EntityName, IDependency, IScript, ISnapshot } from './types';

export type IBuildOptions = {
  /** Configuration file path */
  conf?: string;
};

export type IShareOptions = {
  /** Package devDependencies list */
  [EntityName.Dependencies]?: IDependency[];
  /** List of package scripts */
  [EntityName.Scripts]?: IScript[];
  /** Configuration files snapshots */
  [EntityName.Snapshots]?: ISnapshot[];
};

/** Shared configuration manager */
export class SharedConfig {
  #builder = new Builder();

  /** Build a shared configuration npm package structure */
  async build({ conf }: IBuildOptions): Promise<void> {
    const task = TaskTree.add('Building...');
    const pkg = new Package();

    await this.#builder.build(pkg.name, new Config(conf));
    await pkg.update();
    task.complete('Shared config package is builded!');
  }

  /** Create configuration files by shared config structure */
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
