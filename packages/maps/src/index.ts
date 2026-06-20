import type { MapOptions, StyleSpecification } from "maplibre-gl";

export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export type MapLibreFoundationOptions = Pick<MapOptions, "center" | "container" | "style" | "zoom">;

export type MapStyleDocument = StyleSpecification;

export interface MapStyleProvider {
  getStyleUrl(): string;
}

export interface GeocodingProvider {
  reverse(point: GeoPoint): Promise<string | null>;
}

export interface RoutingProvider {
  route(from: GeoPoint, to: GeoPoint): Promise<ReadonlyArray<GeoPoint>>;
}

export const almatyCenter: GeoPoint = {
  latitude: 43.238949,
  longitude: 76.889709,
};
