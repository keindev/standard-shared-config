import TaskTree from 'tasktree-cli';
import { ArgumentsCamelCase, CommandModule, Options } from 'yargs';

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

export const command: CommandModule<{ [key: string]: Options }, IArguments> = {
  command: 'build',
  aliases: 'b',
  describe: 'Build shared config map',
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
