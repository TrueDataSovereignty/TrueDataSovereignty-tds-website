# Deploying the site, later

Nothing here is published. Nothing goes live without Henrik's clear yes in chat. This note only makes a clean deploy copy easy when that day comes.

## What is the site, and what is working material

**Site pages (deploy these):**
- `index.html`, `how-it-works.html`, `platform.html`, `extension.html`, `mcp.html`, `pilot.html`, `trust.html`, `404.html`
- `logo/` : only the logo files those pages use (the script below picks them)
- the Lora font, `web/fonts/Lora-wght.ttf`, with its licence `Lora-OFL.txt`

**Working material (never deploy):**
- `mock.html` and `mock/` : mockups. `mock/ref-forest.webp` is a reference picture with unknown source and rights, and it may be AI-generated.
- `concepts/` : the three early hero concepts.
- `looks.html`, `logo-drafts.html`, `logo-fan.html`, `logo-mycelium.html`, `logo-through.html` : look and logo sheets.
- `logo/sheet.html`, `logo/make_logo.py`, `logo/outline.py`, and the logo files the pages do not use.
- `preview*.html` : sendable copies with the font embedded. Large, and only for review.
- `brand/slide-kit-v2/` : the slide templates for the sales pitch.
- `shots/` : screenshots and the screenshot tool.
- `src/`, `README.md`, `DEPLOY.md`, `.git`.

## Make the clean copy

```
python -I logo/make_logo.py
python -I src/build.py
python -I src/build_pages.py
python -I src/audit.py
python -I src/make_deploy.py
```

`make_deploy.py` writes `deploy/` with the eight pages, the logo files they use, and the font. It fixes the font path and stops if a page links to anything that is not a site page. `deploy/` is ignored by git.

## Before going live

1. **Henrik's yes** to publish, in chat.
2. **A contact address.** The close on the home page still shows a marked placeholder.
3. **Remove the draft marks.** Every page has `<meta name="robots" content="noindex,nofollow">` and "(draft, not published)" in its title, and the footer says "Draft for review. Not published." Change these only at go-live.
4. **The logo swap** has Henrik's yes, so the site and the other material match.
5. **Browser checks** in Safari and Firefox, and on a real phone.
6. **The server** must send `404.html` for missing pages, and the pages as UTF-8.
7. **If the repository is ever made public:** remove `mock/` and `mock.html` from the history first.
