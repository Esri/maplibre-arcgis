#!/bin/bash

# PRE-RELEASE: run these commands and ensure everything works as expected
#   npm i
#   npm run build
#   npm run test || exit 1

# config
VERSION=$(node --eval "console.log(require('./package.json').version);")
NAME=$(node --eval "console.log(require('./package.json').name);")

# Integrity string and save to siteData.json
#JS_INTEGRITY=$(cat dist/maplibre-arcgis.js | openssl dgst -sha512 -binary | openssl base64 -A)
#echo "{\"name\": \"maplibre-arcgis\",\"version\": \"$VERSION\",\"lib\": {\"path\": \"dist/maplibre-arcgis.js\",\"integrity\": \"sha512-$JS_INTEGRITY\"}}" > dist/siteData.json

# checkout temp branch for release
git checkout -b release-$VERSION

# force add files
git add dist -f

# commit changes with a versioned commit message
git commit -m "build $VERSION"

# push commit so it exists on GitHub when we run gh-release
git push git@github.com:Esri/maplibre-arcgis.git release-$VERSION

# create a ZIP archive of the dist files
7z a esri-maplibre-arcgis-v$VERSION.zip ./dist/* -r

# publish release to github -- you need to do this manually.
# create a tag based on the release branch and attach the zip file
# write comprehensive release notes that include all changes

# publish release on NPM
# npm publish --tag latest

# checkout master and delete release branch locally and on GitHub
#git checkout main
#git branch -D release-$VERSION
#git push git@github.com:Esri/maplibre-arcgis.git :release-$VERSION
