import { IAuthenticationManager } from "@esri/arcgis-rest-request";
import { StyleFamily } from "./types/StyleFamily.js";
export interface IBasemapSessionParams {
    token: string;
    startSessionUrl: string;
    styleFamily: StyleFamily;
    authentication: IAuthenticationManager | string;
    expires: Date;
    startTime: Date;
    endTime: Date;
    safetyMargin?: number;
    duration?: number;
    autoRefresh?: boolean;
}
export interface IStartSessionParams {
    styleFamily?: StyleFamily;
    authentication: IAuthenticationManager | string;
    safetyMargin?: number;
    duration?: number;
    autoRefresh?: boolean;
    /**
     * The URL to start the session. If not provided, it will use the default URL.
     * @private
     */
    startSessionUrl?: string;
}
/**
 * The base class for all basemap sessions. This class implements the {@linkcode IAuthenticationManager} interface and provides methods to start, refresh, and check the expiration of a session.
 * This is not intendet to be used directly, but instead is extended by other classes such as {@linkcode BasemapStyleSession} and {@linkcode StaticBasemapTilesSession}.
 *
 * @abstract
 * @implements {IAuthenticationManager}
 */
export declare abstract class BaseSession implements IAuthenticationManager {
    /**
     * Event handler for when an error occurs during session management.
     */
    static readonly error: (e: Error) => void;
    /**
     * Event handler for when a session expires and the `token` it no longer valid.
     *
     * @event expired
     * @param e - The parameters for the expired event.
     * @param e.token - The session token that expired.
     * @param e.startTime - The start time of the session.
     * @param e.endTime - The end time of the session.
     * @param e.expires - The expiration time of the session.
     */
    static readonly expired: (e: {
        token: string;
        startTime: Date;
        endTime: Date;
        expires: Date;
    }) => void;
    /**
     * Event handler for when a session refreshes and a new `token` is available.
     *
     * @event refreshed
     * @param e. - The parameters for the refreshed event.
     * @param e.previous - The previous session details.
     * @param e.previous.token - The previous session token.
     * @param e.previous.startTime - The start time of the previous session.
     * @param e.previous.endTime - The end time of the previous session.
     * @param e.previous.expires - The expiration time of the previous session.
     * @param e.current - The current session details.
     * @param e.current.token - The current session token.
     * @param e.current.startTime - The start time of the current token.
     * @param e.current.endTime - The end time of the current session.
     * @param e.current.expires - The expiration time of the current token.
     */
    static readonly refreshed: (e: {
        previous: {
            token: string;
            startTime: Date;
            endTime: Date;
            expires: Date;
        };
        current: {
            token: string;
            startTime: Date;
            endTime: Date;
            expires: Date;
        };
    }) => void;
    /**
     * The portal URL that the session is associated with. This generally is not used but exists to implement the `IAuthenticationManager` interface.
     */
    readonly portal: string;
    /**
     * The style family of the session. This is used to determine the type of basemap styles that are available.
     */
    readonly styleFamily: StyleFamily;
    /**
     * The authentication manager or token used for the session.
     * This can be an instance of {@linkcode ApiKeyManager}, {@linkcode ArcGISIdentityManager}, {@linkcode ApplicationCredentialsManager} or a string token.
     */
    readonly authentication: IAuthenticationManager | string;
    /**
     * The expiration date of the session. This is the {@linkcode BaseSession.endTime} minus the {@linkcode BaseSession.safetyMargin}. This is used internally to determine if the session is expired.
     */
    readonly expires: Date;
    /**
     * The start time of the session. This is the time returned from the API when the session war started.
     */
    readonly startTime: Date;
    /**
     * The end time of the session. This is the time returned from the API when the session will end.
     */
    readonly endTime: Date;
    /**
     * The token for the session.
     */
    readonly token: string;
    /**
     * The URL used to start the session.
     */
    readonly startSessionUrl: string;
    /**
     * The safety margin in milliseconds. This subtracted from the {@linkcode BaseSession.endTime} to get the {@linkcode BaseSession.expiration}.
     */
    readonly safetyMargin: number;
    /**
     * The duration of the session in seconds. This is used to determine how long the session will last when the session is refreshed.
     */
    readonly duration: number;
    /**
     * The interval at which to check the expiration time of the session. This is always 10 seconds or 1/100th of the duration, whichever is smaller.
     */
    readonly expirationCheckInterval: number;
    /**
     * The ID of the timer used to check the expiration time of the session.
     */
    private expirationTimerId;
    /**
     * Internal instance of [`mitt`](https://github.com/developit/mitt) used for event handlers. It is recommended to use {@linkcode BasemapSession.on}, {@linkcode BasemapSession.off} or {@linkcode BasemapSession.once} instead of `emitter.`
     */
    private emitter;
    /**
     * A handler that is used to automatically refresh the session when it expires.
     */
    private autoRefreshHandler;
    /**
     * Creates a new instance of the BaseSession class. Generally you should not create an instance of this class directly, but instead use the static methods to start a session or deserialize a session.
     *
     * You may need to create an instance of this class directly if you are  not using the built in deserialize method.
     *
     * @param params - The parameters for the session.
     * @param params.startSessionUrl - The URL to start the session.
     * @param params.token - The token for the session.
     * @param params.styleFamily - The style family of the session.
     * @param params.authentication - The authentication manager or token used for the session.
     * @param params.expires - The expiration date of the session.
     * @param params.startTime - The start time of the session.
     * @param params.endTime - The end time of the session.
     * @param params.safetyMargin - The safety margin in milliseconds.
     * @param params.duration - Indicates if this is a test session.
     */
    constructor(params: IBasemapSessionParams);
    /**
     * Checks if the session is expired. If it is expired, it emits an "expired" event. The event will fire **before** the method returns true.
     *
     * @returns {boolean} - Returns true if the session is expired, otherwise false.
     */
    isSessionExpired(): boolean;
    /**
     * Starts checking the expiration time of the session. This will check the expiration time immediately and then on an interval.
     * If the session is expired, it will emit an "expired" event.
     */
    startCheckingExpirationTime(): any;
    /**
     * Stops checking the expiration time of the session. This will clear the interval that was set by {@linkcode BaseSession.startCheckingExpirationTime}.
     */
    stopCheckingExpirationTime(): void;
    /**
     * Indicates if the session is currently checking for expiration time.
     *
     * @returns {boolean} - Returns true if the session is checking for expiration time, otherwise false.
     */
    get checkingExpirationTime(): boolean;
    /**
     * Starts a new session using the provided parameters and returns an instance of the session class.
     *
     * @param params - The parameters for starting the session.
     * @param SessionClass - The class to use for the session.
     * @returns A promise that resolves to an instance of the session class.
     */
    protected static startSession<T extends BaseSession>({ startSessionUrl, styleFamily, authentication, safetyMargin, duration, autoRefresh }: {
        startSessionUrl?: string;
        styleFamily?: StyleFamily;
        authentication: IAuthenticationManager | string;
        safetyMargin?: number;
        duration?: number;
        autoRefresh?: boolean;
    }, SessionClass: new (params: IBasemapSessionParams) => T): Promise<T>;
    /**
     * Checks if the session is expired.
     *
     */
    get isExpired(): boolean;
    /**
     * Gets the session token. If the session is expired, it will refresh the credentials and return the new token.
     *
     * @returns A promise that resolves to the session token.
     */
    getToken(): Promise<string>;
    /**
     * Indicates if the session can be refreshed. This is always true for this class.
     *
     * @returns {boolean} - Always returns true.
     */
    get canRefresh(): boolean;
    /**
     * Indicates if the session is set to automatically refresh when it expires.
     *
     * @returns {boolean} - Returns true if auto-refresh is enabled, otherwise false.
     */
    get autoRefresh(): boolean;
    /**
     * Refreshes the session credentials by starting a new session.
     * This will emit a "refreshed" event with the previous and current session details.
     *
     * @returns A promise that resolves to the current instance of the session.
     */
    refreshCredentials(): Promise<this>;
    /**
     * Enables auto-refresh for the session. This will automatically refresh the session when it expires.
     * It will also start checking the expiration time of the session if it is not already started via {@linkcode BaseSession.startCheckingExpirationTime}.
     */
    startAutoRefresh(): void;
    /**
     * Disables auto-refresh for the session. This will stop automatically refreshing the session when it expires.
     * This will  **not** stop checking the expiration time of the session. If you want to stop automated expiration
     * checking, call {@linkcode BaseSession.stopCheckingExpirationTime} after calling this method.
     */
    stopAutoRefresh(): void;
    /**
     * A handler that listens for an eventName and returns custom handler.
     *
     * @param eventName A string of what event to listen for.
     * @param handler A function of what to do when eventName was called.
     */
    on(event: "refreshed", handler: typeof BaseSession.refreshed): void;
    on(event: "expired", handler: typeof BaseSession.expired): void;
    on(event: "error", handler: typeof BaseSession.error): void;
    /**
     * A handler that listens for an event once and returns a custom handler. Events listened to with this method cannot be removed with {@linkcode BasemapSession.off}.
     *
     * @param eventName A string of what event to listen for.
     * @param handler A function of what to do when eventName was called.
     */
    once(event: "refreshed", handler: typeof BaseSession.refreshed): void;
    once(event: "expired", handler: typeof BaseSession.expired): void;
    once(event: "error", handler: typeof BaseSession.error): void;
    /**
     * A handler that will remove a listener from a given event.
     *
     * @param eventName A string of what event to listen for.
     * @param handler A function of what to do when eventName was called.
     */
    off(event: "refreshed", handler: typeof BaseSession.refreshed): void;
    off(event: "expired", handler: typeof BaseSession.expired): void;
    off(event: "error", handler: typeof BaseSession.error): void;
    /**
     * These private methods are used to set the internal state of the session.
     */
    private setToken;
    private setStartTime;
    private setEndTime;
    private setExpires;
}
