# Category Domain Spec

## Problem

Users need lightweight optional labels for organizing habits, tasks, and recurrent tasks.

## Scope

- Category definitions.
- Optional assignment from items.
- Archive and confirmed physical delete behavior.

## Non-Goals

- Role/value/type/orientation taxonomy.
- Nested category trees.
- Multiple categories per item in MVP.

## Functional Requirements

- Categories are customizable labels with `name`, required `iconName`, required `colorToken`, and `order`.
- Items may reference zero or one category.
- Category lifecycle status is limited to `active` and `archived`.
- Delete physically removes a category after explicit confirmation and does not delete linked items.
- A category may remain marked as a starter/default label without imposing a category type.

## Data Model

- `Category`
  - base item entity fields
  - `name`
  - `description`
  - `iconName`
  - `colorToken`
  - `order`
  - `lifecycleStatus`
  - `isDefault`

## Acceptance Criteria

- Categories can be created without role, value, type, or orientation metadata.
- Categories require icon and color metadata for their visual token.
- Items can remain uncategorized.
- Archive is reversible and delete removes the category from storage.
- Deleting a category leaves linked items intact with no category assignment.

## Test Plan

- Schema tests for required icon/color customizable labels and rejection of type/orientation fields.
- Repository tests for archive and physical delete unlinking behavior.
