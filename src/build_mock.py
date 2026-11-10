"""Build mock.html: one self-contained page (font, mark, engine and the reference picture embedded)."""
import pathlib, base64, json
root = pathlib.Path(__file__).resolve().parents[1]
s = (root / "src" / "mock.src.html").read_text(encoding="utf-8")
font = "data:font/ttf;base64," + base64.b64encode((root.parent / "fonts" / "Lora-wght.ttf").read_bytes()).decode()
forest = "data:image/webp;base64," + base64.b64encode((root / "mock" / "ref-forest.webp").read_bytes()).decode()
markjs = "var TDS_MARK_SVG = " + json.dumps((root.parent / "brand" / "final" / "tds-mark.svg").read_text(encoding="utf-8")) + ";"
mycel = (root / "concepts" / "src" / "mycel.js").read_text(encoding="utf-8")
out = s.replace("{{FONT}}", font).replace("{{FOREST}}", forest).replace("{{MARKJS}}", markjs).replace("{{MYCEL}}", mycel)
(root / "mock.html").write_text(out, encoding="utf-8", newline=chr(10))
print("mock.html", len(out.encode()), "bytes")
