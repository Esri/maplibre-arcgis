import { type StyleFamily } from '@esri/arcgis-rest-basemap-sessions';
/**
 * Options for initializing a BasemapStyleSession
 */
export interface IBasemapSessionOptions {
    /** Access token for authentication. The token must be from an ArcGIS Location Platform account and have the Basemaps privilege. */
    token: string;
    /** Style family for the session. */
    styleFamily: StyleFamily;
    /** Duration in seconds for the session. */
    duration?: number;
    /** Toggles auto-refresh functionality. */
    autoRefresh?: boolean;
    /** Safety margin in seconds to refresh the session before the `endTime`. */
    safetyMargin?: number;
    /**
     * @internal
     */
    startSessionUrl?: string;
}
/**
 * The object returned from the session start request.
 */
export type SessionResponse = {
    token: string;
    endTime: Date;
    startTime: Date;
    expires: Date;
};
/**
 * The object returned by the `BasemapSessionRefreshed` event.
 */
export type SessionRefreshedData = {
    previous: SessionResponse;
    current: SessionResponse;
};
/**
 * Type representing the events emitted by the BasemapSession class.
 */
export type BasemapSessionEventMap = {
    /**
     * Event emitted when the basemap session is refreshed.
     */
    BasemapSessionRefreshed: SessionRefreshedData;
    /**
     * Event emitted when the basemap session expires.
     */
    BasemapSessionExpired: SessionResponse;
    /**
     * Event emitted when there is an error with the basemap session.
     */
    BasemapSessionError: Error;
};
/**
 * Manages the creation and lifecycle of a basemap session for use with {@link BasemapStyle}.
 *
 * The `BasemapSession` class provides:
 * - Session token management with auto-refresh capabilities
 * - Event handling for session lifecycle (refresh, expiration, errors)
 * - Integration with ArcGIS Basemap Styles Service
 *
 * \> An [access token](https://developers.arcgis.com/maplibre-gl-js/access-tokens/) is required to use basemap sessions.
 *The token must be from an [ArcGIS Location Platform account](https://location.arcgis.com) and have the Basemaps [privilege](https://developers.arcgis.com/documentation/security-and-authentication/reference/privileges/).
 *
 * ```javascript
 * // Create and start a session
 * const basemapSession = await BasemapSession.start({
 *   token: "your-arcgis-token",
 *   styleFamily: "arcgis",
 *   duration: 3600,
 *   autoRefresh: true
 * });
 *
 * // Listen for session events
 * basemapSession.on("BasemapSessionRefreshed", (e) => {
 *   console.log("Session refreshed", e.current.token);
 * });
 *
 * basemapSession.on("BasemapSessionExpired", (e) => {
 *   console.log("Session expired", e.token);
 * });
 *
 * basemapSession.on("BasemapSessionError", (e) => {
 *   console.error("Session error", e);
 * });
 * ```
 */
export declare class BasemapSession {
    private _session?;
    private readonly _options;
    private readonly _emitter;
    private _parentToken;
    /**
     * Creates a new `BasemapSession` instance but does not start it. Use the {@link BasemapSession.initialize} method to begin the session manually. Creating basemap sessions in this way using the constructor directly is discouraged. The recommended method is to use {@link BasemapSession.start}.
     * ```javascript
     * const basemapSession = new BasemapSession({
     *   token: 'your-arcgis-token',
     *   styleFamily: 'arcgis-navigation',
     *   duration: 3600,
     *   autoRefresh: false
     * });
     * await session.initialize();
     * ```
     * @param options - Configuration options for the session
     */
    constructor(options: IBasemapSessionOptions);
    /**
     * Gets the current session token.
     */
    get token(): string;
    get parentToken(): string;
    /**
     * Gets the sessions {@link StyleFamily} value.
     */
    get styleFamily(): StyleFamily | undefined;
    /**
     * Gets the functional end time of the session. This is equivalent to the session end time plus the safety margin, and is used to tell when the session should be refreshed.
     */
    get safeEndTime(): Date;
    /**
     * Gets the session start time.
     */
    get startTime(): Date;
    /**
     * Gets the end time of the session returned by the basemap styles service.
     */
    get endTime(): Date;
    /**
     * Returns 'true' if the session is started, and false otherwise.
     */
    get isStarted(): boolean;
    /**
     * Starts the session if it has not been started already.
     *
     * ```javascript
     * const basemapSession = new BasemapSession({
     *   token: 'your-arcgis-token',
     *   styleFamily: 'arcgis-navigation',
     *   duration: 3600,
     *   autoRefresh: false
     * });
     * await session.initialize();
     * ```
     */
    initialize(): Promise<void>;
    /**
     * Manually refresh the session token.
     * @example
     * ```javascript
     * basemapSession.on("BasemapSessionExpired", () => {
     *   console.log('Session expired');
     *   // Manually refresh the session token using the refresh method.
     *   basemapSession.refresh();
     * });
     * ```
     */
    refresh(): Promise<void>;
    /**
     * @internal
     */
    private setupEventListeners;
    /**
     * @internal
     */
    private expiredHandler;
    /**
     * @internal
     */
    private refreshedHandler;
    /**
     * @internal
     */
    private errorHandler;
    /**
     * Register an event handler
     * @example
     * ```typescript
     * const basemapSession = await BasemapSession.start(options);
     * basemapSession.on('BasemapSessionExpired', (data) => {
     *   console.log('Session expired:', data);
     * });
     * ```
     */
    on<K extends keyof BasemapSessionEventMap>(eventName: K, handler: (data: BasemapSessionEventMap[K]) => void): void;
    /**
     * Unregister an event handler
     * @example
     * ```typescript
     * const basemapSession = await BasemapSession.start(options);
     * basemapSession.off('BasemapSessionExpired', handler);
     * ```
     */
    off<K extends keyof BasemapSessionEventMap>(eventName: K, handler: (data: BasemapSessionEventMap[K]) => void): void;
    /**
     * Factory method that creates a new basemap session and starts it.
     * @param options - Options for constructing the basemap session.
     * @example
     * ```javascript
     * const basemapSession = await BasemapSession.start({
     *   token: 'your-access-token',
     *   styleFamily: 'arcgis',
     *   autoRefresh: true
     * });
     * ```
     */
    static start(options: IBasemapSessionOptions): Promise<BasemapSession>;
}
export default BasemapSession;
