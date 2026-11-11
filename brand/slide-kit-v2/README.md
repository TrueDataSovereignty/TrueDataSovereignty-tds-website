# TDS slide kit v2: the ground line (draft, 12 Nov 2026, Brand & web)

For Deck & investors' sales pitch. Nothing here is published. It replaces `web/brand/slide-kit/` once Henrik has said yes to the logo swap; until then both exist.

## Files
- `slide-kit.html`: six 16:9 templates (1280 x 720). Open it in a browser. To get a PDF, print it with margins off: one slide per page.
- `logo/`: the new logo files this kit needs, copied from `../../logo/`. The `-on-marine` files here have no background, so they sit on any marine band.
- `logo/tds-tree-no-line*.svg`: the tree without its own line, for slides where the slide's ground line runs through it (templates 1 and 6). Use these only on a ground line.
- The font is Lora, from `web/fonts/Lora-wght.ttf` (`../../../fonts/` from here), at medium weight (500) for headlines.

## The six templates
1. **Title**: kicker, product name, tagline. The gold ground line crosses the slide and runs through the logo.
2. **One big idea**: marine band, one sentence, at most 12 words, one gold phrase.
3. **Routes on the ground line**: three small drawings on one gold line: the ball passes (mask), passes into fog (generalise), or the thread curls back and seals (keep local). One sentence each.
4. **Proof tiles**: up to four numbers. Each needs its n, its 95% range and its ledger row. The gap tile is the one in dark gold.
5. **Quote**: marine band, one quote in italic, who said it.
6. **Close**: one ask and the contact. The ground line and the logo again.

## Rules for every slide
- One idea per slide. Headline at most 12 words.
- Colours: paper #FAFAF8, midnight marine #101A3D, ivory #F7F3EA, gold #DDB04A. Gold as text on paper is dark gold #8A6212, so it can be read.
- Gold means the line: the ground line, the short rule on marine slides, one phrase. Not decoration.
- The logo is one ink (marine on paper, ivory on marine) with a gold line. Do not recolour it.
- Numbers only from cleared ledger rows, with n, the 95% range and "measured on synthetic data, round one".
- Banned words: guarantee, compliant, "never leaves", tamper-proof, "zero plaintext egress", "makes you compliant".
- No "AB" until the company is registered. hello@ does not exist yet.
- Keep local: say "the local model is selected, not yet installed" wherever that route is described as running.

## To make a new slide
Copy one `<section class="slide">` block. Use `class="slide marine"` for a marine slide. Positions are in px inside the 1280 x 720 frame: `.pad` gives the 96 px side margins, and `.ground` is the gold line (set its `top`).
