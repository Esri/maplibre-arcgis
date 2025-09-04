import {
  BasemapStyleSession as ArcgisRestBasemapStyleSession,
  type IStartSessionParams,
  type StyleFamily,
} from '@esri/arcgis-rest-basemap-sessions';
import { ApiKeyManager } from '@esri/arcgis-rest-request';

import mitt, { type Emitter } from 'mitt';

/**
 * Options for initializing a BasemapStyleSession
 */
export interface IBasemapSessionOptions {
  /** Access token for authentication. The token must be from an ArcGIS Location Platform account and have the Basemaps privelege. */
  token?: string;
  /** Duration in seconds for the session. */
  duration?: number;
  /** Style family for the session. */
  styleFamily: StyleFamily;
  /** Toggles auto-refresh functionality. */
  autoRefresh?: boolean;
  /** Safety margin in seconds to refresh the session before it expires. */
  safetyMargin?: number;
  /**
   * @internal
   */
  startSessionUrl?: string;
  /**
   * The end time of the session.
   */
  endTime: Date;
  /**
   * The date of expiration for the session taking into account the {@link safetyMargin} applied.
   */
  expires: Date;
  /**
   * The start time of the session
   */
  startTime: Date;
}

/**
 * Structure of the object returned from the session start request.
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
  /**
   * Event emitted when the basemap session is refreshed.
   */
  BasemapSessionRefreshed: SessionRefreshedData;
  /**
   * Event emitted when the basemap session expires.
   */
  /**
   * Event emitted when the basemap session expires.
   */
  BasemapSessionExpired: SessionResponse;
  /**
   * Event emitted when there is an error with the basemap session.
   */
  /**
   * Event emitted when there is an error with the basemap session.
   */
  BasemapSessionError: Error;
};

const DEFAULT_START_BASEMAP_STYLE_SESSION_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start';
const DEV_STYLE_SESSION_URL = 'https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start';
/**
 * Manages the creation and lifecycle of a basemap session for use with {@link BasemapStyle}.
 *
 * The `BasemapSession` class provides:
 * - Session token management with auto-refresh capabilities
 * - Event handling for session lifecycle (refresh, expiration, errors)
 * - Integration with ArcGIS Basemap Styles Service
 *
 * > An [access token](https://mapbox-migration-preview.gha.afd.arcgis.com/maplibre-gl-js/access-tokens/) is required to use basemap sessions.
 * > The token must be from an [ArcGIS Location Platform account](https://location.arcgis.com) and have the Basemaps [privilege](https://developers.arcgis.com/documentation/security-and-authentication/reference/privileges/).
 *
 * @example
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
 *
 * @see {@link IBasemapSessionOptions} for configuration options
 * @see {@link https://developers.arcgis.com/documentation/mapping-and-location-services/security-and-authentication/api-keys/ | ArcGIS API Keys} for more information on ArcGIS Authentication.
 * @see {@link https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/basemaps/basemap-usage-styles/ | Basemap usage} for more information on the session usage models.
 * @see {@link https://mapbox-migration-preview.gha.afd.arcgis.com/maplibre-gl-js/maps/display-a-map-with-a-basemap-session/ | Display a map with a basemap session tutorial}
 *
 */
export class BasemapSession {
  private _session?: ArcgisRestBasemapStyleSession;
  private readonly _options: IBasemapSessionOptions;
  private readonly _emitter: Emitter<BasemapSessionEventMap> = mitt();
  private _parentToken: string;

  /**
   * Gets or sets whether the session should automatically request a new token after expiration.
   * @defaultValue false
   */
  autoRefresh: boolean;

