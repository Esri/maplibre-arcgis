import type {SourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Source } from 'maplibre-gl';
/*
map.addSource
map.addLayer

maplibregl.Esri.vectorTileSource(itemId/URL)

needs to handle:
source-layer property
source property
*/
export interface VectorTileSource {
    readonly type: "vector";

    id: string;

    minzoom: number;
    maxzoom: number;
    attribution: string;
}

export class VectorTileSource implements Source {

}