'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png", // آیکون پیش‌فرض leaflet (باید در public بذاری)
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  onSelect: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
}

function LocationMarker({ onSelect }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

export default function MapView({ onSelect, initialCenter }: Props) {
  return (
    <MapContainer
      center={[initialCenter?.lat || 35.6892, initialCenter?.lng || 51.3890]} // پیش‌فرض: تهران
      zoom={12}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onSelect={onSelect} />
    </MapContainer>
  );
}