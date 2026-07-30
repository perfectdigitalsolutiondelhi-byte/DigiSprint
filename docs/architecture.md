# DigiSprint product architecture

DigiSprint is an AI-powered Digital Marketing Assistant for Indian small businesses.

## Current release boundary

Version 1.0 establishes the product direction, public marketing surface, responsive product shell, dashboard preview, plan architecture, environment contract and Supabase-ready foundation schema.

Authentication, live database access, AI requests, uploads, payments and scheduled jobs are intentionally deferred to later versions.

## Canonical source layout

The active application uses the root `app/` and `components/` directories. The older `src/` application remains temporarily for migration safety and must not receive new product work.

## Product principles

- Mobile-first for owner-operated businesses
- India-first festival and language context
- Editable AI output rather than one-click publishing
- Server-controlled AI and billing requests
- Tenant isolation through business membership and RLS
- Provider-independent AI and payment adapters
- Asynchronous jobs for costly generation work

## Route ownership

- `/` — public marketing homepage
- `/plan` — plan architecture preview
- `/dashboard` — Version 1.0 product-shell preview
- `/demo-profile` and `/demo-card` — legacy rollback routes pending retirement

## Next release

Version 1.1 introduces Supabase clients, authentication routes, session middleware and profile provisioning. The Version 1.0 dashboard must remain read-only until that work is complete.
