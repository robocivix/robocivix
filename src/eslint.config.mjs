import globals from "globals"
import pluginJs from "@eslint/js"
//import tseslint from "typescript-eslint"


/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ["**/*.{js,mjs,cjs,ts}"] },
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	//...tseslint.configs.recommended,

	{
		rules: {
			"indent": ["error", "tab"],
			"no-tabs": "off",
			"semi": ["error", "never"],
			"no-unused-vars": [
				"warn", // or "error"
				{
					"argsIgnorePattern": "^_",
					"varsIgnorePattern": "^_",
					"caughtErrorsIgnorePattern": "^_"
				}
			],
			"no-undef": "error",
		},
	},

	{
		// Note: there should be no other properties in this object
		ignores: [
			"node_modules/*",
			"lib/*",
			"assets/*",
			"data/*",
			"**/temp.js",
			"config/*",
			"**/t.js"
		]
	}
]