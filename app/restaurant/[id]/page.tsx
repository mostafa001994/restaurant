'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Restaurant, Product } from '@/types/models';
import { api } from '@/lib/api';
import ProductModal from '@/components/ProductModal';

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;

    api.get(`/restaurants/${id}`).then(res => setRestaurant(res.data));
    api.get(`/restaurants/${id}/products`).then(res => setProducts(res.data));
  }, [id]);

  if (!restaurant) {
    return <div className="p-6 text-red-500">رستوران یافت نشد یا در دسترس نیست.</div>;
  }

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
      <p className="text-gray-600 mb-6">{restaurant.address}</p>

      {products.length === 0 ? (
        <p className="text-gray-500">منویی برای این رستوران ثبت نشده است.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="border p-4 rounded shadow-sm bg-white cursor-pointer hover:shadow-md transition"
            >
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${p.image}`}
                alt={p.name}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <h2 className="font-semibold text-lg">{p.name}</h2>
              <p className="text-sm text-gray-600">{p.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-green-600 font-bold">{p.price} تومان</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}