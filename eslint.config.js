// ESLint Core: The base linting engine.
// Docs: https://eslint.org/docs/latest/

import eslint from '@eslint/js'

// Svelte ESLint Plugin: Provides rules specific to Svelte components.
// Docs: https://sveltejs.github.io/eslint-plugin-svelte/

import eslintPluginSvelte from 'eslint-plugin-svelte'

// Svelte ESLint Parser: Allows ESLint to understand Svelte's HTML-like AST.
// Docs: https://github.com/sveltejs/svelte-eslint-parser

import svelteParser from 'svelte-eslint-parser'

// ESLint Stylistic: Formatting rules (indent, brace-style, etc.) since they were deprecated in ESLint core.
// Docs: https://eslint.style/

import stylistic from '@stylistic/eslint-plugin'

export default [
	{
		// Configuration for styling rules (using ESLint Stylistic)

		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			// 'allman' style puts opening braces on the next line.
			// Docs: https://eslint.style/rules/default/brace-style

			'@stylistic/brace-style': [ 'error', 'allman', { allowSingleLine: true } ],
			
			// Enforces tab indentation
			// Docs: https://eslint.style/rules/default/indent

			'@stylistic/indent': [ 'error', 'tab' ],

			// Disallows semicolons at the end of statements (except where necessary to prevent ASI hazards)
			// Docs: https://eslint.style/rules/default/semi

			'@stylistic/semi': [ 'error', 'never' ],

			// Enforces single quotes for a cleaner, lighter look
			// Docs: https://eslint.style/rules/default/quotes

			'@stylistic/quotes': [ 'error', 'single' ],

			// Removes parentheses around arrow function arguments if there is only one
			// Docs: https://eslint.style/rules/default/arrow-parens

			'@stylistic/arrow-parens': [ 'error', 'as-needed' ],

			// Removes trailing commas on the last item in objects/arrays
			// Docs: https://eslint.style/rules/default/comma-dangle

			'@stylistic/comma-dangle': [ 'error', 'never' ],

			// Enforces spaces inside array brackets so they breathe like objects
			// Docs: https://eslint.style/rules/default/array-bracket-spacing

			'@stylistic/array-bracket-spacing': [ 'error', 'always' ],

			// Enforces a blank line after comments so they stand alone from the code they describe
			// Docs: https://eslint.style/rules/default/lines-around-comment

			'@stylistic/lines-around-comment': [ 'error', {
				afterBlockComment: true,
				afterLineComment: true,
				allowBlockStart: true,
				allowObjectStart: true,
				allowArrayStart: true
			} ]
		}
	},
	{
		// Apply the Svelte parser to Svelte components

		files: [ '**/*.svelte' ],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				extraFileExtensions: [ '.svelte' ]
			}
		}
	}
]
