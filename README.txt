THE CRADLE SCHOOLS — 20TH ANNIVERSARY INVITATION STARTER

Files
- index.html: responsive invitation page and RSVP form.

Before publishing
1. Replace [Add confirmed date and time] and [Add confirmed venue] with the final event details.
2. Review the invitation wording and branding.
3. Create a Netlify site and deploy this folder (or connect a Git repository containing it).
4. After deployment, open Netlify Forms in the site dashboard and confirm the form is detected. Netlify form detection may require form detection to be enabled and a fresh deploy.
5. Test an RSVP from a phone and verify the submission appears in Netlify.
6. Do not share the public link until the event details and submission handling have been tested.

Important limitations
- This starter collects responses through Netlify Forms; it does not yet include a custom admin dashboard or SQL database.
- The Netlify dashboard can be used to review form submissions if form handling is enabled for the site and your plan/settings support it.
- If you want a custom admin dashboard, add server-side authentication and protected Netlify Functions before exposing any guest records. Never put admin passwords, database credentials, or secret API keys in client-side JavaScript.
- The event date/time and venue are intentionally placeholders because the confirmed details have not been provided in this conversation.

# PROJECT CONTINUATION PROMPT: THE CRADLE SCHOOLS 20TH ANNIVERSARY DIGITAL INVITATION

## 1. Project Overview

I am building a custom digital invitation website for **The Cradle Schools' 20th Anniversary Dinner Night**.

The goal is to create a Paperless Post-style digital invitation using standard front-end technologies and host it on Netlify. Guests will receive the invitation link through the school's existing WhatsApp communication platform.

This is a one-off event website, so the solution should be simple, affordable, attractive, secure, and easy to manage without unnecessary complexity.

## 2. Technology Stack

Use:
- HTML5 for page structure.
- CSS3 for custom styling and animations.
- Bootstrap 5 for responsive layout and UI components.
- Vanilla JavaScript for client-side interactions.
- Netlify for hosting and deployment.
- Netlify Forms, Netlify Functions, or another suitable backend/storage option for handling RSVP submissions.

The project should not depend on WordPress, Elementor, or cPanel.

## 3. Existing Work

A starter website has already been created in `index.html`. It includes:

- A responsive digital invitation page.
- An off-white background with gold details and red accents.
- The Cradle Schools' 20th anniversary branding and invitation wording.
- Placeholder event date, time, and venue.
- An RSVP form with guest name and contact details.
- Accept and decline options.
- An additional-guest selector allowing up to two guests.
- JavaScript that displays the expected attendee count.
- Initial Netlify Forms markup.
- Basic responsive styling and subtle entrance animation.

The starter package also contains a README with preliminary deployment instructions.

**Important:** The existing implementation is only a starting point. Do not assume that Netlify Forms is already active, that submissions have been tested, or that a database and admin dashboard exist.

## 4. Outstanding Tasks

### A. Finalize the invitation design

1. Replace the placeholder date, time, and venue with the confirmed event information.
2. Incorporate the official anniversary logo or supplied school branding assets.
3. Refine the typography, spacing, gold borders, and red accents.
4. Ensure the invitation looks elegant on mobile phones, tablets, and desktops.
5. Add a suitable cover image or background artwork if provided.
6. Review all event wording and ensure no placeholder content remains.
7. Optionally add a calendar link, venue directions, dress code, and contact information.

### B. Complete the RSVP form

The form should collect:
- Guest's full name.
- Phone number or email address.
- Attendance status: Accept or Decline.
- Number of additional guests, from zero to two, when accepting.
- Optional message to the organizers.
- Submission timestamp.

Expected behavior:
- Show the additional-guest selector only when the guest accepts.
- Hide or disable that selector when the guest declines.
- Calculate the total attendees correctly, including the invitee.
- Validate all required fields.
- Prevent duplicate or accidental submissions where practical.
- Show a clear success or failure message.
- Preserve accessibility and mobile usability.

The server must validate and sanitize all submitted values. Client-side JavaScript validation alone is insufficient.

### C. Implement reliable RSVP storage

Determine the most appropriate storage approach for this one-off website.

First investigate whether Netlify Forms is available and suitable for the intended deployment and current account limits.

