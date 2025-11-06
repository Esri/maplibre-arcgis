// Copyright 2025 Esri
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { AttributionControl, IAttributionControlOptions, EsriAttribution } from './AttributionControl';
import { BasemapSession, BasemapSessionEventMap, IBasemapSessionOptions, SessionRefreshedData, SessionResponse } from './BasemapSession';
import { IBasemapPreferences, BasemapSelfResponse, BasemapStyle, BasemapStyleEventMap, BasemapStyleObject, CodeNamePair, IBasemapStyleOptions, PlacesOptions, StyleEnum, StyleFamily, IUpdateStyleOptions, IApplyStyleOptions, MaplibreStyleOptions } from './BasemapStyle';
import { FeatureLayer, IFeatureLayerOptions, IQueryOptions } from './FeatureLayer';
import { HostedLayer, IItemInfo, SupportedSourceSpecification, IHostedLayerOptions } from './HostedLayer';
import { RestJSAuthenticationManager } from './Util';
import { VectorTileLayer, IVectorTileLayerOptions, IVectorTileServiceInfo } from './VectorTileLayer';

import packageInfo from '../package.json';

interface CustomWindow extends Window {
  TEST_ENVIRONMENT?: string | null;
}
const customWindow: CustomWindow | undefined = window;
if (customWindow && customWindow.TEST_ENVIRONMENT) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

const version = packageInfo.version;

export {
  AttributionControl,
  IAttributionControlOptions, IBasemapPreferences, BasemapSelfResponse, BasemapSession, BasemapSessionEventMap, BasemapStyle, BasemapStyleEventMap, BasemapStyleObject, CodeNamePair, EsriAttribution, FeatureLayer,
  IFeatureLayerOptions, HostedLayer,
  IHostedLayerOptions, IBasemapSessionOptions, IBasemapStyleOptions, IItemInfo, PlacesOptions, IQueryOptions,
  RestJSAuthenticationManager, SessionRefreshedData, SessionResponse, StyleEnum, StyleFamily, SupportedSourceSpecification, IUpdateStyleOptions, IApplyStyleOptions, VectorTileLayer, IVectorTileLayerOptions, IVectorTileServiceInfo, version as VERSION, MaplibreStyleOptions,
};
