# Premium Spec

## Problem

Habit Compass needs a clear Premium boundary that supports monetization without making the free app
feel broken, punitive, or overloaded with sales pressure.

## Scope

- Free usage limits for active items.
- Premium entitlement behavior at the product level.
- Paywall messaging requirements for the current RevenueCat paywall.
- AI insights positioning as a future Premium feature.

RevenueCat identity, Offering setup, Customer Center, and subscription-aware account deletion are
specified in `/specs/auth/06-revenuecat-and-account-deletion.md`.

## Non-Goals

- Implementing item-limit enforcement in this spec update.
- Implementing AI insights.
- Defining AI prompts, model providers, generated insight types, safety rules, or data-retention
  behavior.
- Defining exact pricing, trials, discounts, refunds, or store-specific legal copy.
- Removing the usefulness of the free app as a simple habit/task tracker.

## User Flows

### Free user creates items

A free user can create and keep active up to:

- 5 habits.
- 10 one-time tasks.
- 5 recurrent tasks.

When a free user is below the relevant active-item limit, creation follows the normal item creation
flow.

When a free user reaches the relevant active-item limit, the app should block creating another active
item of that type and offer Premium as the path to continue.

### Free user archives or completes items

Archived items do not count against the free active-item limits.

Completed one-time tasks do not count against the active task limit. Habit completion logs and
recurrent-task occurrence completions do not make the parent habit or recurrent task inactive.

Users may keep more than the free limits in archived or completed history.

### Premium user creates items

A user with the `Habit Compass Premium` entitlement is not constrained by the free active-item
limits.

### User sees Premium paywall

The paywall should frame Premium as optional depth:

- More room to keep active habits, tasks, and recurrent tasks.
- Future AI insights for patterns, reflection, and practical next steps.
- Continued support for simple daily tracking without shame or pressure.

The paywall must not imply that the free app is useless. It must not use fake urgency, fake
scarcity, shame, or punitive streak language.

## Domain Rules

- Premium access is represented by the RevenueCat entitlement `Habit Compass Premium`.
- Non-Premium active item limits are:
  - Habits: 5 active habits.
  - Tasks: 10 active, incomplete one-time tasks.
  - Recurrent tasks: 5 active recurrent tasks.
- Active habits and recurrent tasks are items that are not archived.
- Active tasks are one-time tasks that are not archived and not completed.
- Archived habits, archived tasks, archived recurrent tasks, and completed one-time tasks remain in
  the user's history and must not be deleted to satisfy limits.
- Reactivating an archived item or reopening a completed task must respect the same active-item
  limits as creating a new active item.
- AI insights are a future Premium feature. Any implementation requires a separate AI feature spec
  covering data use, privacy, safety, explainability, user controls, and testing.
- Paywall copy may mention AI insights only as planned/future value until the feature ships.
- The free app must remain useful for a lightweight routine.

## Paywall Messaging Requirements

Use ethical persuasion that matches Habit Compass:

- Clarity and contrast: Premium gives more room and more guidance; free stays simple.
- Anchoring: present lifetime, yearly, and monthly packages consistently with RevenueCat setup.
- Loss aversion: describe avoiding scattered routines and lost context, not personal failure.
- Commitment consistency: connect Premium to the user's existing intent to track habits.
- Cognitive fluency: short, concrete sentences.

Avoid:

- Shame-based copy.
- Fake countdowns or fake scarcity.
- Unverified savings claims.
- Promises of AI behavior before the AI feature spec and implementation exist.

## Acceptance Criteria

- Given a free user has fewer than 5 active habits, when they create a habit, then creation is
  allowed.
- Given a free user has 5 active habits, when they try to create or reactivate another active habit,
  then creation/reactivation is blocked and the Premium path is offered.
- Given a free user has fewer than 10 active incomplete one-time tasks, when they create a task, then
  creation is allowed.
- Given a free user has 10 active incomplete one-time tasks, when they try to create or reopen
  another active task, then creation/reopening is blocked and the Premium path is offered.
- Given a free user has fewer than 5 active recurrent tasks, when they create a recurrent task, then
  creation is allowed.
- Given a free user has 5 active recurrent tasks, when they try to create or reactivate another
  active recurrent task, then creation/reactivation is blocked and the Premium path is offered.
- Given an item is archived, then it does not count against the free active-item limit.
- Given a one-time task is completed, then it does not count against the free active task limit.
- Given a user has the `Habit Compass Premium` entitlement, then the free active-item limits do not
  block creation, reopening, or reactivation.

## Test Plan

When item-limit enforcement is implemented:

- Add pure domain tests for active-count calculations by item type.
- Add repository or mutation tests for create, archive, complete, reopen, and reactivate flows.
- Add UI tests for the blocked-at-limit state and Premium entry point.
- Add entitlement-state tests proving Premium users bypass free limits.
- Add regression coverage proving archived items and completed one-time tasks remain accessible.
