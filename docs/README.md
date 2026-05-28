# TicketBox — static HTML site

Static client-side build of the concert ticketing demo, deployed via GitHub Pages.

- All pages are plain HTML + ES modules — no build step
- Data + auth via `supabase-js` directly to Supabase (anon key)
- Row Level Security on every table — bookings/admin gated by Postgres policies

## Pages

| File | Description |
|---|---|
| `index.html` | Concert list (public) |
| `concert.html?id=...` | Concert detail + seat picker |
| `login.html`, `register.html` | Supabase Auth |
| `checkout.html?id=...` | Mock payment for a pending booking |
| `tickets.html` | User's bookings + QR e-tickets |
| `admin.html` | Admin dashboard (requires `profiles.is_admin = true`) |

## Making yourself admin

After signing up, run (via Supabase MCP or SQL Editor):

```sql
UPDATE profiles SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
```

## Note on email confirmation

If Supabase's "Confirm email" is enabled (default), `register.html` will tell users to check their inbox before they can log in. To disable for demo:
Authentication → Sign In / Providers → Email → toggle "Confirm email" off.
