"""Make a clean copy of the site in deploy/, with only what a web server needs.

It copies the eight site pages, the logo files they use and the Lora font, and points the font path at the copy.
It publishes nothing: deploy/ is a local folder, ignored by git. Nothing goes live without Henrik's yes.

Run after the builds:  python -I src/make_deploy.py
"""
import pathlib, re, shutil

root = pathlib.Path(__file__).parent.parent
out = root / "deploy"
PAGES = ["index", "how-it-works", "platform", "extension", "mcp", "pilot", "trust", "404"]

if out.exists():
    shutil.rmtree(out)
(out / "logo").mkdir(parents=True)
(out / "fonts").mkdir()
shutil.copy2(root.parent / "fonts" / "Lora-wght.ttf", out / "fonts" / "Lora-wght.ttf")
shutil.copy2(root.parent / "fonts" / "Lora-OFL.txt", out / "fonts" / "Lora-OFL.txt")   # the font's licence travels with it

used, total = set(), 0
for n in PAGES:
    s = (root / (n + ".html")).read_text(encoding="utf-8")
    assert "../fonts/Lora-wght.ttf" in s, n
    s = s.replace("../fonts/Lora-wght.ttf", "fonts/Lora-wght.ttf")
    used |= set(re.findall(r'"logo/([\w\-]+\.svg)"', s))
    for ref in re.findall(r'(?:href|src)="([^"#:]+)"', s):
        if ref.endswith(".html"):
            assert ref[:-5] in PAGES, "%s links to %s, which is not a site page" % (n, ref)
    (out / (n + ".html")).write_text(s, encoding="utf-8", newline="\n")
    total += len(s.encode())
for name in sorted(used):
    shutil.copy2(root / "logo" / name, out / "logo" / name)
    total += (out / "logo" / name).stat().st_size

print("deploy/ written: %d pages, %d logo files, the font" % (len(PAGES), len(used)))
print("pages and logos: %d KB; font: %d KB" % (total // 1024, (out / "fonts" / "Lora-wght.ttf").stat().st_size // 1024))
print("still marked as drafts: every page has noindex and '(draft, not published)' in its title. See DEPLOY.md before going live.")
