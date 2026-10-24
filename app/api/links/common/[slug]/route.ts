import { resolveCommonLink } from '@/lib/links';
import { apiErrorResponse } from '@/lib/api-errors';
import { allowRateLimit, rateLimitedResponse } from '@/lib/rate-limit';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    if (!allowRateLimit(request.headers, 'common-link', 60)) return rateLimitedResponse();
    const { slug } = await params;
    const invitation = resolveCommonLink(slug);
    return invitation
      ? Response.json({ id: invitation.id, slug: invitation.slug, title: invitation.title, templateId: invitation.templateId, customData: invitation.customData })
      : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) { return apiErrorResponse('GET /api/links/common/[slug]', error, 'Could not resolve this invitation link.'); }
}
