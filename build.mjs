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

var copyright = '/* ' + pkg.name + ' - v' + pkg.version + ' - ' + new Date().toString() + '\n' +
                ' * Copyright (c) ' + new Date().getFullYear() + ' Environmental Systems Research Institute, Inc.\n' +
                ' * ' + pkg.license + ' */';

const BUILD_MODE = process.argv[2];
const LIVE_RELOAD = process.argv.length > 3 && process.argv[3] == 'watch';

const buildOptions = {
    entryPoints: ['./src/EsriMapLibre.ts'],
    bundle:true,
    banner: {
        js:copyright
    },
    globalName: 'maplibregl.esri',
}

if (BUILD_MODE == 'dev') {
    const debugOptions = {
        //debug only - build sourcemap
        sourcemap:true,
        outfile: 'dist/esri-maplibre-debug.js',
    };

    Object.assign(buildOptions,debugOptions);
}
if (BUILD_MODE == 'prod') {
    const prodOptions = {
        //prod only
        outfile: 'dist/esri-maplibre.js',
        minify: true, //minify output
        platform:'browser',
        format:'iife',
        target: ['chrome132','firefox130'] //list of supported browsers
    };

    Object.assign(buildOptions,prodOptions);
}


console.log(buildOptions);

if (LIVE_RELOAD) {

    buildOptions.define = {
        TEST_ENVIRONMENT:'yes'
    };

    console.log(`Starting live reload of ${buildOptions.outfile}...`);
    let app = await esbuild.context(buildOptions);

    await app.watch();

    let {host,port} = app.serve({
        servedir:'dist'
    })
}
else {
    await esbuild.build(buildOptions);
}


