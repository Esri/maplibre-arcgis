import type {
  IControl,
  Map,
  AttributionControl as MaplibreAttributionControl,
  VectorTileSource,
} from "maplibre-gl"
import { ApiKeyManager, request } from "@esri/arcgis-rest-request"
import { AttributionControl } from "./AttributionControl"
import type { RestJSAuthenticationManager } from "./Util"
import type { BasemapStyleSession } from "./BasemapStyleSession"

type BasemapSelfResponse = {
  customStylesUrl: string
  selfUrl: string
  languages: [CodeNamePair]
  worldviews: [CodeNamePair]
  places: [CodeNamePair]
  styleFamilies: [CodeNamePair]
  styles: [BasemapStyleObject]
}

type CodeNamePair = {
  code: string
  name: string
}
type PlacesOptions = "all" | "attributed" | "none"
type StyleFamily = "arcgis" | "open" | "osm"
type StyleEnum = `${StyleFamily}/${string}`

type IBasemapStyleOptions = {
  token: string
  authentication: RestJSAuthenticationManager
  language?: string
  worldview?: string
  places?: PlacesOptions
  session?: BasemapStyleSession
  //transformStyle?:TransformStyleFunction;
}


export class BasemapStyle {
  // Type declarations
  style: string
  token: string
  authentication: RestJSAuthenticationManager

  preferences: BasemapPreferences

  options: IBasemapStyleOptions
  private _session?: BasemapStyleSession

  _map?: Map

  /**
   *
   * @param style - The basemap style enumeration
   * @param options - Additional options, including access token and style preferences
   */
  constructor(style: string, options: IBasemapStyleOptions) {
    // move this auth logic to a separate function
    // Access token validation
    if (options.authentication) {
      this.authentication = options.authentication
    } else if (options.token) {
      this.authentication = ApiKeyManager.fromKey(options.token)
    } else if (options.session) {
      // if it's an api keys
      // new basemapStyleSession()
      //this.setSession(options.session)
      // void this.setSession(options.session)
      this._session = options.session
    } else {
      throw new Error(
        "A valid token is required to access basemap styles. To get one, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/."
      )
    }
  }

  _updateAttribution(): void {
    if (!this._map) return

    // Remove existing attribution controls
    if (this._map._controls.length > 0) {
      const controlIsAttribution = (control: IControl) => {
        return (
          (control as MaplibreAttributionControl).options?.customAttribution !==
          undefined
        )
      }
      this._map._controls.forEach((control) => {
        if (controlIsAttribution(control)) {
          this._map?.removeControl(control)
        }
      })
    }
    // Add Esri attribution
    this._map.addControl(new AttributionControl())
  }

  async setSession(session: BasemapStyleSession): Promise<void> {
    if (!this._session.isStarted) {
      await this._session.start()
      this.authentication = ApiKeyManager.fromKey(this._session.token)
      //this.token = session.token
      this._session.on("BasemapStyleSessionRefreshed", (sessionData) => {
        console.debug("Style refresh...")
        const oldToken = sessionData.previous.token
        const newToken = sessionData.current.token
        this.authentication = ApiKeyManager.fromKey(newToken) // update the authentication manager with the new token
        this._updateTiles(oldToken, newToken)
      })
    }
  }

  setStyle(style: string): BasemapStyle {
    this.style = style // arcgis/outdoor
    if (
      !(
        this.style.startsWith("arcgis/") ||
        this.style.startsWith("open/") ||
        this.style.startsWith("osm/")
      ) &&
      this.style.length === 32
    ) {
      // Style is an ItemId
      this._baseUrl = `${BasemapStyle._baseUrl}/items/${this.style}`
      this._isItemId = true
    } else {
      // Style is a StyleEnum
      this._baseUrl = `${BasemapStyle._baseUrl}/${this.style}`
      this._isItemId = false
    }

    if (this._map) this._map.setStyle(this.styleUrl)

    return this
  }
