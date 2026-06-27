# AI Code Task Guardrails

These guardrails apply to every AI-assisted coding task in Habit Compass: new features,
refactors, bug fixes, reviews, migrations, test work, and UI changes. They extend
`AGENTS.md`, `.github/copilot-instructions.md`, the relevant specs, and the existing
engineering docs.

## Related Skills And Agents

- Use `.ai/skills/ai-context-maintenance` when specs, docs, prompts, or agent
  instructions drift from implementation.
- Use `.ai/skills/react-component-architecture` when creating, reviewing, or refactoring
  React components.
- Use `.ai/agents/reviewer-gatekeeper.md` for code review, regression risk, i18n,
  accessibility, scope creep, and verification checks.

## Do Not Invent Scope

- Do not invent requirements, APIs, components, hooks, utilities, models, environment
  variables, routes, translations, design tokens, business rules, or product behavior.
- If behavior changes, read or update the relevant spec before implementation.
- If information is missing, explicitly record it as an assumption or open question in the
  spec, PR notes, implementation notes, or review notes.
- If a decision cannot be verified from the repository, mark it as an assumption and keep
  the implementation isolated.
- Separate confirmed facts from assumptions and open questions in every spec or planning
  note.

## Search Before Creating

- Before creating something new, search the repository for an equivalent or similar
  implementation.
- Reuse existing components, hooks, services, utilities, models, constants, styles,
  translation keys, and domain exports when they already fit.
- Extend an existing implementation when the new behavior is compatible with its current
  responsibility.
- Create a new file or module only when existing code does not fit cleanly.
- Introduce a new architectural pattern only when required by the spec and documented.

## Avoid Duplication

- Do not duplicate business logic, API calls, formatting logic, validation logic,
  navigation logic, or transformation logic.
- If existing code is almost suitable, prefer a small safe extension over duplicating it.
- Extract shared logic when two or more places need the same behavior.
- If duplication is unavoidable, document why and consider extracting a shared utility.

## Keep Abstractions Small

- Do not add generic frameworks, factories, registries, managers, or complex abstractions
  unless there is a clear current need.
- Do not optimize prematurely.
- Do not create reusable abstractions for one use case unless the abstraction significantly
  improves clarity.
- Avoid excessive configuration, indirection, and deeply nested patterns.
- Prefer small explicit functions over clever generic logic.
- If a task is small, keep the implementation small.

## Separate Responsibilities

- Keep types in `*.types.ts` when they are shared across files or clarify a contract.
- Keep static options, maps, labels, defaults, and config in `*.constants.ts`.
- Keep pure calculations, formatting, filtering, sorting, grouping, mapping, validation
  helpers, and transformation logic in `*.utils.ts`.
- Keep API calls, repository access, and service integrations outside React components.
- Keep non-trivial state, effects, forms, mutation orchestration, and event sequencing in
  `use*.ts` hooks.
- Keep global state in the established state layer only; use Zustand only for local
  UI/app state.
- Prefer feature-local modules before promoting code to `src/shared` or `src/domain`.

## React Code Organization

- Component files should mainly contain JSX composition, simple local UI state, hook calls,
  and event wiring.
- Do not mix rendering, API calls, data transformation, validation, navigation logic, and
  business rules in the same component.
- Prefer small, focused components, hooks, and functions.
- Each function should do one clear thing.
- Split complex logic into named helper functions.
- Split large components into smaller presentational or feature components when it
  improves readability.
- Avoid functions with many unrelated branches or responsibilities.
- Keep extracted functions meaningful; do not split code so much that readability becomes
  worse.
- Prefer descriptive function names that explain intent.

See `docs/engineering/react-code-organization.md` for detailed React extraction guidance.

## Verification

- Add or preserve focused tests for extracted pure utilities and behavior changes.
- Run the narrowest useful check first, then broader verification when practical.
- Use `pnpm verify` as the broad verification command unless the environment prevents it.
- If a command cannot run, report the blocker and the verification that was skipped.
