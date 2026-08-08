# Marketing Strategy Engine

## Architecture

Version 1.5 is an additive feature consumer of the Version 1.4 AI Core. Feature code validates user intent, resolves the authenticated business, evaluates the response cache, then calls `runAIRequest()`. Provider access remains isolated inside the OpenAI adapter.

## Lifecycle

Dashboard → Strategy workspace → authenticated generation → cache check → AI Core → structured validation → generated content → review → acceptance → history → regeneration.

## Prompt

- Feature key: `marketing_strategy`
- Prompt key: `marketing_strategy_complete`
- Prompt version: `1`
- Model profile: `balanced`

The prompt treats business text as data and prohibits invented competitor names, keyword volumes, market statistics, advertising results, revenue projections, rankings, and guarantees.

## Validation

Strict Zod contracts bound all strings and arrays. The calendar requires 30 unique sequential days. Invalid or partial provider output is rejected before storage.

## Storage

Strategies use existing `ai_jobs`, `generated_content`, `ai_usage_events`, and `ai_settings`. Status begins as `generated`; acceptance uses `accepted`, and older accepted strategies can become `archived`. Versions are derived chronologically and earlier records remain immutable.

## Caching and idempotency

The cache compares a deterministic hash of the current business context with the latest saved context snapshot, plus feature key and prompt version. Explicit regeneration bypasses the cache. Existing AI job idempotency prevents repeated submission.

## Security

All actions are authenticated, business membership is resolved server-side, reads and mutations are tenant-scoped, and RLS remains the final database boundary. No provider secret or SDK is exposed to the browser.

## Future compatibility

Structured content reserves schema/editability metadata and an unset feedback envelope. Future AI consumers must use the same service → prompt registry → context → provider registry → validation → storage pipeline.

Reserved future feature families: marketing_strategy, daily_post, festival_post, seo_audit, website_copy, email_campaign, ad_copy, social_calendar, resume_builder, mini_profile. Only `marketing_strategy_complete` is implemented in Version 1.5.
