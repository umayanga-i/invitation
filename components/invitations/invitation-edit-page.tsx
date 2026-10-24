'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getInvitation } from '@/lib/invitations';
import type { Invitation } from '@/lib/mock-data';
import { getTemplate } from '@/components/templates/registry';
import { TemplateEditor } from '@/components/templates/template-editor';

export function InvitationEditPage({ invitationId }: { invitationId: string }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getInvitation(invitationId).then((result) => {
      if (active) setInvitation(result);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load this invitation.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [invitationId]);

  if (loading) return <main className="iv-state-page">Loading invitation…</main>;
  if (error || !invitation) return <main className="iv-state-page"><span className="iv-state-icon" aria-hidden="true">✉</span><h1>Invitation not found</h1><p>{error || 'This invitation is unavailable.'}</p><Link href="/invitations" className="iv-state-link">Back to my invitations</Link></main>;

  const template = getTemplate(invitation.templateId);
  if (!template) return <main className="iv-state-page">This invitation design is unavailable.</main>;
  return <TemplateEditor template={template} invitation={invitation} />;
}
