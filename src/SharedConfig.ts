import { TaskTree } from 'tasktree-cli';

import Builder from './core/Builder';
import LibraryConfig from './core/LibraryConfig';
import LocalConfig from './core/LocalConfig';
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

    await this.#builder.build(pkg.name, new LibraryConfig(conf));
    await pkg.update();
    task.complete('Shared config package is builded!');
  }

  /** Create configuration files by shared config structure */
  async share(rootDir: string, { dependencies = [], scripts = [], snapshots = [] }: IShareOptions): Promise<void> {
    const tree = TaskTree.tree().start();

    try {
      const task = TaskTree.add('Share configs:');
      const config = new LocalConfig();
      const pkg = new Package();

      await config.init();
      pkg.lint(dependencies.filter(([key]) => !config.isIgnoreDependency(key)));
      await this.#builder.process(rootDir, snapshots);
      await pkg.insert(scripts.map(([key, value]) => [key, config.findScript(key) ?? value]));
      task.complete('Shared configs:');
      tree.exit();
    } catch (error) {
      tree.fail(error);
    }
  }
}

export default SharedConfig;
