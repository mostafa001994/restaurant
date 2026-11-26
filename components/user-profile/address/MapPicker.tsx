// MapPicker.tsx
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';

type MapPickerProps = {
  onSelect: (
    lat: number,
    lng: number,
    addressData?: { province?: string; city?: string; address?: string }
  ) => void;
  initialPosition?: [number, number];
};

// آیکن سفارشی SVG با رنگ آبی
const customDivIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="16" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
    </svg>
  `,
  className: '', // حذف کلاس پیش‌فرض Leaflet
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function MapPicker({ onSelect, initialPosition }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition ?? null
  );

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=fa`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error('reverse geocoding failed');

      const data = await res.json();
      const province = data.address?.state || '';
      const city = data.address?.city || data.address?.town || data.address?.village || '';
      const address = data.display_name || '';
      onSelect(lat, lng, { province, city, address });
    } catch {
      // سرویس خارجی در دسترس نبود؛ حداقل مختصات را برمی‌گردانیم تا کاربر گیر نکند
      onSelect(lat, lng);
    } finally {
      clearTimeout(timeout);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        fetchAddressFromCoords(e.latlng.lat, e.latlng.lng);
      },
    });
    return position ? <Marker position={position} icon={customDivIcon} /> : null;
  }

  function SearchField() {
    const map = useMap();

    useEffect(() => {
      const provider = new OpenStreetMapProvider();

      const searchControl = GeoSearchControl({
        provider,
        style: 'bar',
        showMarker: true,
        showPopup: false,
        marker: {
          icon: customDivIcon,
          draggable: false,
        },
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'جستجوی مکان...',
        keepResult: true,
      }) as L.Control;

      map.addControl(searchControl);

      const container = (searchControl as any).getContainer?.();
      if (container) {
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
      }

      map.on('geosearch/showlocation', (result: any) => {
        const { x: lng, y: lat } = result.location;
        setPosition([lat, lng]);
        fetchAddressFromCoords(lat, lng);
        const input = document.querySelector<HTMLInputElement>(
          '.leaflet-control-geosearch form input'
        );
        input?.blur();
      });

      return () => {
        map.removeControl(searchControl);
      };
    }, [map]);

    return null;
  }

  return (
    <MapContainer
      center={initialPosition ?? [35.6892, 51.3890]}
      zoom={13}
      style={{ height: '300px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <SearchField />
      <LocationMarker />
    </MapContainer>
  );
}