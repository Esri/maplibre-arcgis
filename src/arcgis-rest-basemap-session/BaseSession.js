import mitt from "mitt";
import { startNewSession } from "./utils/startNewSession.js";
import { determineSafetyMargin } from "./utils/detemineSafetyMargin.js";
import { DEFAULT_DURATION, DEFAULT_CHECK_EXPIRATION_INTERVAL } from "./utils/defaults.js";
/**
 * The base class for all basemap sessions. This class implements the {@linkcode IAuthenticationManager} interface and provides methods to start, refresh, and check the expiration of a session.
 * This is not intendet to be used directly, but instead is extended by other classes such as {@linkcode BasemapStyleSession} and {@linkcode StaticBasemapTilesSession}.
 *
 * @abstract
 * @implements {IAuthenticationManager}
 */
export class BaseSession {
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
    constructor(params) {
        /**
         * The ID of the timer used to check the expiration time of the session.
         */
        this.expirationTimerId = null;
        /**
         * A handler that is used to automatically refresh the session when it expires.
         */
        this.autoRefreshHandler = null;
        this.startSessionUrl = params.startSessionUrl;
        this.token = params.token;
        this.styleFamily = params.styleFamily || "arcgis";
        this.authentication = params.authentication;
        this.duration = params.duration || DEFAULT_DURATION;
        this.startTime = params.startTime;
        this.endTime = params.endTime;
        this.expires = params.expires;
        this.safetyMargin = params.safetyMargin;
        this.expirationCheckInterval =
            Math.min(this.duration / 100, DEFAULT_CHECK_EXPIRATION_INTERVAL) * 1000;
        this.emitter = mitt();
    }
    /**
     * Checks if the session is expired. If it is expired, it emits an "expired" event. The event will fire **before** the method returns true.
     *
     * @returns {boolean} - Returns true if the session is expired, otherwise false.
     */
    isSessionExpired() {
        if (this.isExpired) {
            this.emitter.emit("expired", {
                token: this.token,
                startTime: this.startTime,
                endTime: this.endTime,
                expires: this.expires
            });
        }
        return this.isExpired;
    }
    /**
     * Starts checking the expiration time of the session. This will check the expiration time immediately and then on an interval.
     * If the session is expired, it will emit an "expired" event.
     */
    startCheckingExpirationTime() {
        const check = () => {
            this.isSessionExpired();
        };
        if (!this.expirationTimerId) {
            this.expirationTimerId = setInterval(check, 
            // check every 10 seconds or 1/100th of the duration, whichever is smaller
            this.expirationCheckInterval); // check immediatly then on an interval
        }
        setTimeout(() => {
            check(); // check immediately after starting the interval
        }, 10);
        return this.expirationTimerId; // return the timer ID so it can be stopped later
    }
    /**
     * Stops checking the expiration time of the session. This will clear the interval that was set by {@linkcode BaseSession.startCheckingExpirationTime}.
     */
    stopCheckingExpirationTime() {
        if (this.expirationTimerId) {
            clearInterval(this.expirationTimerId);
            this.expirationTimerId = null;
        }
    }
    /**
     * Indicates if the session is currently checking for expiration time.
     *
     * @returns {boolean} - Returns true if the session is checking for expiration time, otherwise false.
     */
    get checkingExpirationTime() {
        return !!this.expirationTimerId;
    }
    /**
     * Starts a new session using the provided parameters and returns an instance of the session class.
     *
     * @param params - The parameters for starting the session.
     * @param SessionClass - The class to use for the session.
     * @returns A promise that resolves to an instance of the session class.
     */
    static async startSession({ startSessionUrl, styleFamily = "arcgis", authentication, safetyMargin, duration = DEFAULT_DURATION, autoRefresh = true }, SessionClass) {
        const sessionResponse = await startNewSession({
            startSessionUrl,
            styleFamily,
            authentication,
            duration
        });
        const actualSafetyMargin = determineSafetyMargin(duration, safetyMargin);
        const session = new SessionClass({
            startSessionUrl: startSessionUrl,
            token: sessionResponse.sessionToken,
            styleFamily,
            authentication,
            safetyMargin: actualSafetyMargin,
            expires: new Date(sessionResponse.endTime - actualSafetyMargin * 1000),
            startTime: new Date(sessionResponse.startTime),
            endTime: new Date(sessionResponse.endTime),
            duration
        });
        session.startCheckingExpirationTime();
        if (autoRefresh) {
            session.startAutoRefresh();
        }
        return session;
    }
    /**
     * Checks if the session is expired.
     *
     */
    get isExpired() {
        return this.expires < new Date();
    }
    /**
     * Gets the session token. If the session is expired, it will refresh the credentials and return the new token.
     *
     * @returns A promise that resolves to the session token.
     */
    getToken() {
        if (this.isExpired) {
            return this.refreshCredentials().then(() => this.token);
        }
        return Promise.resolve(this.token);
    }
    /**
     * Indicates if the session can be refreshed. This is always true for this class.
     *
     * @returns {boolean} - Always returns true.
     */
    get canRefresh() {
        return true;
    }
    /**
     * Indicates if the session is set to automatically refresh when it expires.
     *
     * @returns {boolean} - Returns true if auto-refresh is enabled, otherwise false.
     */
    get autoRefresh() {
        return !!this.autoRefreshHandler && !!this.expirationTimerId;
    }
    /**
     * Refreshes the session credentials by starting a new session.
     * This will emit a "refreshed" event with the previous and current session details.
     *
     * @returns A promise that resolves to the current instance of the session.
     */
    async refreshCredentials() {
        // @TODO switch this to structured clone when we upgrade to Node 20+ types so we don't have to parse the dates later
        const previous = JSON.parse(JSON.stringify({
            token: this.token,
            startTime: this.startTime,
            endTime: this.endTime,
            expires: this.expires
        }));
        try {
            const newSession = await startNewSession({
                startSessionUrl: this.startSessionUrl,
                styleFamily: this.styleFamily,
                authentication: this.authentication,
                duration: this.duration
            });
            this.setToken(newSession.sessionToken);
            this.setStartTime(new Date(newSession.startTime));
            this.setEndTime(new Date(newSession.endTime));
            this.setExpires(new Date(newSession.endTime - this.safetyMargin * 1000));
            this.emitter.emit("refreshed", {
                previous: {
                    token: previous.token,
                    startTime: new Date(previous.startTime),
                    endTime: new Date(previous.endTime),
                    expires: new Date(previous.expires)
                },
                current: {
                    token: this.token,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    expires: this.expires
                }
            });
        }
        catch (error) {
            this.emitter.emit("error", error);
            throw error;
        }
        return this;
    }
    /**
     * Enables auto-refresh for the session. This will automatically refresh the session when it expires.
     * It will also start checking the expiration time of the session if it is not already started via {@linkcode BaseSession.startCheckingExpirationTime}.
     */
    startAutoRefresh() {
        if (!this.expirationTimerId) {
            this.startCheckingExpirationTime();
        }
        this.autoRefreshHandler = () => {
            this.refreshCredentials().catch((error) => {
                this.emitter.emit("error", error);
            });
        };
        this.on("expired", this.autoRefreshHandler);
    }
    /**
     * Disables auto-refresh for the session. This will stop automatically refreshing the session when it expires.
     * This will  **not** stop checking the expiration time of the session. If you want to stop automated expiration
     * checking, call {@linkcode BaseSession.stopCheckingExpirationTime} after calling this method.
     */
    stopAutoRefresh() {
        if (this.autoRefreshHandler) {
            this.off("expired", this.autoRefreshHandler);
            this.autoRefreshHandler = null;
        }
    }
    on(eventName, handler) {
        this.emitter.on(eventName, handler);
        this.isSessionExpired(); // check if the session is expired immediately after adding the handler
    }
    once(eventName, handler) {
        const fn = (e) => {
            this.emitter.off(eventName, fn);
            handler(e);
        };
        this.emitter.on(eventName, fn);
    }
    off(eventName, handler) {
        this.emitter.off(eventName, handler);
    }
    /**
     * These private methods are used to set the internal state of the session.
     */
    setToken(token) {
        this.token = token;
    }
    setStartTime(startTime) {
        this.startTime = startTime;
    }
    setEndTime(endTime) {
        this.endTime = endTime;
    }
    setExpires(expires) {
        this.expires = expires;
    }
}
// the static methods for event handlers are used to provide doc via typedoc and do not need to be tested.
/* istanbul ignore next -- @preserve */
/**
 * Event handler for when an error occurs during session management.
 */
BaseSession.error = function error(e) { }; // eslint-disable-line @typescript-eslint/no-empty-function
// the static methods for event handlers are used to provide doc via typedoc and do not need to be tested.
/* istanbul ignore next -- @preserve */
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
BaseSession.expired = function expired(e) { }; // eslint-disable-line @typescript-eslint/no-empty-function
// the static methods for event handlers are used to provide doc via typedoc and do not need to be tested.
/* istanbul ignore next -- @preserve */
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
BaseSession.refreshed = function refreshed(e) { }; // eslint-disable-line @typescript-eslint/no-empty-function
//# sourceMappingURL=BaseSession.js.map