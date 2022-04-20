import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import build from './commands/build.js';

const argv = yargs(hideBin(process.argv));

argv.command(build).demandCommand().wrap(argv.terminalWidth()).help().parse();
