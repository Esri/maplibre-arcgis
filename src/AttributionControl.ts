import {
    AttributionControl as MaplibreAttributionControl,
    type AttributionControlOptions as MaplibreAttributionControlOptions,
    type Map,
} from 'maplibre-gl';

interface AttributionControlOptions {
    compact?: boolean;
    minimize?: boolean;
}

export const esriAttribution = 'Powered by <a href="https://www.esri.com/">Esri</a>';
export const maplibreAttribution = '<a href="https://maplibre.org/">MapLibre</a>';

export class AttributionControl extends MaplibreAttributionControl {
    _minimized?: boolean;
    constructor(options: AttributionControlOptions = {}) {
        const attributionOptions: MaplibreAttributionControlOptions = {
            compact: (options?.compact !== undefined) ? options.compact : true,
            customAttribution: `${maplibreAttribution} | ${esriAttribution}`,
        };

        super(attributionOptions);
        this._minimized = options?.minimize;
    }

    onAdd(map: Map) {
        const htmlElement = super.onAdd(map);

        if (this._minimized) {
            this._updateCompactMinimize();
        }
        return htmlElement;
    }
}

export default AttributionControl;
