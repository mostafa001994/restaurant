import { requireAuth } from '@/lib/auth';
import { handler, parseId, type IdCtx } from '@/lib/http';
import { deliveredOrderFor, hasReviewed } from '@/lib/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<IdCtx>(async (req, ctx) => {
  const { user } = await requireAuth(req);
  const productId = parseId((await ctx.params).id);
  const [purchased, already] = await Promise.all([deliveredOrderFor(user.id, productId), hasReviewed(user.id, productId)]);
  return Response.json({ can_review: !!purchased && !already, already_reviewed: already });
});
