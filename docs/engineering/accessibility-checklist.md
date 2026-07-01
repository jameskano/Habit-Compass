# Accessibility Checklist

Use this checklist for UI specs, implementation, and review. Habit Compass targets practical
WCAG AA alignment, but does not claim formal compliance.

## Structure

- Use semantic elements and existing Radix/shadcn primitives before custom ARIA.
- Keep page, section, dialog, tab, menu, and list semantics meaningful.
- Do not rely on color, icon shape, or position as the only way to communicate state.

## Keyboard And Focus

- Every interactive control must be reachable and operable by keyboard.
- Focus states must remain visible in light and dark themes.
- Dialogs, sheets, popovers, and menus must trap focus while open when the primitive supports it.
- Closing an overlay should return focus to the invoking control or another sensible target.
- Escape and outside-dismiss behavior should not leave the user in a hidden or inert state.

## Names And Labels

- Icon-only buttons, custom controls, charts, status dots, and non-text actions need accessible names.
- Visible form labels are preferred; otherwise use a translated `aria-label`.
- User-facing accessible labels must go through `react-intl`.
- Decorative icons should use `aria-hidden`.

## Forms And Feedback

- Invalid fields should expose `aria-invalid` and a useful visible error message.
- Validation and mutation errors should be discoverable by screen readers.
- Loading, empty, error, and success states should have clear text, not just visual styling.

## Visual And Motion

- Text and essential UI states should meet WCAG AA contrast in supported themes.
- Touch targets for primary mobile controls should be comfortably tappable.
- Motion should be restrained and respect `motion-reduce` where practical.

## Review Checks

- Complete the changed flow using only the keyboard.
- Confirm controls can be found by role and accessible name in tests where practical.
- Check overlay focus trap and focus return.
- Run focused tests for changed UI and `pnpm test:a11y` when accessibility risk is relevant.
