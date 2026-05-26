# Codex Prompt — Architecture Review Before Coding

Review your proposed Items implementation plan against the existing codebase.

Do not code yet.

Check:

1. Does the plan follow the current project architecture?
2. Does it reuse existing UI components where possible?
3. Does it avoid unnecessary dependencies?
4. Does it keep utilities pure and testable?
5. Does it avoid building unrelated Today, Week, Mood, AI, or deep analytics features?
6. Does it preserve the locked product decisions from the Items docs?
7. Does it separate source-of-truth logs from derived stats?
8. Does it keep the first implementation realistic for a solo developer?

Then return:

- Final file plan.
- Any dependency recommendation, with justification.
- Any simplification you recommend before implementation.
- Exact first phase to implement.

Do not modify files until explicitly asked.
