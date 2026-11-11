"""The ground-line logo (variant E), saved as fixed vector files.

Threads gather from above, pass one gold ground line, and spread again below. Marine in, gold out.
The branches are grown once by a seeded program (the same growth Henrik saw in logo-through.html),
so every run of this script writes the same drawing.

Run:  python -I make_logo.py        (writes the .svg files and sheet.html next to this script)
Draft. These files do not replace anything in web/brand/final.
"""
import math, pathlib

HERE = pathlib.Path(__file__).parent
MARINE, IVORY, GOLD, LIGHT, DEEP = (16, 26, 61), (247, 243, 234), (221, 176, 74), (248, 223, 156), (184, 134, 43)
WHITE, BLACK = (255, 255, 255), (0, 0, 0)


def rng(seed):
    """xorshift32, the same generator the site's drawing code uses."""
    s = [(seed & 0xFFFFFFFF) or 1]
    def r():
        x = s[0]
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        s[0] = x & 0xFFFFFFFF
        return s[0] / 4294967296
    return r


def grow(roots, attractors, step, reach, kill, rand, iters=600, jitter=0.5, max_nodes=6000):
    """Space colonisation: threads grow toward points they can reach, and stop when they arrive."""
    nodes, grid = [], {}
    def add(x, y, p):
        n = {"x": x, "y": y, "p": p, "i": len(nodes), "kids": 0, "w": 0}
        nodes.append(n)
        grid.setdefault((math.floor(x / reach), math.floor(y / reach)), []).append(n)
        return n
    for r in roots:
        add(r[0], r[1], -1)
    att = [[a[0], a[1], True] for a in attractors]
    for _ in range(iters):
        if len(nodes) >= max_nodes:
            break
        pull = {}
        for A in att:
            if not A[2]:
                continue
            cx, cy = math.floor(A[0] / reach), math.floor(A[1] / reach)
            best, bd = None, reach * reach
            for gx in (-1, 0, 1):
                for gy in (-1, 0, 1):
                    for n in grid.get((cx + gx, cy + gy), ()):
                        dd = (A[0] - n["x"]) ** 2 + (A[1] - n["y"]) ** 2
                        if dd < bd:
                            bd, best = dd, n
            if best is None:
                continue
            if bd < kill * kill:
                A[2] = False
                continue
            l = math.sqrt(bd)
            v = pull.setdefault(best["i"], [0.0, 0.0])
            v[0] += (A[0] - best["x"]) / l
            v[1] += (A[1] - best["y"]) / l
        grew = False
        for i, v in pull.items():
            if math.hypot(v[0], v[1]) < 1e-6:
                continue
            n = nodes[i]
            ang = math.atan2(v[1], v[0]) + (rand() - 0.5) * jitter
            if n["p"] >= 0:
                P = nodes[n["p"]]
                pa = math.atan2(n["y"] - P["y"], n["x"] - P["x"])
                ang = pa + math.atan2(math.sin(ang - pa), math.cos(ang - pa)) * 0.72
            s = step * (0.85 + rand() * 0.3)
            add(n["x"] + math.cos(ang) * s, n["y"] + math.sin(ang) * s, i)
            grew = True
        if not grew:
            break
    for n in reversed(nodes):          # pipe model: a thread is as thick as what it carries
        n["w"] = n["w"] or 1
        if n["p"] >= 0:
            P = nodes[n["p"]]
            P["w"] = (P["w"] or 1) + n["w"]
            P["kids"] += 1
    return nodes


