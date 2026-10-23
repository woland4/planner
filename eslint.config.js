import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';

export default defineConfig([

    {
        files: [  '**/*.{js,ts,vue}'  ],

        plugins: {
            js,
            '@stylistic': stylistic
        },

        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            pluginVue.configs['flat/essential'],
            stylistic.configs.recommended
        ],

        languageOptions: {
            globals: globals.browser
        }

    },

    {
        files: [ '**/*.vue' ],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        }
    },

    {
        rules: {

            '@stylistic/array-bracket-spacing': [ 'warn', 'always' ],

            '@stylistic/arrow-parens': [ 'warn', 'as-needed', {
                requireForBlockBody: false
            } ],

            '@stylistic/brace-style': [ 'warn', '1tbs' ],

            '@stylistic/comma-dangle': [ 'warn', 'never' ],

            '@stylistic/indent': 'off',

            '@stylistic/indent-binary-ops': 'off',

            '@stylistic/member-delimiter-style': [ 'warn', {
                multiline: { delimiter: 'semi', requireLast: true },
                singleline: { delimiter: 'semi', requireLast: false },
                multilineDetection: 'brackets'
            } ],

            '@stylistic/multiline-ternary': 'off',

            '@stylistic/operator-linebreak': [ 'warn', 'after', {
                overrides: { '|': 'ignore' }
            } ],

            '@stylistic/padded-blocks': 'off',

            '@stylistic/semi': [ 'warn', 'always' ],

            '@stylistic/spaced-comment': 'off',

            '@stylistic/template-curly-spacing': [ 'warn', 'always' ],

            'vue/multi-word-component-names': 'off',

            'vue/script-indent': [ 'warn', 4, {
                baseIndent: 1,
                switchCase: 1,
                ignores: [
                    'FunctionDeclaration > .params',
                    'CallExpression > .arguments'
                ]
            } ],

            'vue/html-indent': [ 'warn', 4, {
                ignores: [
                    'VExpressionContainer'
                ]
            } ]

        }
    },

    {
        files: [ '**/*.vue' ],
        rules: {
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': 'error'
        }
    }

]);
