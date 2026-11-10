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

lg = (root / "src" / "logo2.src.html").read_text(encoding="utf-8").replace("{{FONT}}", font).replace("{{MARKJS}}", markjs).replace("{{MYCEL}}", mycel)
(root / "logo-mycelium.html").write_text(lg, encoding="utf-8", newline=chr(10))
print("logo-mycelium.html", len(lg.encode()), "bytes")

l3 = (root / "src" / "logo3.src.html").read_text(encoding="utf-8").replace("{{FONT}}", font).replace("{{MYCEL}}", mycel)
(root / "logo-fan.html").write_text(l3, encoding="utf-8", newline=chr(10))
print("logo-fan.html", len(l3.encode()), "bytes")

src3 = (root / "src" / "logo3.src.html").read_text(encoding="utf-8")
fanjs = src3[src3.index("  function mix(a, b, t)"):src3.index("  function draw(cv) {")]   # the shared fan-growing code
l4 = (root / "src" / "logo4.src.html").read_text(encoding="utf-8").replace("{{FONT}}", font).replace("{{MYCEL}}", mycel).replace("{{FANJS}}", fanjs)
(root / "logo-through.html").write_text(l4, encoding="utf-8", newline=chr(10))
print("logo-through.html", len(l4.encode()), "bytes")
