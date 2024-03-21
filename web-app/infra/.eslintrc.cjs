// .eslintrc.js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@stylistic',
    '@typescript-eslint',
  ],
  extends: [
    'plugin:@stylistic/recommended-extends',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/max-len': ['error', { code: 80, ignoreStrings: true }],
    '@stylistic/array-bracket-newline': ['error', 'consistent'],
    '@stylistic/array-element-newline': ['error', 'consistent'],
  },
};
