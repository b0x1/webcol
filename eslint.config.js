import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TS/TSX files: full type-aware linting
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Strict type safety — matches AGENTS.md "no any, no !"
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',

      // Unsafe operations — requires type-aware linting
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Explicit return types on all exports — matches AGENTS.md
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Unused vars — fine-grained ignore pattern for intentional unused args
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // System classes are intentional static-method containers
      '@typescript-eslint/no-extraneous-class': 'warn',

      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: false,
        allowNullish: false,
      }],

      '@typescript-eslint/prefer-for-of': 'error',

      // No console.log in src — matches AGENTS.md
      'no-console': 'error',

      // No TODO/FIXME in commits — matches AGENTS.md
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack'] }],
    },
  },

  // JS files (scripts/): disable ALL type-aware rules, allow console + node globals
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Layer: systems + entities must not import framework code
  {
    files: ['src/game/systems/**/*.ts', 'src/game/entities/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['phaser'], message: 'Systems and entities must not import Phaser.' },
          { group: ['react', 'react-dom'], message: 'Systems and entities must not import React.' },
          { group: ['**/ui/**'], message: 'No upward layer import into systems/entities.' },
          { group: ['**/scenes/**'], message: 'No upward layer import into systems/entities.' },
        ],
      }],
    },
  },

  // Layer: UI must not import Phaser or scenes
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['phaser'], message: 'UI layer must not import Phaser.' },
          { group: ['**/scenes/**'], message: 'UI must not import scenes.' },
        ],
      }],
    },
  },

  // Layer: scenes must not import React
  {
    files: ['src/scenes/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react-dom'], message: 'Scenes must not import React.' },
        ],
      }],
    },
  },

  // Tests: disable strict type-checking and other restrictive rules for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
);
