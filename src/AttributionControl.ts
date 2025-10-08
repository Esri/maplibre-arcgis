import {
  type IControl,
  type Map,
  type AttributionControlOptions as MaplibreAttributionControlOptions,
} from 'maplibre-gl';
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

const esriAttributionString = 'Powered by \<a href=\"https:\/\/www.esri.com\/\"\>Esri\<\/a\>';
const maplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\"\>MapLibre\<\/a\>';
const defaultMaplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\" target=\"_blank\"\>MapLibre\<\/a\>';

export const EsriAttribution: MaplibreAttributionControlOptions = {
  customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
  compact: true,
};

/**
 * The attribution control adds attribution information for ArcGIS Data services in a MapLibre GL JS Map.
 */
export class AttributionControl extends maplibregl.AttributionControl {
  /** @internal */
  private _closed?: boolean;
  private attributionOptions: MaplibreAttributionControlOptions;

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
  constructor(options: IAttributionControlOptions = {}) {
    // Incompatible options - 'closed' overrides 'compact'
    if ((!options?.compact) && options?.collapsed) options.compact = true;

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
    this._closed = options?.collapsed;
  }

  /**
   * Event that runs after the control is added to the map.
   * @param map - A MapLibre GL JS Map
   * @returns HTMLElement | null
   * @internal
   */
  onAdd(map: MapLibreMap): HTMLElement | null {
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
   * Checks if the control can be added to the map.
   * @param map - {@link MaplibreMap}
   * @returns boolean
   * @internal
   */
  canAdd(map?: MapLibreMap): boolean {
    if (!map && !this._map) throw new Error('No map provided to attribution control.');
    if (!map) map = this._map;

    let attributionExists = false;
    if (map._controls.length > 0) {
      map._controls.forEach((control: IControl) => {
        // Error if any other attribution control is present
        if ('_toggleAttribution' in control) {
          const attributionControl = control as maplibregl.AttributionControl;
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

  /**
   * Returns the default Esri attribution control options.
   * @returns MaplibreAttributionControlOptions
   */
  static get esriAttribution(): MaplibreAttributionControlOptions {
    const defaultAttribution = new AttributionControl();
    return defaultAttribution.attributionOptions;
  }
}

export default AttributionControl;
// Copyright 2025 Esri
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
