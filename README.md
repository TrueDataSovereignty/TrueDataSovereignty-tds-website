# site-v3: the mycelium site (first draft, 10–11 Nov 2026, Brand & web, Fable)

Draft. Not published. Nothing here is deployed or sent.

## Open it
- `index.html`: the home page, one self-contained file. Double-click it.
- `concepts/concept-a-mycelial-gate.html`, `concept-b-descent.html`, `concept-c-rings.html`: the three hero concepts.
- Add `?still` to any address for the still frame (the same frame `prefers-reduced-motion` gets).
- The bar at the bottom is for review only. It switches the hero wording: A Henrik's words, B Compliance, C Competition (or add `?w=b` / `?w=c` to the address). Lines 1–2 stay in all three.

## Build it again
```
python -I concepts/src/make_data.py   # data.js, copied from ../how-it-works-data/cases-out.json (router a822605)
python -I concepts/src/build.py       # the three concepts
python -I src/build.py                # index.html, plus a banned-word scan
python -I shots/shoot.py index.html home   # screenshots; needs: python -m http.server 8741 --directory web
```

## Version 2 (minimal)
- Paper-light page, one dark band below ground for the network, the live scene and the rings.
- The hero shows `photos/hero.jpg` when that file exists. Until then it shows the drawn forest.
- The first dark version is commit ce702a1.
- `shots/shoot.py` can leave headless Edge processes behind when a capture fails. Check Task Manager after using it.

## Version 3 (light, marine and gold)
- Henrik, 12 Nov: "I like the light one, but we want some dark marine blue and gold in there. And make the minimalistic look, but with a minimal mycelium style. You can change font if you feel fit too."
- Light page; marine blue bands for the vision, the live scene, the record and the close; gold lines and button.
- The mycelium is a fine ink drawing (`src/ink.js`) with the real mark as the gate.
- Headlines are Lora at medium weight (500), from the same font file. Version 2 is commit 57d03e2.
- `preview.html` is the same page with the font embedded, for sending.

## The finished first site (12 Nov 2026)

Seven pages, all in the light editorial style, all self-contained, none published:
- `index.html` (home), `how-it-works.html`, `platform.html`, `extension.html`, `mcp.html`, `pilot.html`, `trust.html`.
- `preview.html` and `preview-<page>.html` are the same pages with the font and logo embedded, for sending. Do not publish those.

Build:
```
python -I logo/make_logo.py          # the logo files
python -I src/build.py               # index.html and preview.html
python -I src/build_pages.py         # the six subpages and their previews
```
- The subpages share one shell (styles, masthead, footer) in `src/build_pages.py`. Their content is in `src/pages/*.html`; the how-it-works content and its three figures are in `src/how.src.html`.
- The review bar is gone: the hero wording is settled and cleared by Compliance.
- Subpage copy for platform, extension, MCP, pilot and trust is taken from the earlier site pages (`web/platform`, `web/extension`, `web/mcp`, `web/pilot`, `web/trust.html`), with later corrections applied. It has not had a fresh Compliance read in this form.
- Before publishing: a contact address; Henrik's yes to the logo swap; a Compliance read of the five subpages; a check in Safari and Firefox and on a real phone.

## Version 4 (the ground line)
- Henrik, 12 Nov: the ground-line tree is the logo ("Ground line is my favorite"); the site is light, editorial, white and marine with gold; the hero animation has no words in it.
- The hero (`src/tree.js`) is the logo grown large: marine branches above a full-width gold line, roots with gold ends below. Balls come in, meet the line, and leave in gold, or stay.
- Logo files and their script are in `logo/`. Nothing in `web/brand/final` is replaced.
- Version 3 is commit db12535.

## Rules it follows
- Every masking example is real router output on synthetic text. `make_data.py` only slices the router's own strings, and checks that the slices rebuild them.
- The answers in the live scene were written by us (no model was called). The page says so.
- Numbers: only ledger rows N12, N13, N14, N15, V11-2 and V11-4, each with n, the 95% range and "measured on synthetic data, round one".
- Keep local: the local model is selected, not yet installed. The page says so wherever that route appears.
- Page weight before animation: about 77 KB of HTML plus the 212 KB Lora font file.

## Not done yet
- Compliance has not checked the copy.
- No contact address (hello@ does not exist). The close has a marked placeholder.
- No fallback picture for browsers without JavaScript; the text still reads.
- The body face is the system sans. No font files were added.
- Subpages: how it works, pilot, trust, platform, extension, MCP.
- Commits are local, in a git repository inside `web/site-v3` only. No remote, no push.
