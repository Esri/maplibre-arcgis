import { IAuthenticationManager } from "@esri/arcgis-rest-request";
import { StyleFamily } from "../types/StyleFamily.js";
export interface IRequestNewSessionParams {
    startSessionUrl: string;
    authentication: IAuthenticationManager | string;
    styleFamily?: StyleFamily;
    duration?: number;
}
export interface IStartSessionResponse {
    sessionToken: string;
    endTime: number;
    startTime: number;
    styleFamily: StyleFamily;
}
export declare function startNewSession({ startSessionUrl, authentication, styleFamily, duration }: IRequestNewSessionParams): Promise<IStartSessionResponse>;
