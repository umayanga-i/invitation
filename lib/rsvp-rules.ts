export function isRsvpClosed(deadline?: string, now = new Date()): boolean {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false;
  const closesAt = new Date(`${deadline}T23:59:59+05:30`);
  return !Number.isNaN(closesAt.getTime()) && now.getTime() > closesAt.getTime();
}

function validLimit(value?: number): number | undefined {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : undefined;
}

export function getPartyLimit(invitationLimit?: number, guestLimit?: number): number {
  const invitationMax = validLimit(invitationLimit) ?? 6;
  const guestMax = validLimit(guestLimit);
  return guestMax ? Math.min(invitationMax, guestMax) : invitationMax;
}
