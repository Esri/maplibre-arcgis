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

type BasemapStyleObject = {
  complete: boolean
  deprecated?: boolean
  name: string
  path: StyleEnum
  provider: string
  styleFamily: string
  styleUrl: string
  selfUrl: string
  thumbnailUrl: string
  detailUrl?: string
  labelsUrl?: string
  rootUrl?: string
  baseUrl?: string
}

type IBasemapStyleOptions = {
  token: string
  authentication: RestJSAuthenticationManager
  language?: string
  worldview?: string
  places?: PlacesOptions
  session?: BasemapStyleSession
  //transformStyle?:TransformStyleFunction;
}

type BasemapPreferences = {
  places?: PlacesOptions
  worldview?: string
  language?: string
}

export class BasemapStyle {
  // Type declarations
  style: string
  token: string
  authentication: RestJSAuthenticationManager

  preferences: BasemapPreferences

  options: IBasemapStyleOptions
  private _session?: BasemapStyleSession
  _isItemId: boolean
  //_transformStyleFn?:TransformStyleFunction;
  _map?: Map
  _baseUrl: string
  static _baseUrl: string =
    "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles"

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

    // Configure style and base URL
    this.setStyle(style)

    // Language param
    this.setPreferences({
      language: options?.language,
      worldview: options?.worldview,
      places: options?.places,
    })
  }

  get styleUrl(): string {
    let styleUrl = this._baseUrl
    styleUrl += `?token=${this.authentication.token}`

    if (this.preferences.language) {
      styleUrl += `&language=${this.preferences.language}`
    }
    if (this.preferences.worldview) {
      styleUrl += `&worldview=${this.preferences.worldview}`
    }
    if (this.preferences.places) {
      styleUrl += `&places=${this.preferences.places}`
    }

    return styleUrl
  }

  async applyStyleTo(map: Map, updateAttribution: boolean): Promise<void> {
    this._map = map
    // if this.session isn't started
    if (this._session && !this._session.isStarted) {
      await this.setSession(this._session)
    }

    map.setStyle(this.styleUrl)

    if (updateAttribution) {
      this._updateAttribution()
    }

    // return this // we don't need to return anything
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

  private _updateTiles(fromToken: string, toToken: string): void {
    console.log("Updating map tiles with new token...")

    // replace token in the styles tiles with the new session token
    for (const s of Object.keys(this._map.style.sourceCaches)) {
      const source: VectorTileSource = this._map.getSource(s)
      // skip if we can't find the source or the source doesn't have tiles
      if (!source || !source.tiles) {
        return
      }

      // Skip if the source doesn't have tiles that include the old token
      if (!source.tiles.some((tileUrl) => tileUrl.includes(fromToken))) {
        return
      }

      const newTiles = source.tiles.map((tile) => {
        return tile.includes(fromToken)
          ? tile.replace(fromToken, toToken)
          : tile
      })

      source.setTiles(newTiles)
    }

    // replace the token in the glyph url, ensuring fonts continue loading
    const glyphs = this._map.getGlyphs()
    if (glyphs.includes(fromToken)) {
      this._map.setGlyphs(glyphs.replace(fromToken, toToken))
    }

    const sprites = this._map.getSprite()
    for (const sprite of sprites) {
      if (sprite.url.includes(fromToken)) {
        this._map.setSprite(sprite.url.replace(fromToken, toToken))
      }
    }
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

  setPreferences(preferences: BasemapPreferences): BasemapStyle {
    if (!this.preferences) this.preferences = {}

    if (preferences.language) {
      if (this._isItemId)
        console.warn(
          "The 'language' option of basemap styles is not supported with custom basemaps. This parameter will be ignored."
        )
      else this.preferences.language = preferences.language
    }
    if (preferences.places) {
      if (this._isItemId)
        console.warn(
          "The 'places' option of basemap styles is not supported with custom basemaps. This parameter will be ignored."
        )
      else this.preferences.places = preferences.places
    }
    if (preferences.worldview) {
      if (this._isItemId)
        console.warn(
          "The 'worldview' option of basemap styles is not supported with custom basemaps. This parameter will be ignored."
        )
      else this.preferences.worldview = preferences.worldview
    }

    if (this._map) this._map.setStyle(this.styleUrl)

    return this
  }

  /**
   * Makes a \'/self\' request to the basemap styles service endpoint
   * @param accessToken - An ArcGIS access token
   */
  static async getSelf(options: {
    accessToken?: string
  }): Promise<BasemapSelfResponse> {
    return (await request(`${BasemapStyle._baseUrl}/self`, {
      authentication: options?.accessToken,
      httpMethod: "GET",
    })) as BasemapSelfResponse
  }
  /**
   * Static method that returns a basemap style URL. Does not add a basemap style to the map.
   * @param style - The basemap style enumeration being requested
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The URL of the specified ArcGIS basemap style with all included parameters
   */
  static url(style: string, options: IBasemapStyleOptions): string {
    return new BasemapStyle(style, options).styleUrl
  }
}

export default BasemapStyle