def fan(c, R, RY, direction, n, seed, step=1.5, reach=22, kill=2.9):
    rand, A = rng(seed), []
    for _ in range(n):
        a = math.pi * (0.04 + 0.92 * rand())
        r = 0.3 + 0.7 * rand() ** 0.55
        A.append((c[0] + math.cos(a) * r * R, c[1] + direction * (1.5 + math.sin(a) * r * RY)))
    roots = [(c[0] - 2.4, c[1]), (c[0], c[1]), (c[0] + 2.4, c[1])]
    return grow(roots, A, step, reach, kill, rand)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return "#%02X%02X%02X" % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def f(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")


def strokes(net, c, R, RY, colour, wmin, wmax, wbase, wk):
    """Each short piece runs midpoint to midpoint, bent through the joint. Pieces of one style share a path."""
    groups = {}
    for n in net:
        if n["p"] < 0:
            continue
        P = net[n["p"]]
        e = min(1.0, math.hypot((n["x"] - c[0]) / R, (n["y"] - c[1]) / RY))
        width = round(max(wmin, min(wmax, wbase + math.sqrt(n["w"]) * wk)) * 5) / 5
        mx, my = (P["x"] + n["x"]) / 2, (P["y"] + n["y"]) / 2
        if P["p"] >= 0:
            G = net[P["p"]]
            d = "M%s %sQ%s %s %s %s" % (f((G["x"] + P["x"]) / 2), f((G["y"] + P["y"]) / 2), f(P["x"]), f(P["y"]), f(mx), f(my))
        else:
            d = "M%s %sL%s %s" % (f(P["x"]), f(P["y"]), f(mx), f(my))
        if n["kids"] == 0:
            d += "L%s %s" % (f(n["x"]), f(n["y"]))
        groups.setdefault((colour(round(e * 10) / 10), width), []).append(d)
    return "".join('<path d="%s" stroke="%s" stroke-width="%s"/>' % ("".join(ds), col, f(wd)) for (col, wd), ds in groups.items())


def logo(base, mono=False, dark=False, small=False, gradient=False):
    """base: the ink of the tree. mono: one ink only, line included. small: fewer, thicker threads.
    gradient: the earlier look, with roots fading to gold. The default keeps gold for the line alone."""
    x, top, line_y, org, R, RY, sw = 50.0, 39.0, 49.5, 60.0, 45.0, 37.0, (4.2 if small else 3.4)
    ink = mix(base, base, 0)
    mid = GOLD if dark else DEEP
    end = LIGHT if dark else GOLD
    def grad(e):
        if mono or not gradient:
            return ink
        t = (e - 0.3) / 0.7
        return mix(base, mid, t / 0.6) if t < 0.6 else mix(mid, end, (t - 0.6) / 0.4)
    if small:
        below = fan((x, org), R, RY, 1, 30, 34, step=1.8, kill=4.4)
        above = fan((x, top), R * 0.86, 34, -1, 20, 52, step=1.8, kill=4.4)
        w = dict(wmin=2.6, wmax=5.2, wbase=2.2, wk=0.34)
    else:
        below = fan((x, org), R, RY, 1, 70, 34)
        above = fan((x, top), R * 0.86, 34, -1, 44, 52)
        w = dict(wmin=1.2, wmax=4.4, wbase=1.15, wk=0.24)
    g = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
    g += strokes(below, (x, org), R, RY, grad, **w)
    g += strokes(above, (x, top), R, 34, lambda e: ink, **w)
    g += "</g>"
    stem = "M%s %sQ%s %s %s %sQ%s %s %s %sL%s %sQ%s %s %s %sQ%s %s %s %sZ" % tuple(f(v) for v in (
        x - sw * 1.45, top - 1.5, x - sw * 0.9, top + 4, x - sw, line_y, x - sw * 0.9, org - 4, x - sw * 1.45, org + 1.5,
        x + sw * 1.45, org + 1.5, x + sw * 0.9, org - 4, x + sw, line_y, x + sw * 0.9, top + 4, x + sw * 1.45, top - 1.5))
    lw = 3.2 if small else 2.4
    line = '<path d="M4 %s H96" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>' % (f(line_y), ink if mono else mix(GOLD, GOLD, 0), f(lw))
    if mono:   # in one ink the line must stay a line: the trunk stops just short of it on both sides
        gap = lw / 2 + (1.3 if small else 0.9)
        g += '<clipPath id="c"><path d="M0 0H100V%sH0ZM0 %sH100V100H0Z"/></clipPath><path d="%s" fill="%s" clip-path="url(#c)"/>' % (f(line_y - gap), f(line_y + gap), stem, ink)
    else:
        g += '<path d="%s" fill="%s"/>' % (stem, ink)
    return g + line, len([n for n in below if n["kids"] == 0 and n["p"] >= 0]), len([n for n in above if n["kids"] == 0 and n["p"] >= 0])


def svg(body, title, bg=None):
    rect = '<rect width="100" height="100" fill="%s"/>' % bg if bg else ""
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1000" height="1000" role="img" aria-label="%s">'
            '<title>%s</title>%s%s</svg>\n') % (title, title, rect, body)


GOLD_HEX = "#DDB04A"


