export function pageOf(req: Request, perPage: number) {
  const page = Math.max(1, Math.min(100_000, Number(new URL(req.url).searchParams.get('page')) || 1));
  return { page, perPage, offset: (page - 1) * perPage };
}

/** شکل صفحه‌بندی لاراول */
export function paginated<T>(data: T[], total: number, page: number, perPage: number) {
  return { data, current_page: page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) };
}
