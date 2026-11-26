// lib/addresses.ts
import { api } from '@/lib/api';

export interface Address {
  id: number;
  title?: string | null;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code?: string | null;
  address_line: string;
  plaque?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default: boolean;
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await api.get('/addresses');
  return res.data;
}

export async function deleteAddress(id: number) {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
}

export function formatAddress(a: Address): string {
  return `${a.province}، ${a.city}، ${a.address_line}`;
}
