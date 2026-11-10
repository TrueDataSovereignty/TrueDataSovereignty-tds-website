"""Screenshots with the installed Edge, headless. Needs the local server on 8741
(python -m http.server 8741 --directory web). Phone shots go through phone.html, a 390 px frame,
because Edge will not open a window narrower than 500 px.
usage: python shoot.py <page under /site-v3/> <name> [desktop height] [phone height] [scroll y]"""
import subprocess, sys, time, pathlib, urllib.parse
from PIL import Image
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
here = pathlib.Path(__file__).parent
import tempfile
PROFILE = str(pathlib.Path(tempfile.gettempdir()) / "tds-shoot-profile")  # own profile, so an open Edge window does not swallow the run
page, name = sys.argv[1], sys.argv[2]
dh = int(sys.argv[3]) if len(sys.argv) > 3 else 900
ph = int(sys.argv[4]) if len(sys.argv) > 4 else 844
y = int(sys.argv[5]) if len(sys.argv) > 5 else 0
base = "http://localhost:8741/site-v3/"
u = base + page + ("&" if "?" in page else "?") + "still"
def shot(url, out, w, h, scale, tries=2):
    out.unlink(missing_ok=True)
    prof = tempfile.mkdtemp(prefix='tds-shoot-')   # a fresh profile each time: a stuck earlier run cannot swallow this one
    subprocess.run([EDGE, "--headless=old", "--user-data-dir=" + prof, "--no-first-run", "--disable-gpu", "--hide-scrollbars", f"--force-device-scale-factor={scale}",
                    "--virtual-time-budget=5000", f"--window-size={w},{h}", f"--screenshot={out}", url],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    for _ in range(30):
        if out.exists() and out.stat().st_size > 0: return
        time.sleep(0.5)
    if tries: shot(url, out, w, h, scale, tries - 1)   # Edge sometimes exits without writing; try again
d = here / f"{name}-desktop.png"; p = here / f"{name}-phone.png"
inner = urllib.parse.quote("/site-v3/" + page + ("&" if "?" in page else "?") + "still&t=%d" % time.time(), safe="")
shot(base + "shots/phone.html?w=1440&h=%d&y=%d&u=%s" % (dh, y, inner), d, 1440, dh, 1)
shot(base + "shots/phone.html?w=390&h=%d&y=%d&u=%s" % (ph, y, inner), p, 500, ph, 2)
im = Image.open(p); im.crop((0, 0, 780, im.height)).save(p)
print(d.name, d.stat().st_size, p.name, p.stat().st_size)
