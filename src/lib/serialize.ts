import type { addresses, branches, orderItems, orders, productExtras, products, restaurants } from '@/db';

type Row<T extends { $inferSelect: unknown }> = T['$inferSelect'];

const num = (v: string | null): number | null => (v === null ? null : Number(v));
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : null);
const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function serializeBranch(b: Row<typeof branches>) {
  return {
    id: b.id,
    restaurant_id: b.restaurantId,
    name: b.name,
    address: b.address,
    phone: b.phone,
    latitude: num(b.latitude),
    longitude: num(b.longitude),
    is_active: b.isActive,
  };
}

export function serializeRestaurant(r: Row<typeof restaurants>, branchRows: Row<typeof branches>[] = []) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    address: r.address,
    latitude: num(r.latitude),
    longitude: num(r.longitude),
    logo: r.logo,
    cover_image: r.coverImage,
    open_time: hhmm(r.openTime),
    close_time: hhmm(r.closeTime),
    is_open: r.isOpen,
    status: r.status,
    branches: branchRows.map(serializeBranch),
  };
}

export function serializeExtra(e: Row<typeof productExtras>) {
  return { id: e.id, product_id: e.productId, name: e.name, price: Number(e.price), is_active: e.isActive };
}

export function serializeProduct(p: Row<typeof products>, extras: Row<typeof productExtras>[] = []) {
  return {
    id: p.id,
    category_id: p.categoryId,
    restaurant_id: p.restaurantId,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    discount_price: num(p.discountPrice),
    image: p.image,
    is_available: p.isAvailable,
    stock: p.stock,
    preparation_minutes: p.preparationMinutes,
    tags: p.tags ?? [],
    extras: extras.map(serializeExtra),
  };
}

export function serializeAddress(a: Row<typeof addresses>) {
  return {
    id: a.id,
    title: a.title,
    full_name: a.fullName,
    phone: a.phone,
    province: a.province,
    city: a.city,
    postal_code: a.postalCode,
    address_line: a.addressLine,
    plaque: a.plaque,
    lat: num(a.lat),
    lng: num(a.lng),
    is_default: a.isDefault,
  };
}

export function serializeOrder(
  o: Row<typeof orders>,
  restaurant: { id: number; name: string } | null,
  items: { item: Row<typeof orderItems>; product: { id: number; name: string } | null }[],
) {
  return {
    id: o.id,
    user_id: o.userId,
    restaurant_id: o.restaurantId,
    total_price: Number(o.totalPrice),
    delivery_fee: Number(o.deliveryFee),
    discount: Number(o.discount),
    final_price: Number(o.finalPrice),
    status: o.status,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod,
    payment_gateway: o.paymentGateway,
    delivery_address: o.deliveryAddress,
    delivery_lat: num(o.deliveryLat),
    delivery_lng: num(o.deliveryLng),
    preparation_minutes: o.preparationMinutes,
    estimated_delivery_at: iso(o.estimatedDeliveryAt),
    paid_at: iso(o.paidAt),
    remaining_seconds: o.estimatedDeliveryAt ? Math.max(0, Math.floor((o.estimatedDeliveryAt.getTime() - Date.now()) / 1000)) : null,
    created_at: o.createdAt.toISOString(),
    restaurant,
    items: items.map(({ item, product }) => ({
      id: item.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      total_price: Number(item.totalPrice),
      selected_options: item.selectedOptions,
      product,
    })),
  };
}