If using Netlify Forms:
- Configure form detection and deployment correctly.
- Verify that the form is recognized by Netlify.
- Confirm submissions are stored and visible in the Netlify dashboard.
- Test validation, spam prevention, and duplicate handling.
- Document any applicable usage limits and retention considerations.

If a custom admin dashboard requires a more flexible backend, evaluate Netlify Functions and a suitable database or managed storage service.

Do not assume Netlify provides a general-purpose SQL database automatically with static hosting.

Never store RSVP records in browser local storage as the authoritative database. Never put database credentials, secret API keys, or administrator passwords in front-end JavaScript.

### D. Build a secure admin dashboard

Create a separate, responsive admin interface for the event organizer.

The dashboard should allow an authorized administrator to:

1. Sign in securely.
2. View all RSVP submissions.
3. See each guest's name, contact details, attendance status, additional-guest count, and submission time.
4. Filter responses by Accepted, Declined, and Pending.
5. Search guests by name or contact information.
6. View summary statistics:
   - Total RSVP responses.
   - Total accepted invitations.
   - Total declined invitations.
   - Total additional guests.
   - Total expected attendees.
   - Pending invitations, if an invitation list is implemented.
7. Export guest records to CSV.
8. Protect guest information from public access.

Security requirements:
- Authenticate administrators on the server or through a trusted authentication provider.
- Authorize every protected data request.
- Keep private credentials in environment variables.
- Do not rely on hiding an admin page URL as security.
- Do not embed administrator passwords or secrets in HTML or JavaScript.
- Validate and sanitize data on the server.
- Apply appropriate rate limiting and spam protection.
- Avoid exposing guest records in public API responses.

If time permits, add response editing or correction functionality, with appropriate authorization.

### E. Deployment and configuration

Prepare the site for Netlify deployment.

Tasks:
1. Organize the project files and folders.
2. Verify Bootstrap and other external assets load correctly.
3. Configure Netlify Forms or the selected backend.
4. Add Netlify Functions and environment variables if required.
5. Configure redirects or routing for any custom admin page.
6. Provide instructions for deployment through a Git repository or Netlify's supported manual deployment workflow.
7. Test the deployed site over HTTPS.
8. Confirm the public invitation link works when shared through WhatsApp.
9. Test the complete RSVP workflow on both mobile and desktop.
10. Verify that submissions actually reach the intended storage system.

### F. Testing and handover

Test the following scenarios:

- A guest accepts without additional guests.
- A guest accepts with one additional guest.
- A guest accepts with two additional guests.
- A guest declines.
- Required fields are missing.
- Invalid or unusually long input is submitted.
- The form is submitted repeatedly.
- The storage service is temporarily unavailable.
- An unauthorized visitor attempts to access the admin dashboard.
- The administrator views and exports the guest list.
- Attendance statistics match the stored records.

Provide a final README covering deployment, configuration, environment variables, admin access setup, RSVP management, export procedures, and troubleshooting.

## 5. Design Direction

Use an elegant anniversary theme:
- Primary background: warm off-white.
- Secondary colors: muted gold and champagne.
- Accent: restrained deep red.
- Typography: elegant serif headings paired with clean sans-serif body text.
- Style: premium, refined, celebratory, and uncluttered.

The website must remain readable and easy to use on mobile devices.

## 6. Project Constraints

- This is a one-off anniversary event, not a general-purpose SaaS platform.
- Keep costs as low as reasonably possible.
- Prefer free-tier services where suitable, but verify current usage limits and availability before committing.
- Avoid unnecessary dependencies.
- Keep the code understandable and maintainable.
- Do not introduce a complex framework unless there is a clear benefit.
- Use real backend storage and secure authentication for the admin dashboard.
- Do not claim any feature is working until it has been implemented and tested.

## 7. How to Continue

Begin by reviewing the existing `index.html` and README rather than rebuilding everything from scratch.

Then:
1. Identify what is already implemented and what remains incomplete.
2. Ask for the confirmed event date, time, venue, and any required branding assets.
3. Recommend a practical storage and authentication architecture suitable for Netlify.
4. Implement the remaining work in logical stages.
5. Test each stage before moving to the next.
6. Provide the updated project files and clear deployment instructions.

**Immediate priority:** Finalize the event details, ensure RSVP submissions are reliably stored, and implement a secure admin dashboard that lets the organizer manage the guest list and attendance totals.