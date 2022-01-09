import TaskTree from 'tasktree-cli';
import { Arguments } from 'yargs';

import SharedConfig from '../../SharedConfig';
import { CONFIG_FILE } from '../../types';

type IArguments = Arguments<{ configPath: string }>;

const build = async ({ configPath }: IArguments): Promise<void> => {
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
  handler: (args: IArguments): Promise<void> => build(args),
};
