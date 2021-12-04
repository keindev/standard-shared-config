import Package from 'package-json-helper';
import TaskTree from 'tasktree-cli';

import Builder from './core/Builder';
import Extractor from './core/Extractor';
import { CONFIG_FILE, IExtractionOptions } from './types';

/** Shared configuration manager */
export class SharedConfig {
  #package = new Package();

  /** Build a shared configuration npm package structure */
  async build(configPath = CONFIG_FILE): Promise<void> {
    try {
      const task = TaskTree.add('Building...');
      const builder = new Builder(this.#package.name);

      await builder.build(configPath, this.#package);
      task.complete('Shared config package is builded!');
    } catch (error) {
      if (error instanceof Error) {
        TaskTree.fail(error);
      }
    }
  }

  /** Create configuration files by shared config structure */
  async share(dir: string, options: IExtractionOptions): Promise<void> {
    const tree = TaskTree.tree().start();

    try {
      const task = TaskTree.add('Share configs:');
      const extractor = new Extractor(dir);

      await extractor.extract(options, this.#package);
      task.complete('Shared configs:');
      tree.exit();
    } catch (error) {
      if (error instanceof Error) {
        tree.fail(error);
      }
    }
  }
}

export default SharedConfig;
