# Harness Cases

Habit Compass harness coverage currently focuses on deterministic non-UI logic that is risky enough to justify direct pure-function tests before broader feature work.

## Covered Areas

- Frequency and goal evaluation:
  - binary daily habits
  - times per week
  - times per month
  - repetitions per period
  - time per session
  - total time per week
  - quantity per session
  - total quantity per month
  - specific days of week
  - future advanced recurrence placeholder
- Habit completion evaluation:
  - completed
  - derived missed days
  - skipped
  - partial progress
  - minimum and standard level handling
- Stats:
  - completion percentage
  - calendar completion state
  - period progress
- Suggestions:
  - low mood adjustment
  - repeated misses
  - category neglect
  - overloaded day
  - inactive user recovery
  - no-suggestion baseline
- Reset and lifecycle:
  - soft reset
  - hard reset confirmation
  - archive
  - confirmed physical item deletion through repository behavior

## Intent

These harnesses protect the highest-risk branching behavior while the product still has minimal UI. They are deliberately pure, deterministic, and disconnected from Supabase, routing, or React components.
