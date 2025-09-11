//@ts-nocheck
import {expect, describe} from 'vitest';
import { customTest as test } from './BaseTest';

describe('Browser tests with WebGL', () => {

  describe('BasemapStyle browser tests', () => {

    test('Map \'load\' event fires after style \'load\' event.', () => {});
  })
});


describe('Works on a real page', () => {
  test('puppeteer test', async ({setupPage}) => {
    // setup a specific page from the test/mock/pages folder
    const page = await setupPage("basemap-style.html");
    // wait for the map and basemap to be set on the window
    await page.waitForFunction(() => window.map && window.basemapStyle);
    // wait for the map load event to fire and evaluate the style object
    const { style } = await page.evaluate(async() => {
      return await new Promise(resolve => {
        window.map.once("load", ()=> {
          resolve({
            style: window.map.getStyle()
          })
        });
      });
    });

    // wait for the map render event to fire or tiles to fully load whichever comes first
    // this appears to vary depending on the style and how many tiles need to be loaded
    await page.waitForFunction(async() => {
      return await new Promise(resolve =>  {
        if (window.map.areTilesLoaded()){
          return resolve(true)
        };
        window.map.once("render", resolve)
      });
    });

    // we can also take screeshots if we want
    // await page.screenshot({
    //   path: 'hn.png',
    //   fullPage: true
    // });

    expect(style.sources.esri.url).toBe("https://basemaps-api.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer");

    await page.close();
  }, 20000);

  });
