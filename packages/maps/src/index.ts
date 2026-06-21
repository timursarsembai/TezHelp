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
