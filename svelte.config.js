// Svelte Preprocessor: Compiles TypeScript, PostCSS, SCSS, etc. inside Svelte components before Svelte parses them.
// Docs: https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Svelte Configuration: Global settings for the Svelte compiler.
// Docs: https://svelte.dev/docs/svelte/svelte-config

export default {
	preprocess: vitePreprocess()
}
