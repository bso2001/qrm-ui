// Svelte Preprocessor: Compiles TypeScript, PostCSS, SCSS, etc. inside Svelte components before Svelte parses them.
// Docs: https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Svelte Configuration: Global settings for the Svelte compiler.
// Docs: https://svelte.dev/docs/svelte/svelte-config

export default {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// 'runes: false' indicates Svelte 4 legacy mode for state management. 
		// Read about Svelte 5 runes (the new reactivity model) here: https://svelte.dev/docs/svelte/runes

		runes: false
	}
}
