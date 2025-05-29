type ServiceUrl = string;
export type ItemId = string;
export type ServiceUrlOrItemId = ServiceUrl | ItemId;

// what does loadService do?
// 1. load item info
// 2. load service info
// 3. load style info

// loadItemInfo
// loadServiceInfo
// loadStyleInfo
export const vectorTileServiceRegex = /\/VectorTileServer\/?$/;
// loadServiceMetadata
export const checkServiceUrlOrItemId = (idOrUrl : ServiceUrlOrItemId) : 'serviceUrl' | 'itemId' => {

    const httpRegex = /^https?:\/\//;

    // Check other service types here eventually
    
    if (httpRegex.test(idOrUrl) && vectorTileServiceRegex.test(idOrUrl)) {
        // Vector tile service URL
        return 'serviceUrl';
    }
    else if (idOrUrl.length == 32) {
        // Item ID
        return 'itemId';
    }
    else throw new Error('Input must be a valid ArcGIS service URL or item ID.');
}



export const loadItemInfo = async (itemId, options) => {

}

export const loadStyleFromItem = async (itemId, options) => {

}

export const loadServiceInfo = async (serviceUrl, options) => {
    // item ID
    // default style URL
    // tile URL
}

export const loadStyleFromService = async (serviceUrl, options) => {

}