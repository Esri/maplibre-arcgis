import { BaseSession, IBasemapSessionParams, IStartSessionParams } from "./BaseSession.js";
/**
 * `StaticBasemapTilesSession` is a class that extends {@linkcode BaseSession} to manage sessions
 * for static basemap tiles. It provides methods to {@linkcode StaticBasemapTilesSession.start} a new session
 * which should be used instead of constructing a new instance directly.
 *
 * @class StaticBasemapTilesSession
 * @extends BaseSession
 */
export declare class StaticBasemapTilesSession extends BaseSession {
    /**
     * Creates an instance of `StaticBasemapTilesSession`. Constructing `StaticBasemapTilesSession` directly is discouraged.
     * Instead, use the static method {@linkcode StaticBasemapTilesSession.start} to start a new session.`
     */
    constructor(params: IBasemapSessionParams);
    /**
     * Starts a new static basemap tiles session.
     */
    static start(params: IStartSessionParams): Promise<StaticBasemapTilesSession>;
}
