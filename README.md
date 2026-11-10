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
