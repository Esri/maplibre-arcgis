import type { Map, VectorTileSource } from "maplibre-gl"
import { request } from "@esri/arcgis-rest-request"
import type { RestJSAuthenticationManager } from "./Util"

type SessionResponse = {
  sessionToken: string
  endTime: number
  startTime: number
  styleFamily: string
}

type StyleFamily = "arcgis" | "open" | "osm"

type ServiceType = "static" | "style"

type BasemapSessionOptions = {
  serviceType: ServiceType
  token: RestJSAuthenticationManager
  duration: number // mayber a range type? 0 -> 43200
  autoRefresh: boolean
  autoStart: boolean
}

export class BasemapSession {
  serviceType?: ServiceType
  serviceFamily?: StyleFamily
  token: string
  authentication: RestJSAuthenticationManager
  options: BasemapSessionOptions
  sessionToken: string
  session: SessionResponse

  private styleStartURL: string = "https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start"
  private staticStartURL: string = ""

  constructor(family: StyleFamily, options: BasemapSessionOptions) {
    this.options = options
    this.authentication = options.token
    this.serviceFamily = family
    this.session = null
    // creates new session
    // constructor starts a new session or should it be called?
    console.log("BasemapStyleSession constructor")
    if (this.options.autoStart) {
      this.startSession().then(
        (response) => {
          this.session = response
          console.log("BasemapSession constructor")
        },
        (err) => {
          throw err
        }
      )
    }
  }

  async startSession(): Promise<SessionResponse> {
    const resp = (await request(`${this.styleStartURL}`, {
      params: {
        styleFamily: this.serviceFamily,
        durationSeconds: this.options.duration,
      },
      authentication: this.authentication,
      httpMethod: "GET",
    })) as SessionResponse

    return resp
  }

  /**
   * Updates tiles for session-based billing instead of resetting the entire style
   */
  applySessionToken(map: Map, oldToken: string, newToken: string): void {
    // Implement session-specific tile update logic
    // This would update individual tile sources instead of resetting the entire style
    console.log("Updating tiles for session-based billing")
    console.log("Updating map tiles with new token...")

    // replace token in the styles tiles with the new session token
    for (const s of Object.keys(map.style.sourceCaches)) {
      // check for esri sources
      console.log(`\t Checking source ${s}...`)
      const source = map.getSource(s)
      // skip if we can't find the source or the source doesn't have tiles
      if (!source || !("tiles" in source) || !(source as VectorTileSource).tiles) {
        console.log(`\t Skipping ${s}...`)
        continue
      }

      // Skip if the source doesn't have tiles that include the old token
      if (!(source as VectorTileSource).tiles.some((tileUrl: string) => tileUrl.includes(oldToken))) {
        console.log(`\t Old token not found in tiles, skipping.`)
        continue
      }

      const newTiles = (source as VectorTileSource).tiles.map((tile: string) => {
        console.log(`\t Replacing token in ${tile}...`)
        return tile.includes(oldToken) ? tile.replace(oldToken, newToken) : tile
      })

      console.log("\t Updating tiles...")
      ;(source as VectorTileSource).setTiles(newTiles)
    }

    // replace the token in the glyph url, ensuring fonts continue loading
    const glyphs = map.getGlyphs()
    if (glyphs && glyphs.includes(oldToken)) {
      console.log("\t Replacing glyph tokens...")
      map.setGlyphs(glyphs.replace(oldToken, newToken))
    }

    const sprites = map.getSprite()
    if (sprites) {
      for (const sprite of sprites) {
        if (sprite.url && sprite.url.includes(oldToken)) {
          map.setSprite(sprite.url.replace(oldToken, newToken))
        }
      }
    }
    console.log("Map tile update complete")
  }
}

export default BasemapSession
