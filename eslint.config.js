const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', require: 'readonly' },
    },
  },
]);
