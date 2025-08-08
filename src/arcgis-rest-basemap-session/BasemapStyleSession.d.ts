import { BaseSession, IBasemapSessionParams, IStartSessionParams } from "./BaseSession.js";
/**
 * `BasemapStyleSession` is a class that extends {@linkcode BaseSession} to manage sessions
 * for basemap styles. It provides methods to {@linkcode BasemapStyleSession.start} a new session
 * which should be used instead of constructing a new instance directly.
 *
 * @class BasemapStyleSession
 * @extends BaseSession
 */
export declare class BasemapStyleSession extends BaseSession {
    /**
     * Creates an instance of `BasemapStyleSession`. Constructing `BasemapStyleSession` directly is discouraged.
     * Instead, use the static method {@linkcode BasemapStyleSession.start} to start a new session.
     */
    constructor(params: IBasemapSessionParams);
    /**
     * Starts a new basemap style session.
     */
    static start(params: IStartSessionParams): Promise<BasemapStyleSession>;
}
