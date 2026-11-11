"""Make a clean copy of the site in deploy/, with only what a web server needs.

It copies the eight site pages, the logo files they use and the Lora font, and points the font path at the copy.
It also writes deploy-headers/ (the security headers and a Caddyfile). Those are server settings, not site files.
It publishes nothing: deploy/ is a local folder, ignored by git. Nothing goes live without Henrik's yes.

Run after the builds:
  python -I src/make_deploy.py              draft copy: noindex and draft marks stay, robots.txt says keep out
  python -I src/make_deploy.py --launch     launch copy: draft marks removed; stops if anything is not ready
  add --meta-csp                            also put the content policy in each page (for a host that cannot set headers)
"""
import base64, hashlib, pathlib, re, shutil, sys

LAUNCH = "--launch" in sys.argv
META_CSP = "--meta-csp" in sys.argv
root = pathlib.Path(__file__).parent.parent
out = root / "deploy"
hdr = root / "deploy-headers"
PAGES = ["index", "how-it-works", "platform", "extension", "mcp", "pilot", "trust", "404"]
ROBOTS = '<meta name="robots" content="noindex,nofollow">\n'
FOOT = "<span>Draft for review. Not published. No trackers, no cookies.</span>"

def empty(folder):
    # OneDrive can hold a folder open, so remove the files and keep the folders
    for f in sorted(folder.rglob("*"), reverse=True):
        if f.is_file():
            f.unlink()


if out.exists():
    empty(out)
(out / "logo").mkdir(parents=True, exist_ok=True)
(out / "fonts").mkdir(exist_ok=True)
hdr.mkdir(exist_ok=True)
shutil.copy2(root.parent / "fonts" / "Lora-wght.ttf", out / "fonts" / "Lora-wght.ttf")
shutil.copy2(root.parent / "fonts" / "Lora-OFL.txt", out / "fonts" / "Lora-OFL.txt")   # the font's licence travels with it

used, total, hashes, not_ready, texts = set(), 0, [], [], {}
for n in PAGES:
    s = (root / (n + ".html")).read_text(encoding="utf-8")
    assert "../fonts/Lora-wght.ttf" in s, n
    s = s.replace("../fonts/Lora-wght.ttf", "fonts/Lora-wght.ttf")
    used |= set(re.findall(r'"logo/([\w\-]+\.svg)"', s))
    for ref in re.findall(r'(?:href|src)="([^"#:]+)"', s):
        if ref.endswith(".html"):
            assert ref[:-5] in PAGES, "%s links to %s, which is not a site page" % (n, ref)
    assert not re.search(r'(?:href|src)="(?:https?:)?//', s), n + " loads something from another site"
    assert not re.search(r"<[^>]+\son\w+=", re.sub(r"<script[\s\S]*?</script>", "", s)), n + " has an inline event handler, which the content policy blocks"
    if LAUNCH:
        assert ROBOTS in s and FOOT in s, n
        s = s.replace(ROBOTS, "").replace(" (draft, not published)", "").replace(FOOT, "<span>No trackers, no cookies.</span>")
        seen = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", s)
        if 'class="ph"' in seen or "[Draft" in seen:
            not_ready.append(n + ": a marked placeholder is still on the page (the contact address)")
        if re.search(r"not published|draft for review", seen, re.I):
            not_ready.append(n + ": a draft mark is still in the text")
        if "noindex" in s:
            not_ready.append(n + ": noindex is still there")
    if n == "404":   # the server shows this page at any address, so its links must start at the site root
        s = re.sub(r'(href|src)="(?!#|/|[a-z]+:)', r'\1="/', s).replace('url("fonts/', 'url("/fonts/')
    texts[n] = s
    for js in re.findall(r"<script>([\s\S]*?)</script>", s):
        h = "'sha256-" + base64.b64encode(hashlib.sha256(js.encode("utf-8")).digest()).decode() + "'"
        if h not in hashes:
            hashes.append(h)
    assert "<script src" not in s and "<script " not in s, n + " has a script the content policy does not cover"

# The content policy. Scripts: only the exact inline scripts of this build (by hash). Nothing from other sites.
# img-src needs data: because the home page draws the logo from an inline SVG.
csp = ("default-src 'none'; script-src %s; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
       "base-uri 'none'; form-action 'none'; frame-ancestors 'none'") % " ".join(hashes)
HEADERS = [
    ("Content-Security-Policy", csp),
    ("Strict-Transport-Security", "max-age=31536000"),
    ("Referrer-Policy", "no-referrer"),
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()"),
    ("Cross-Origin-Opener-Policy", "same-origin"),
]

for n, s in texts.items():
    if META_CSP:   # frame-ancestors does not work in a meta tag, and HSTS cannot be set this way at all
        meta = '<meta http-equiv="Content-Security-Policy" content="%s">\n' % csp.replace("; frame-ancestors 'none'", "")
        s = s.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + meta, 1)
        assert meta in s, n
    (out / (n + ".html")).write_text(s, encoding="utf-8", newline="\n")
    total += len(s.encode())
for name in sorted(used):
    shutil.copy2(root / "logo" / name, out / "logo" / name)
    total += (out / "logo" / name).stat().st_size
(out / "robots.txt").write_text("User-agent: *\n" + ("Allow: /\n" if LAUNCH else "Disallow: /\n"), encoding="utf-8", newline="\n")

(hdr / "headers.txt").write_text("".join("%s: %s\n" % kv for kv in HEADERS), encoding="utf-8", newline="\n")
(hdr / "Caddyfile").write_text("""# Caddyfile for route B (a small EU server). Caddy gets the HTTPS certificates itself.
# Written by src/make_deploy.py. The script hashes change with every build: copy this file again after each build.
truedatasovereignty.eu, www.truedatasovereignty.eu {
    @www host www.truedatasovereignty.eu
    redir @www https://truedatasovereignty.eu{uri} permanent
    root * /srv/site
    encode zstd gzip
    file_server
    handle_errors {
        rewrite * /404.html
        file_server
    }
    header {
%s        -Server
    }
}

truedatasovereignty.com, www.truedatasovereignty.com {
    redir https://truedatasovereignty.eu{uri} permanent
}
""" % "".join('        %s "%s"\n' % kv for kv in HEADERS), encoding="utf-8", newline="\n")

print("deploy/ written (%s copy): %d pages, %d logo files, the font, robots.txt" % ("LAUNCH" if LAUNCH else "draft", len(PAGES), len(used)))
print("pages and logos: %d KB; font: %d KB" % (total // 1024, (out / "fonts" / "Lora-wght.ttf").stat().st_size // 1024))
print("deploy-headers/ written: headers.txt and Caddyfile, with %d script hashes%s" % (len(hashes), "; the policy is also inside each page" if META_CSP else ""))
if not LAUNCH:
    print("still marked as drafts: noindex, '(draft, not published)' in titles, the footer line, robots.txt Disallow. See go-live-runbook.md.")
elif not_ready:
    print("\nNOT READY to launch:")
    for x in not_ready:
        print("  - " + x)
    empty(out)
    print("deploy/ emptied again, so a copy that is not ready cannot be uploaded by mistake.")
    sys.exit(1)
else:
    print("READY: no draft marks, no placeholder. Publishing still needs Henrik's clear yes.")
