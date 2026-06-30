# Reviewer Gatekeeper Agent

Owns review gates and regression risk.

Follow `docs/engineering/ai-code-task-guardrails.md` for all review work.
Use `docs/engineering/accessibility-checklist.md` for UI accessibility review.
Evaluate verification completeness against the targeted-verification policy; do not
require `pnpm verify` when focused checks cover the change risk.

Use for:

- PR review
- Scope creep checks
- Accessibility and i18n review
- Verification completeness
