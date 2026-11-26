'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { IRAN_CITIES } from '@/lib/iranCities';

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  province?: string;
}

interface Props {
  initial: UserLocation;
  onConfirm: (location: UserLocation) => void;
}

// آیکن سفارشی
const customDivIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="16" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
    </svg>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function LocationPicker({ initial, onConfirm }: Props) {
  // اگر شهر قبلاً انتخاب/ذخیره شده (حالت ویرایش)، همون از قبل توی select انتخاب باشه؛
  // در غیر این صورت (هنوز هیچ آدرسی انتخاب نشده) دیفالت روی «قم» باشه.
  const initialCity =
    initial.city && IRAN_CITIES.some((c) => c.name === initial.city) ? initial.city : 'قم';

  const [position, setPosition] = useState<[number, number]>([initial.lat, initial.lng]);
  const [addressData, setAddressData] = useState<UserLocation>(initial);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  // فقط وقتی true بشه که کاربر خودش از select شهر رو عوض کرده باشه؛
  // با این کار موقع ویرایش یک آدرس قبلی، نقشه از روی نقطه‌ی دقیق ذخیره‌شده
  // به مرکز شهر "نمی‌پره" (چون آن پرش فقط باید نتیجه‌ی یک انتخاب دستی باشد).
  const [manualCitySelect, setManualCitySelect] = useState(false);

  const fetchAddressFromCoords = async (lat: number, lng: number, city?: string, province?: string) => {
    setLoadingAddr(true);

    // تایم‌اوت ۵ ثانیه‌ای: اگر Nominatim جواب نداد یا توسط اکستنشن مرورگر
    // بلاک شد، به‌جای هنگ‌کردن یا نمایش خطای رانتایم، fallback ساکت می‌زنیم.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=fa`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error('reverse geocoding failed');

      const data = await res.json();
      const resolvedProvince = data.address?.state || province || '';
      const resolvedCity = data.address?.city || data.address?.town || data.address?.village || city || '';
      const address = data.display_name || '';

      setAddressData({ lat, lng, province: resolvedProvince, city: resolvedCity, address });
    } catch {
      // شبکه/سرویس خارجی در دسترس نبود؛ حداقل شهر انتخاب‌شده و مختصات را نگه می‌داریم
      // تا کاربر همچنان بتواند آدرس را تأیید کند.
      setAddressData((prev) => ({
        lat,
        lng,
        province: province || prev.province || '',
        city: city || prev.city || '',
        address: prev.address && prev.lat === lat && prev.lng === lng ? prev.address : '',
      }));
    } finally {
      clearTimeout(timeout);
      setLoadingAddr(false);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setPosition([lat, lng]);
        fetchAddressFromCoords(lat, lng, addressData.city, addressData.province);
      },
    });
    return position ? <Marker position={position} icon={customDivIcon} /> : null;
  }

  // بعد از انتخاب شهر، نقشه را به مرکز همان شهر می‌بریم تا کاربر
  // فقط با یک کلیک آدرس دقیق خودش را روی نقشه مشخص کند.
  function FlyToCity({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
  }

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setManualCitySelect(true);
    const city = IRAN_CITIES.find((c) => c.name === cityName);
    if (!city) return;

    setPosition([city.lat, city.lng]);
    setAddressData({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      province: city.province,
      address: '',
    });
  };

  const handleConfirm = () => {
    if (!position) return;
    onConfirm(addressData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-4 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-center">انتخاب موقعیت شما</h2>

        <div>
          <label className="block text-sm text-gray-700 mb-1">شهر خود را انتخاب کنید</label>
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">-- انتخاب شهر --</option>
            {IRAN_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.province})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {manualCitySelect && selectedCity && (
              <FlyToCity
                lat={IRAN_CITIES.find((c) => c.name === selectedCity)!.lat}
                lng={IRAN_CITIES.find((c) => c.name === selectedCity)!.lng}
              />
            )}
            <LocationMarker />
          </MapContainer>
        </div>

        <p className="text-xs text-gray-500 text-center">
          بعد از انتخاب شهر، روی نقطه‌ی دقیق آدرس خودتان روی نقشه کلیک کنید.
        </p>

        <p className="text-sm text-gray-600 text-center">
          {loadingAddr
            ? 'در حال دریافت آدرس...'
            : addressData?.address
            ? `📍 ${addressData.address}`
            : addressData.city
            ? `📍 ${addressData.city}${addressData.province ? ' - ' + addressData.province : ''} (برای آدرس دقیق روی نقشه کلیک کنید)`
            : `Lat: ${position[0].toFixed(5)}, Lng: ${position[1].toFixed(5)}`}
        </p>

        <button
          onClick={handleConfirm}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          تایید موقعیت
        </button>
      </div>
    </div>
  );
}
