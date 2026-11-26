'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import {
  fetchProductReviews,
  fetchReviewEligibility,
  submitReview,
  Review,
} from '@/lib/reviews';

export default function ReviewsSection({ productId }: { productId: number }) {
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetchProductReviews(productId)
      .then((res) => {
        setReviews(res.reviews);
        setAverage(res.average_rating);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [productId]);

  useEffect(() => {
    if (!user) return;
    fetchReviewEligibility(productId).then((res) => {
      setCanReview(res.can_review);
      setAlreadyReviewed(res.already_reviewed);
    });
  }, [user, productId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await submitReview(productId, rating, comment);
      setSubmitMsg('نظر شما ثبت شد و بعد از تایید ادمین نمایش داده می‌شود ✅');
      setCanReview(false);
      setAlreadyReviewed(true);
      setComment('');
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.message || 'خطا در ثبت نظر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">نظرات کاربران</h3>
        {count > 0 && (
          <span className="text-sm text-amber-600">
            ⭐ {average.toFixed(1)} ({count} نظر)
          </span>
        )}
      </div>

      {/* فرم ثبت نظر: فقط برای کسی که این غذا را خریده و تحویل گرفته */}
      {user && canReview && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-sm font-bold mb-2">نظر خودتان را ثبت کنید</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="text-xl">
                {n <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="نظرتان درباره‌ی این غذا..."
            className="w-full border rounded p-2 text-sm mb-2"
          />
          {submitMsg && <p className="text-sm text-blue-600 mb-2">{submitMsg}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
          </button>
        </div>
      )}

      {user && alreadyReviewed && !canReview && (
        <p className="text-sm text-gray-500 mb-4">شما قبلاً برای این غذا نظر ثبت کرده‌اید.</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">در حال بارگذاری نظرات...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">هنوز نظری برای این غذا ثبت نشده است.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm mb-1">
                {'⭐'.repeat(r.rating)} {r.comment}
              </p>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>{r.user?.name ?? 'کاربر'}</span>
                <span>{new Date(r.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
