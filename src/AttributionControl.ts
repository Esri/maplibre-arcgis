import { AttributionControl as MaplibreAttributionControl, type AttributionControlOptions as MaplibreAttributionControlOptions, type Map, type IControl } from 'maplibre-gl';

/**
 * Supported options for the attribution control.
 */
export interface AttributionControlOptions {
  customAttribution?: string | Array<string>;
  compact?: boolean;
  closed?: boolean;
}

const esriAttributionString = `Powered by <a href="https://www.esri.com/">Esri</a>`;
const maplibreAttributionString = `<a href="https://maplibre.org/">MapLibre</a>`;
const defaultMaplibreAttributionString = `<a href="https://maplibre.org/" target="_blank">MapLibre</a>`;

export const EsriAttribution: MaplibreAttributionControlOptions = {
  customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
  compact: true,
};

/**
 * Custom attribution control for MapLibre GL JS that includes Esri attribution.
 * This control can be configured to be compact and closed by default.
 * It extends the Maplibre attribution control to include custom attribution text.
 */
export class AttributionControl extends MaplibreAttributionControl {
  _closed?: boolean;
  attributionOptions: MaplibreAttributionControlOptions;

  /**
   * Creates a new AttributionControl instance with Esri attribution.
   *
   * @param options - Configuration options for the attribution control
   */
  constructor(options: AttributionControlOptions = {}) {
    // Incompatible options - 'closed' overrides 'compact'
    if (!options?.compact && options?.closed) options.compact = true;

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
      compact: options?.compact !== undefined ? options.compact : true,
      customAttribution: attributions.join(' | '),
    };
    super(attributionOptions);

    this.attributionOptions = attributionOptions;
    this._closed = options?.closed;
  }

  /**
   * Adds the attribution control to the map.
   *
   * @param map - The MapLibre map instance to add the control to
   * @returns The HTML element for the control, or null if the control cannot be added
   *
   * @remarks
   * This method checks if Esri attribution already exists on the map before adding.
   * If the control is configured to be closed initially, it will remove the 'show' class.
   */
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

  /**
   * Removes the attribution control from the map.
   *
   * @param map - The MapLibre map instance to remove the control from
   * @returns The HTML element for the control, or null if the control cannot be removed
   *
   * @remarks
   * This method checks if the control is currently added to the map before removing.
   * If the control is configured to be closed initially, it will add the 'show' class.
   */
  onRemove(map: Map): HTMLElement | null {
    this._map = map;
    if (!this.canRemove(this._map)) {
      console.warn('Esri attribution not present on map. This attribution control will not be removed.');
      return null;
    }

    const htmlElement = super.onRemove(map);

    if (this._closed && this._container.classList.contains('maplibregl-compact-show')) {
      this._container.classList.add('maplibregl-compact-show');
    }
    return htmlElement;
  }

  /**
   * Checks if the attribution control can be added to the map.
   *
   * @param map - The MapLibre map instance to check
   * @returns True if the control can be added, false otherwise
   *
   * @remarks
   * This method checks if Esri attribution already exists on the map before adding.
   * If the control is configured to be closed initially, it will remove the 'show' class.
   */
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
            throw new Error('Unable to add Esri attribution. Disable the map\'s default attribution control.');
          }
          else if (attributionControl.options.customAttribution.includes(esriAttributionString)) {
            // Esri string already exists,
            attributionExists = true;
          }
          else {
            throw new Error('Unable to add Esri attribution. Your map\'s custom attribution is not configured properly.');
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
