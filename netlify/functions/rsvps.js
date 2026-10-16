
/*
 * netlify/functions/rsvps.js
 * Protected admin endpoint for RSVP submissions.
 */

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

  // Never return guest information without a valid admin session.
  if (!verifySession(request)) {
    return jsonResponse(
      { error: 'Authentication required. Please sign in.' },
      401
    );
  }

  const apiToken = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  // Missing backend configuration must not look like an empty guest list.
  if (!apiToken || !siteId) {
    console.error('RSVP backend environment variables are missing.');
    return jsonResponse(
      { error: 'RSVP service is not configured.' },
      500
    );
  }

  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/submissions?form_name=contact`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error(
        'Netlify API request failed with status:',
        response.status
      );

      return jsonResponse(
        { error: 'Unable to retrieve RSVP submissions.' },
        502
      );
    }

    const submissions = await response.json();

    if (!Array.isArray(submissions)) {
      console.error('Unexpected response format from Netlify API.');
      return jsonResponse(
        { error: 'Unexpected response from RSVP service.' },
        502
      );
    }

    return jsonResponse(submissions);
  } catch (error) {
    console.error('RSVP retrieval failed:', error.message);

    return jsonResponse(
      { error: 'Unable to retrieve RSVP submissions.' },
      502
    );
  }
}
