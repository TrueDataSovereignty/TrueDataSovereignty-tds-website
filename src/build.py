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
