/*
 * Copyright 2025 Esri
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
import { AttributionControl, AttributionControlOptions, EsriAttribution } from './AttributionControl';
import { BasemapSession, BasemapSessionEventMap, IBasemapSessionOptions, SessionRefreshedData, SessionResponse } from './BasemapSession';
import { BasemapPreferences, BasemapSelfResponse, BasemapStyle, BasemapStyleEventMap, BasemapStyleObject, CodeNamePair, IBasemapStyleOptions, MaplibreStyleOptions, PlacesOptions, StyleEnum, StyleFamily, UpdateStyleOptions } from './BasemapStyle';
import { FeatureLayer, GeoJSONLayerOptions, QueryOptions } from './FeatureLayer';
import { HostedLayer, HostedLayerOptions, ItemInfo, SupportedSourceSpecification } from './HostedLayer';
import { RestJSAuthenticationManager } from './Util';
import { VectorTileLayer, VectorTileLayerOptions, VectorTileServiceInfo } from './VectorTileLayer';

import packageInfo from '../package.json';

interface CustomWindow extends Window {
  TEST_ENVIRONMENT: string | null;
}
declare let window: CustomWindow;
if (window.TEST_ENVIRONMENT) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

const version = packageInfo.version;

export {
  AttributionControl,
  AttributionControlOptions, BasemapPreferences, BasemapSelfResponse, BasemapSession, BasemapSessionEventMap, BasemapStyle, BasemapStyleEventMap, BasemapStyleObject, CodeNamePair, EsriAttribution, FeatureLayer,
  GeoJSONLayerOptions, HostedLayer,
  HostedLayerOptions, IBasemapSessionOptions, IBasemapStyleOptions, ItemInfo, MaplibreStyleOptions, PlacesOptions, QueryOptions,
  RestJSAuthenticationManager, SessionRefreshedData, SessionResponse, StyleEnum, StyleFamily, SupportedSourceSpecification, UpdateStyleOptions, VectorTileLayer, VectorTileLayerOptions, VectorTileServiceInfo, version as VERSION,
};
