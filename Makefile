VERSION := $(shell node -p "require('./extension/manifest.json').version")

.PHONY: test zip store clean

test:
	node test.js

# Chrome Web Store upload: dist/tamal-<version>.zip
zip: test
	@mkdir -p dist
	rm -f dist/tamal-$(VERSION).zip
	cd extension && zip -qr -X ../dist/tamal-$(VERSION).zip . -x '.*'
	@echo "dist/tamal-$(VERSION).zip"

# Chrome Web Store screenshots and promo tiles: store/src/*.html → store/*.png
store:
	node store/render.js

clean:
	rm -rf dist
