"""Read letter shapes straight out of a TrueType font file, as SVG paths. No library needed.

Used for the wordmark: the letters of "TRUE DATA SOVEREIGNTY" become outlines, so the lockup files
do not depend on Lora being installed. Reads the font's default instance (Lora Regular, weight 400).
Simple glyphs only, which is all that capital letters need.
"""
import struct


class Font:
    def __init__(self, path):
        self.d = open(path, "rb").read()
        n = struct.unpack(">H", self.d[4:6])[0]
        self.t = {}
        for i in range(n):
            tag, _, off, ln = struct.unpack(">4sIII", self.d[12 + 16 * i:28 + 16 * i])
            self.t[tag.decode()] = (off, ln)
        h = self.t["head"][0]
        self.upm = struct.unpack(">H", self.d[h + 18:h + 20])[0]
        self.long_loca = struct.unpack(">h", self.d[h + 50:h + 52])[0] == 1
        self.n_hm = struct.unpack(">H", self.d[self.t["hhea"][0] + 34:self.t["hhea"][0] + 36])[0]
        self.cmap = self._cmap()

    def _cmap(self):
        o = self.t["cmap"][0]
        n = struct.unpack(">H", self.d[o + 2:o + 4])[0]
        sub = None
        for i in range(n):
            pid, eid, off = struct.unpack(">HHI", self.d[o + 4 + 8 * i:o + 12 + 8 * i])
            if struct.unpack(">H", self.d[o + off:o + off + 2])[0] == 4 and (pid, eid) in ((3, 1), (0, 3), (0, 4)):
                sub = o + off
        if sub is None:
            raise ValueError("no format 4 cmap in this font")
        segx2 = struct.unpack(">H", self.d[sub + 6:sub + 8])[0]
        seg = segx2 // 2
        ends = struct.unpack(">%dH" % seg, self.d[sub + 14:sub + 14 + segx2])
        p = sub + 16 + segx2
        starts = struct.unpack(">%dH" % seg, self.d[p:p + segx2])
        deltas = struct.unpack(">%dh" % seg, self.d[p + segx2:p + 2 * segx2])
        ro_at = p + 2 * segx2
        ros = struct.unpack(">%dH" % seg, self.d[ro_at:ro_at + segx2])
        m = {}
        for i in range(seg):
            for c in range(starts[i], ends[i] + 1):
                if c == 0xFFFF:
                    continue
                if ros[i] == 0:
                    g = (c + deltas[i]) & 0xFFFF
                else:
                    at = ro_at + 2 * i + ros[i] + 2 * (c - starts[i])
                    g = struct.unpack(">H", self.d[at:at + 2])[0]
                    if g:
                        g = (g + deltas[i]) & 0xFFFF
                if g:
                    m[c] = g
        return m

    def advance(self, gid):
        o = self.t["hmtx"][0]
        i = min(gid, self.n_hm - 1)
        return struct.unpack(">H", self.d[o + 4 * i:o + 4 * i + 2])[0]

    def contours(self, gid):
        lo = self.t["loca"][0]
        if self.long_loca:
            a, b = struct.unpack(">II", self.d[lo + 4 * gid:lo + 4 * gid + 8])
        else:
            a, b = (2 * v for v in struct.unpack(">HH", self.d[lo + 2 * gid:lo + 2 * gid + 4]))
        if a == b:
            return []
        g = self.t["glyf"][0] + a
        nc = struct.unpack(">h", self.d[g:g + 2])[0]
        if nc < 0:
            raise ValueError("composite glyph: not supported here")
        ends = struct.unpack(">%dH" % nc, self.d[g + 10:g + 10 + 2 * nc])
        p = g + 10 + 2 * nc
        il = struct.unpack(">H", self.d[p:p + 2])[0]
        p += 2 + il
        npts = ends[-1] + 1
        flags = []
        while len(flags) < npts:
            f = self.d[p]; p += 1
            flags.append(f)
            if f & 8:
                r = self.d[p]; p += 1
                flags.extend([f] * r)
        def coords(short, same):
            nonlocal p
            out, v = [], 0
            for f in flags:
                if f & short:
                    dv = self.d[p]; p += 1
                    v += dv if f & same else -dv
                elif not f & same:
                    v += struct.unpack(">h", self.d[p:p + 2])[0]; p += 2
                out.append(v)
            return out
        xs = coords(2, 16)
        ys = coords(4, 32)
        res, s = [], 0
        for e in ends:
            res.append([(xs[i], ys[i], bool(flags[i] & 1)) for i in range(s, e + 1)])
            s = e + 1
        return res

    def path(self, ch, x0, y0, scale):
        """One letter as an SVG path, its origin at (x0, y0), y pointing down."""
        gid = self.cmap.get(ord(ch))
        if gid is None:
            return "", 0
        def P(x, y):
            return "%.2f %.2f" % (x0 + x * scale, y0 - y * scale)
        d = []
        for c in self.contours(gid):
            # TrueType curves are quadratic; two off-curve points in a row have an on-curve point halfway between them
            pts = []
            for i, (x, y, on) in enumerate(c):
                px, py, pon = c[i - 1]
                if not on and not pon:
                    pts.append(((x + px) / 2, (y + py) / 2, True))
                pts.append((x, y, on))
            start = next(i for i, q in enumerate(pts) if q[2])
            pts = pts[start:] + pts[:start]
            d.append("M" + P(pts[0][0], pts[0][1]))
            i = 1
            while i < len(pts):
                x, y, on = pts[i]
                if on:
                    d.append("L" + P(x, y)); i += 1
                else:
                    nx, ny, _ = pts[(i + 1) % len(pts)]
                    d.append("Q" + P(x, y) + " " + P(nx, ny)); i += 2
            d.append("Z")
        return "".join(d), self.advance(gid) * scale

    def text(self, s, x, y, size, tracking=0.0):
        """A line of text as one path. Returns (path data, width)."""
        scale = size / self.upm
        out, cx = [], x
        for ch in s:
            if ch == " ":
                cx += size * 0.3 + tracking * size
                continue
            d, adv = self.path(ch, cx, y, scale)
            out.append(d)
            cx += adv + tracking * size
        return "".join(out), cx - tracking * size - x
