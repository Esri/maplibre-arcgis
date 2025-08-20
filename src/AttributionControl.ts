import {
  AttributionControl as MaplibreAttributionControl,
  type AttributionControlOptions as MaplibreAttributionControlOptions,
  type Map,
  type IControl,
} from 'maplibre-gl';

export interface AttributionControlOptions {
  customAttribution?: string | Array<string>;
  compact?: boolean;
  closed?: boolean;
}

const esriAttributionString = 'Powered by <a href="https://www.esri.com/">Esri</a>';
const maplibreAttributionString = '<a href="https://maplibre.org/">MapLibre</a>';
const defaultMaplibreAttributionString = '<a href="https://maplibre.org/" target="_blank">MapLibre</a>';

export const EsriAttribution: MaplibreAttributionControlOptions = {
  customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
  compact: true,
};

export class AttributionControl extends MaplibreAttributionControl {
  _closed?: boolean;
  attributionOptions: MaplibreAttributionControlOptions;

  constructor(options: AttributionControlOptions = {}) {
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
    attributions.push([esriAttributionString, maplibreAttributionString]);

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
    if (!this._canAddAttribution()) return null;

    const htmlElement = super.onAdd(map);

    if (this._closed && this._container.classList.contains('maplibregl-compact-show')) {
      this._container.classList.remove('maplibregl-compact-show');
    }
    return htmlElement;
  }

  private _canAddAttribution(): boolean {
    if (this._map._controls.length > 0) {
      this._map._controls.forEach((control: IControl) => {
        // Error if any other attribution control is present
        if ('_toggleAttribution' in control) {
          const attributionControl = control as MaplibreAttributionControl;
          if (attributionControl.options.customAttribution === defaultMaplibreAttributionString) {
            throw new Error('Unable to add Esri attribution. Disable the map\'s default attribution control.');
          }
          else if (attributionControl.options.customAttribution.includes(esriAttributionString)) {
            // Esri string already exists, don't add
            return false;
          }
          else {
            throw new Error('Unable to add Esri attribution. Your map\'s custom attribution is not configured properly.');
          }
        }
      });
    }
    return true;
  }

  static get esriAttribution(): MaplibreAttributionControlOptions {
    const defaultAttribution = new AttributionControl();
    return defaultAttribution.attributionOptions;
  }
}

export default AttributionControl;
