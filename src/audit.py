"""A static accessibility check of the built pages. No browser needed.

It checks what can be read from the files: colour pairs against WCAG AA (4.5:1 for text),
alt text, canvas labels, the skip link, one h1 per page, the language, focus styles, reduced motion.
It does not replace a look by eye or a real screen-reader test.

Run:  python -I src/audit.py
"""
import pathlib, re

root = pathlib.Path(__file__).parent.parent
PAGES = ["index", "how-it-works", "platform", "extension", "mcp", "pilot", "trust", "about", "privacy", "404"]


def lum(h):
    h = h.lstrip("#")
    v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    v = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in v]
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def over(fg, bg, alpha):
    """A see-through colour laid over a background, as one flat colour."""
    f, b = fg.lstrip("#"), bg.lstrip("#")
    return "#" + "".join("%02X" % round(int(f[i:i + 2], 16) * alpha + int(b[i:i + 2], 16) * (1 - alpha)) for i in (0, 2, 4))


PAPER, FOG, MARINE = "#FAFAF8", "#EDF0EF", "#101A3D"
# every text colour the site uses, on the ground it sits on
PAIRS = [
    ("body text, navy on paper", "#101A3D", PAPER),
    ("body text, navy on the hero's grey end", "#101A3D", FOG),
    ("soft text and labels on paper", "#4D5672", PAPER),
    ("soft text on the hero's grey end (figure caption)", "#4D5672", FOG),
    ("dark gold text on paper (kicker, arrows, gap number)", "#8A6212", PAPER),
    ("dark gold kicker on the hero", "#8A6212", "#F4F5F4"),
    ("nav links, navy at 85% on paper", over("#101A3D", PAPER, 0.85), PAPER),
    ("button: ink on gold", "#060A1A", "#DDB04A"),
    ("ivory text on marine", "#F7F3EA", MARINE),
    ("soft text on marine", "#AEB6CE", MARINE),
    ("gold text on marine (step numbers)", "#DDB04A", MARINE),
    ("light gold on marine (placeholder note, record title)", "#F8DF9C", MARINE),
    ("example text on marine", "#D5D9E6", MARINE),
    ("masked token, teal on its tint", "#5FD9C6", over("#5FD9C6", MARINE, 0.12)),
    ("widened token, moss on its tint", "#8FAE6B", over("#8FAE6B", MARINE, 0.16)),
    ("found token, light gold on its tint", "#F8DF9C", over("#DDB04A", MARINE, 0.14)),
    ("verdict in moss on marine", "#8FAE6B", MARINE),
    ("verdict in teal on marine", "#5FD9C6", MARINE),
    ("footer links, ivory on marine", "#F7F3EA", MARINE),
]

problems = 0
print("Colour pairs (text needs 4.5:1)")
for name, fg, bg in PAIRS:
    r = ratio(fg, bg)
    flag = "" if r >= 4.5 else "   <-- TOO LOW"
    problems += r < 4.5
    print("  %5.2f  %s%s" % (r, name, flag))

print("\nFocus outline (needs 3:1 against its ground)")
for name, fg, bg in (("navy outline on paper", "#101A3D", PAPER), ("light gold outline on marine", "#F8DF9C", MARINE), ("navy outline around the gold button, on paper", "#101A3D", PAPER)):
    r = ratio(fg, bg); problems += r < 3
    print("  %5.2f  %s%s" % (r, name, "" if r >= 3 else "   <-- TOO LOW"))

print("\nPages")
for n in PAGES:
    s = (root / (n + ".html")).read_text(encoding="utf-8")
    body = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", s)
    issues = []
    if not re.search(r'<html lang="en"', s): issues.append("no lang")
    if len(re.findall(r"<h1[\s>]", body)) != 1: issues.append("h1 count %d" % len(re.findall(r"<h1[\s>]", body)))
    if not ('class="skip" href="#main"' in body and 'id="main"' in body): issues.append("skip link")
    no_alt = [m for m in re.findall(r"<img\b[^>]*>", body) if " alt=" not in m]
    if no_alt: issues.append("%d img without alt" % len(no_alt))
    bad_cv = [m for m in re.findall(r"<canvas\b[^>]*>", body) if "aria-hidden" not in m and "aria-label" not in m]
    if bad_cv: issues.append("%d canvas without a label" % len(bad_cv))
    if ":focus-visible{outline:2px solid #101A3D" not in s: issues.append("no focus style")
    if re.search(r"<a\b(?![^>]*\bhref=)[^>]*>", body): issues.append("link without href")
    if re.search(r'<div[^>]*onclick|<span[^>]*onclick', body): issues.append("click handler on a non-button")
    if "prefers-reduced-motion" not in s: issues.append("no reduced-motion rule")
    heads = [int(h) for h in re.findall(r"<h([1-6])[\s>]", body)]
    if any(b - a > 1 for a, b in zip(heads, heads[1:])): issues.append("heading level skipped")
    problems += len(issues)
    print("  %-14s %s" % (n, "; ".join(issues) or "ok"))
print("\nproblems:", problems)
