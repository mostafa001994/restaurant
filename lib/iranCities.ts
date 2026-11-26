// lib/iranCities.ts
// لیست ثابت مراکز استان‌های ایران با مختصات، برای انتخاب شهر بدون نیاز به
// فراخوانی زنده‌ی سرویس‌های جستجوی خارجی (Nominatim) که در مرورگر ممکنه
// توسط اکستنشن‌ها بلاک شود یا rate-limit بخورد.
export interface IranCity {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export const IRAN_CITIES: IranCity[] = [
  { name: 'تهران', province: 'تهران', lat: 35.6892, lng: 51.389 },
  { name: 'مشهد', province: 'خراسان رضوی', lat: 36.2605, lng: 59.6168 },
  { name: 'اصفهان', province: 'اصفهان', lat: 32.6546, lng: 51.668 },
  { name: 'کرج', province: 'البرز', lat: 35.8355, lng: 50.9915 },
  { name: 'شیراز', province: 'فارس', lat: 29.5918, lng: 52.5836 },
  { name: 'تبریز', province: 'آذربایجان شرقی', lat: 38.08, lng: 46.2919 },
  { name: 'قم', province: 'قم', lat: 34.6401, lng: 50.8764 },
  { name: 'اهواز', province: 'خوزستان', lat: 31.3183, lng: 48.6706 },
  { name: 'کرمانشاه', province: 'کرمانشاه', lat: 34.3277, lng: 47.065 },
  { name: 'ارومیه', province: 'آذربایجان غربی', lat: 37.5527, lng: 45.0761 },
  { name: 'رشت', province: 'گیلان', lat: 37.2809, lng: 49.5832 },
  { name: 'زاهدان', province: 'سیستان و بلوچستان', lat: 29.4963, lng: 60.8629 },
  { name: 'کرمان', province: 'کرمان', lat: 30.2839, lng: 57.083 },
  { name: 'همدان', province: 'همدان', lat: 34.7992, lng: 48.5146 },
  { name: 'یزد', province: 'یزد', lat: 31.8974, lng: 54.3569 },
  { name: 'اردبیل', province: 'اردبیل', lat: 38.2498, lng: 48.2933 },
  { name: 'بندرعباس', province: 'هرمزگان', lat: 27.1865, lng: 56.2808 },
  { name: 'اراک', province: 'مرکزی', lat: 34.0917, lng: 49.6892 },
  { name: 'ساری', province: 'مازندران', lat: 36.5633, lng: 53.0601 },
  { name: 'خرم‌آباد', province: 'لرستان', lat: 33.4878, lng: 48.3558 },
  { name: 'زنجان', province: 'زنجان', lat: 36.6736, lng: 48.4787 },
  { name: 'سنندج', province: 'کردستان', lat: 35.3144, lng: 46.9923 },
  { name: 'بوشهر', province: 'بوشهر', lat: 28.9234, lng: 50.8203 },
  { name: 'بیرجند', province: 'خراسان جنوبی', lat: 32.8663, lng: 59.2211 },
  { name: 'ایلام', province: 'ایلام', lat: 33.6374, lng: 46.4227 },
  { name: 'یاسوج', province: 'کهگیلویه و بویراحمد', lat: 30.6683, lng: 51.5878 },
  { name: 'بجنورد', province: 'خراسان شمالی', lat: 37.4747, lng: 57.3291 },
  { name: 'سمنان', province: 'سمنان', lat: 35.5769, lng: 53.3944 },
  { name: 'شهرکرد', province: 'چهارمحال و بختیاری', lat: 32.3256, lng: 50.8644 },
  { name: 'گرگان', province: 'گلستان', lat: 36.8392, lng: 54.4341 },
  { name: 'قزوین', province: 'قزوین', lat: 36.269, lng: 50.0041 },
];
