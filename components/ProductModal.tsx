// components/ProductModal.tsx
import React, { useState } from 'react';
import BaseModal from './ui/BaseModal';
import { Product } from '@/types/models';
import { useCart, CartExtraSelection } from '@/context/CartContext';
import ReviewsSection from './ReviewsSection';

interface Props {
    product: Product;
    onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
    const { addToCart } = useCart();

    const discountPrice = product.discount_price
        ? product.price - (product.price * product.discount_price) / 100
        : null;

    const [qty, setQty] = useState(1);
    // تعداد انتخاب‌شده از هر مخلفات؛ کلید = شناسه‌ی extra
    const [extraQuantities, setExtraQuantities] = useState<Record<number, number>>({});
    const [justAdded, setJustAdded] = useState(false);

    const activeExtras = (product.extras ?? []).filter((e) => e.is_active);

    const changeExtraQty = (extraId: number, delta: number) => {
        setExtraQuantities((prev) => {
            const next = Math.max(0, (prev[extraId] ?? 0) + delta);
            return { ...prev, [extraId]: next };
        });
    };

    const extrasTotal = activeExtras.reduce(
        (sum, e) => sum + e.price * (extraQuantities[e.id] ?? 0),
        0
    );

    const unitPrice = discountPrice ?? product.price;
    const lineTotal = unitPrice * qty + extrasTotal;

    const handleAdd = () => {
        const selectedExtras: CartExtraSelection[] = activeExtras
            .filter((e) => (extraQuantities[e.id] ?? 0) > 0)
            .map((e) => ({ extra: e, quantity: extraQuantities[e.id] }));

        addToCart(product, qty, selectedExtras);

        // نکته: عمداً مودال بسته نمی‌شود تا کاربر بتواند همین محصول را با
        // ترکیب دیگری از مخلفات دوباره اضافه کند یا چند بار پشت‌سر‌هم اضافه کند.
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
        setQty(1);
        setExtraQuantities({});
    };

    return (
        <BaseModal onClose={onClose} widthClass="max-w-3xl">
            {/* بخش بالا: دو ستونه */}
            <div className="flex flex-wrap">
                {/* تصویر غذا */}
                <div className="bg-gray-100 md:w-5/12">
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${product.image}`}
                        alt={product.name}
                        className="w-full h-64 object-cover rounded-r-xl md:rounded-none"
                    />
                </div>

                {/* توضیحات و قیمت */}
                <div className="p-6 flex flex-col justify-start  md:w-7/12">
                    <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                        {discountPrice ? (
                            <>
                                <span className="text-green-600 font-bold text-lg">{discountPrice.toLocaleString()} تومان</span>
                                <span className="line-through text-gray-400 text-sm">{product.price.toLocaleString()} تومان</span>
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">٪{product.discount_price} تخفیف</span>
                            </>
                        ) : (
                            <span className="text-green-600 font-bold text-lg">{product.price.toLocaleString()} تومان</span>
                        )}
                    </div>

                    {/* مخلفات */}
                    {activeExtras.length > 0 && (
                        <div className="mb-4 border-t pt-3">
                            <p className="font-bold text-sm mb-2">مخلفات (اختیاری)</p>
                            <div className="space-y-2">
                                {activeExtras.map((extra) => (
                                    <div key={extra.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <span>{extra.name}</span>{' '}
                                            <span className="text-gray-500">
                                                {extra.price > 0 ? `(+${extra.price.toLocaleString()} تومان)` : '(رایگان)'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => changeExtraQty(extra.id, -1)}
                                                className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                                            >
                                                −
                                            </button>
                                            <span className="w-5 text-center">{extraQuantities[extra.id] ?? 0}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeExtraQty(extra.id, 1)}
                                                className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* تعداد + افزودن */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                                −
                            </button>
                            <span className="w-6 text-center font-bold">{qty}</span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={handleAdd}
                            className="border-[#ff00a6] border text-[#ff00a6] px-4 py-1 rounded-full hover:bg-[#ff0693] hover:text-white transition"
                        >
                            {justAdded ? '✅ اضافه شد' : `افزودن — ${lineTotal.toLocaleString()} تومان`}
                        </button>
                    </div>
                </div>
            </div>

            {/* بخش نظرات (داینامیک، از سرور) */}
            <ReviewsSection productId={product.id} />
        </BaseModal>
    );
}
