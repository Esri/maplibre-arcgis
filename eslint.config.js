import js from "@eslint/js";
import tseslint from "typescript-eslint";
import html from 'eslint-plugin-html';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from "globals";
import vitest from '@vitest/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config([
  {
    ignores: ["**/dist/**", "test/**"]
  },
  {
    files: ["**/*.ts"],
    plugins: {
      js,
      '@typescript-eslint': tseslint.plugin,
      tsdoc,
      vitest
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      stylistic.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, 'off'])),
        performance: true
      },
      parser: tseslint.parser,
      "ecmaVersion": 5,
      sourceType: 'module',

      parserOptions: {
        createDefaultProgram: true,
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      'no-dupe-class-members': 'off',
      'no-useless-constructor': 'off',
      'no-undef': 'off',
      'no-use-before-define': 'off',
      'no-duplicate-imports': 'off',
      'implicit-arrow-linebreak': 'off',
      'arrow-parens': 'off',
      'arrow-body-style': 'off',
      'no-confusing-arrow': 'off',
      'no-control-regex': 'off',
      'no-invalid-this': 'off',
      'no-buffer-constructor': 'off',
      'array-bracket-spacing': 'error',
      'consistent-return': 'off',
      'global-require': 'off',
      'no-eq-null': 'off',
      'no-lonely-if': 'off',
      'no-new': 'off',
      'no-restricted-properties': [2, {
        object: 'Object',
        property: 'assign',
      }],
      'no-unused-vars': 'off',
      'no-warning-comments': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': ['error', {
        destructuring: 'all',
      }],
      'prefer-template': 'error',
      'prefer-spread': 'off',
      quotes: 'off',
      'no-redeclare': 'off',
      'space-before-function-paren': 'off',
      'template-curly-spacing': 'error',
      'no-useless-escape': 'off',
      indent: 'off',

      'tsdoc/syntax': 'warn',

      '@typescript-eslint/no-explicit-any': ['error', {
        'ignoreRestArgs': true
      }],
      '@typescript-eslint/no-dupe-class-members': ['error'],
      '@typescript-eslint/consistent-type-imports': ['error', {
        'fixStyle': 'inline-type-imports'
      }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-useless-constructor': ['error'],
      '@typescript-eslint/no-redeclare': ['error'],
      "no-warning-comments": ['warn'],
      '@stylistic/semi': ['error', "always"],
      '@stylistic/indent': ['error', 2],
      "@stylistic/member-delimiter-style": ['error', {
        "multiline": {
          "delimiter": "semi",
          "requireLast": true
        },
        "singleline": {
          "delimiter": "semi",
          "requireLast": false
        },
        "multilineDetection": "brackets"
      }],
      "@stylistic/multiline-comment-style": ['error', 'starred-block'],
    }
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked]
  },
  {
    files: ['**/*.html'],
    plugins: {
      html
    },
    rules: {
      'no-restricted-properties': 'off',
      'new-cap': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]);
