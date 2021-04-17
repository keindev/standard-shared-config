import { TaskTree } from 'tasktree-cli';
import { Arguments } from 'yargs';

import SharedConfig, { IBuildOptions } from '../../SharedConfig';

export const command = 'build';
export const alias = 'b';
export const desc = 'Build shared config map';
export const showInHelp = true;
export const builder = {
  conf: {
    string: true,
    alias: 'c',
    description: 'Path to shared configuration',
    default: '.sharedconfig.yml',
  },
};

const build = async (options: IBuildOptions): Promise<void> => {
  const tree = TaskTree.tree().start();
  const config = new SharedConfig();

  try {
    await config.build(options);
    tree.exit();
  } catch (error) {
    tree.fail(error);
  }
};

export const handler = (options: Arguments<IBuildOptions>): Promise<void> => build(options);
