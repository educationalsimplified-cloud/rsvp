
import {
  COOKIE_NAME,
  sessionCookie,
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

  return jsonResponse(
    { authenticated: false },
    200,
    {
      'Set-Cookie': sessionCookie(request, '', 0),
    }
  );
}
