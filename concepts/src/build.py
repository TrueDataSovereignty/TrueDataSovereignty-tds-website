"""Inline the shared parts into each concept so every file opens offline on its own."""
import pathlib, re
src = pathlib.Path(__file__).parent
out = src.parent
parts = {p.name: p.read_text(encoding="utf-8") for p in src.iterdir() if p.suffix in (".css", ".js", ".html") and not p.name.startswith("concept-")}
for t in sorted(src.glob("concept-*.html")):
    html = re.sub(r"\{\{([\w.\-]+)\}\}", lambda m: parts[m.group(1)], t.read_text(encoding="utf-8"))
    (out / t.name).write_text(html, encoding="utf-8", newline="\n")
    print(t.name, len(html.encode("utf-8")), "bytes")
