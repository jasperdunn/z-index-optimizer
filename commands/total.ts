import chalk from 'chalk'
import { table, getBorderCharacters } from 'table'
import { Command, program } from '@commander-js/extra-typings'
import { pluralize, truncateString } from '../utils/string.js'
import { getZIndexes } from '../utils/getZIndexes.js'

export const totalCommand = new Command('total')
  .description('Displays the total number of z-indexes in your codebase.')
  .arguments('<directory>')
  .option('-e, --excludedPaths <paths...>', 'Paths that should be excluded.')
  .action(async (directory, { excludedPaths }) => {
    if (!directory) {
      program.help()
    }

    const { zIndexes, sassVariables } = await getZIndexes(
      directory,
      excludedPaths
    )

    const uniqueIndexes = [...new Set(zIndexes.map((z) => z.value))]

    console.log(
      chalk.blue(
        table(
          [
            [
              zIndexes.length,
              `numeric ${pluralize('z-index', zIndexes.length, 'z-indexes')}`,
              chalk.grey(
                truncateString(zIndexes.map((z) => z.value).join(), {
                  length: 150,
                })
              ),
            ],
            [
              uniqueIndexes.length,
              `unique numeric ${pluralize(
                'z-index',
                uniqueIndexes.length,
                'z-indexes'
              )}`,
              chalk.grey(
                truncateString(uniqueIndexes.join(), {
                  length: 150,
                })
              ),
            ],
            [
              sassVariables.length,
              pluralize('sass variable', sassVariables.length),
              chalk.grey(
                sassVariables
                  .map(
                    (s) =>
                      `${s.name}: ${s.value ?? '[Unknown Value]'}\n${
                        s.filePath
                      }`
                  )
                  .join('\n\n'),
                {
                  length: 150,
                }
              ),
            ],
          ],
          {
            columnDefault: {
              wrapWord: true,
            },
            columns: [
              {
                alignment: 'right',
              },
              {},
              {
                width: 100,
              },
            ],
            border: getBorderCharacters('norc'),
          }
        )
      )
    )
  })
