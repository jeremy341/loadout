# FAQ question readability

**Status:** Implemented.

## Design read

Keep the industrial field-manual identity and pixel display lettering. Give FAQ question labels slightly more tracking so the uppercase pixel font is easier to scan.

## Scope

- Surface: homepage FAQ accordion.
- Change: increase question letter spacing from `0.04em` to `0.09em` at every viewport width.
- States: collapsed and expanded questions use the same spacing; answer copy and accordion motion are unchanged.
- Responsive: retain the existing full-width, 56px minimum-height rows on desktop and mobile.
- Accessibility: preserve the existing button semantics, focus treatment, and reduced-motion behavior.

## Acceptance

Question labels are a little easier to read while the FAQ rows, content, and interactions remain visually consistent with the current design.
