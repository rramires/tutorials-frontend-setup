import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
			{
				rules: {
					'prefer-const': 'warn',
					'no-unused-vars': 'off',
					'@typescript-eslint/no-unused-vars': 'warn',
					'simple-import-sort/imports': 'error',
					/* 'simple-import-sort/exports': 'error', */
				},
			},
			eslintConfigPrettier,
			{
				rules: {
					curly: ['error', 'all'],
				},
			},
		],
		languageOptions: {
			globals: globals.browser,
		},
	},
	{
		files: ['src/components/ui/**/*.{ts,tsx}'],
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
])
