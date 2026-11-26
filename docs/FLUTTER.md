# سازگاری با اپ فلاتر

قرارداد فعلی حفظ شده است:

| مسیر | توضیح |
|---|---|
| `POST /api/send-otp` | = `/api/auth/otp/request` — بدنه: `{"phone": "09..."}` یا `{"identifier": ...}` |
| `POST /api/verify-otp` | = `/api/auth/otp/verify` — بدنه: `{"phone": "...", "code": "123456"}` (نام `otp` هم پذیرفته می‌شود) |
| `GET/PUT /api/profile` | هدر `Authorization: Bearer <token>` |

پاسخ ورود: `{ token, token_type, refresh_token, expires_in, user }` (فقط وقتی هدر `X-Client: web` ارسال **نشود**).

## تغییر مهم: عمر access token
access token پیش‌فرض ۱۵ دقیقه است و اپ فلاتر فعلی refresh ندارد. دو راه:
1. موقتاً `ACCESS_TOKEN_TTL_SECONDS=2592000` (۳۰ روز) بگذارید؛
2. (بهتر) interceptor زیر را به Dio اضافه کنید و `refresh_token` را در `flutter_secure_storage` نگه دارید.

```dart
class RefreshInterceptor extends QueuedInterceptorsWrapper {
  final Dio dio; final TokenStore store;
  RefreshInterceptor(this.dio, this.store);

  @override
  void onError(DioException err, ErrorInterceptorHandler h) async {
    final isAuthCall = err.requestOptions.path.contains('/auth/');
    if (err.response?.statusCode != 401 || isAuthCall) return h.next(err);
    final rt = await store.refreshToken();
    if (rt == null) return h.next(err);
    try {
      final r = await Dio(BaseOptions(baseUrl: dio.options.baseUrl))
          .post('/api/auth/refresh', data: {'refresh_token': rt});
      await store.save(r.data['token'], r.data['refresh_token']); // refresh چرخشی است؛ حتماً جدید را ذخیره کنید
      final o = err.requestOptions..headers['Authorization'] = 'Bearer ${r.data['token']}';
      return h.resolve(await dio.fetch(o));
    } catch (_) {
      await store.clear();
      return h.next(err);
    }
  }
}
```

## Base URL
`baseUrl` را روی دامنه‌ی Vercel بگذارید (بدون `/res`) و آدرس‌ها مثل قبل `/api/...` باشند.
