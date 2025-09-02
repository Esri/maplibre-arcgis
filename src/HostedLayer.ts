import type { GeoJSONSourceSpecification, LayerSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { Map } from 'maplibre-gl';
import type { RestJSAuthenticationManager } from './Util';
import AttributionControl from './AttributionControl';

type SupportedSourceSpecification = VectorSourceSpecification | GeoJSONSourceSpecification;

export interface HostedLayerOptions {
  token?: string; // Access token as a string
  authentication?: RestJSAuthenticationManager | string; // Authentication as a REST JS object or access token string
  portalUrl?: string;
  attribution?: string;
};

export interface ItemInfo {
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

export interface DataServiceInfo {
  serviceUrl: string;
  copyrightText?: string; // Attribution information from service JSON
  /*
   * serviceItemId?: string; // This may differ from itemInfo.itemId if the itemId provided in constructor represents a style, group layer, etc
   * serviceItemPortalUrl: string;
   */
}

const throwReadOnlyError = (propertyName: string) => {
  throw new Error(`${propertyName} is a read-only property.`);
};

export abstract class HostedLayer {
  /**
   * An ArcGIS access token is required for accessing secure data layers. To get a token, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.
   */
  authentication?: RestJSAuthenticationManager | string;

  protected get token(): string {
    if (!this.authentication) return undefined;
    return typeof this.authentication === 'string' ? this.authentication : this.authentication.token;
  }

  /**
   * Stores custom attribution text for the hosted layer
   */
  protected _customAttribution: string;

  /**
   * Retrieves information about the associated hosted data service in ArcGIS.
   */
  protected _serviceInfo: DataServiceInfo;

  /**
   * Retrieves information about the associated ArcGIS item.
   */
  protected _itemInfo?: ItemInfo;

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
   *
   */
  get sources(): Readonly<{ [_: string]: SupportedSourceSpecification }> {
    return Object.freeze(this._sources);
  }

  set sources(_) { throwReadOnlyError('sources'); }
  ;
  /**
   *
   */
  get source(): Readonly<SupportedSourceSpecification> | undefined {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return undefined;

    return Object.freeze(this._sources[sourceIds[0]]);
  }

  set source(_) { throwReadOnlyError('source'); }

  /**
   *
   */
  get sourceId(): Readonly<string> | undefined {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return undefined;

    return Object.freeze(sourceIds[0]);
  }

  set sourceId(_) { throwReadOnlyError('sourceId'); }

  /**
   *
   */
  get layers(): Readonly<LayerSpecification[]> {
    return Object.freeze(this._layers);
  }

  set layers(_) { throwReadOnlyError('layers'); }

  /**
   *
   */
  get layer(): Readonly<LayerSpecification> | undefined {
    if (this._layers.length !== 1) return undefined;

    return Object.freeze(this._layers[0]);
  }

  set layer(_) { throwReadOnlyError('layer'); }

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
   * @param map - A MapLibre GL JS map
   */
  addSourcesAndLayersTo(map: Map): HostedLayer {
    if (!this._ready) throw new Error('Cannot add sources and layers to map: Object has not finished loading.');
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
    if (!this._ready) throw new Error('Cannot add sources to map: Object has not finished loading.');
    this._map = map;
    Object.keys(this._sources).forEach((sourceId) => {
      map.addSource(sourceId, this._sources[sourceId]);
    });
    this._onAdd(map);
    return this;
  }

  addLayersTo(map: Map): HostedLayer {
    if (!this._ready) throw new Error('Cannot add layers to map: Object has not finished loading.');
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
