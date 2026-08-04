//@ts-nocheck
import customResourcesRaw from './custom-style-resource.json';
import usaServiceInfoRaw from './usa/service-info.json';
import usaServiceItemInfoRaw from './usa/service-item-info.json';
import usaServiceStyleRaw from './usa/service-resource-style.json';
import usaItemInfoRaw from './usa/styled-item-info.json';
import usaItemResourcesRaw from './usa/styled-item-resources.json';
import usaItemStyleRaw from './usa/styled-item-resource-style.json';

const vectorTileLayerMocks = {
  customResourceFiles: {
    customResourcesRaw,
    customResources: JSON.stringify(customResourcesRaw)
  },
  usaPopulationLayer: {
    itemId: '31eb749371c441e0b3ac5db4f60ecba9',
    serviceItemId: '7945dd44c5cd41329984d7ce6e641976',
    serviceUrl: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/USA_States_Population_Vector_Tiles/VectorTileServer',
    usaServiceInfoRaw,
    usaServiceItemInfoRaw,
    usaServiceStyleRaw,
    usaItemInfoRaw,
    usaItemResourcesRaw,
    usaItemStyleRaw,
    usaServiceInfo: JSON.stringify(usaServiceInfoRaw),
    usaServiceItemInfo: JSON.stringify(usaServiceItemInfoRaw),
    usaServiceStyle: JSON.stringify(usaServiceStyleRaw),
    usaItemInfo: JSON.stringify(usaItemInfoRaw),
    usaItemStyle: JSON.stringify(usaItemStyleRaw),
    usaItemResources: JSON.stringify(usaItemResourcesRaw),
    emptyResources: JSON.stringify({
      total: 0,
      start: 1,
      num: 0,
      nextStart: -1,
      resources: []
    })
  },
  santaMonicaParcelsLayer: {
    serviceUrl: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer',
    serviceItemId: 'f0298e881b5b4743bbdf2c7d378acc84'
  }
};

export default vectorTileLayerMocks;
