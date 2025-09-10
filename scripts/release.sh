#!/bin/bash

# config
VERSION=$(node --eval "console.log(require('./package.json').version);")
NAME=$(node --eval "console.log(require('./package.json').name);")

#clear package-lock.json
npm i

# build and test
#npm run build
#npm run test || exit 1

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

# run gh-release to create the tag and push release to github
#gh-release --assets esri-maplibre-arcgis-v$VERSION.zip

# publish release on NPM
#npm publish

# checkout master and delete release branch locally and on GitHub
#git checkout master
#git branch -D gh-release
#git push git@github.com:Esri/maplibre-arcgis.git :gh-release
