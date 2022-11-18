import TaskTree from 'tasktree-cli';
import { ArgumentsCamelCase } from 'yargs';

import SharedConfig from '../../SharedConfig.js';
import { CONFIG_FILE } from '../../types.js';

interface IArguments {
  configPath: string;
}

const build = async ({ configPath }: ArgumentsCamelCase<IArguments>): Promise<void> => {
  const tree = TaskTree.tree().start();
  const config = new SharedConfig();

  try {
    await config.build(configPath);
    tree.exit();
  } catch (error) {
    if (error instanceof Error) {
      tree.fail(error);
    }
  }
};

export default {
  command: 'build',
  alias: 'b',
  desc: 'Build shared config map',
  showInHelp: true,
  builder: {
    configPath: {
      string: true,
      alias: 'c',
      description: 'Path to shared configuration',
      default: CONFIG_FILE,
    },
  },
  handler: (args: ArgumentsCamelCase<IArguments>): Promise<void> => build(args),
};
