import { type Map, type AttributionControlOptions as MaplibreAttributionControlOptions } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
type MapLibreMap = Map;
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
    collapsed?: boolean;
}
export declare const EsriAttribution: MaplibreAttributionControlOptions;
/**
 * The attribution control adds attribution information for ArcGIS Data services in a MapLibre GL JS Map.
 */
export declare class AttributionControl extends maplibregl.AttributionControl {
    /** @internal */
    private _closed?;
    private attributionOptions;
    /**
     * Constructor for AttributionControl.
     * ```javascript
     * const attributionControl = new AttributionControl({
     *   customAttribution: ['Custom Attribution 1', 'Custom Attribution 2'],
     *   closed: false,
     *   compact: true,
     * });
     * ```
     * @param options - Options for the attribution control.
     */
    constructor(options?: IAttributionControlOptions);
    /**
     * Event that runs after the control is added to the map.
     * @param map - A MapLibre GL JS Map
     * @returns HTMLElement | null
     * @internal
     */
    onAdd(map: MapLibreMap): HTMLElement | null;
    /**
     * Checks if the control can be added to the map.
     * @param map - {@link MaplibreMap}
     * @returns boolean
     * @internal
     */
    canAdd(map?: MapLibreMap): boolean;
    /**
     * Returns the default Esri attribution control options.
     * @returns MaplibreAttributionControlOptions
     */
    static get esriAttribution(): MaplibreAttributionControlOptions;
}
export default AttributionControl;
