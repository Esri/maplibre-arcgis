import type { IRequestOptions } from '@esri/arcgis-rest-request';

declare module '@esri/arcgis-rest-feature-service' {
  interface ILayerDefinition {
    supportsExceedsLimitStatistics: boolean;
  }
}

declare module '@esri/arcgis-rest-portal' {

  interface IItem {
    accessInformation?: string;
    access?: string;
    orgId?: string;
    description?: string;
    licenseInfo?: string;
  }

  interface IItemResourcesResponse {
    start: number;
    nextStart: number;
    num: number;
    total: number;
    resources: [{
      resource: string;
      access: string;
      created: number;
      size: number;
    }];
  }

  function getItemResources(id: string, requestOptions?: IRequestOptions): Promise<IItemResourcesResponse>;
}
