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
