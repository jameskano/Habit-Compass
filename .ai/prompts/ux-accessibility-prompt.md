# UX Accessibility Prompt

Use this prompt to shape, review, or fix Habit Compass user flows, onboarding, settings, empty states, forms, dialogs, accessibility, progressive disclosure, or humane UX copy.

## Inputs

- UX target: `[flow-or-screen]`
- Relevant spec or source: `[spec-path-or-file]`
- User action or state: `[action-or-state]`
- Implementation status: `[plan|in-progress|review|fix]`

## Required Context

Read before acting:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/context/domain-glossary.md`
5. `docs/product/user-flows.md`
6. `docs/engineering/accessibility-checklist.md`
7. `docs/engineering/ai-code-task-guardrails.md`
8. Relevant specs and implementation files.

Use these when relevant:

- `.agents/skills/fixing-accessibility`
- `.agents/skills/ui-feature-implementation`
- `.agents/skills/frontend-design`
- `.agents/skills/impeccable` for visual design, redesign, polish, or UI craft.
- `.ai/agents/ux-architect.md`
- `.ai/agents/frontend-feature-engineer.md` when the UX is ready to implement.
- `.ai/agents/reviewer-gatekeeper.md` for final accessibility and regression review.

## Workflow

1. Confirm the user goal, primary path, optional-depth boundaries, and relevant spec behavior.
2. Define loading, empty, error, success, disabled, permission, and destructive or reversible states when relevant.
3. Check accessible names, labels, keyboard access, focus management, semantics, error linkage, announcements, contrast, and reduced motion.
4. Keep copy humane, non-punitive, and aligned with domain terms.
5. Prefer native elements and established accessible primitives over custom interactions.
6. For UI implementation or polish, verify responsive behavior and rendered states when practical.

## Output

Return:

- UX behavior or accessibility fixes.
- Copy or state guidance.
- Files changed or planned.
- Verification run or recommended.
- Remaining UX, accessibility, or spec risks.

## Guardrails

- Do not invent backend, domain, or permission rules.
- Do not make optional depth block simple tracking.
- Do not rely on toasts as the only critical feedback.
- Do not add ARIA where native semantics solve the issue.
