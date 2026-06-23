import { describe, expect, it } from "vitest";

import { DevelopmentOpenStreetMapStyleProvider, almatyCenter } from "./index.js";

describe("map foundation", () => {
  it("keeps the initial viewport centered on Almaty", () => {
    expect(almatyCenter).toEqual({
      latitude: 43.238949,
      longitude: 76.889709,
    });
  });

  it("marks the public OSM raster style as a development adapter", () => {
    const style = new DevelopmentOpenStreetMapStyleProvider().getStyle();

    expect(typeof style).toBe("object");
    expect(typeof style === "object" && style.sources).toHaveProperty("openStreetMap");
    expect(typeof style === "object" && style.sources).toHaveProperty("almatyFallback");
  });
});
