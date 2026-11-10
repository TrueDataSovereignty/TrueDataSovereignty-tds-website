"""Screenshots with the installed Edge, headless. One browser at a time, always closed afterwards.
Needs the local server on 8741 (python -m http.server 8741 --directory web). Shots go through phone.html,
a fixed-width frame, because Edge will not open a window narrower than 500 px.
usage: python shoot.py <page under /site-v3/> <name> [desktop height] [phone height] [scroll y] [desktop|phone|both]"""
import subprocess, sys, time, pathlib, urllib.parse, tempfile, shutil
from PIL import Image
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def own_children():
    """Put this script in a Windows job that kills everything in it when the script ends.
    Edge starts helper processes that outlive the one we launched; the job is the only reliable way to close them all.
    If the job cannot be made, refuse to run, so no browser is ever left behind."""
    import ctypes
    from ctypes import wintypes
    k = ctypes.WinDLL("kernel32", use_last_error=True)
    class BASIC(ctypes.Structure):
        _fields_ = [("PerProcessUserTimeLimit", ctypes.c_int64), ("PerJobUserTimeLimit", ctypes.c_int64), ("LimitFlags", wintypes.DWORD),
                    ("MinimumWorkingSetSize", ctypes.c_size_t), ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", wintypes.DWORD),
                    ("Affinity", ctypes.c_size_t), ("PriorityClass", wintypes.DWORD), ("SchedulingClass", wintypes.DWORD)]
    class IO(ctypes.Structure):
        _fields_ = [(n, ctypes.c_uint64) for n in ("r", "w", "o", "rb", "wb", "ob")]
    class EXT(ctypes.Structure):
        _fields_ = [("Basic", BASIC), ("Io", IO), ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t),
                    ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]
    k.CreateJobObjectW.restype = wintypes.HANDLE
    k.GetCurrentProcess.restype = wintypes.HANDLE
    k.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    k.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    job = k.CreateJobObjectW(None, None)
    info = EXT(); info.Basic.LimitFlags = 0x2000   # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not job or not k.SetInformationJobObject(job, 9, ctypes.byref(info), ctypes.sizeof(info)) or not k.AssignProcessToJobObject(job, k.GetCurrentProcess()):
        raise SystemExit("could not create a kill-on-close job; not starting a browser")
    return job   # keep the handle alive until the script ends

JOB = own_children()

here = pathlib.Path(__file__).parent
page, name = sys.argv[1], sys.argv[2]
dh = int(sys.argv[3]) if len(sys.argv) > 3 else 900
ph = int(sys.argv[4]) if len(sys.argv) > 4 else 844
y = int(sys.argv[5]) if len(sys.argv) > 5 else 0
which = sys.argv[6] if len(sys.argv) > 6 else "both"
base = "http://localhost:8741/site-v3/"
inner = urllib.parse.quote("/site-v3/" + page + ("&" if "?" in page else "?") + "still&t=%d" % time.time(), safe="")

def shot(url, out, w, h, scale, limit=40):
    """One capture. Whatever happens, the browser this call started is closed, with all its children."""
    out.unlink(missing_ok=True)
    prof = tempfile.mkdtemp(prefix="tds-shoot-")
    proc = subprocess.Popen([EDGE, "--headless=old", "--user-data-dir=" + prof, "--no-first-run", "--disable-gpu",
                             "--hide-scrollbars", f"--force-device-scale-factor={scale}", "--virtual-time-budget=5000",
                             f"--window-size={w},{h}", f"--screenshot={out}", url],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        end = time.time() + limit
        while time.time() < end:
            if out.exists() and out.stat().st_size > 0: break
            if proc.poll() is not None and not out.exists(): time.sleep(1); break
            time.sleep(0.5)
    finally:
        # close only the process tree this call started
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try: proc.wait(timeout=10)
        except Exception: pass
        shutil.rmtree(prof, ignore_errors=True)
    return out.exists() and out.stat().st_size > 0

d = here / f"{name}-desktop.png"; p = here / f"{name}-phone.png"
ok_d = ok_p = None
if which in ("both", "desktop"):
    ok_d = shot(base + "shots/phone.html?w=1440&h=%d&y=%d&u=%s" % (dh, y, inner), d, 1440, dh, 1)
if which in ("both", "phone"):
    ok_p = shot(base + "shots/phone.html?w=390&h=%d&y=%d&u=%s" % (ph, y, inner), p, 500, ph, 2)
    if ok_p:
        im = Image.open(p); im.crop((0, 0, 780, im.height)).save(p)
print(name, "desktop:", ok_d, "phone:", ok_p)
