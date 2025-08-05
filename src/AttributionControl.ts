import {
    AttributionControl as MaplibreAttributionControl,
    type AttributionControlOptions as MaplibreAttributionControlOptions,
    type Map,
} from 'maplibre-gl';

interface AttributionControlOptions {
    compact?: boolean;
    minimize?: boolean;
}

const esriAttributionString = 'Powered by <a href="https://www.esri.com/">Esri</a>';
const maplibreAttributionString = '<a href="https://maplibre.org/">MapLibre</a>';

export const EsriAttribution = {
    customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
    compact: true,
};

export class AttributionControl extends MaplibreAttributionControl {
    _minimized?: boolean;
    attributionOptions: MaplibreAttributionControlOptions;

    constructor(options: AttributionControlOptions = {}) {
        const attributionOptions = {
            compact: (options?.compact !== undefined) ? options.compact : true,
            customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
        };

        super(attributionOptions);

        this.attributionOptions = attributionOptions;
        this._minimized = options?.minimize;
    }

    onAdd(map: Map) {
        const htmlElement = super.onAdd(map);

        if (this._minimized) {
            this._updateCompactMinimize();
        }
        return htmlElement;
    }

    static get esriAttribution(): MaplibreAttributionControlOptions {
        const defaultAttribution = new AttributionControl();
        return defaultAttribution.attributionOptions;
    }
}

export default AttributionControl;
