import {
  BasemapStyleSession as ArcgisRestBasemapStyleSession,
  type StyleFamily,
} from './arcgis-rest-basemap-session'; // TODO update this to the remote package
import { ApiKeyManager } from '@esri/arcgis-rest-request';

import { type RestJSAuthenticationManager } from './Util';
import mitt, { type Emitter } from 'mitt';

/**
 * Options for initializing a BasemapStyleSession
 */
interface IBasemapStyleSessionOptions {
  /** Authentication manager for handling auth requests */
  // authentication?: RestJSAuthenticationManager
  /** Optional token for authentication */
  token?: string;
  /** Duration in seconds for the session */
  duration?: number;
  /** Style family for the session */
  styleFamily: StyleFamily;
  autoRefresh?: boolean;
  /** Safety margin in seconds to refresh the session before it expires */
  safetyMargin?: number;
}

type SessionResponse = {
  token: string;
  endTime: Date;
  startTime: Date;
  expires: Date;
};

type SessionRefreshedData = {
  previous: SessionResponse;
  current: SessionResponse;
};

type BasemapSessionEventMap = {
  BasemapStyleSessionRefreshed: SessionRefreshedData;
  BasemapStyleSessionExpired: SessionResponse;
  BasemapStyleSessionError: Error;
};

/**
 * Manages basemap style sessions with automatic refresh and event handling
 */
export class BasemapStyleSession {
  private _session?: ArcgisRestBasemapStyleSession;
  private readonly options: IBasemapStyleSessionOptions;
  private readonly emitter: Emitter<BasemapSessionEventMap> = mitt();
  private _auth: RestJSAuthenticationManager;

  constructor(options: IBasemapStyleSessionOptions) {
    this.options = { ...options };

    this._auth = ApiKeyManager.fromKey(this.options.token);

    if (!this._auth) {
      throw new Error('An valid authentication token is required to start a session');
    }
  }

  get authentication(): RestJSAuthenticationManager {
    return this._auth;
  }

  /**
   * Gets the current session token
   * @throws If session is not initialized
   */
  get token(): string {
    if (!this._session?.token) {
      throw new Error('Session token not available');
    }
    return this._session.token;
  }

  get styleFamily(): StyleFamily | undefined {
    return this._session?.styleFamily;
  }

  /**
   * Gets the session expiration date
   * @throws If session is not initialized
   */
  get expires(): Date {
    if (!this._session) {
      throw new Error('Unable to get session expiration. Session not initialized.');
    }
    return this._session.expires;
  }

  get isStarted(): boolean {
    return Boolean(
      this._session
      && this._session.token !== undefined
      && this._session.expires
      && this._session.expires > new Date()
    );
  }

  /**
   * Creates and starts a new BasemapStyleSession
   * @throws If session creation fails
   */
  async start(): Promise<void> {
    if (this._session) {
      // Clean up existing session without disposing emitter
      this._session.off('expired', this.expiredHandler);
      this._session.off('refreshed', this.refreshedHandler);
      this._session.off('error', this.errorHandler);
      this.emitter.all.clear();
    }
    this._session = await ArcgisRestBasemapStyleSession.start({
      ...this.options,
      authentication: this._auth,
    });
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
      this.emitter.emit('BasemapStyleSessionError', error as Error);
    }
  }

  private setupEventListeners(): void {
    if (!this._session) return;

    this._session.on('expired', this.expiredHandler);

    this._session.on('refreshed', this.refreshedHandler);

    this._session.on('error', this.errorHandler);
  }

  private expiredHandler = (e: SessionResponse): void => {
    console.log(`Session expired ${e.token}`);
    this.emitter.emit('BasemapStyleSessionExpired', e);
  };

  private refreshedHandler = (e: SessionRefreshedData): void => {
    console.log('Session event handler refreshed');
    this.emitter.emit('BasemapStyleSessionRefreshed', e);
  };

  private errorHandler = (e: Error): void => {
    console.log('Session event handler error');
    this.emitter.emit('BasemapStyleSessionError', e);
  };

  dispose(): void {
    if (this._session) {
      this._session.off('expired', this.expiredHandler);
      this._session.off('refreshed', this.refreshedHandler);
      this._session.off('error', this.errorHandler);
    }
    this.emitter.all.clear();
    this._session = undefined;
  }

  /**
   * Registers an event handler
   */
  on<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this.emitter.on(eventName, handler);
  }

  /**
   * Unregisters an event handler
   */
  off<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this.emitter.off(eventName, handler);
  }
}

export default BasemapStyleSession;
