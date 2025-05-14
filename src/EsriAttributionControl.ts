import { AttributionControl, AttributionControlOptions, Map } from "maplibre-gl";

interface EsriAttributionControlOptions {
    compact?:boolean;
    minimize?: boolean;
}

export class EsriAttributionControl extends AttributionControl {
    _minimized?:boolean;
    constructor (options : EsriAttributionControlOptions) {
        
        const esriAttribution = "Powered by <a href=\"https://www.esri.com/\" target=\"_blank\">Esri</a>";
        const maplibreAttribution = "<a href=\"https://maplibre.org/\" target=\"_blank\">MapLibre</a>";

        const attributionOptions : AttributionControlOptions = {
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

export default EsriAttributionControl;