"""The extension's store graphics, drawn from the small logo: the promo tile and the icons.

Run:  python -I make_store_assets.py      (writes into web/extension/store-assets/)
Needs Pillow. The letters come from the Lora font file in web/fonts. Nothing is uploaded by this script.
"""
import pathlib, shutil, sys
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
from make_logo import hand, raster, MARINE, WHITE

OUT = HERE.parents[1] / "extension" / "store-assets"
FONT = HERE.parents[1] / "fonts" / "Lora-wght.ttf"
NAVY, GOLD, WHITE4 = (16, 26, 61, 255), (221, 176, 74, 255), (255, 255, 255, 255)


def lora(size, weight):
    f = ImageFont.truetype(str(FONT), size)
    f.set_variation_by_axes([weight])
    return f


def spaced(dr, xy, text, font, fill, track):
    x, y = xy
    for ch in text:
        dr.text((x, y), ch, font=font, fill=fill)
        x += dr.textlength(ch, font=font) + track
    return x


def tile(k=4):
    """Small promo tile, 440 x 280: the small logo in white with its gold line, the name, one line of what it does."""
    W, H = 440 * k, 280 * k
    im = Image.new("RGBA", (W, H), NAVY); dr = ImageDraw.Draw(im)
    mark = raster(hand(WHITE), 512).resize((116 * k, 116 * k), Image.LANCZOS)
    im.alpha_composite(mark, (34 * k, (H - 116 * k) // 2))
    spaced(dr, (174 * k, 84 * k), "TDS", lora(54 * k, 700), WHITE4, 5 * k)
    small = lora(11.5 * k, 600)
    spaced(dr, (176 * k, 158 * k), "MASKS PERSONAL DATA", small, GOLD, 1.9 * k)
    spaced(dr, (176 * k, 178 * k), "BEFORE IT REACHES AI CHATS", small, GOLD, 1.9 * k)
    return im.resize((440, 280), Image.LANCZOS).convert("RGB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    tile().save(OUT / "promo-tile-440x280.png")
    icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))          # store icon: the mark at 96 px, with clear space around it
    icon.alpha_composite(raster(hand(MARINE), 96), (16, 16)); icon.save(OUT / "store-icon-128.png")
    for px in (16, 32, 48):
        shutil.copy2(HERE / "png" / ("tds-icon-%d.png" % px), OUT / ("icon-%d.png" % px))
    print("written to", OUT)
