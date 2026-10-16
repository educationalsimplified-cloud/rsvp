
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'cradle_admin_session';
export const SESSION_TTL_SECONDS = 28800; // 8 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or too short.');
  }
  return secret;
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function createSession(username) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  ).toString('base64url');

  const signature = createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifySession(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const cookie = cookieHeader
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(`${COOKIE_NAME}=`));

    if (!cookie) return false;

    const token = cookie.slice(COOKIE_NAME.length + 1);
    const parts = token.split('.');

    if (parts.length !== 2) return false;

    const [payload, suppliedSignature] = parts;

    const expectedSignature = createHmac('sha256', getSecret())
      .update(payload)
      .digest('base64url');

    if (!safeEqual(suppliedSignature, expectedSignature)) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    return (
      typeof session.sub === 'string' &&
      session.sub === process.env.ADMIN_USERNAME &&
      Number.isInteger(session.exp) &&
      session.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function sessionCookie(request, token, maxAge) {
  const secure = new URL(request.url).protocol === 'https:';

  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}
