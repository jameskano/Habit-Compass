# Category Domain Spec

## Problem

Users need lightweight optional labels for organizing habits, tasks, and recurrent tasks.

## Scope

- Category definitions.
- Optional assignment from items.
- Settings-based management, contextual creation, and confirmed physical delete behavior.

## Non-Goals

- Role/value/type/orientation taxonomy.
- Nested category trees.
- Multiple categories per item in MVP.

## Functional Requirements

- Categories are customizable labels with `name`, required `iconName`, required `colorToken`, and `order`.
- Every user has protected defaults: `Wellbeing`, `Family`, `Relationships`, `Career`,
  `Learning`, `Finance`, `Home`, `Projects`, `Creativity`, `Leisure`, `Growth`,
  `Reflection`, `Community`, `Meaning`, and `Uncategorized`.
- Protected defaults use stable `defaultKey` values: `wellbeing`, `family`,
  `relationships`, `career`, `learning`, `finance`, `home`, `projects`, `creativity`,
  `leisure`, `growth`, `reflection`, `community`, `meaning`, and `uncategorized`.
- `isDefault` marks protected defaults. Default category names and deletion are blocked.
- Custom categories must have `defaultKey = null` and `isDefault = false`.
- Items may reference zero or one category at rest. Habits require one category and fall back to
  the protected `Uncategorized` category when a custom category is deleted. Tasks and recurrent
  tasks keep category optional.
- Delete physically removes a custom category after explicit confirmation and does not delete linked items.
- Category icons use app-owned Lucide icon keys; colors use the exact `CATEGORY_COLOR_PALETTE`
  token set.
- Category creation uses required name, icon, and color inputs plus optional description. New
  user-created categories are ordered after existing categories and not marked default.

## Data Model

- `Category`
  - `id`
  - `userId`
  - `createdAt`
  - `updatedAt`
  - `name`
  - `description`
  - `iconName`
  - `colorToken`
  - `order`
  - `isDefault`
  - `defaultKey`

## Acceptance Criteria

- Categories can be created without role, value, type, or orientation metadata.
- Categories require icon and color metadata for their visual token.
- The protected defaults are provisioned for each user and cannot be renamed or deleted.
- Custom category deletion is atomic: habits move to Uncategorized, tasks and recurrent tasks clear
  their category, and the category row is physically removed.
- Settings exposes category management at `/settings/categories`; item create/edit forms can open
  contextual category creation without losing the interrupted form state.
- Category management includes brief contextual help explaining that categories can represent life
  areas, roles, or values without adding category type metadata.

## Test Plan

- Schema tests for required icon/color/default metadata and rejection of type/orientation fields.
- Unit tests for protected defaults, icon registry fallback/search, and the 24-color palette.
- Repository tests for protected default blocking and custom delete reassignment behavior.
