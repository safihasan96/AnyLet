import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Only lint first-party app code (src, api) and root tooling config.
  // Everything below is generated, vendored, or a separate platform/project.
  globalIgnores([
    'dist',
    'android',
    'ios',
    'mobile',
    'graphify-out',
    'zip',
    'AnyLet',
    '.obsidian',
    '.vercel',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Count identifiers referenced in JSX (e.g. <motion.div>, <Icon/>) as used,
      // so no-unused-vars doesn't false-flag them. Needs eslint-plugin-react.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
    },
  },
  {
    // Server-side code and build tooling run on Node, not in the browser.
    files: [
      'api/**/*.js',
      'scripts/**/*.js',
      'dev-api-server.mjs',
      'seed_fees.js',
      '*.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
])
