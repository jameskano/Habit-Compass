# AI Instruction System

Habit Compass keeps always-on AI instructions short and pushes detailed guidance into files that are loaded only when relevant.

## Hierarchy

- `AGENTS.md`: always-on Codex operating contract. Keep it concise: required reading, product guardrails, core engineering rules, React structure rules, scope control, and verification.
- `.github/copilot-instructions.md`: always-on GitHub Copilot rules. Keep it aligned with `AGENTS.md`, but optimized for short coding assistance.
- `.ai/context/`: durable project context such as product direction, principles, tech stack, non-goals, and glossary.
- `specs/`: behavior contracts. Product behavior changes require an existing or updated relevant spec.
- `docs/engineering/`: detailed engineering guidance that should be linked from always-on files instead of copied into them.
- `.ai/skills/`: task-specific workflows loaded only when relevant, such as React component architecture or feature-spec writing.
- `.ai/prompts/` and `.ai/workflows/`: reusable task prompts and process checklists for larger planned work.

## Placement Rules

- Put short rules that must always apply in `AGENTS.md` or `.github/copilot-instructions.md`.
- Put detailed explanations, examples, and tradeoffs in `docs/engineering/`.
- Put task-triggered procedures in `.ai/skills/`.
- Put product behavior in `specs/`, not only in prompts or agent instructions.
- Avoid copying long rule sets across files; link to the deeper source instead.

## Maintenance

When instructions drift, update the smallest source of truth that fixes the drift. Preserve the short always-on contracts, and prefer adding links over duplicating full guidance.
