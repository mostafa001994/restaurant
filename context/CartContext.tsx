// context/CartContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import type { Product, ProductExtra } from '@/types/models';

export interface CartExtraSelection {
  extra: ProductExtra;
  quantity: number;
}

export interface CartItem {
  key: string; // ترکیب محصول + مخلفات انتخاب‌شده، برای تفکیک سطرهای متفاوت سبد
  product: Product;
  quantity: number;
  extras: CartExtraSelection[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, extras: CartExtraSelection[]) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function buildKey(productId: number, extras: CartExtraSelection[]): string {
  const extrasKey = extras
    .map((e) => `${e.extra.id}:${e.quantity}`)
    .sort()
    .join(',');
  return `${productId}__${extrasKey}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number, extras: CartExtraSelection[]) => {
    const key = buildKey(product.id, extras);

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { key, product, quantity, extras }];
    });
  };

  const removeFromCart = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart باید داخل CartProvider استفاده شود');
  return ctx;
}
