## 2026-04-13 - [Visual Iconography in Selection Lists]
**Learning:** Abstract placeholders like letters (e.g., 'S' for Settlement) are less intuitive than visual icons (Flags, Unit Sprites). Including unit owner flags on unit icons provides immediate visual context of allegiance without needing to read text.
**Action:** Prefer using existing `Sprite` and `Flag` components in selection lists and panels to improve recognition speed and visual delight.

## 2026-04-13 - [Keyboard Accessibility in Interactive Modals]
**Learning:** Many game UI elements rely solely on hover/click states. Adding `focus-visible:ring-2` and `aria-label` to selection buttons ensures that keyboard-only users can navigate and understand the interface.
**Action:** Always include focus indicators and descriptive ARIA labels for icon-heavy or list-based interactive elements.

## 2026-04-20 - [Visual Context in Cargo Inventories]
**Learning:** Text-only inventory lists are slow to parse mentally. Adding 16px resource icons provides immediate visual recognition of cargo contents, aligning with the "recognition over recall" usability heuristic.
**Action:** Use `ResourceIcon` in all inventory contexts (Units, Settlements, Trade) to ensure consistent visual language for goods.

## 2026-04-27 - [Consistent Modal Dismissal and Keyboard Support]
**Learning:** Forcing users to reach for the mouse to dismiss or confirm a disruptive modal (like an "End Turn" warning) breaks game flow. However, global keyboard listeners must respect the focused element; overriding `Enter` when a different button is focused creates deceptive and destructive interactions.
**Action:** Use `Escape` for dismissal, but rely on standard browser behavior for `Enter` by using `autoFocus` on the preferred (safest) button. Implement ARIA attributes (`role="alertdialog"`) for all confirmation modals.

## 2026-05-04 - [Contextual Accessibility with Keyboard Hints]
**Learning:** In keyboard-heavy interfaces like games, standard ARIA labels are insufficient if they don't communicate the shortcut. Including the shortcut key in the `aria-label` (e.g., "Load Game (L)") and using the `title` attribute to explain disabled states (e.g., "Requires a Ship") significantly reduces user frustration and cognitive load.
**Action:** Always include keyboard shortcut hints in `aria-label` and descriptive reasonings in `title` for buttons that can be disabled.