def hand(base, mono=False, tiny=False):
    """The small-size cuts, drawn by hand on a 100 grid. Not grown: every stroke is placed so it survives at 16 to 48 px.
    tiny: three branch ends and three root ends, for 16 to 24 px. Otherwise five and five, for 32 to 48 px."""
    ink = mix(base, base, 0)
    if tiny:
        sw, lw, top, bot = 9.5, 9.5, 34, 66
        up = ["M50 %d C48 24 37 22 27 11" % top, "M50 %d V8" % top, "M50 %d C52 24 63 22 73 11" % top]
        down = ["M50 %d C48 76 37 78 25 89" % bot, "M50 %d V92" % bot, "M50 %d C52 76 63 78 75 89" % bot]
    else:
        sw, lw, top, bot = 6.6, 6.6, 36, 64
        up = ["M50 %d C48 26 36 26 26 13" % top, "M37 24 C30 24 24 27 17 24", "M50 %d C51 26 49 18 52 7" % top,
              "M50 %d C52 28 64 28 74 15" % top, "M63 26 C70 24 78 27 85 22"]
        down = ["M50 %d C48 74 34 72 22 83" % bot, "M36 73 C30 80 28 85 30 92", "M50 %d C49 74 52 83 49 93" % bot,
                "M50 %d C52 74 66 72 78 81" % bot, "M64 73 C72 79 80 77 89 81"]
    gap = lw / 2 + (3.2 if tiny else 2.4)
    trunk = ("M50 %s V%sM50 %s V%s" % (f(top + 2), f(50 - gap), f(50 + gap), f(bot - 2))) if mono else ("M50 %d V%d" % (top + 2, bot - 2))
    g = '<g fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"><path d="%s"/></g>' % (ink, f(sw), "".join(up + down) + trunk)
    g += '<path d="M5 50 H95" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>' % (ink if mono else GOLD_HEX, f(lw))
    return g


