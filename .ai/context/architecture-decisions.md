# Architecture Decisions

- Domain logic lives in `src/domain/*` and should be pure where possible.
- Feature UI lives in `src/features/*`.
- Shared UI primitives live in `src/shared/ui`.
- Server integration code lives in `src/integrations/*`.
- App composition lives in `src/app/*`.
- User-facing copy lives in `src/i18n`.
- Specs are the source of truth for behavior.

Record durable decisions as ADRs in `docs/adr`.
