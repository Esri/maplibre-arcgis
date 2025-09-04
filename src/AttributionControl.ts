import {
  AttributionControl as MaplibreAttributionControl,
  type IControl,
  type Map,
  type AttributionControlOptions as MaplibreAttributionControlOptions,
} from 'maplibre-gl';

/**
 * Interface for AttributionControl options.
 */
export interface IAttributionControlOptions {
  /**
   * Custom attribution string or array of strings.
   */
  customAttribution?: string | Array<string>;
  /**
   * Whether to display the attribution in a compact format.
   */
  compact?: boolean;
  /**
   * Whether the attribution control will be closed on initial map load.
   */
  closed?: boolean;
}

const esriAttributionString = 'Powered by \<a href=\"https:\/\/www.esri.com\/\"\>Esri\<\/a\>';
const maplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\"\>MapLibre\<\/a\>';
const defaultMaplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\" target=\"_blank\"\>MapLibre\<\/a\>';

export const EsriAttribution: MaplibreAttributionControlOptions = {
  customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
  compact: true,
};

export class AttributionControl extends MaplibreAttributionControl {
  _closed?: boolean;
  attributionOptions: MaplibreAttributionControlOptions;

  /**
   * Constructor for AttributionControl.
   * @param options - Options for the attribution control.
   */
  constructor(options: IAttributionControlOptions = {}) {
    // Incompatible options - 'closed' overrides 'compact'
    if ((!options?.compact) && options?.closed) options.compact = true;

    const attributions = [];

    if (options.customAttribution) {
      // Append user-provided custom attribution
      if (Array.isArray(options.customAttribution)) {
        attributions.concat(
          options.customAttribution.map((attribution) => {
            if (typeof attribution !== 'string') return '';
            return attribution;
          })
        );
      }
      else if (typeof options.customAttribution === 'string') {
        attributions.push(options.customAttribution);
      }
    }

    attributions.push(esriAttributionString, maplibreAttributionString);

    const attributionOptions = {
      compact: (options?.compact !== undefined) ? options.compact : true,
      customAttribution: attributions.join(' | '),
    };
    super(attributionOptions);

    this.attributionOptions = attributionOptions;
    this._closed = options?.closed;
  }

  onAdd(map: Map): HTMLElement | null {
    this._map = map;
    if (!this.canAdd(this._map)) {
      console.warn('Esri attribution already present on map. This attribution control will not be added.');
      return null;
    }

    const htmlElement = super.onAdd(map);

    if (this._closed && this._container.classList.contains('maplibregl-compact-show')) {
      this._container.classList.remove('maplibregl-compact-show');
    }
    return htmlElement;
  }

  canAdd(map?: Map): boolean {
    if (!map && !this._map) throw new Error('No map provided to attribution control.');
    if (!map) map = this._map;

    let attributionExists = false;
    if (map._controls.length > 0) {
      map._controls.forEach((control: IControl) => {
        // Error if any other attribution control is present
        if ('_toggleAttribution' in control) {
          const attributionControl = control as MaplibreAttributionControl;
          if (attributionControl.options.customAttribution === defaultMaplibreAttributionString) {
            map.removeControl(attributionControl);
            // console.warn('Map attribution is handled by ArcGIS BasemapStyle. The default attribution control was overwritten.');
          }
          else if (attributionControl.options.customAttribution.includes(esriAttributionString)) {
            // Esri string already exists,
            attributionExists = true;
          }
          else {
            const errorMessage = 'Unable to load Esri attribution. Set the attributionControl property of BasemapStyle to display custom attribution.';
            throw new Error(errorMessage);
          }
        }
      });
    }
    return !attributionExists;
  }

  static get esriAttribution(): MaplibreAttributionControlOptions {
    const defaultAttribution = new AttributionControl();
    return defaultAttribution.attributionOptions;
  }
}

export default AttributionControl;
