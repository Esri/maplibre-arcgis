import type { GeoJSONSourceSpecification, LayerSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { Map } from 'maplibre-gl';
import AttributionControl from './AttributionControl';
import type { RestJSAuthenticationManager } from './Util';

/**
 * Union type representing the MapLibre source specifications supported by hosted layers.
 *
 * @remarks
 * This type defines the data source formats that can be used with ArcGIS hosted layers
 * in MapLibre maps. It currently supports loading data as vector tile sources and GeoJSON sources,
 * which cover the most common use cases for ArcGIS Feature Services and Vector Tile Services.
 *
 * - `VectorSourceSpecification` - For vector tile sources, typically used with ArcGIS Vector Tile Services
 * - `GeoJSONSourceSpecification` - For GeoJSON data sources, typically used with ArcGIS Feature Services converted to GeoJSON
 *
 * @example
 * ```typescript
 * // Vector source example
 * const vectorSource: SupportedSourceSpecification = {
 *   type: 'vector',
 *   tiles: ['https://services.arcgis.com/.../{z}/{y}/{x}.pbf'],
 *   attribution: 'Esri'
 * };
 *
 * // GeoJSON source example
 * const geoJsonSource: SupportedSourceSpecification = {
 *   type: 'geojson',
 *   data: 'https://services.arcgis.com/.../query?f=geojson'
 * };
 * ```
 *
 * @see {@link https://maplibre.org/maplibre-style-spec/sources/ | MapLibre Style Specification - Sources}
 */
export type SupportedSourceSpecification = VectorSourceSpecification | GeoJSONSourceSpecification;

/**
 * Options accepted by all instances of HostedLayer.
 */
export interface IHostedLayerOptions {
  /**
   * An access token as a string.
   */
  token?: string;
  /**
   * The URL of the ArcGIS portal.
   */
  portalUrl?: string;
  attribution?: string;
}

/**
 * Structure representing the metadata for an ArcGIS item. Go to {@link https://developers.arcgis.com/rest/users-groups-and-items/item/#response-properties | ArcGIS REST API - Item} to learn more.
 * @internal
 */
export interface IItemInfo {
  portalUrl: string;
  itemId: string;
  accessInformation?: string; // Attribution information from item JSON
  title?: string;
  description?: string;
  access?: string;
  orgId?: string;
  licenseInfo?: string;
  // spatialReference?: string
}

/**
 * Object representing the metadata for an ArcGIS data service.
 * @internal
 */
export interface IDataServiceInfo {
  serviceUrl: string;
  copyrightText?: string; // Attribution information from service JSON
  // serviceItemId?: string; // This may differ from itemInfo.itemId if the itemId provided in constructor represents a style, group layer, etc
  // serviceItemPortalUrl: string;
}

const throwReadOnlyError = (propertyName: string) => {
  throw new Error(`${propertyName} is a read-only property.`);
};

/**
 * Abstract class representing a [hosted layer](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/types-of-data-services/) for MapLibre GL JS.
 * This class provides a common base for loading data hosted in ArcGIS, such as feature layers and vector tile layers. It cannot be instantiated directly.
 * It includes methods for managing authentication, sources, layers, and adding them to a MapLibre map.
 * Subclasses must implement the `initialize` method to load data from ArcGIS.
 */
export abstract class HostedLayer {
  /**
   * An ArcGIS access token is required for accessing secure data layers. To get a token, go to the [Security and Authentication Guide](https://developers.arcgis.com/documentation/security-and-authentication/get-started/).
   */
  token: string;

  protected _authentication?: RestJSAuthenticationManager;

  /**
   * Prevent public constructor from appearing in docs by making it protected.
   * This keeps the class abstract while avoiding a displayed public constructor.
   */
  protected constructor() {
    // intentionally empty
    if (new.target === HostedLayer) throw new Error('HostedLayer is an abstract class and cannot be instantiated directly.');
  }

  /**
   * Stores custom attribution text for the hosted layer
   */
  protected _customAttribution: string;

  /**
   * Retrieves information about the associated hosted data service in ArcGIS.
   */
  protected _serviceInfo: IDataServiceInfo;

  /**
   * Retrieves information about the associated ArcGIS item.
   */
  protected _itemInfo?: IItemInfo;

  /**
   * Contains formatted maplibre sources for adding to map.
   */
  protected _sources: { [_: string]: SupportedSourceSpecification };
  protected _layers: LayerSpecification[];

  /**
   * Internal flag to track layer loading.
   */
  protected _ready: boolean;

  /**
   * A MapLibre GL JS map.
   */
  protected _map?: Map;

  /**
   * Retrieves the sources for the hosted layer.
   */
  get sources(): Readonly<{ [_: string]: SupportedSourceSpecification }> {
    return Object.freeze(this._sources);
  }

  /**
   * Sets the sources for the hosted layer.
   */
  set sources(value: { [_: string]: SupportedSourceSpecification }) {
    throwReadOnlyError('sources');
  }

  /**
   * Retrieves the source for the hosted layer.
   */
  get source(): Readonly<SupportedSourceSpecification> | undefined {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return undefined;

    return Object.freeze(this._sources[sourceIds[0]]);
  }

  /**
   * Sets the source for the hosted layer.
   */
  set source(_) {
    throwReadOnlyError('source');
  }

  /**
   * Retrieves the source ID for the hosted layer.
   */
  get sourceId(): Readonly<string> | undefined {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return undefined;

    return Object.freeze(sourceIds[0]);
  }

  /**
   * Sets the source ID for the hosted layer.
   */
  set sourceId(_) {
    throwReadOnlyError('sourceId');
  }

  /**
   * Retrieves the layers for the hosted layer.
   */
  get layers(): Readonly<LayerSpecification[]> {
    return Object.freeze(this._layers);
  }

  /**
   * Sets the layers for the hosted layer.
   */
  set layers(_) {
    throwReadOnlyError('layers');
  }

  /**
   * Retrieves the layer for the hosted layer.
   */
  get layer(): Readonly<LayerSpecification> | undefined {
    if (this._layers.length !== 1) return undefined;

    return Object.freeze(this._layers[0]);
  }

  set layer(_) {
    throwReadOnlyError('layer');
  }

  protected _onAdd(map: Map) {
    if (map) this._map = map;
    if (!this._map) throw new Error('No map');
    // Handle attribution
    const esriAttribution = new AttributionControl();
    if (esriAttribution.canAdd(this._map)) this._map.addControl(esriAttribution);
  }

  /**
   * Changes the ID of a maplibre style source, and updates all associated maplibre style layers.
   * @param oldId - The source ID to be changed.
   * @param newId - The new source ID.
   */
  setSourceId(oldId: string, newId: string): void {
    // Update ID of source
    const newSources = structuredClone(this._sources);
    newSources[newId] = newSources[oldId];
    delete newSources[oldId];

    this._sources = newSources;

    // Update source ID property of all layers
    this._layers.forEach((lyr) => {
      if (lyr['source'] == oldId) lyr['source'] = newId;
    });
  }

  /**
   * Sets the data attribution of the specified source
   * @param sourceId - The ID of the maplibre style source.
   * @param attribution - Custom attribution text.
   */
  setAttribution(sourceId: string, attribution: string): void {
    if (!sourceId || !attribution) throw new Error('Must provide a source ID and attribution');
    const newSources = structuredClone(this._sources);
    newSources[sourceId].attribution = attribution;
    this._sources = newSources;
  }

  /**
   * Returns a mutable copy of the specified source.
   * @param sourceId - The ID of the maplibre style source to copy.
   */
  copySource(sourceId: string): SupportedSourceSpecification {
    return structuredClone(this._sources[sourceId]);
  }

  /**
   * Returns a mutable copy of the specified layer
   * @param layerId - The ID of the maplibre style layer to copy
   */
  copyLayer(layerId: string): LayerSpecification {
    for (let i = 0; i < this._layers.length; i++) {
      if (this._layers[i].id == layerId) return structuredClone(this._layers[i]);
    }
    throw new Error(`No layer with ID ${layerId} exists.`);
  }

  /**
   * Convenience method that adds all associated Maplibre sources and data layers to a map.
   * @param map - A [MapLibre GL JS map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
   */
  addSourcesAndLayersTo(map: Map): HostedLayer {
    if (!this._ready) throw new Error('Cannot add sources and layers to map: Layer is not loaded.');
    this._map = map;

    Object.keys(this._sources).forEach((sourceId) => {
      map.addSource(sourceId, this._sources[sourceId]);
    });
    this._layers.forEach((layer) => {
      map.addLayer(layer);
    });
    this._onAdd(map);
    return this;
  }

  addSourcesTo(map: Map): HostedLayer {
    if (!this._ready) throw new Error('Cannot add sources to map: Layer is not loaded.');
    this._map = map;
    Object.keys(this._sources).forEach((sourceId) => {
      map.addSource(sourceId, this._sources[sourceId]);
    });
    this._onAdd(map);
    return this;
  }

  /**
   * Add layers to a maplibre map.
   * @param map - A maplibre map object
   * @returns
   */
  addLayersTo(map: Map): HostedLayer {
    if (!this._ready) throw new Error('Cannot add layers to map: Layer is not loaded.');
    this._map = map;
    this._layers.forEach((layer) => {
      map.addLayer(layer);
    });
    this._onAdd(map);
    return this;
  }

  /**
   * Initializes the layer with data from ArcGIS. Called to instantiate a class.
   */
  abstract initialize(): Promise<HostedLayer>;
}

export default HostedLayer;
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
