
import {
  verifySession,
  jsonResponse,
} from './auth-utils.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') {
    return jsonResponse(
      { error: 'Method not allowed' },
      405,
      { Allow: 'GET' }
    );
  }

  if (!verifySession(request)) {
    return jsonResponse({ authenticated: false }, 401);
  }

  return jsonResponse({ authenticated: true });
}
