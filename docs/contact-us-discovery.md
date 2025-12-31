# Contact / Feedback Discovery

Date: 2025‑12‑09  
Branch: `feature/contact-us/discovery`

## Repo searches

Command:

```bash
grep -R --line-number -E "contact|contact-us|feedback|messages|/api/contact|/api/messages|sendMessage" backend frontend || true
```

Signal (excluding `node_modules` / build artifacts via a follow-up `rg`):

- **Frontend navigation:** `frontend/src/components/app-header.tsx` and `app-footer.tsx` already link to `/contact`, but no page/component exists for that route. Besides this placeholder link, “contact” only appears inside the registration wizard (collecting attendee phone/email) and admin messaging dialogs.
- **Feedback module:** All backend hits live under `backend/src/feedback/*` plus Swagger docs in `backend/openapi.yaml`. These endpoints manage event feedback forms/responses, not generic contact messages. Frontend mirrors exist in `frontend/src/app/admin/feedback/*` and `/admin/events/[eventId]/feedback`.
- **Admin messaging:** Files such as `frontend/src/components/admin/send-message-dialog.tsx` and `frontend/src/app/admin/messaging/page.tsx` handle outbound messages to registered users only; there is no inbound “contact us” feature.

Command:

```bash
rg --line-number --glob '!.git/**' --glob '!**/node_modules/**' --glob '!frontend/.next/**' "SMTP|smtp|nodemailer|sendgrid"
```

Result: **no matches**. There is currently no SMTP/nodemailer/sendgrid configuration anywhere in env files or source.

## Existing implementation summary

| Area | Files | Notes |
|------|-------|-------|
| Navigation link | `frontend/src/components/app-header.tsx` / `app-footer.tsx`, mobile nav | Static link to `/contact`; page not implemented. |
| Registration “contact info” step | `frontend/src/components/registration-steps/contact-step.tsx` and related i18n strings | Used only for event registrations; unrelated to a public contact form. |
| Feedback system | `backend/src/feedback/*`, `frontend/src/app/admin/feedback/*`, Swagger entries | Handles post-event surveys. No general-purpose `/api/contact` endpoint. |
| Admin messaging | `frontend/src/components/admin/send-message-dialog.tsx`, `frontend/src/app/admin/messaging/page.tsx` | Sends bulk SMS/email to registrations via existing APIs; again outbound-only. |

## Admin UI assessment

- There is **no admin page** to view arbitrary incoming contact requests. Admin-facing pages under `/admin` focus on events, registrations, messaging, payments, and feedback (survey responses) only.

## Environment / config findings

- `.env`, `.env.production`, and other config modules do **not** define SMTP credentials or any contact-related rate limit variables.
- The backend config module (`backend/src/infrastructure/config/config.module.ts`) currently validates IPPanel, OTP, JWT, Redis, Zarinpal, etc., but nothing for contact submissions or mailers.

## Conclusion

The project currently lacks:

1. A backend endpoint or database model for general “Contact Us” messages.
2. SMTP/nodemailer configuration for notification emails.
3. A public Contact page (only nav links exist).
4. Admin UI to read/manage incoming contact messages.

Next steps (per prompts): implement backend contact message storage + throttled endpoint with SMTP notifications, provide Nuxt contact page, and add admin tooling to review/triage messages.
