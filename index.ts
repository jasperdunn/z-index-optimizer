import { program } from '@commander-js/extra-typings'
import pkg from './package.json'
import { totalCommand } from './commands/total.js'
import { listCommand } from './commands/list.js'

try {
  program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version, '-v, --version', 'Displays the version number.')
    .helpOption('-h, --help', 'Displays this help message.')
    .addHelpCommand('help', 'Displays this help message.')
    .addCommand(totalCommand)
    .addCommand(listCommand)
    .parse(process.argv)
} catch (error) {
  console.error(error)
  process.exit(1)
}
