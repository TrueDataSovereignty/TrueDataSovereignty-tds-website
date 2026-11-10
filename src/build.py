"""Build web/site-v3/index.html: one self-contained file. Shared parts come from concepts/src."""
import pathlib, re
src = pathlib.Path(__file__).parent
root = src.parent
parts = {}
for d in (root / "concepts" / "src", src):
    for p in d.iterdir():
        if p.suffix in (".css", ".js") or p.name in ("hero.html", "toggle.html"):
            parts[p.name] = p.read_text(encoding="utf-8")
import json
parts["mark.js"] = "var TDS_MARK_SVG = " + json.dumps((root.parent / "brand" / "final" / "tds-mark.svg").read_text(encoding="utf-8")) + ";\n"  # the real logo file, not redrawn
parts["base.css"] = parts["base.css"].replace("../../fonts/", "../fonts/")
html = re.sub(r"\{\{([\w.\-]+)\}\}", lambda m: parts[m.group(1)], (src / "index.src.html").read_text(encoding="utf-8"))
(root / "index.html").write_text(html, encoding="utf-8", newline="\n")
banned = ["guarantee", "compliant", "never leaves", "tamper-proof", "zero plaintext egress", " AB ", "hello@"]
text = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", html).lower()
hits = [b for b in banned if b.lower() in text]
print("index.html", len(html.encode("utf-8")), "bytes; banned words found:", hits or "none")

# preview.html: the same page with the font and the nav mark embedded, so it can be sent and opened anywhere
import base64, urllib.parse
font = "data:font/ttf;base64," + base64.b64encode((root.parent / "fonts" / "Lora-wght.ttf").read_bytes()).decode()
small = "data:image/svg+xml;charset=utf-8," + urllib.parse.quote((root.parent / "brand" / "final" / "tds-mark-small.svg").read_text(encoding="utf-8"))
pv = html.replace('url("../fonts/Lora-wght.ttf")', 'url("' + font + '")').replace("../brand/final/tds-mark-small.svg", small)
(root / "preview.html").write_text(pv, encoding="utf-8", newline=chr(10))
print("preview.html", len(pv.encode("utf-8")), "bytes (for sending; not the page to publish)")
