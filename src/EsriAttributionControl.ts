import { AttributionControl } from "maplibre-gl";

interface EsriAttributionControlOptions {
    compact?: boolean;
}

export class EsriAttributionControl extends AttributionControl {
    constructor (options : EsriAttributionControlOptions) {

        const esriAttribution = "Powered by <a href=\"https://www.esri.com/\" target=\"_blank\">Esri</a>";
        const maplibreAttribution = "<a href=\"https://maplibre.org/\" target=\"_blank\">MapLibre</a>";
        super({
            compact: (options?.compact !== undefined) ? options.compact : true,
            customAttribution: esriAttribution //`${maplibreAttribution} | ${esriAttribution}`
        });
    }
}

export default EsriAttributionControl;