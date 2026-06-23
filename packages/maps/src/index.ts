import type { MapOptions, StyleSpecification } from "maplibre-gl";

export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export type MapLibreFoundationOptions = Pick<MapOptions, "center" | "container" | "style" | "zoom">;

export type MapStyleDocument = StyleSpecification;

export interface MapStyleProvider {
  getStyle(): MapStyleDocument | string;
}

export interface GeocodingProvider {
  reverse(point: GeoPoint): Promise<string | null>;
}

export interface RoutingProvider {
  route(from: GeoPoint, to: GeoPoint): Promise<ReadonlyArray<GeoPoint>>;
}

export interface RouteRequest {
  readonly from: GeoPoint;
  readonly to: GeoPoint;
}

export interface RouteResult {
  readonly geometry: ReadonlyArray<GeoPoint>;
  readonly distanceMeters?: number;
  readonly durationSeconds?: number;
}

export interface RouteProvider {
  buildRoute(request: RouteRequest): Promise<RouteResult | null>;
}

export interface LiveLocationRealtimeGateway {
  publishProviderLocation(input: {
    readonly orderId: string;
    readonly providerUserId: string;
    readonly point: GeoPoint;
    readonly sequence: number;
    readonly recordedAt: string;
    readonly stale: boolean;
  }): Promise<void>;
}

export const almatyCenter: GeoPoint = {
  latitude: 43.238949,
  longitude: 76.889709,
};

export class DevelopmentOpenStreetMapStyleProvider implements MapStyleProvider {
  getStyle(): MapStyleDocument {
    return {
      version: 8,
      sources: {
        almatyFallback: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              lineFeature([
                [76.82, 43.242],
                [76.98, 43.235],
              ]),
              lineFeature([
                [76.83, 43.207],
                [76.99, 43.201],
              ]),
              lineFeature([
                [76.82, 43.266],
                [76.98, 43.26],
              ]),
              lineFeature([
                [76.95, 43.3],
                [76.95, 43.17],
              ]),
              lineFeature([
                [76.93, 43.29],
                [76.93, 43.19],
              ]),
            ],
          },
        },
        openStreetMap: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "app-background",
          type: "background",
          paint: {
            "background-color": "#dfe8ee",
          },
        },
        {
          id: "open-street-map",
          type: "raster",
          source: "openStreetMap",
        },
        {
          id: "almaty-road-fallback-casing",
          type: "line",
          source: "almatyFallback",
          paint: {
            "line-color": "#ffffff",
            "line-opacity": 0.9,
            "line-width": 7,
          },
        },
        {
          id: "almaty-road-fallback",
          type: "line",
          source: "almatyFallback",
          paint: {
            "line-color": "#a7b6c5",
            "line-opacity": 0.75,
            "line-width": 3,
          },
        },
      ],
    };
  }
}

function lineFeature(coordinates: ReadonlyArray<readonly [number, number]>) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
  };
}
