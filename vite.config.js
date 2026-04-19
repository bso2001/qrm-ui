// Vite Configuration: The fast build tool and dev server.
// Docs: https://vitejs.dev/config/

import { defineConfig } from 'vite'

// Vite Plugin Svelte: Integrates the Svelte compiler into the Vite build pipeline.
// Docs: https://github.com/sveltejs/vite-plugin-svelte/tree/main/docs

import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [ svelte() ],
	server: {
		allowedHosts: [ 'qrm.noztrey.com' ]
	}
})