def favicon():
    """The small logo as the browser-tab icon. The tree turns white when the browser is in dark mode; the line stays gold."""
    body = hand(MARINE).replace('stroke="#101A3D"', 'class="t"')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>.t{stroke:#101A3D}@media (prefers-color-scheme:dark){.t{stroke:#FFFFFF}}</style>%s</svg>\n') % body


def raster(body, px):
    """Draw the small logo as a PNG with Pillow: no SVG program is needed. Strokes are drawn 8 times too large with round ends, then scaled down."""
    import re
    from PIL import Image, ImageDraw
    ss = max(4, 2048 // px) if px < 512 else 4
    S = px * ss; k = S / 100.0
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    for stroke, width, d in [(m.group(1), float(m.group(2)), m.group(3)) for m in re.finditer(r'<g fill="none" stroke="(#\w+)" stroke-width="([\d.]+)"[^>]*><path d="([^"]+)"', body)] + \
                            [(m.group(2), float(m.group(3)), m.group(1)) for m in re.finditer(r'<path d="([^"]+)" fill="none" stroke="(#\w+)" stroke-width="([\d.]+)"', body)]:
        col = tuple(int(stroke[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        r = width * k / 2; cur = None; lines = []
        for cmd, args in re.findall(r"([MCVH])([^MCVH]*)", d):
            v = [float(a) for a in re.findall(r"-?[\d.]+", args)]
            if cmd == "M": cur = (v[0], v[1]); lines.append([cur])
            elif cmd == "V": cur = (cur[0], v[0]); lines[-1].append(cur)
            elif cmd == "H": cur = (v[0], cur[1]); lines[-1].append(cur)
            else:
                p0, p1, p2, p3 = cur, (v[0], v[1]), (v[2], v[3]), (v[4], v[5])
                for i in range(1, 49):
                    s = i / 48.0; u = 1 - s
                    lines[-1].append(tuple(u ** 3 * p0[j] + 3 * u * u * s * p1[j] + 3 * u * s * s * p2[j] + s ** 3 * p3[j] for j in (0, 1)))
                cur = p3
        for pts in lines:
            P = [(x * k, y * k) for x, y in pts]
            dr.line(P, fill=col, width=max(1, round(2 * r)))
            for x, y in P: dr.ellipse((x - r, y - r, x + r, y + r), fill=col)
    return im.resize((px, px), Image.LANCZOS)


PNG = [("tds-icon", dict(base=MARINE)), ("tds-icon-on-dark", dict(base=WHITE)), ("tds-icon-black", dict(base=BLACK, mono=True)), ("tds-icon-white", dict(base=WHITE, mono=True))]
PNG_SIZES = (16, 32, 48, 128, 512)


def lockup(font, base, mono=False, stacked=False, bg=None, small=False):
    """The mark beside (or above) the name, with the letters as outlines read from the Lora font file."""
    ink = mix(base, base, 0)
    body = hand(base, mono=mono) if small else logo(base=base, mono=mono, dark=base == IVORY)[0]
    name = "TRUE DATA SOVEREIGNTY"
    if stacked:
        size, track = 15.0, 0.2
        d, wd = font.text(name, 0, 0, size, track)
        W = max(wd + 16, 110); H = 100 + 12 + size * 0.72 + 12
        mark = '<g transform="translate(%s 4) scale(0.92)">%s</g>' % (f((W - 92) / 2), body)
        word = '<path transform="translate(%s %s)" d="%s" fill="%s"/>' % (f((W - wd) / 2), f(100 + 8 + size * 0.72), d, ink)
    else:
        size, track = 26.0, 0.16
        d, wd = font.text(name, 0, 0, size, track)
        W = 100 + 14 + wd + 12; H = 100
        mark = body
        word = '<path transform="translate(114 %s)" d="%s" fill="%s"/>' % (f(50 + size * 0.35), d, ink)
    rect = '<rect width="%s" height="%s" fill="%s"/>' % (f(W), f(H), bg) if bg else ""
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%d" height="%d" role="img" aria-label="True Data Sovereignty">'
            '<title>True Data Sovereignty</title>%s%s%s</svg>\n') % (f(W), f(H), round(W * 6), round(H * 6), rect, mark, word)


GROWN = [
    ("tds-tree-colour.svg", dict(base=MARINE), None, "The logo on white or light paper. The tree in marine ink, the line in gold."),
    ("tds-tree-colour-on-marine.svg", dict(base=IVORY, dark=True), "#101A3D", "The logo on marine blue. The tree in ivory, the line in gold."),
    ("tds-tree-one-ink.svg", dict(base=MARINE, mono=True), None, "One ink, midnight marine (#101A3D), line included. The standard dark version."),
    ("tds-tree-one-ink-reversed.svg", dict(base=IVORY, mono=True), "#101A3D", "One ink, ivory on midnight marine, line included."),
    ("tds-tree-production-true-black.svg", dict(base=(0, 0, 0), mono=True), None, "Production fallback only: true black (#000000), one ink. For engraving, stamps and single-colour print where marine cannot be matched. Not for screens."),
    ("tds-tree-gradient.svg", dict(base=MARINE, gradient=True), None, "Earlier look, kept for reference: roots fading to gold."),
]
HAND = [   # THE small logo (Henrik, 12 Nov 2026): five branch ends, five root ends, one trunk, one thick line
    ("tds-tree-small.svg", dict(base=MARINE), None, "The small logo on light: marine tree, gold line. Header, favicon, icons."),
    ("tds-tree-small-on-marine.svg", dict(base=WHITE), "#101A3D", "The small logo on dark: white tree, gold line. Footer."),
    ("tds-tree-small-one-ink.svg", dict(base=MARINE, mono=True), None, "Full dark: one ink, midnight marine, line included."),
    ("tds-tree-small-black.svg", dict(base=BLACK, mono=True), None, "Full black (#000000), line included."),
    ("tds-tree-small-one-ink-reversed.svg", dict(base=WHITE, mono=True), "#101A3D", "Full white, line included, shown on marine."),
]
LOCKUPS = [
    ("tds-lockup-horizontal.svg", dict(base=MARINE), None, "Mark and name side by side."),
    ("tds-lockup-horizontal-on-marine.svg", dict(base=IVORY), "#101A3D", "Side by side, on marine."),
    ("tds-lockup-horizontal-one-ink.svg", dict(base=MARINE, mono=True), None, "Side by side, one ink."),
    ("tds-lockup-stacked.svg", dict(base=MARINE, stacked=True), None, "Mark above the name."),
    ("tds-lockup-stacked-on-marine.svg", dict(base=IVORY, stacked=True), "#101A3D", "Stacked, on marine."),
    ("tds-lockup-stacked-one-ink.svg", dict(base=MARINE, mono=True, stacked=True), None, "Stacked, one ink."),
    ("tds-lockup-small-horizontal.svg", dict(base=MARINE, small=True), None, "For small sizes: the small logo beside the name."),
    ("tds-lockup-small-horizontal-on-marine.svg", dict(base=WHITE, small=True), "#101A3D", "For small sizes, on marine: white, gold line."),
    ("tds-lockup-small-horizontal-one-ink.svg", dict(base=MARINE, mono=True, small=True), None, "For small sizes, one ink."),
    ("tds-lockup-small-stacked.svg", dict(base=MARINE, small=True, stacked=True), None, "For small sizes: the small logo above the name."),
]

if __name__ == "__main__":
    import re, sys
    sys.path.insert(0, str(HERE))
    from outline import Font
    font = Font(HERE.parents[1] / "fonts" / "Lora-wght.ttf")
    title = "True Data Sovereignty: threads gather above, pass one ground line, and spread below"
    for old in HERE.glob("*.svg"):
        old.unlink()
    (HERE / "tds-favicon.svg").write_text(favicon(), encoding="utf-8", newline=chr(10))
    (HERE / "png").mkdir(exist_ok=True)
    for stem, opts in PNG:   # transparent background, every one
        for px in PNG_SIZES:
            raster(hand(**opts), px).save(HERE / "png" / ("%s-%d.png" % (stem, px)))
    print("png/: %d files (%s, at %s px), transparent" % (len(PNG) * len(PNG_SIZES), ", ".join(s for s, _ in PNG), "/".join(map(str, PNG_SIZES))))
    groups = []

    def card(name, text, bg, note, sizes, wide=False):
        tile_bg = bg or "#FAFAF8"
        small = "".join('<span style="background:%s;padding:6px;border-radius:3px;line-height:0;display:inline-block">%s</span>' % (
            tile_bg, re.sub(r'width="\d+" height="\d+"', 'height="%d"' % px, text, count=1)) for px in sizes)
        return '<section%s><div class="tile%s" style="background:%s">%s</div><h2>%s</h2><p>%s</p><div class="sizes">%s</div></section>' % (
            ' class="wide"' if wide else "", " w" if wide else "", tile_bg, text, name, note, small)

    cards = []
    for name, opts, bg, note in GROWN:
        body, below, above = logo(**opts)
        text = svg(body, title, bg)
        (HERE / name).write_text(text, encoding="utf-8", newline="\n")
        print("%-40s %6d bytes  %d ends below, %d above" % (name, len(text.encode()), below, above))
        cards.append(card(name, text, bg, note, (96, 48)))
    groups.append(("The logo", "Grown once by a seeded program, then fixed.", cards))
    cards = []
    for name, opts, bg, note in HAND:
        text = svg(hand(**opts), title, bg)
        (HERE / name).write_text(text, encoding="utf-8", newline="\n")
        print("%-40s %6d bytes  hand-drawn" % (name, len(text.encode())))
        cards.append(card(name, text, bg, note, (48, 32, 24, 16)))
    groups.append(("The small logo", "Drawn by hand, stroke by stroke. This is the logo wherever it is small: header, footer, browser tab, app and extension icons. PNG copies (16, 32, 48, 128, 512 px, transparent) are in png/.", cards))
    cards = []
    for name, opts, bg, note in LOCKUPS:
        text = lockup(font, bg=bg, **opts)
        (HERE / name).write_text(text, encoding="utf-8", newline="\n")
        print("%-40s %6d bytes  letters as outlines" % (name, len(text.encode())))
        cards.append(card(name, text, bg, note, (40,), wide="horizontal" in name))
    groups.append(("Lockups", "The mark with the name. The letters are outlines taken from the Lora font file (Lora Regular), so no font is needed to show them.", cards))

    sheet = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>The ground-line logo: vector files (draft)</title>
<style>body{margin:0;background:#ECE9E1;color:#101A3D;font:400 16px/1.55 "Segoe UI",system-ui,sans-serif}.page{max-width:1080px;margin:0 auto;padding:36px 18px 80px}
h1{font:600 30px/1.15 Georgia,serif;margin:0 0 8px}.page>p{margin:0 0 30px;max-width:44rem;color:#4D5672}
h3{font:600 22px/1.2 Georgia,serif;margin:46px 0 4px}h3+p{margin:0 0 18px;color:#4D5672;max-width:44rem}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 18px}@media (max-width:760px){.grid{grid-template-columns:1fr}}
section.wide{grid-column:1/-1}
.tile{aspect-ratio:1;border-radius:3px;padding:8%%;display:grid;place-items:center}.tile.w{aspect-ratio:auto;padding:26px 5%%}.tile svg{width:100%%;height:auto;max-height:100%%;display:block}
h2{font:400 13px/1.3 Consolas,monospace;margin:12px 0 4px}section p{margin:0 0 10px;font-size:14px;color:#4D5672}.sizes{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sizes svg{display:block;width:auto}</style></head>
<body><div class="page"><h1>The ground-line logo: vector files</h1>
<p>Draft, not published. All files are written by <code>make_logo.py</code>, and the drawing is the same every time it runs. Nothing in web/brand/final is replaced.</p>
%s</div></body></html>
""" % "".join('<h3>%s</h3><p>%s</p><div class="grid">%s</div>' % (t, n, "".join(c)) for t, n, c in groups)
    (HERE / "sheet.html").write_text(sheet, encoding="utf-8", newline="\n")
    print("sheet.html", len(sheet.encode()), "bytes")
