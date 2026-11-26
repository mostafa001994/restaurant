// src/lib/helpers.ts
export function getImageUrl(path?: string) {
  if (!path) return '/placeholder.png'; // اگر تصویر نداشت
  return `${process.env.NEXT_PUBLIC_API_URL}/storage/${path}`;
}