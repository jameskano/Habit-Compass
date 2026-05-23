# Category Domain Spec

## Problem

Users need lightweight grouping for habits and tasks, while the product keeps its default orientation toward roles and values.

## User Value

- Categories help organize items without forcing users into a complex taxonomy.
- Users who care about roles or values can express them, while simple users can keep categories minimal or ignore them.

## Scope

- Category definitions.
- Category orientation.
- Archive and delete behavior.
- Optional category assignment from habits, tasks, and recurrent tasks.

## Non-Goals

- Deep collections as a primary product concept.
- Nested category trees.
- Multi-category assignment in MVP.

## User Stories

- As a user, I can create a custom category.
- As a user, I can use role-oriented or value-oriented categories.
- As a user, I can leave an item uncategorized.

## Functional Requirements

- Categories must support `role`, `value`, and `custom` orientation.
- Categories must be fully customizable.
- Items may reference zero or one category in MVP.
- Categories must support active, archived, and deleted lifecycle state.
- The model may mark a category as a default template or starter category.

## Non-Functional Requirements

- Category use must remain optional.
- The domain model must not force roles or values for all users.

## Data Model

- `Category`
  - base entity fields
  - `name`
  - `description`
  - `colorToken`
  - `iconName`
  - `orientation`
  - `lifecycleStatus`
  - `isDefault`

## UI States

- No categories configured.
- Active category state.
- Archived category state.
- Uncategorized item state.

## Edge Cases

- Deleting a category must not imply deleting linked items.
- Role/value defaults must remain editable.
- An empty name is invalid.

## Acceptance Criteria

- Categories can be created in custom, role, or value orientation.
- Items are allowed to remain uncategorized.
- Archive and delete are supported separately from item lifecycle.

## Test Plan

- Schema tests for minimal and optional category payloads.
- Unit tests for valid orientations.
- Unit tests ensuring linked items can still exist without a category value.
