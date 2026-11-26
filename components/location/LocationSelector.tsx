'use client';

import { useState } from 'react';

interface Props {
  onSelect: (location: string) => void;
}

export default function LocationSelector({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const locations = [
    'تهران',
    'ونک',
    'پاسداران',
    'اکباتان',
    'اصفهان',
    'شیراز',
    'قم',
    'تبریز'
  ];

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      setSuggestions(locations.filter(loc => loc.includes(value)));
    } else {
      setSuggestions([]);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        console.log("مختصات:", pos.coords.latitude, pos.coords.longitude);
        // اینجا می‌تونی مختصات رو به آدرس تبدیل کنی (API نقشه مثل Neshan یا Google)
        setSelected("موقعیت فعلی شما");
        onSelect("موقعیت فعلی شما");
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4 text-center">انتخاب موقعیت شما</h2>

        {/* input جستجو */}
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="شهر یا منطقه خود را وارد کنید"
          className="w-full p-2 border rounded mb-2"
        />

        {/* لیست پیشنهادها */}
        {suggestions.length > 0 && (
          <ul className="border rounded mb-4 bg-white shadow max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setSelected(s);
                  setQuery(s);
                  setSuggestions([]);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        {/* دکمه‌ها */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => selected && onSelect(selected)}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            disabled={!selected}
          >
            مشاهده رستوران‌ها
          </button>

          <button
            onClick={detectLocation}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            تشخیص موقعیت من
          </button>
        </div>
      </div>
    </div>
  );
}