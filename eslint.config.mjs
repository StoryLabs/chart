import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, Bun: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      complexity: ['warn', 22]
    }
  },
  {
    // El runtime es lo único que toca el DOM.
    files: ['src/runtime/**', 'src/global.js', 'test/browser/**'],
    languageOptions: { globals: { ...globals.browser } }
  }
]
