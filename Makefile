buildRomListJsonFile:
	node ./scripts/buildRomListJsonFile.js

deploy: buildRomListJsonFile
	npm run deploy