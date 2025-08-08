import { request } from "@esri/arcgis-rest-request";
import { DEFAULT_DURATION } from "./defaults.js";
export function startNewSession({ startSessionUrl, authentication, styleFamily = "arcgis", duration = DEFAULT_DURATION }) {
    return request(startSessionUrl, {
        httpMethod: "GET",
        authentication: authentication,
        params: { styleFamily, durationSeconds: duration }
    });
}
//# sourceMappingURL=startNewSession.js.map