module.exports = {
  '**/*': ['prettier --write --ignore-unknown'],
  '**/*.ts': ['eslint --cache --quiet', () => 'tsc --noEmit'],
}
