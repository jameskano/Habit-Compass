# Codex Prompt — Debug and Fix Items Feature

There is an issue in the Items feature.

First:

1. Reproduce or locate the issue.
2. Identify the smallest safe fix.
3. Check the relevant Items docs before changing behavior.

Relevant docs:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
docs/features/items/06-items-test-and-verification.md
```

Rules:

- Do not rewrite unrelated code.
- Do not change product behavior unless the bug requires it.
- Do not add new dependencies unless absolutely necessary.
- Keep the fix minimal and readable.
- Add or update a test if the project has tests and the issue is testable.

After fixing:

- Run the smallest relevant verification first.
- Then run typecheck/lint/build if appropriate.
- Return:
  - Root cause.
  - Files changed.
  - Fix summary.
  - Verification results.
