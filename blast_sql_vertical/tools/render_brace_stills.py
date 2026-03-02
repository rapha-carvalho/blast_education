from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFont


@dataclass(frozen=True)
class StillSpec:
    width: int
    height: int
    theme: str  # dark | white


def _pick_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/seguisb.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
    ]
    for font_path in candidates:
        if Path(font_path).exists():
            try:
                return ImageFont.truetype(font_path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


def _build_brace_targets(width: int, height: int, spacing: int = 6) -> np.ndarray:
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)

    font_size = int(min(width * 0.42, height * 0.225))
    font = _pick_font(font_size)

    cx = width / 2.0
    cy = height / 2.0
    offset = max(min(width * 0.385, 430), 205)
    draw.text((cx - offset, cy), "{", fill=255, font=font, anchor="mm")
    draw.text((cx + offset, cy), "}", fill=255, font=font, anchor="mm")

    data = np.array(mask)
    points: list[tuple[float, float]] = []
    for y in range(0, height, spacing):
        row = data[y]
        for x in range(0, width, spacing):
            if row[x] > 80:
                points.append((float(x), float(y)))
    return np.array(points, dtype=np.float32)


def _draw_circle(image: np.ndarray, x: float, y: float, r: float, color: tuple[int, int, int], alpha: float) -> None:
    h, w, _ = image.shape
    cx = int(round(x))
    cy = int(round(y))
    rad = max(1, int(math.ceil(r)))
    x0 = max(0, cx - rad)
    x1 = min(w - 1, cx + rad)
    y0 = max(0, cy - rad)
    y1 = min(h - 1, cy + rad)
    if x1 < x0 or y1 < y0:
        return

    yy, xx = np.ogrid[y0 : y1 + 1, x0 : x1 + 1]
    dist2 = (xx - x) ** 2 + (yy - y) ** 2
    mask = dist2 <= (r * r)
    if not np.any(mask):
        return

    patch = image[y0 : y1 + 1, x0 : x1 + 1]
    col = np.array(color, dtype=np.float32)
    a = np.clip(alpha, 0.0, 1.0)
    patch[mask] = (patch[mask] * (1.0 - a) + col * a).astype(np.uint8)


def render_still(spec: StillSpec, out_path: Path, seed: int) -> None:
    rng = np.random.default_rng(seed)
    width, height = spec.width, spec.height

    targets = _build_brace_targets(width, height, spacing=6)
    if len(targets) == 0:
        raise RuntimeError("No brace targets generated.")

    if spec.theme == "white":
        bg_color = np.array([250, 252, 255], dtype=np.uint8)
        brace_rgb = (46, 117, 230)
        star_rgb = (70, 85, 105)
        star_alpha_scale = 0.42
    else:
        bg_color = np.array([2, 4, 9], dtype=np.uint8)
        brace_rgb = (66, 133, 244)
        star_rgb = (250, 253, 255)
        star_alpha_scale = 1.0

    frame = np.empty((height, width, 3), dtype=np.uint8)
    frame[:, :] = bg_color

    # Ambient stars (white/gray particles).
    star_count = max(120, int((width * height) / 12000))
    star_pos = rng.random((star_count, 2), dtype=np.float32) * np.array([width, height], dtype=np.float32)
    star_size = rng.uniform(0.65, 2.1, size=star_count).astype(np.float32)
    star_alpha = rng.uniform(0.20, 0.95, size=star_count).astype(np.float32) * star_alpha_scale

    for i in range(star_count):
        _draw_circle(
            frame,
            float(star_pos[i, 0]),
            float(star_pos[i, 1]),
            float(star_size[i]),
            star_rgb,
            float(star_alpha[i]),
        )

    # Brace particles.
    jitter = np.column_stack(
        (
            rng.normal(0.0, 0.9, size=len(targets)),
            rng.normal(0.0, 0.9, size=len(targets)),
        )
    ).astype(np.float32)
    points = targets + jitter
    sizes = rng.uniform(0.9, 2.2, size=len(points)).astype(np.float32)

    for i in range(len(points)):
        _draw_circle(
            frame,
            float(points[i, 0]),
            float(points[i, 1]),
            float(sizes[i]),
            brace_rgb,
            1.0,
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(frame, mode="RGB").save(out_path.as_posix(), format="PNG", optimize=True)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "docs" / "marketing" / "assets"

    specs = [
        StillSpec(1080, 1350, "dark"),
        StillSpec(1080, 1920, "dark"),
        StillSpec(1080, 1350, "white"),
        StillSpec(1080, 1920, "white"),
    ]

    for idx, spec in enumerate(specs, start=1):
        suffix = "white_bg" if spec.theme == "white" else "dark_bg"
        filename = f"brace_particles_static_{suffix}_{spec.width}x{spec.height}.png"
        out_file = out_dir / filename
        print(f"Rendering {out_file} ...")
        render_still(spec, out_file, seed=303500 + idx)
        print(f"Done: {out_file}")


if __name__ == "__main__":
    main()
