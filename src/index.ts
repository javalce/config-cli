import { Command } from 'commander';

import { description, name, version } from '../package.json';
import { init } from './commands/init';

process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

function main(): void {
  const program = new Command()
    .name(name)
    .description(description)
    .helpOption('-h, --help', 'Display this help message')
    .version(version, '-v, --version', 'Display the current version');

  program.addCommand(init);

  program.parse();
}

main();
