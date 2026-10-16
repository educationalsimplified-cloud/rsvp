/*
 * netlify/functions/rsvps.js
 *
 * Server-side endpoint used by the admin dashboard (GET) to list RSVP
 * submissions. Netlify Functions run on Netlify's infrastructure so
 * secrets never reach the browser.
 *
 * Required Netlify environment variables (set in Site settings > Build & deploy > Environment):
 *   NETLIFY_API_TOKEN  – personal access token with forms:read scope
 *
 * How it works:
 *   1. Reads NETLIFY_API_TOKEN from environment (never hard-coded).
 *   2. Calls the Netlify API: GET /api/v1/sites/{site_id}/submissions?form_name=contact
 *   3. Returns the submissions as JSON to the dashboard.
 *
 * Authentication for the admin dashboard itself (sign-in, session cookie,
 * rate limiting, password hashing) must be added here or in a separate
 * /api/auth function before this endpoint is exposed publicly. Until then,
 * this stub returns an empty array so the dashboard UI can be reviewed.
 */

export default async function handler(request, context) {
  // Only allow the dashboard origin in production; adjust as needed.
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiToken = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!apiToken || !siteId) {
    // Backend not configured yet: return empty list so the dashboard
    // renders its empty state instead of crashing.
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/submissions?form_name=contact`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Netlify API responded ${response.status}`);
    }

    const submissions = await response.json();
    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
