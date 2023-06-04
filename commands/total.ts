import chalk from 'chalk'
import { table, getBorderCharacters } from 'table'
import { Command, program } from '@commander-js/extra-typings'
import { truncateString } from '../utils/string.js'
import { getZIndexes } from '../utils/getZIndexes.js'

export const totalCommand = new Command('total')
  .description('Displays the total number of z-indexes in your codebase.')
  .arguments('<directory>')
  .option('-i, --ignoredPaths <paths...>', 'Paths that should be ignored.')
  .action(async (directory, { ignoredPaths }) => {
    if (!directory) {
      program.help()
    }

    const { zIndexes, sassVariables } = await getZIndexes(
      directory,
      ignoredPaths
    )

    const uniqueIndexes = [...new Set(zIndexes.map((z) => z.value))]

    console.log(
      chalk.blue(
        table(
          [
            [
              zIndexes.length,
              'numeric z-indexes',
              chalk.grey(
                truncateString(zIndexes.map((z) => z.value).join(), {
                  length: 150,
                })
              ),
            ],
            [
              uniqueIndexes.length,
              'unique numeric z-indexes',
              chalk.grey(
                truncateString(uniqueIndexes.join(), {
                  length: 150,
                })
              ),
            ],
            [
              sassVariables.length,
              'sass variables',
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
