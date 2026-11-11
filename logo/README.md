# The ground-line logo (draft)

Henrik chose this direction on 12 Nov 2026: "Ground line is my favorite".
Threads gather from above, pass one gold ground line, and spread again below. Marine in, gold out.

- `make_logo.py` writes the six `.svg` files and `sheet.html`. The growth is seeded, so the drawing is the same on every run.
- Gold is on the line only (Henrik, 12 Nov). The tree is one ink: marine on light, ivory on marine. One-ink files have the line in the same ink.
- The dark ink is midnight marine (#101A3D), not black (Henrik, 12 Nov: "yes, lets go with the dark midnight ice marine and not black"). One true-black file exists as a production fallback only: `tds-tree-production-true-black.svg`.
- `small` is THE small logo (Henrik, 12 Nov 2026): five branch ends, five root ends, one trunk, one thick line. Drawn by hand in `hand()`. Use it wherever the logo is small: header, footer, browser tab, app and extension icons, small lockups.
- Colour rule: on light, marine tree with a gold line (`tds-tree-small.svg`). On dark, white tree with a gold line (`tds-tree-small-on-marine.svg`). Full dark (`-one-ink`), full black (`-black`) and full white (`-one-ink-reversed`) also exist.
- `tds-favicon.svg` is the small logo for the browser tab; its tree turns white when the browser is in dark mode.
- `png/` holds transparent PNG copies at 16, 32, 48, 128 and 512 px: `tds-icon-*` (colour, for light), `tds-icon-on-dark-*`, `tds-icon-black-*`, `tds-icon-white-*`. Drawn by `make_logo.py` with Pillow.
- The old three-and-three `tiny` cut is retired.
- Lockups (horizontal and stacked; colour, on marine, one ink) have the name as outlines. `outline.py` reads the letter shapes from `web/fonts/Lora-wght.ttf` (Lora Regular), so the files need no font.
- Draft. Nothing in `web/brand/final` is replaced. A logo swap needs Henrik's explicit decision, since it touches the deck, the extension icon and the reports.
