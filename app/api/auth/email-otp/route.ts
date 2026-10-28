import { NextResponse } from 'next/server';
import { RESET_COOKIE, resetToken } from '@/lib/server/password-reset';

const OTP_API_URL = 'https://otp.invitation-online.workers.dev';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request must be valid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { action, email, otp } = body as { action?: unknown; email?: unknown; otp?: unknown };
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (action !== 'send' && action !== 'verify') {
    return NextResponse.json({ error: 'Invalid OTP action.' }, { status: 400 });
  }
  if (action === 'verify' && (typeof otp !== 'string' || !/^\d{6}$/.test(otp))) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const apiKey = process.env.OTP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email verification is not configured. Please contact support.' }, { status: 503 });
  }

  const sendRequest = () =>
    fetch(`${OTP_API_URL}/${action === 'send' ? 'send-otp' : 'verify-otp'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(action === 'send' ? { to: normalizedEmail } : { email: normalizedEmail, otp }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

  let response: Response;
  try {
    response = await sendRequest();
  } catch (cause) {
    // A send retry is safe because the Worker enforces a five-minute per-email cooldown.
    if (action === 'send') {
      try {
        response = await sendRequest();
      } catch (retryCause) {
        console.error('[email-otp] Worker send failed:', retryCause instanceof Error ? retryCause.name : 'unknown error');
        return NextResponse.json({ error: 'Unable to reach the email service. Please try again shortly.' }, { status: 502 });
      }
    } else {
      console.error('[email-otp] Worker verification failed:', cause instanceof Error ? cause.name : 'unknown error');
      return NextResponse.json({ error: 'Unable to reach the email service. Please try again shortly.' }, { status: 502 });
    }
  }

  try {
    const result: unknown = await response.json();
    const next=NextResponse.json(result, { status: response.status });
    if(action==='verify'&&response.ok)next.cookies.set(RESET_COOKIE,resetToken(normalizedEmail),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:600});
    return next;
  } catch (cause) {
    console.error('[email-otp] Worker returned an invalid response:', cause instanceof Error ? cause.name : 'unknown error');
    return NextResponse.json({ error: 'The email service returned an invalid response. Please try again shortly.' }, { status: 502 });
  }
}
