import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

type ZIndexMeta = {
  value: number
  filePath: string
}

type SassVariableMeta = {
  name: string
  value: number | undefined
  filePath: string
}

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.sass']
const regularZIndexValues = ['auto', 'inherit', 'initial', 'revert', 'unset']

export async function getZIndexes(
  directoryPath: string,
  ignoredPaths: string[] = []
): Promise<{
  zIndexes: ZIndexMeta[]
  sassVariables: SassVariableMeta[]
}> {
  const zIndexes: ZIndexMeta[] = []
  const sassVariables: SassVariableMeta[] = []

  await processFiles(
    directoryPath,
    extensions,
    async (line, filePath, fileLineNumber) => {
      const regex = /z(?:-|_)?index\s*[:=]\s*((-?\d+)|(.*[^;]))/gi
      let match

      while ((match = regex.exec(line)) !== null) {
        const possibleZIndex = match[1].trim().replaceAll("'", '')

        if (
          // Skip regular z-index values
          regularZIndexValues.includes(possibleZIndex)
        ) {
          continue
        }

        // Skip and extract sass variables
        if (possibleZIndex.startsWith('$')) {
          sassVariables.push({
            name: possibleZIndex,
            value: await getSassVariableValue(possibleZIndex, directoryPath),
            filePath: `${filePath}:${fileLineNumber}`,
          })
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

        zIndexes.push({
          value: zIndex,
          filePath: `${filePath}:${fileLineNumber}`,
        })
      }
    },
    {
      ignoredPaths,
    }
  )

  zIndexes.sort((a, b) => a.value - b.value)

  return { zIndexes, sassVariables }
}

async function getSassVariableValue(
  sassVariable: string,
  directoryPath: string
): Promise<number | undefined> {
  let sassVariableValue: number | undefined

  await processFiles(
    directoryPath,
    ['.scss', '.sass'],
    (line, filePath, fileLineNumber) => {
      const regex = new RegExp(
        `\\${sassVariable}:\\s*((-?\\d+)|(.*[^;]))`,
        'gi'
      )
      let match
      while ((match = regex.exec(line)) !== null) {
        const possibleZIndex = match[1].trim().replaceAll("'", '')

        const zIndex = parseInt(possibleZIndex)
        if (isNaN(zIndex)) {
          console.log(
            chalk.red(
              `Invalid z-index: "${possibleZIndex}"\nMatch: [${match.join()}]\nFile path: ${filePath}:${fileLineNumber}\n`
            )
          )
          continue
        }

        sassVariableValue = zIndex
      }
    }
  )

  return sassVariableValue
}

async function processFiles(
  directoryPath: string,
  extensions: string[],
  callback: (
    line: string,
    filePath: string,
    fileLineNumber: number
  ) => Promise<void> | void,
  config: { ignoredPaths?: string[] } = {}
) {
  const stack: string[] = [directoryPath]

  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- stack.length > 0
    const dirPath = stack.pop()!
    const files = await fs.readdir(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)

      // Skip ignored paths and their subdirectories
      if (
        config.ignoredPaths?.some((ignorePath) =>
          filePath.startsWith(ignorePath)
        )
      ) {
        continue
      }

      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        stack.push(filePath)
      } else {
        const extension = path.extname(filePath).toLowerCase()
        if (extensions.includes(extension)) {
          const fileContents = await Bun.file(filePath).text()
          const lines = fileContents.split('\n')

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
              continue
            }

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            callback(line, filePath, i + 1)
          }
        }
      }
    }
  }
}
