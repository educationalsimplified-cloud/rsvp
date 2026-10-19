/*
 * netlify/functions/submit-rsvp.js
 *
 * Server-side RSVP submission with duplicate prevention.
 * Checks existing submissions for the same email or phone before
 * accepting a new RSVP. Returns 409 "You have already registered."
 * if a duplicate is found.
 *
 * Environment variables:
 *   NETLIFY_API_TOKEN
 *   NETLIFY_SITE_ID
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!token || !siteId) {
    console.error("Missing NETLIFY_API_TOKEN or NETLIFY_SITE_ID.");
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  // Parse form data (URL-encoded or JSON)
  let formData;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    formData = await request.json();
  } else {
    const text = await request.text();
    const params = new URLSearchParams(text);
    formData = {};
    for (const [key, value] of params) {
      formData[key] = value;
    }
  }

  const email = (formData.email || "").trim().toLowerCase();
  const contact = (formData.contact || "").trim();

  if (!email && !contact) {
    return jsonResponse({ error: "Email or phone is required" }, 400);
  }

  const apiHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  async function netlifyGet(url) {
    const response = await fetch(url, { method: "GET", headers: apiHeaders });
    if (!response.ok) {
      console.error("Netlify API request failed:", response.status);
      throw new Error(`Netlify API returned ${response.status}`);
    }
    return response.json();
  }

  try {
    // 1. Find the form "contact"
    const forms = await netlifyGet(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/forms`
    );
    const form = Array.isArray(forms) ? forms.find((f) => f.name === "contact") : null;

    if (!form) {
      console.error('Netlify Form "contact" was not found.');
      return jsonResponse({ error: "Form not found" }, 404);
    }

    // 2. Retrieve all submissions (paginated)
    const submissions = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const url =
        `https://api.netlify.com/api/v1/forms/${encodeURIComponent(form.id)}/submissions` +
        `?page=${page}&per_page=${perPage}`;
      const batch = await netlifyGet(url);
      if (!Array.isArray(batch) || batch.length === 0) break;
      submissions.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
      if (page > 100) break;
    }

    // 3. Check for duplicate email or phone
    const existingEmail = submissions.find((s) => {
      const data = s.data || {};
      return data.email && data.email.toLowerCase().trim() === email;
    });
    if (existingEmail) {
      return jsonResponse({ error: "You have already registered." }, 409);
    }

    const existingContact = submissions.find((s) => {
      const data = s.data || {};
      return data.contact && data.contact.trim() === contact;
    });
    if (existingContact) {
      return jsonResponse({ error: "You have already registered." }, 409);
    }

    // 4. Submit to Netlify Forms API
    const submitRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/submissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_id: form.id,
          data: formData,
        }),
      }
    );

    if (!submitRes.ok) {
      console.error("Netlify submission failed:", submitRes.status);
      return jsonResponse({ error: "Failed to submit RSVP" }, 502);
    }

    return jsonResponse({ success: true, message: "RSVP submitted successfully" });
  } catch (error) {
    console.error("submit-rsvp error:", error.message);
    return jsonResponse({ error: "Server error" }, 500);
  }
}