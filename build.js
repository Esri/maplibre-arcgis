/* Copyright 2025 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as esbuild from 'esbuild';
import pkg from './package.json' with { type: 'json'};
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import { umdWrapper } from 'esbuild-plugin-umd-wrapper';

var copyright = '/* ' + pkg.name + ' - v' + pkg.version + ' - ' + new Date().toString() + '\n' +
                ' * Copyright (c) ' + new Date().getFullYear() + ' Environmental Systems Research Institute, Inc.\n' +
                ' * ' + pkg.license + ' */';

const ENVIRONMENT = process.argv[2];
const LIVE_RELOAD = process.argv.length > 3 && process.argv[3] == 'watch';

const globals = {
    'maplibre-gl': {
        varName:'maplibregl',
        namedExports: ['AttributionControl'],
        defaultExport: false
    }
}

const baseConfig = {
  entryPoints: ['./src/MaplibreArcGIS.ts'],
  banner: {
    js:copyright
  },
  platform:'browser',
  target: ['chrome132','firefox130'], //list of supported browsers
  sourcemap:true,
  bundle: true,
  external: ['maplibre-gl'],

}

const umdConfig = {
  ...baseConfig,
  format:'umd',
  plugins: [umdWrapper({
    libraryName: 'maplibreArcGIS',
    globals: {
      'maplibre-gl':'maplibregl'
    }
  })],
};

const esmConfig = {
  ...baseConfig,
  format: 'esm',
  //plugins: [globalExternals(globals)],
}

if (LIVE_RELOAD) {
  const buildOptions = {
    ...umdConfig,
    outfile: 'dist/umd/maplibre-arcgis.umd.js',
  }

  console.log(`Starting live reload of ${buildOptions.outfile}...`);
  let app = await esbuild.context(buildOptions);

  await app.watch();

  let {host,port} = await app.serve({
      servedir:'dist'
  });
}
else {
  const umd = await esbuild.build({
    ...umdConfig,
    outfile: 'dist/umd/maplibre-arcgis.umd.js',
  });

  const umdMin = await esbuild.build({
    ...umdConfig,
    minify: true,
    outfile:'dist/umd/maplibre-arcgis.umd.min.js'
  });

  const esm = await esbuild.build({
    ...esmConfig,
    outfile: 'dist/esm/maplibre-arcgis.esm.js'
  });

  const esmMin = await esbuild.build({
    ...esmConfig,
    minify:true,
    outfile: "dist/esm/maplibre-arcgis.esm.min.js"
  })
}
