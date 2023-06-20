import { Command, Option, program } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { getBorderCharacters, table } from 'table'
import { getZIndexes } from '../utils/getZIndexes.js'

export const listCommand = new Command('list')
  .description(
    'Displays a list of all z-index files in your codebase. Grouped by similar z-indexes. Sorted by total number of occurrences.'
  )
  .arguments('<directory>')
  .option('-e, --excludedPaths <paths...>', 'Paths that should be excluded.')
  .addOption(
    new Option('-s, --sort <sort>', 'Sort by total or zIndex')
      .choices(['total', 'zIndex'])
      .default('total')
  )
  .action(async (directory, { excludedPaths, sort }) => {
    if (!directory) {
      program.help()
    }

    const { zIndexes, sassVariables } = await getZIndexes(
      directory,
      excludedPaths
    )

    const groupedZIndexes: ZIndexGroup[] = []

    for (const zIndex of zIndexes) {
      const group = groupedZIndexes.find((g) => g.value === zIndex.value)

      if (group) {
        group.files.push(zIndex.filePath)
        group.total++
      } else {
        groupedZIndexes.push({
          value: zIndex.value,
          total: 1,
          files: [zIndex.filePath],
        })
      }
    }

    const sortedGroups = groupedZIndexes.sort((a, b) =>
      sort === 'zIndex' ? b.value - a.value : b.total - a.total
    )

    const tableRows = sortedGroups.map((g) => [
      chalk.blue(g.value),
      g.total,
      g.files.join('\n'),
    ])

    console.log('z-indexes')
    console.log(
      table([['z-index', 'total', 'files'], ...tableRows], {
        columnDefault: {
          wrapWord: true,
        },
        columns: [
          {
            alignment: 'center',
          },
          { alignment: 'center' },
          {},
        ],
        border: getBorderCharacters('norc'),
      })
    )

    const groupedSassVariables: SassVariableGroup[] = []

    for (const sassVariable of sassVariables) {
      const group = groupedSassVariables.find(
        (g) => g.name === sassVariable.name
      )

      if (group) {
        group.files.push(sassVariable.filePath)
        group.total++
      } else {
        groupedSassVariables.push({
          name: sassVariable.name,
          value: sassVariable.value,
          total: 1,
          files: [sassVariable.filePath],
        })
      }
    }

    const sortedSassVariableGroups = groupedSassVariables.sort((a, b) =>
      sort === 'zIndex' && a.value !== undefined && b.value !== undefined
        ? b.value - a.value
        : b.total - a.total
    )

    console.log('sass variables')
    console.log(
      table(
        [
          ['sass variable', 'value', 'total', 'files'],
          ...sortedSassVariableGroups.map((g) => [
            chalk.blue(g.name),
            chalk.blue(g.value),
            g.total,
            g.files.join('\n'),
          ]),
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
            {},
          ],
          border: getBorderCharacters('norc'),
        }
      )
    )
  })

type ZIndexGroup = {
  value: number
  total: number
  files: string[]
}

type SassVariableGroup = {
  name: string
  value: number | undefined
  total: number
  files: string[]
}
