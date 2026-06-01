# Avantay EventWorks Prototype

This is a local clickable prototype based on `Venue_Mini_CRM_PRD_1.docx`.

Open `index.html` in a browser to try it. The demo sign-in is prefilled:

- Username: `owner`
- Password: `demo`

The prototype uses browser local storage, so edits and new bookings stay on this machine until browser data is cleared.

## Prototype Scope

- Single-user sign-in screen
- Dashboard with upcoming bookings
- Search by client name
- Filters for status, event type, and date range
- Summary counts for upcoming events, awaiting deposit, and balance due
- Visual highlights for events inside the next 14 days
- Payment status badges and overdue balance alerts
- Editable event record with sections for client, event, setup, catering, bar, staffing, payments, and notes
- Calendar page with month, 3 month, 6 month, and 12 month views
- Payments page with deposit, balance, overdue, and completion actions
- Archive page for completed and cancelled bookings
- Delete confirmation for event records

## Notes For The Real Build

- Replace local storage with Supabase Auth and Postgres.
- Keep one `events` table for v1 unless payment history needs auditing.
- Completed events should probably be hidden by default with a clear archive filter.
- The mobile/tablet workflow needs validation with the venue owner before final UI decisions.

## Netlify

This is a static site. In Netlify, connect the GitHub repository and use:

- Build command: leave blank
- Publish directory: `.`
