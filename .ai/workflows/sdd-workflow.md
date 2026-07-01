# SDD Workflow

Use this as the normal workflow for feature work.

1. Read `AGENTS.md` for the always-on operating contract.
2. Identify the relevant MVP or feature spec.
3. Read `docs/engineering/ai-code-task-guardrails.md`.
4. If no spec exists, create one from `specs/_templates/feature-spec.md`.
5. Write requirements and acceptance criteria before implementation.
6. Define domain behavior separately from UI behavior.
7. For UI changes, apply `docs/engineering/accessibility-checklist.md`.
8. Implement the smallest useful slice.
9. Add or update tests for domain behavior and user-facing flows.
10. Run `.ai/workflows/review-gates.md` and verification commands.
11. Update documentation if architecture, behavior, or workflow changes.
