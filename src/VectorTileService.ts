import type {SourceSpecification} from '@maplibre/maplibre-gl-style-spec';
/*
map.addSource

map.addLayer

maplibregl.Esri.vectorTileSource(itemId/URL)

needs to handle:

source-layer property
source property
*/
export interface Source {
    readonly type: string;

    id: string;

    minzoom: number;
    maxzoom: number;
}


interface VectorTileSource {
    attribution: string;
    type: "vector";
    
}