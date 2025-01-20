.PHONY: lint

lint:
	npx eslint ./src --fix

dev:
	npm run dev

prod:
	npm run build

preview:
	npm run preview
	