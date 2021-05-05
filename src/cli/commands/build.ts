import TaskTree from 'tasktree-cli';
import { Arguments } from 'yargs';

import SharedConfig, { IBuildOptions } from '../../SharedConfig';

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

export default {
  command: 'build',
  alias: 'b',
  desc: 'Build shared config map',
  showInHelp: true,
  builder: {
    conf: {
      string: true,
      alias: 'c',
      description: 'Path to shared configuration',
      default: '.sharedconfig.yml',
    },
  },
  handler: (options: Arguments<IBuildOptions>): Promise<void> => build(options),
};
