"""Build looks.html: one self-contained page (font and mark embedded) so it opens anywhere."""
import pathlib, base64, urllib.parse
root = pathlib.Path(__file__).resolve().parents[1]
s = (root / "src" / "looks.src.html").read_text(encoding="utf-8")
font = "data:font/ttf;base64," + base64.b64encode((root.parent / "fonts" / "Lora-wght.ttf").read_bytes()).decode()
mark = "data:image/svg+xml;charset=utf-8," + urllib.parse.quote((root.parent / "brand" / "final" / "tds-mark-small.svg").read_text(encoding="utf-8"))
big = "data:image/svg+xml;charset=utf-8," + urllib.parse.quote((root.parent / "brand" / "final" / "tds-mark.svg").read_text(encoding="utf-8"))
out = s.replace("{{FONT}}", font).replace("{{MARK}}", mark)
(root / "looks.html").write_text(out, encoding="utf-8", newline="\n")
print("looks.html", len(out.encode()), "bytes")

lg = (root / "src" / "logos.src.html").read_text(encoding="utf-8").replace("{{FONT}}", font).replace("{{MARK}}", big)
(root / "logo-drafts.html").write_text(lg, encoding="utf-8", newline=chr(10))
print("logo-drafts.html", len(lg.encode()), "bytes")
