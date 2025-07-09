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
interface CustomWindow extends Window {
    TEST_ENVIRONMENT: string | null;
}
declare let window: CustomWindow;

import packageInfo from '../package.json';
const version = packageInfo.version;
export { version as VERSION };

export { BasemapStyle } from './BasemapStyle';
export { AttributionControl } from './AttributionControl';
export { VectorTileLayer } from './VectorTileLayer';
export { FeatureLayer } from './FeatureLayer';

if (window.TEST_ENVIRONMENT) {
    new EventSource('/esbuild').addEventListener('change', () => location.reload())
}