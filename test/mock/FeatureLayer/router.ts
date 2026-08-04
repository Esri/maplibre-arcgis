//@ts-nocheck
import multiLayerServiceDefinitionRaw from './multiLayer-service-info.json';
import trailsLayerDefinitionRaw from './trails/trails-layer-info.json';
import trailsServiceDefinitionRaw from './trails/trails-service-info.json';
import trailsItemRaw from './trails/trails-item-info.json';
import trailsDataRaw from './trails/trails-features.json';
import trailsDataTruncatedRaw from './trails/trails-features-truncated.json';
import trailsExceedsLimitRaw from './trails/trails-feature-exceedsLimit.json';

const featureMultiLayerMock = {
  itemId: '44299709cce447ea99014ff1e3bf8505',
  serviceUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/ManyLayers/FeatureServer',
  serviceDefinition: JSON.stringify(multiLayerServiceDefinitionRaw),
  serviceDefinitionRaw: multiLayerServiceDefinitionRaw
};

const featureTrailsMock = {
  itemId: '69e12682738e467eb509d8b54dc73cbd',
  item: JSON.stringify(trailsItemRaw),
  itemRaw: trailsItemRaw,
  serviceUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer',
  serviceDefinition: JSON.stringify(trailsServiceDefinitionRaw),
  serviceDefinitionRaw: trailsServiceDefinitionRaw,
  layerUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0',
  layerDefinition: JSON.stringify(trailsLayerDefinitionRaw),
  layerDefinitionRaw: trailsLayerDefinitionRaw,
  exceedsLimitResponse: JSON.stringify(trailsExceedsLimitRaw),
  exceedsLimitResponseRaw: trailsExceedsLimitRaw,
  geoJSONSmall: JSON.stringify(trailsDataTruncatedRaw),
  geoJSONLarge: JSON.stringify(trailsDataRaw),
  geoJSONRaw: trailsDataRaw,
  geoJSONSmallRaw: trailsDataTruncatedRaw
};

export const featureMocks = {
  trailsMock: featureTrailsMock,
  multiLayerMock: featureMultiLayerMock
};

export default featureMocks;
