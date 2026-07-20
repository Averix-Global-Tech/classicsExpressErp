// ESLint 9 flat config. Legacy key/value (eslintrc) format is not supported in v9.
module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { node: true, commonjs: true, es2022: true },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['warn', 'smart'],
    },
    ignores: ['node_modules/**'],
  },
];
