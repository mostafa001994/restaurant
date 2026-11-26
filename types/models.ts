export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: Role; // اکنون هر کاربر دقیقاً یک نقش دارد (ستون role_id مستقیم)
  is_admin?: boolean;
  avatar?: string | null;
  avatar_url?: string | null;
  is_verified: boolean; // تغییر اینجا
  login_type?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions?: Permission[];
}



export interface Restaurant {
  id: number;
  user_id: number;
  name: string;
  address?: string;
  description?:string;
  status: string;
  city: string;
  latitude?: number;
  longitude?: number;

  is_open: boolean;
  open_time?: string;
  close_time?: string;
  logo?: string;
  cover_image?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };

  
  branches?: Branch[];     // شعب
  categories?: Category[]; // دسته‌بندی‌ها
}







export interface Branch {
  id: number;
  restaurant_id: number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: number;
    name: string;
  };
}


export interface Category {
  id: number;
  name: string;
  image?: string;
  restaurant_id: number;
  restaurant?: Restaurant; // برای نمایش نام رستوران در لیست دسته‌بندی‌ها
  products?: Product[];    // محصولات این دسته‌بندی
}




export interface Ingredient {
  id: number;
  name: string;
}

export interface ProductExtra {
  id: number;
  product_id: number;
  name: string;
  price: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  discount_price: number;
  stock: number;
  image?: string | null;
  status: 'active' | 'inactive';
  category_id: number;
  restaurant_id: number;
  preparation_minutes?: number;
  category?: Category;
  restaurant?: Restaurant;
  ingredients?: Ingredient[];
  extras?: ProductExtra[];
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'on_the_way' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options?: { extra_id: number; name: string; price: number; quantity: number }[] | null;
  product?: Product;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  total_price: number;
  delivery_fee: number;
  discount: number;
  final_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'cash' | 'online';
  payment_gateway?: 'zarinpal' | 'mellat' | null;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  preparation_minutes?: number | null;
  estimated_delivery_at?: string | null;
  remaining_seconds?: number | null;
  paid_at?: string | null;
  created_at: string;
  items?: OrderItem[];
  restaurant?: Restaurant;
}

export interface PaymentGateway {
  key: 'zarinpal' | 'mellat';
  name: string;
}