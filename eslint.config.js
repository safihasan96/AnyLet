import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
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
      // jsx-uses-vars marks identifiers referenced ONLY in JSX (<Comp/>,
      // <motion.div/>, <Icon/>) as used, so no-unused-vars stops false-flagging
      // them. Without it, JSX-only imports/params report spurious errors.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Design-system layer: icons must come from the curated registry
    // (src/lib/icons.jsx), never ad-hoc from lucide-react — this is what
    // "prevents random icons". The registry file itself is exempt (it lives in
    // src/lib, outside this glob).
    files: [
      'src/components/ui/**/*.{js,jsx}',
      'src/components/layout/**/*.{js,jsx}',
      'src/components/patterns/**/*.{js,jsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'Import icons from src/lib/icons (the <Icon/> component / Icons registry), not lucide-react directly — so the same concept always uses the same glyph. Add new concepts to the registry.',
            },
          ],
        },
      ],
    },
  },
])
