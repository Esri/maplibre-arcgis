import {
  BasemapStyleSession as ArcgisRestBasemapStyleSession,
  type StyleFamily,
} from "@esri/arcgis-rest-basemap-session"
import { ApiKeyManager } from "@esri/arcgis-rest-request"

import { type RestJSAuthenticationManager } from "./Util"
import mitt, { type Emitter } from "mitt"

/**
 * Options for initializing a BasemapStyleSession
 */
interface IBasemapStyleSessionOptions {
  /** Authentication manager for handling auth requests */
  authentication: RestJSAuthenticationManager
  /** Optional token for authentication */
  token?: string
  /** Duration in seconds for the session */
  duration?: number
  /** Style family for the session */
  styleFamily?: StyleFamily
  autoRefresh?: boolean
  /** Safety margin in milliseconds to refresh the session before it expires */
  saftyMargin?: number
}

/** Custom error class for session-related errors */
export class BasemapStyleSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BasemapStyleSessionError"
  }
}

type SessionResponse = {
  token: string
  endTime: Date
  startTime: Date
  expires: Date
}

type SessionRefreshedData = {
  previous: SessionResponse
  current: SessionResponse
}

type BasemapSessionEventMap = {
  BasemapStyleSessionRefreshed: SessionRefreshedData
  BasemapStyleSessionExpired: SessionResponse
  BasemapStyleSessionError: Error
}

/**
 * Manages basemap style sessions with automatic refresh and event handling
 */
export class BasemapStyleSession {
  private _session?: ArcgisRestBasemapStyleSession
  private readonly options: IBasemapStyleSessionOptions
  private readonly emitter: Emitter<BasemapSessionEventMap> = mitt()

  constructor(options: IBasemapStyleSessionOptions) {
    this.options = options
    if (options.token) {
      this.options.authentication = ApiKeyManager.fromKey(options.token)
    }

    if (!this.options.authentication) {
      throw new BasemapStyleSessionError(
        "An authentication is required to start a session"
      )
    }
  }

  /**
   * Creates and starts a new BasemapStyleSession
   * @throws {BasemapStyleSessionError} If session creation fails
   */
  static async start(
    options: IBasemapStyleSessionOptions
  ): Promise<BasemapStyleSession> {
    try {
      const wrapper = new BasemapStyleSession(options)
      wrapper._session = await ArcgisRestBasemapStyleSession.start({
        ...options,
        startSessionUrl:
          "https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start",
      })
      wrapper.setupEventListeners()
      return wrapper
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new BasemapStyleSessionError(
        `Failed to start session: ${errorMessage}`
      )
    }
  }

  async refreshSession(): Promise<void> {
    // Ensure the session is initialized
    await this._session.refreshCredentials()
  }

  private setupEventListeners(): void {
    if (!this._session) return

    this._session.on("expired", (e) => {
      this.emitter.emit("BasemapStyleSessionExpired", e)
    })

    this._session.on("refreshed", (e) => {
      this.emitter.emit("BasemapStyleSessionRefreshed", e)
    })

    this._session.on("error", (error) => {
      this.emitter.emit("BasemapStyleSessionError", error)
    })
  }

  /**
   * Gets the current session token
   * @throws {BasemapStyleSessionError} If session is not initialized
   */
  get token(): string {
    if (!this._session || !this._session.token) {
      throw new BasemapStyleSessionError("Session not initialized")
    }
    return this._session.token
  }

  get styleFamily(): StyleFamily | undefined {
    return this._session?.styleFamily
  }

  set setSession(session: ArcgisRestBasemapStyleSession) {
    this._session = session
  }

  /**
   * Gets the session expiration date
   * @throws {BasemapStyleSessionError} If session is not initialized
   */
  get expires(): Date {
    if (!this._session) {
      throw new BasemapStyleSessionError("Session not initialized")
    }
    return this._session.expires
  }

  // /**
  //  * Gets the underlying ArcGIS REST session instance
  //  * @throws {BasemapStyleSessionError} If session is not initialized
  //  */
  // getArcgisRestSession(): ArcgisRestBasemapStyleSession {
  //   if (!this._session) {
  //     throw new BasemapStyleSessionError("Session not initialized")
  //   }
  //   return this._session
  // }

  /**
   * Registers an event handler
   */
  on<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this.emitter.on(eventName, handler)
  }

  /**
   * Unregisters an event handler
   */
  off<K extends keyof BasemapSessionEventMap>(
    eventName: K,
    handler: (data: BasemapSessionEventMap[K]) => void
  ): void {
    this.emitter.off(eventName, handler)
  }
}

export default BasemapStyleSession
