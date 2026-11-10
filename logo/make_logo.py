"""The ground-line logo ("Through the layer", variant E), saved as fixed vector files.

Threads gather from above, pass one gold ground line, and spread again below. Marine in, gold out.
The branches are grown once by a seeded program (the same growth Henrik saw in logo-through.html),
so every run of this script writes the same drawing.

Run:  python -I make_logo.py        (writes the .svg files and sheet.html next to this script)
Draft. These files do not replace anything in web/brand/final.
"""
import math, pathlib

HERE = pathlib.Path(__file__).parent
MARINE, IVORY, GOLD, LIGHT, DEEP = (16, 26, 61), (247, 243, 234), (221, 176, 74), (248, 223, 156), (184, 134, 43)


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


FILES = [
    ("tds-tree-colour.svg", dict(base=MARINE), None, "The logo on white or light paper. The tree in marine ink, the line in gold."),
    ("tds-tree-colour-on-marine.svg", dict(base=IVORY, dark=True), "#101A3D", "The logo on marine blue. The tree in ivory, the line in gold."),
    ("tds-tree-one-ink.svg", dict(base=MARINE, mono=True), None, "Full black: one ink, line included. For stamps, engraving and one-colour print."),
    ("tds-tree-one-ink-reversed.svg", dict(base=IVORY, mono=True), "#101A3D", "Full white: one ink on marine, line included."),
    ("tds-tree-small.svg", dict(base=MARINE, small=True), None, "Small-size cut, first try: fewer, thicker threads. Not good enough yet; it needs redrawing by hand."),
    ("tds-tree-gradient.svg", dict(base=MARINE, gradient=True), None, "Earlier look, kept for reference: roots fading to gold."),
]

if __name__ == "__main__":
    title = "True Data Sovereignty: threads gather above, pass one ground line, and spread below"
    cards = []
    for name, opts, bg, note in FILES:
        body, tips_below, tips_above = logo(**opts)
        text = svg(body, title, bg)
        (HERE / name).write_text(text, encoding="utf-8", newline="\n")
        print("%-34s %6d bytes  %d thread ends below, %d above" % (name, len(text.encode()), tips_below, tips_above))
        tile_bg = bg or "#FAFAF8"
        sizes = "".join('<span style="background:%s;padding:6px;border-radius:3px;line-height:0;display:inline-block"><span style="display:block;width:%dpx;height:%dpx">%s</span></span>' % (tile_bg, s, s, text.replace('width="1000" height="1000"', 'width="%d" height="%d"' % (s, s))) for s in ((48, 32, 16) if "small" in name else (96, 48)))
        cards.append('<section><div class="tile" style="background:%s">%s</div><h2>%s</h2><p>%s</p><div class="sizes">%s</div></section>' % (tile_bg, text, name, note, sizes))
    sheet = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>The ground-line logo: vector files (draft)</title>
<style>body{margin:0;background:#ECE9E1;color:#101A3D;font:400 16px/1.55 "Segoe UI",system-ui,sans-serif}.page{max-width:1080px;margin:0 auto;padding:36px 18px 80px}
h1{font:600 30px/1.15 Georgia,serif;margin:0 0 8px}.page>p{margin:0 0 30px;max-width:44rem;color:#4D5672}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:34px 18px}@media (max-width:760px){.grid{grid-template-columns:1fr}}
.tile{aspect-ratio:1;border-radius:3px;padding:8%%}.tile svg{width:100%%;height:100%%;display:block}
h2{font:400 13px/1.3 Consolas,monospace;margin:12px 0 4px}section p{margin:0 0 10px;font-size:14px;color:#4D5672}.sizes{display:flex;gap:8px;align-items:center}.sizes svg{display:block}</style></head>
<body><div class="page"><h1>The ground-line logo: vector files</h1>
<p>Draft, not published. Six fixed SVG files, written by <code>make_logo.py</code>. The drawing is the same every time the script runs. Nothing in web/brand/final is replaced.</p>
<div class="grid">%s</div></div></body></html>
""" % "".join(cards)
    (HERE / "sheet.html").write_text(sheet, encoding="utf-8", newline="\n")
    print("sheet.html", len(sheet.encode()), "bytes")
