# Release instructions

This file is a reference sheet for how manual releases in this repository work. A script is also available.

## Before release

Prior to beginning a release, you must run these commands and ensure everything works as expected:

* `npm i` -- Update package-lock.json.
* `npm run build` -- Build latest files to /dist.
* `npm run test` -- Run unit tests. **All** tests must pass prior to release.

After this point, the code for the release is final. No source code files should be modified.

## Release process

1. Copy the **package name** and **package version** from `package.json`:
  `name: @esri/maplibre-arcgis`
  `version: 1.0.0`

2. Checkout a temp branch for release:
  `git checkout -b release-$VERSION`

3. Force add /dist files
  `git add dist -f`

4. Commit changes with a versioned commit message
  `git commit -m "build $VERSION"`

5. Push commit so it exists on GitHub when we run gh-release
  `git push git@github.com:Esri/maplibre-arcgis.git release-$VERSION`

6. Create a ZIP archive of the dist files
  Windows:
  `7z a esri-maplibre-arcgis-v$VERSION.zip ./dist/* -r`
  Mac:
  `zip -r esri-maplibre-arcgis-v$VERSION.zip ./dist/*`

7. Publish release to github -- you need to do this manually.
  * Create a tag based on the release branch you pushed.
  * Attach the zip file containing the build.
  * Write comprehensive release notes that include all changes.

8. Publish release on NPM
  `npm publish --tag latest`

9. Checkout main and delete release branch locally and on GitHub:
  * `git checkout main`
  * `git branch -D release-$VERSION`
  * `git push git@github.com:Esri/maplibre-arcgis.git :release-$VERSION`
