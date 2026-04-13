## 2026-04-13 - [Visual Iconography in Selection Lists]
**Learning:** Abstract placeholders like letters (e.g., 'S' for Settlement) are less intuitive than visual icons (Flags, Unit Sprites). Including unit owner flags on unit icons provides immediate visual context of allegiance without needing to read text.
**Action:** Prefer using existing `Sprite` and `Flag` components in selection lists and panels to improve recognition speed and visual delight.

## 2026-04-13 - [Keyboard Accessibility in Interactive Modals]
**Learning:** Many game UI elements rely solely on hover/click states. Adding `focus-visible:ring-2` and `aria-label` to selection buttons ensures that keyboard-only users can navigate and understand the interface.
**Action:** Always include focus indicators and descriptive ARIA labels for icon-heavy or list-based interactive elements.
