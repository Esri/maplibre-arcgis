import { AttributionControl as MaplibreAttributionControl, AttributionControlOptions as MaplibreAttributionControlOptions, Map } from "maplibre-gl";

interface AttributionControlOptions {
    compact?:boolean;
    minimize?: boolean;
}

export class AttributionControl extends MaplibreAttributionControl {
    _minimized?:boolean;
    constructor (options : AttributionControlOptions) {
        
        const esriAttribution = "Powered by <a href=\"https://www.esri.com/\" target=\"_blank\">Esri</a>";
        const maplibreAttribution = "<a href=\"https://maplibre.org/\" target=\"_blank\">MapLibre</a>";

        const attributionOptions : MaplibreAttributionControlOptions = {
            compact: (options?.compact !== undefined) ? options.compact : true,
            customAttribution: esriAttribution //`${maplibreAttribution} | ${esriAttribution}`
        }

        super(attributionOptions);
        this._minimized = options?.minimize;
    }
    onAdd(map : Map) {
        const htmlElement = super.onAdd(map);

        if (this._minimized) {
            this._updateCompactMinimize();
        }
        return htmlElement;
    }
}

export default AttributionControl;