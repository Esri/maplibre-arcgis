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

  endTime: Date;
  expires: Date;
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
 * Structure representing the object returned in the basemap session refreshed event.
 */
export type SessionRefreshedData = {
  previous: SessionResponse;
  current: SessionResponse;
};

/**
 * Type representing the different events emitted by the BasemapSession class.
 */
export type BasemapSessionEventMap = {
  BasemapSessionRefreshed: SessionRefreshedData;
  BasemapSessionExpired: SessionResponse;
  BasemapSessionError: Error;
};

/**
 * Class representing a session for ArcGIS Basemap Styles.
 * This class manages the lifecycle of a basemap style session, including authentication and auto-refresh functionality.
 * It provides methods to start, refresh, and handle events related to the session.
 * The session can be used to apply basemap styles to MapLibre maps.
 *
 * Go to [Basemap Session](https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/basemaps/introduction-basemap-styles-service/) for more information.
 */
export class BasemapSession {
  private _session?: ArcgisRestBasemapStyleSession;
  private readonly _options: IBasemapSessionOptions;
  private readonly _emitter: Emitter<BasemapSessionEventMap> = mitt();
  private _parentToken: string;

  /**
   * Gets or sets whether the session should automatically request a new token when the session expires.
   */
  autoRefresh: boolean;

  /**
   * Creates a new BasemapSession instance for managing basemap sessions.
   *
   * @param options - Configuration options for the basemap session
   *
   * @remarks
   * Creates a session instance but does not start it. Use the {@link initialize}
   * method or the static {@link BasemapSession.start} method to begin the session.
   *
   * The token must be from an ArcGIS Location Platform account with the Basemaps privilege.
   * For more information, see the ArcGIS Location Platform documentation.
   *
   * @example
   * ```typescript
   * // Create and initialize a session manually
   * const session = new BasemapSession({
   *   token: 'your-arcgis-token',
   *   styleFamily: 'arcgis-navigation',
   *   duration: 3600,
   *   autoRefresh: false
   * });
   * await session.initialize();
   *
   * // Or use the static start method (recommended)
   * const session = await BasemapSession.start({
   *   token: 'your-arcgis-token',
   *   styleFamily: 'arcgis-streets',
   *   autoRefresh: true
   * });
   * ```
   *
   * @see {@link BasemapSession.start} for a convenient way to create and initialize in one step
   * @see {@link https://developers.arcgis.com/documentation/mapping-and-location-services/security-and-authentication/api-keys/ | ArcGIS API Keys}
   */
  constructor(options: IBasemapSessionOptions) {
    if (!options?.token) throw new Error('An valid ArcGIS access token is required to start a session.');

    this._parentToken = options.token;
    this.autoRefresh = options.autoRefresh ? true : false;
    this._options = options;
  }

  /**
   * Gets the current session token
   */
  get token(): string {
    if (!this._session?.token) {
      throw new Error('Session token not available');
    }
    return this._session.token;
  }

  /**
   * Gets the current session token
   */
  get styleFamily(): StyleFamily | undefined {
    return this._session?.styleFamily;
  }

  /**
   * Gets the session expiration date
   */
  get expires(): Date {
    if (!this._session) {
      throw new Error('Unable to get session expiration. Session not initialized.');
    }
    return this._session.expires;
  }

  /**
   * Gets the session start time.
   * @throws If session is not initialized.
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
   * Starts a new BasemapStyleSession
   * @throws If session creation fails
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
    };

    if (sessionParams.autoRefresh) {
      console.warn('Auto-refresh is enabled. Your basemap session will automatically refresh once the \'duration\' elapses.');
    }

    this._session = await ArcgisRestBasemapStyleSession.start(sessionParams);
    this.setupEventListeners();
  }

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

  private setupEventListeners(): void {
    if (!this._session) return;

    this._session.on('expired', this.expiredHandler);

    this._session.on('refreshed', this.refreshedHandler);

    this._session.on('error', this.errorHandler);
  }

  private expiredHandler = (e: SessionResponse): void => {
    this._emitter.emit('BasemapSessionExpired', e);
  };

  private refreshedHandler = (e: SessionRefreshedData): void => {
    this._emitter.emit('BasemapSessionRefreshed', e);
  };

  private errorHandler = (e: Error): void => {
    this._emitter.emit('BasemapSessionError', e);
  };

  /**
   * Registers an event handler
   */
  on<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this._emitter.on(eventName, handler);
  }

  /**
   * Unregisters an event handler
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
   * @returns - a BasemapSession object.
   */
  static async start(options: IBasemapSessionOptions): Promise<BasemapSession> {
    const basemapSession = new BasemapSession(options);

    await basemapSession.initialize();

    return basemapSession;
  }
}

export default BasemapSession;
