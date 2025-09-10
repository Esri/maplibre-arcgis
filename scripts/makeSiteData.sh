#!/bin/bash

# config
VERSION=$(node --eval "console.log(require('./package.json').version);")
NAME=$(node --eval "console.log(require('./package.json').name);")

# build and test
#npm run test || exit 1

# Integrity string and save to siteData.json
JS_INTEGRITY=$(cat dist/maplibre-arcgis.js | openssl dgst -sha512 -binary | openssl base64 -A)
echo "{\"name\": \"maplibre-arcgis\",\"version\": \"$VERSION\",\"lib\": {\"path\": \"dist/maplibre-arcgis.js\",\"integrity\": \"sha512-$JS_INTEGRITY\"}}" > dist/siteData.json
