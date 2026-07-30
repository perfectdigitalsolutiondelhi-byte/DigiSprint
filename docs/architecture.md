# DigiSprint product architecture

DigiSprint is an AI-powered Digital Marketing Assistant for Indian small businesses.

## Current release boundary

Versions 1.0-1.3 establish the product direction, authenticated Supabase session architecture, responsive product shell and guided business setup with atomic workspace provisioning.

AI requests, uploads, payments and scheduled jobs remain intentionally deferred to later versions.

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

- `/` - public marketing homepage
- `/plan` - plan architecture preview
- `/login` and `/signup` - public authentication entry points
- `/setup` - protected three-step business onboarding
- `/dashboard` - authenticated product workspace
- `/demo-profile` and `/demo-card` - legacy rollback routes pending retirement

## Current release

Version 1.3 adds a live, business-aware dashboard data layer with real setup context, post metrics, recent activity and truthful empty states. AI content generation remains the next product milestone.
