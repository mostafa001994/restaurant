'use client';

import { useState, useEffect } from 'react';
import ProductModal from '@/components/admin/product/ProductAdd';
import ProductEditModal from '@/components/admin/product/ProductEdit';
import ProductList from '@/components/admin/product/ProductList';
import { Category, Ingredient, Product, Restaurant } from '@/types/models';
import {
  loadProducts,
  loadCategories,
  loadIngredients,
  loadRestaurants
} from '@/lib/useAdminData';

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const reloadAll = async () => {
    const [p, c, i, r] = await Promise.all([
      loadProducts(),
      loadCategories(),
      loadIngredients(),
      loadRestaurants()
    ]);
    setProducts(p);
    setCategories(c);
    setIngredients(i);
    setRestaurants(r);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  return (
    <div className="p-4">
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        افزودن محصول
      </button>

      <ProductList
        products={products}
        categories={categories}
        ingredients={ingredients}
        restaurants={restaurants}
        onReload={reloadAll}
        onEdit={(product) => {
          setSelectedProduct(product);
          setShowEditModal(true);
        }}
      />

      {showCreateModal && (
        <ProductModal
          categories={categories}
          ingredients={ingredients}
          restaurants={restaurants}
          onClose={() => setShowCreateModal(false)}
          onCreated={reloadAll}
        />
      )}

      {showEditModal && selectedProduct && (
        <ProductEditModal
          product={selectedProduct}
          categories={categories}
          ingredients={ingredients}
          restaurants={restaurants}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onUpdated={reloadAll}
        />
      )}
    </div>
  );
}