"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

import { DevelopmentOpenStreetMapStyleProvider, almatyCenter, type GeoPoint } from "@tezhelp/maps";

interface AlmatyMapProps {
  readonly orderPoints?: ReadonlyArray<{
    readonly id: string;
    readonly point: GeoPoint;
  }>;
  readonly onOrderSelect?: (orderId: string) => void;
  readonly selectedPoint: GeoPoint | null;
  readonly onPointSelect: (point: GeoPoint) => void;
}

export function AlmatyMap({
  orderPoints = [],
  onOrderSelect,
  selectedPoint,
  onPointSelect,
}: AlmatyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const orderMarkersRef = useRef<ReadonlyArray<maplibregl.Marker>>([]);
  const onPointSelectRef = useRef(onPointSelect);

  onPointSelectRef.current = onPointSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [almatyCenter.longitude, almatyCenter.latitude],
      style: new DevelopmentOpenStreetMapStyleProvider().getStyle(),
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("click", (event) => {
      onPointSelectRef.current({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    });
    void map.once("load", () => {
      if (containerRef.current) {
        containerRef.current.dataset.mapReady = "true";
      }
    });
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      orderMarkersRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoint) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    markerRef.current ??= new maplibregl.Marker({ color: "#ff7a00" });
    markerRef.current.setLngLat([selectedPoint.longitude, selectedPoint.latitude]).addTo(map);
  }, [selectedPoint]);

  useEffect(() => {
    const map = mapRef.current;
    orderMarkersRef.current.forEach((marker) => marker.remove());
    orderMarkersRef.current = [];
    if (!map) {
      return;
    }

    orderMarkersRef.current = orderPoints.map(({ id, point }) => {
      const element = document.createElement("button");
      element.className = "provider-order-marker";
      element.type = "button";
      element.ariaLabel = id;
      element.textContent = "!";
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onOrderSelect?.(id);
      });
      return new maplibregl.Marker({ element })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);
    });
  }, [onOrderSelect, orderPoints]);

  return <div className="map-canvas" data-testid="almaty-map" ref={containerRef} />;
}
