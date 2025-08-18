import {
  AttributionControl as MaplibreAttributionControl,
  type AttributionControlOptions as MaplibreAttributionControlOptions,
  type Map,
} from 'maplibre-gl';

export interface AttributionControlOptions {
  customAttribution?: string | Array<string>;
  compact?: boolean;
  closed?: boolean;
}

const esriAttributionString = 'Powered by <a href="https://www.esri.com/">Esri</a>';
const maplibreAttributionString = '<a href="https://maplibre.org/">MapLibre</a>';

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

    const esriAttributions: Array<string> = [
      maplibreAttributionString,
      esriAttributionString,
    ];

    if (options.customAttribution) {
      // Append user-provided custom attribution
      if (Array.isArray(options.customAttribution)) {
        esriAttributions.concat(
          options.customAttribution.map((attribution) => {
            if (typeof attribution !== 'string') return '';
            return attribution;
          })
        );
      }
      else if (typeof options.customAttribution === 'string') {
        esriAttributions.push(options.customAttribution);
      }
    }

    const attributionOptions = {
      compact: (options?.compact !== undefined) ? options.compact : true,
      customAttribution: esriAttributions.join(' | '),
    };
    super(attributionOptions);

    this.attributionOptions = attributionOptions;
    this._closed = options?.closed;
  }

  onAdd(map: Map) {
    const htmlElement = super.onAdd(map);

    if (this._closed && this._container.classList.contains('maplibregl-compact-show')) {
      this._container.classList.remove('maplibregl-compact-show');
    }
    return htmlElement;
  }

  static get esriAttribution(): MaplibreAttributionControlOptions {
    const defaultAttribution = new AttributionControl();
    return defaultAttribution.attributionOptions;
  }
}

export default AttributionControl;
