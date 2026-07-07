# ADR 0004: Capacitor Ready Before Native Init

## Decision

Keep the project Capacitor-ready by default, but allow the authentication work in `/specs/auth` to
initialize/configure the Android pieces required for auth callbacks, OAuth returns, and account
deletion compliance when implementation reaches that phase.

## Rationale

The earlier MVP avoided native build overhead. `/specs/auth` is now the approved review gate for
Android authentication deep links, so auth-specific native work is no longer blocked by this ADR.
Broader native features still require their own spec.
