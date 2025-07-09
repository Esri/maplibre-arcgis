import type { IRequestOptions } from "@esri/arcgis-rest-request";

declare module '@esri/arcgis-rest-feature-service' {
    interface ILayerDefinition {
        supportsExceedsLimitStatistics:boolean;
    }
}

declare module '@esri/arcgis-rest-portal' {
    type IItemResourcesResponse = {
        start:number;
        nextStart:number;
        num:number;
        total:number;
        resources: [{
            resource:string;
            access:string;
            created:number;
            size:number;
        }]
    };

    type IVectorTileServiceDefinition = {
        tiles: [string];
        defaultStyles: string;
        copyrightText: string;
    };

    interface IItem {
        accessInformation:string;
    }

    function getItemResources(id: string, requestOptions?: IRequestOptions): Promise<IItemResourcesResponse>
}