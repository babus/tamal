VERSION := $(shell node -p "require('./extension/manifest.json').version")

.PHONY: test zip store site clean

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

# Web page for GitHub Pages (babu.work/tamal/): site/ plus the converter, icon and link-preview image.
site:
	rm -rf dist/site && mkdir -p dist/site
	cp site/* dist/site/
	cp extension/tamal.js dist/site/
	cp extension/icons/128.png dist/site/icon.png
	cp store/promo-marquee.png dist/site/og.png
	@echo "dist/site"

clean:
	rm -rf dist
