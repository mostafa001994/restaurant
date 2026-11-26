'use client';

import { useState, useEffect } from 'react';
import LocationPicker, { UserLocation } from '@/components/location/LocationPicker';
import { Restaurant, Branch } from '@/types/models';
import { loadRestaurants } from '@/lib/useAdminData';
import Link from 'next/link';
import RestaurantCard from '@/components/ui/ResturantCard';


// تابع محاسبه فاصله بین دو مختصات (کیلومتر)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // شعاع زمین
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomePage() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  // بارگذاری از localStorage
  useEffect(() => {
    const saved = localStorage.getItem('location');
    if (saved) setLocation(JSON.parse(saved));
  }, []);

  // ذخیره و فیلتر رستوران‌ها
  useEffect(() => {
    if (!location) return;
    localStorage.setItem('location', JSON.stringify(location));
    setLoading(true);

    loadRestaurants().then((all) => {
      let filtered: Restaurant[] = [];

      // اگر شعبه‌ها مختصات دارند → فیلتر بر اساس فاصله
      filtered = all.filter((r) =>
        r.branches?.some(
          (b: Branch) =>
            b.latitude &&
            b.longitude &&
            haversine(location.lat, location.lng, b.latitude, b.longitude) < 1// شعاع ۱۰ کیلومتر
        )
      );

      // اگر هیچ شعبه‌ای نزدیک نبود → fallback به فیلتر متنی
      if (filtered.length === 0) {
        const keywords: string[] = [
          location.city || '',
          location.province || '',
          location.address || ''
        ]
          .filter(Boolean)
          .map((s) => s.toLowerCase());

        filtered = all.filter(
          (r) =>
            keywords.some(
              (k) =>
                r.city?.toLowerCase().includes(k) ||
                r.address?.toLowerCase().includes(k) ||
                r.name?.toLowerCase().includes(k)
            )
        );
      }

      setRestaurants(filtered);
      setLoading(false);
    });
  }, [location]);

  if (!location) {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('location') : null;
    const initial: UserLocation = saved
      ? JSON.parse(saved)
      : { lat: 34.6401, lng: 50.8764, city: 'قم', province: 'قم', address: '' };

    return <LocationPicker initial={initial} onConfirm={setLocation} />;
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">
          رستوران‌های اطراف "{location.city || location.province || location.address}"
        </h1>
        <button
          onClick={() => setLocation(null)}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          تغییر موقعیت
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse border p-4 rounded bg-gray-100 h-24"
            />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center text-red-500">
          <p>هیچ رستورانی در این منطقه یافت نشد.</p>
          <button
            onClick={() => setLocation(null)}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
          >
            انتخاب موقعیت دیگر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <Link key={r.id} href={`/restaurant/${r.id}`}>
              <RestaurantCard restaurant={r} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}