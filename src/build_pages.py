"""Build the subpages: how-it-works, platform, extension, mcp, pilot, trust.

One shared shell (styles, masthead, footer) and one content file per page in src/pages/.
The styles and the three route figures come from how.src.html, so all pages look alike.
Each page is also written as preview-<name>.html with the font and logo embedded, for sending.
"""
import base64, pathlib, re, urllib.parse

src = pathlib.Path(__file__).parent
root = src.parent
how = (src / "how.src.html").read_text(encoding="utf-8")
css = how[how.index("<style>") + 7:how.index("</style>")]
css = css.replace("{{base.css}}", (root / "concepts" / "src" / "base.css").read_text(encoding="utf-8").replace("../../fonts/", "../fonts/"))
how_main = how[how.index('<main id="main">') + len('<main id="main">'):how.index("</main>")]
how_script = how[how.rindex("<script>") + 8:how.rindex("</script>")].replace("{{mycel.js}}", (root / "concepts" / "src" / "mycel.js").read_text(encoding="utf-8"))

EXTRA = """
:focus-visible{outline:2px solid #101A3D;outline-offset:3px}
.marine :focus-visible,.soil :focus-visible{outline-color:#F8DF9C}
.cta:focus-visible{outline-offset:4px}
.block{padding:clamp(40px,8vh,90px) 0;border-top:1px solid var(--rule)}
.sec.wide{max-width:1120px}
.cols2,.cols3{display:grid;gap:clamp(22px,4vw,56px);margin-top:34px}
.cols2{grid-template-columns:repeat(2,minmax(0,1fr));max-width:1000px}
.cols3{grid-template-columns:repeat(3,minmax(0,1fr));max-width:1120px}
.cols2>div,.cols3>div{border-top:2px solid var(--gold);padding-top:18px}
.cols2 p,.cols3 p{font-size:16px;margin:0 0 10px}
.lim{color:var(--soft);font-size:14px !important}
ul.plain{list-style:none;margin:0;padding:0}ul.plain li{padding:8px 0;border-top:1px solid var(--rule);font-size:16px}
.src{display:block;font:400 12px/1.4 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin-top:6px}
a.text{color:inherit;text-decoration:underline;text-decoration-color:var(--gold);text-underline-offset:4px}
.after{margin-top:44px}
.ph{font:400 13px/1.6 var(--sans);color:#8A6212;border:1px dashed #8A6212;border-radius:2px;padding:1px 6px}
.sitemap{display:flex;flex-wrap:wrap;gap:6px 22px;margin:10px 0 6px}
.sitemap a{color:var(--ivory);text-decoration:none;font-size:14px}.sitemap a:hover{text-decoration:underline}
@media (max-width:859px){.cols2,.cols3{grid-template-columns:1fr}}
"""
EXTRA += (src / "flow.css").read_text(encoding="utf-8")       # the header that stays, the scroll mark, the reading template
HEADMARK = (src / "headmark.html").read_text(encoding="utf-8").strip()
FLOW = (src / "flow.js").read_text(encoding="utf-8")
NAV = [("how-it-works", "How it works"), ("platform", "Product"), ("extension", "Extension"), ("mcp", "MCP"), ("pilot", "Pilot"), ("trust", "Trust")]


def nav(current):
    links = "".join('<a href="%s.html"%s>%s</a>' % (k, ' aria-current="page"' if k == current else "", label) for k, label in NAV)
    return links + '<a class="keep" href="index.html#contact">Contact</a>'


def sitemap():
    return '<a href="index.html">Home</a>' + "".join('<a href="%s.html">%s</a>' % (k, label) for k, label in NAV) + '<a href="about.html">About</a><a href="index.html#contact">Contact</a><a href="privacy.html">Privacy</a>'


def shell(name, title, desc, main, script=""):
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>%s</title>
<meta name="description" content="%s">
<link rel="icon" href="logo/tds-favicon.svg">
<style>%s%s</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="home" href="index.html">%s<span>True Data Sovereignty</span></a>
  <nav aria-label="Site">%s</nav>
</header>
<main id="main">%s</main>
<footer class="marine">
  <div class="l"><img src="logo/tds-tree-small-on-marine.svg" alt="" width="34" height="34"><span>True Data Sovereignty</span></div>
  <span>Data Sovereignty, beyond paper contracts.</span>
  <nav class="sitemap" aria-label="All pages">%s</nav>
  <span>TDS is a prototype. Every figure on this site is measured on synthetic data, round one.</span>
  <span>Draft for review. Not published. No trackers, no cookies.</span>
</footer>
%s<script>
%s</script>
</body>
</html>
""" % (title, desc, css, EXTRA, HEADMARK, nav(name), main, sitemap(), "<script>%s</script>\n" % script if script else "", FLOW)


def read_layout(t):
    """The reading template. A page file marked <!--layout: read--> has three parts, split by <!--side--> and <!--body-->:
    the head (label, h1, standfirst), extra lines for the side column, and the body as <section id> blocks with an h2 each.
    The "On this page" list is made from those h2 headings."""
    head, rest = t.split("<!--side-->")
    side, body = rest.split("<!--body-->")
    toc = "".join('<a href="#%s">%s</a>' % (i, re.sub(r"<[^>]+>", "", h).rstrip("."))
                  for i, h in re.findall(r'<section id="([\w\-]+)"[^>]*>\s*<h2[^>]*>(.*?)</h2>', body))
    assert toc, "a reading page needs <section id=...><h2> blocks"
    return """<div class="wrap">
  <div class="read-head">%s</div>
  <div class="read-grid">
    <aside class="read-side"><div class="in"><p class="lab">On this page</p><nav aria-label="On this page">%s</nav>%s</div></aside>
    <article class="read-body">%s</article>
  </div>
</div>
""" % (head.strip(), toc, side.strip(), body.strip())


banned = ["guarantee", "compliant", "never leaves", "tamper-proof", "zero plaintext egress", " AB ", "hello@"]
font = "data:font/ttf;base64," + base64.b64encode((root.parent / "fonts" / "Lora-wght.ttf").read_bytes()).decode()


def uri(n):
    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote((root / "logo" / n).read_text(encoding="utf-8"))


pages = {"how-it-works": ("How TDS decides · True Data Sovereignty (draft, not published)",
                          "How TDS routes each AI request: mask, generalise, or keep local. With real examples and the limits.", how_main, how_script)}
for p in sorted((src / "pages").glob("*.html")):
    t = p.read_text(encoding="utf-8")
    title, desc = re.search(r"<!--title: (.*?)-->", t).group(1), re.search(r"<!--desc: (.*?)-->", t).group(1)
    reading = "<!--layout: read-->" in t
    t = re.sub(r"<!--(title|desc|layout):.*?-->\n?", "", t)
    pages[p.stem] = (title, desc, read_layout(t) if reading else t, "")

for name, (title, desc, main, script) in pages.items():
    html = shell(name, title, desc, main, script)
    (root / (name + ".html")).write_text(html, encoding="utf-8", newline="\n")
    text = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", html).lower()
    hits = [b for b in banned if b.lower() in text]
    pv = html.replace('url("../fonts/Lora-wght.ttf")', 'url("' + font + '")')
    for n in ("tds-tree-small-on-marine.svg", "tds-tree-small.svg", "tds-favicon.svg"):
        pv = pv.replace("logo/" + n, uri(n))
    (root / ("preview-" + name + ".html")).write_text(pv, encoding="utf-8", newline="\n")
    print("%-18s %6d bytes; banned words found: %s" % (name + ".html", len(html.encode()), hits or "none"))
