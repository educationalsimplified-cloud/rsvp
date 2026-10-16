
import {
  createSession,
  safeEqual,
  sessionCookie,
  SESSION_TTL_SECONDS,
  jsonResponse,
} from './auth-utils.mjs';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return jsonResponse(
      { error: 'Method not allowed' },
      405,
      { Allow: 'POST' }
    );
  }

  const origin = request.headers.get('origin');

  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const usernameSetting = process.env.ADMIN_USERNAME;
  const passwordSetting = process.env.ADMIN_PASSWORD;

  if (!usernameSetting || !passwordSetting ||
      !process.env.SESSION_SECRET) {
    console.error('Admin authentication environment is incomplete.');
    return jsonResponse(
      { error: 'Authentication is not configured.' },
      500
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400);
  }

  if (
    typeof body.username !== 'string' ||
    typeof body.password !== 'string' ||
    body.username.length > 200 ||
    body.password.length > 2000
  ) {
    return jsonResponse({ error: 'Invalid username or password.' }, 400);
  }

  const validUsername = safeEqual(body.username, usernameSetting);
  const validPassword = safeEqual(body.password, passwordSetting);

  if (!validUsername || !validPassword) {
    return jsonResponse(
      { error: 'Invalid username or password.' },
      401
    );
  }

  try {
    const token = createSession(usernameSetting);

    return jsonResponse(
      { authenticated: true },
      200,
      {
        'Set-Cookie': sessionCookie(
          request,
          token,
          SESSION_TTL_SECONDS
        ),
      }
    );
  } catch (error) {
    console.error('Unable to create admin session.');
    return jsonResponse(
      { error: 'Unable to sign in. Please try again.' },
      500
    );
  }
}

export const config = {
  path: "/.netlify/functions/auth-login",
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};