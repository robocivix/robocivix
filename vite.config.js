import { defineConfig } from "vite"

export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor": ["phaser"]  // Add other third-party dependencies here
				}
			}
		},
		minify: true,
		sourcemap: true
	},
	server: {
		open: true,  // automatically open browser when running dev server
		host: "0.0.0.0"
	}
}) 