  /**
   * Creates a new `BasemapSession` instance but does not start it. Use the {@linkcode BasemapSession.initialize} method to begin the session manually.
   *
   * @param options - Configuration options for the session
   *
   * @example
   * ```javascript
   * const basemapSession = new BasemapSession({
   *   token: 'your-arcgis-token',
   *   styleFamily: 'arcgis-navigation',
   *   duration: 3600,
   *   autoRefresh: false
   * });
   * await session.initialize();
   * ```
   *
   * @see {@link https://developers.arcgis.com/documentation/mapping-and-location-services/security-and-authentication/api-keys/ | ArcGIS API Keys } for more information on ArcGIS Authentication.
   */
  constructor(options: IBasemapSessionOptions) {
    if (!options?.token) throw new Error('An valid ArcGIS access token is required to start a session.');

    this._parentToken = options.token;
    this.autoRefresh = options.autoRefresh ? true : false;
    this._options = options;
  }

  /**
   * Gets the current session token.
   * @readonly
   */
  get token(): string {
    if (!this._session?.token) {
      throw new Error('Session token not available');
    }
    return this._session.token;
  }

  /**
   * Gets the sessions {@link StyleFamily} value.
   */
  get styleFamily(): StyleFamily | undefined {
    return this._session?.styleFamily;
  }

  /**
   * Gets the sessions expiration date.
   */
  get expires(): Date {
    if (!this._session) {
      throw new Error('Unable to get session expiration. Session not initialized.');
    }
    return this._session.expires;
  }

  /**
   * Gets the session start time.
   */
  get startTime(): Date {
    if (!this._session) throw new Error('Unable to fetch start time. Session not initialized.');
    return this._session.startTime;
  }

  /**
   * Returns 'true' if the session is started, and false otherwise.
   */
  get isStarted(): boolean {
    return Boolean(
      this._session
      && this._session.token !== undefined
      && this._session.expires
      && this._session.expires > new Date()
    );
  }

  /**
   * Starts the session.
   *
   * @example
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
  async initialize(): Promise<void> {
    if (this._session) {
      // Clean up existing session without disposing emitter
      this._session.off('expired', this.expiredHandler);
      this._session.off('refreshed', this.refreshedHandler);
      this._session.off('error', this.errorHandler);
      this._emitter.all.clear();
    }

    const sessionParams: IStartSessionParams = {
      authentication: ApiKeyManager.fromKey(this._parentToken),
      autoRefresh: this.autoRefresh,
      duration: this._options.duration,
      safetyMargin: this._options.safetyMargin,
      styleFamily: this._options.styleFamily,
      startSessionUrl: this._options.startSessionUrl,
    };

    if (sessionParams.autoRefresh) {
      console.warn('Auto-refresh is enabled. Your basemap session will automatically refresh once the \'duration\' elapses.');
    }

    this._session = await ArcgisRestBasemapStyleSession.start(sessionParams);
    this.setupEventListeners();
  }

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
  async refresh(): Promise<void> {
    if (!this._session) {
      throw new Error('Session not initialized');
    }
    try {
      this._session = await this._session.refreshCredentials();
    }
    catch (error) {
      this._emitter.emit('BasemapSessionError', error as Error);
    }
  }

  /**
   * @internal
   */
  private setupEventListeners(): void {
    if (!this._session) return;

    this._session.on('expired', this.expiredHandler);

    this._session.on('refreshed', this.refreshedHandler);

    this._session.on('error', this.errorHandler);
  }

  /**
   * @internal
   */
  private expiredHandler = (e: SessionResponse): void => {
    this._emitter.emit('BasemapSessionExpired', e);
  };

  /**
   * @internal
   */
  private refreshedHandler = (e: SessionRefreshedData): void => {
    this._emitter.emit('BasemapSessionRefreshed', e);
  };

  /**
   * @internal
   */
  private errorHandler = (e: Error): void => {
    this._emitter.emit('BasemapSessionError', e);
  };

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
  on<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this._emitter.on(eventName, handler);
  }

  /**
   * Unregister an event handler
   * @example
   * ```typescript
   * const basemapSession = await BasemapSession.start(options);
   * basemapSession.off('BasemapSessionExpired', handler);
   * ```
   */
  off<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this._emitter.off(eventName, handler);
  }

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
  static async start(options: IBasemapSessionOptions): Promise<BasemapSession> {
    const basemapSession = new BasemapSession(options);

    await basemapSession.initialize();
    return basemapSession;
  }
}

export default BasemapSession;
