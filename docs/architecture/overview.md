# Architecture Overview

Habit Compass separates app composition, feature UI, domain rules, shared utilities, and integrations.

- `src/app`: providers, router, and layout.
- `src/features`: route-level feature surfaces.
- `src/domain`: pure types and rules.
- `src/shared`: reusable UI, hooks, types, constants, config, and library helpers.
- `src/integrations`: external service boundaries.
