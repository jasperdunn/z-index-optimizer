import fs from 'fs/promises'
import path from 'path'
import { program } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { table, getBorderCharacters } from 'table'
import pkg from './package.json'
import { truncateString } from './utils/string.js'

type ZIndexMeta = {
  zIndex: number
  line: string
  filePath: string
}

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss']
const regularZIndexValues = ['auto', 'inherit', 'initial', 'revert', 'unset']

async function getZIndexes(
  directoryPath: string,
  ignoredPaths: string[] = []
): Promise<{ zIndexes: ZIndexMeta[]; sassVariables: string[] }> {
  const zIndexes: ZIndexMeta[] = []
  const sassVariables: string[] = []
  const stack: string[] = [directoryPath]

  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- stack.length > 0
    const dirPath = stack.pop()!
    const files = await fs.readdir(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)

      // Skip ignored paths and their subdirectories
      if (ignoredPaths.some((ignorePath) => filePath.startsWith(ignorePath))) {
        continue
      }

      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        stack.push(filePath)
      } else {
        const extension = path.extname(filePath).toLowerCase()
        if (extensions.includes(extension)) {
          const fileContents = await Bun.file(filePath).text()
          const regex = /z(?:-|_)?index\s*[:=]\s*((-?\d+)|(.*[^;]))/gi
          const lines = fileContents.split('\n')
          let match

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
              continue
            }

            while ((match = regex.exec(line)) !== null) {
              const fileLineNumber = i + 1
              const possibleZIndex = match[1].trim().replaceAll("'", '')

              if (
                // Skip regular z-index values
                regularZIndexValues.includes(possibleZIndex)
              ) {
                continue
              }

              // Skip and extract sass variables
              if (possibleZIndex.startsWith('$')) {
                sassVariables.push(possibleZIndex)
                continue
              }

              const zIndex = parseInt(possibleZIndex)
              if (isNaN(zIndex)) {
                console.log(
                  chalk.red(
                    `Invalid z-index: "${possibleZIndex}"\nMatch: [${match.join()}]\nFile path: ${filePath}:${fileLineNumber}\n`
                  )
                )
                continue
              }

              const zIndexInfo: ZIndexMeta = {
                zIndex,
                line: line.trim(),
                filePath: `${filePath}:${fileLineNumber}`,
              }
              zIndexes.push(zIndexInfo)
            }
          }
        }
      }
    }
  }

  zIndexes.sort((a, b) => a.zIndex - b.zIndex)

  return { zIndexes, sassVariables: [...new Set(sassVariables)] }
}

try {
  program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version, '-v, --version', 'Displays the version number.')
    .helpOption('-h, --help', 'Displays this help message.')
    .addHelpCommand('help', 'Displays this help message.')
    .option('-d, --directory <path>', "Path to your codebase's root folder.")
    .option('-i, --ignoredPaths <paths...>', 'Paths that should be ignored.')
    .action(async ({ directory, ignoredPaths }) => {
      if (!directory) {
        program.help()
      }

      const { zIndexes, sassVariables } = await getZIndexes(
        directory,
        ignoredPaths
      )
      const uniqueIndexes = [...new Set(zIndexes.map((z) => z.zIndex))]

      console.log(
        chalk.blue(
          table(
            [
              [
                zIndexes.length,
                'numeric z-indexes',
                chalk.grey(
                  truncateString(zIndexes.map((z) => z.zIndex).join(), {
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
                  truncateString(sassVariables.join(', '), {
                    length: 150,
                  })
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
                  width: 50,
                },
              ],
              border: getBorderCharacters('norc'),
            }
          )
        )
      )
    })
    .parse(process.argv)
} catch (error) {
  console.error(error)
  process.exit(1)
}
