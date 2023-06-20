/**
 * Created because of this issue: https://github.com/gajus/table/issues/220
 * Should be removed when the issue is resolved.
 */
export function truncateString(
  string = '',
  options: {
    length?: number
    omission?: string
    separator?: string
  } = {}
): string {
  const { length = 30, omission = '…', separator = ',' } = options

  if (string.length <= length) {
    return string
  }

  let truncatedString = string.substring(0, length)

  if (separator) {
    const separatorIndex = truncatedString.lastIndexOf(separator)
    if (separatorIndex !== -1) {
      truncatedString = truncatedString.substring(0, separatorIndex)
    }
  }

  return truncatedString + omission
}

export function pluralize(
  word: string,
  count: number,
  plural = `${word}s`
): string {
  return count === 1 ? word : plural
}
