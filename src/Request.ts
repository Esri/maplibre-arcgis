/* eslint
@typescript-eslint/no-explicit-any:"off",
@typescript-eslint/no-unsafe-assignment:"off",
@typescript-eslint/no-unsafe-member-access:"off"
*/

function serialize(params: Record<string, any>) {
    let data = '';

    params.f = params.f || 'json';

    for (const key in params) {
        if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
        const param = params[key];
        if (param === null || param === undefined) continue;

        const type = Object.prototype.toString.call(param);

        let value: string | number;
        if (type === '[object Array]') {
            value
                = Object.prototype.toString.call(param[0]) === '[object Object]'
                    ? JSON.stringify(param)
                    : (param as any[]).join(',');
        }
        else if (type === '[object Object]') {
            value = JSON.stringify(param);
        }
        else if (type === '[object Date]') {
            value = (param as Date).valueOf();
        }
        else {
            value = param;
        }

        if (data.length) {
            data += '&';
        }
        data += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    const APOSTROPHE_URL_ENCODE = '%27';
    return data.replace(/'/g, APOSTROPHE_URL_ENCODE);
}

export function fetchRequest(requestUrl: string, params: { [_: string]: any } = {}, context?: any): Promise<any> {
    const requestOptions: RequestInit = {};
    requestOptions.headers = {};
    requestOptions.mode = 'cors';

    // Try setting access token as authorization header if included
    let accessToken: string;
    if (Object.keys(params).includes('token') && params.token && authorizationHeaderSupported(requestUrl)) {
        accessToken = params.token as string;
        delete params.token;

        requestOptions.headers['X-Esri-Authorization'] = `Bearer ${accessToken}`;
        requestOptions.headers['Access-Control-Request-Headers'] = 'X-Esri-Authorization';
    }

    const paramString = serialize(params);
    const requestLength = `${requestUrl}?${paramString}`.length;

    // Set context variables, timeout, credentials
    if (typeof context === 'object' && context !== null) {
        if (typeof context.options !== 'undefined') {
            if (context.options.timeout) {
                requestOptions.signal = AbortSignal.timeout(context.options.timeout as number);
            }
            if (context.options.credentials) {
                requestOptions.credentials = context.options.credentials;
            }
        }
    }

    // request is less than 2000 characters, make GET request
    if (requestLength <= 2000) {
        requestOptions.method = 'GET';
        requestUrl = `${requestUrl}?${paramString}`;

        // request is more than 2000 characters, make POST request
    }
    else {
        requestOptions.method = 'POST';
        requestOptions.headers['Content-Type'] = 'application/json; charset=UTF-8';
        requestOptions.body = paramString;
    }

    return new Promise((resolve, reject) => {
        makeRequest(requestUrl, requestOptions, resolve, reject)
            .catch((error) => {
                // Could be CORS access token error, move token out of header and try again
                if (requestOptions.headers && requestOptions.headers['X-Esri-Authorization']) {
                    delete requestOptions.headers['X-Esri-Authorization'];
                    if (requestOptions.method == 'GET') requestUrl += `&token=${accessToken}`;
                    else if (requestOptions.method == 'POST') (requestOptions.body as string) += `&token=${accessToken}`;

                    void makeRequest(requestUrl, requestOptions, resolve, reject);
                }
            });
    });
}

const makeRequest = async (requestUrl: string, requestOptions: { [_: string]: any }, resolve: (_: any) => any, reject: (_: string) => void): Promise<any> => {
    return fetch(requestUrl, requestOptions).then((response) => {
        if (!response.ok) {
            reject(`${response.url} ${response.status} (${response.statusText})`);
        }
        response.json().then((result) => {
            if (result.error) {
                reject(`${requestUrl} ${result.error.code}: ${result.error.message}  `);
            }
            resolve(result);
        }, (rejectedReason) => { throw rejectedReason; });
    });
};

// Test if the service endpoint supports authorization headers
const authorizationHeaderSupported = (serviceUrl: string) => {
    /*
     * Vector tile services now support authorization headers
     * TODO find a definitive list of services that do not support this header -- basemap styles service, for example.
     */
    return true;
};

export const Request = {
    request: fetchRequest,
};
export { fetchRequest as request };
export default Request;
