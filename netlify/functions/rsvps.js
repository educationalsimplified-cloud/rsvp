
/*
 * netlify/functions/rsvps.js
 *
 * Retrieves submissions for the Netlify Form named "contact".
 * Environment variables:
 *   NETLIFY_API_TOKEN
 *   NETLIFY_SITE_ID
 *
 * IMPORTANT:
 * This version fixes data retrieval and field mapping.
 * Add/verify server-side admin session authentication before
 * exposing this endpoint publicly.
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

export default async function handler(request) {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  // Do not disguise a configuration problem as an empty RSVP list.
  if (!token || !siteId) {
    console.error("Missing NETLIFY_API_TOKEN or NETLIFY_SITE_ID.");
    return jsonResponse(
      { error: "RSVP backend is not configured." },
      500
    );
  }

  const apiHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  async function netlifyGet(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: apiHeaders,
    });

    if (!response.ok) {
      // Keep secrets and raw API responses out of public error messages.
      console.error("Netlify API request failed:", response.status);
      throw new Error(`Netlify API returned ${response.status}`);
    }

    return response.json();
  }

  try {
    // 1. Find the exact form configured in rsvp.html:
    //    <form name="contact" ...>
    const forms = await netlifyGet(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/forms`
    );

    if (!Array.isArray(forms)) {
      throw new Error("Unexpected forms API response.");
    }

    const form = forms.find((item) => item.name === "contact");

    if (!form) {
      console.error('Netlify Form "contact" was not found for this site.');
      return jsonResponse(
        {
          error:
            'Form "contact" was not found. Check the site ID and Netlify form detection.',
        },
        404
      );
    }

    // 2. Retrieve submissions belonging to this form.
    // Netlify paginates results; continue until the last page.
    const submissions = [];
    const perPage = 100;
    let page = 1;

    while (true) {
      const url =
        `https://api.netlify.com/api/v1/forms/${encodeURIComponent(form.id)}/submissions` +
        `?page=${page}&per_page=${perPage}`;

      const batch = await netlifyGet(url);

      if (!Array.isArray(batch)) {
        throw new Error("Unexpected submissions API response.");
      }

      submissions.push(...batch);

      if (batch.length < perPage) break;

      page += 1;

      // Defensive limit to avoid runaway requests.
      if (page > 100) {
        throw new Error("Submission pagination limit reached.");
      }
    }

    // 3. Flatten submission.data so dashboard.js can read
    //    name, email, contact, attendance, and other fields.
    const result = submissions.map((submission) => {
      const fields =
        submission.data && typeof submission.data === "object"
          ? submission.data
          : {};

      return {
        ...fields,
        id: submission.id || "",
        submission_id: submission.id || "",
        created_at: submission.created_at || "",
        name: fields.name ?? submission.name ?? "",
        email: fields.email ?? submission.email ?? "",
        contact: fields.contact ?? "",
        role: fields.role ?? "",
        attendance: fields.attendance ?? "Pending",
        additional_guests:
          fields.additional_guests ?? fields.extra_guests ?? 0,
        message: fields.message ?? fields.guest_note ?? "",
      };
    });

    return jsonResponse(result);
  } catch (error) {
    console.error("Unable to retrieve RSVP submissions:", error.message);
    return jsonResponse(
      { error: "Unable to retrieve RSVP submissions. Check function logs." },
      502
    );
  }
}
