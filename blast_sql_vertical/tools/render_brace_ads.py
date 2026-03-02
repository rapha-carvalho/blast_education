from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import math
import time

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont


@dataclass(frozen=True)
class RenderSpec:
    width: int
    height: int
    seconds: int = 10
    fps: int = 30
    theme: str = "dark"  # dark | white

    @property
    def frame_count(self) -> int:
        return self.seconds * self.fps


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

    center_x = width / 2.0
    center_y = height / 2.0
    brace_offset = max(min(width * 0.385, 430), 205)

    draw.text((center_x - brace_offset, center_y), "{", fill=255, font=font, anchor="mm")
    draw.text((center_x + brace_offset, center_y), "}", fill=255, font=font, anchor="mm")

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


def render_animation(spec: RenderSpec, out_path: Path, seed: int) -> None:
    rng = np.random.default_rng(seed)

    width, height = spec.width, spec.height
    fps = spec.fps
    frames = spec.frame_count

    targets = _build_brace_targets(width, height, spacing=6)
    count = len(targets)
    if count == 0:
        raise RuntimeError("No brace target points generated; font rendering failed.")

    # Brace particles.
    pos = rng.random((count, 2), dtype=np.float32) * np.array([width, height], dtype=np.float32)
    vel = (rng.random((count, 2), dtype=np.float32) - 0.5) * 0.4
    size = rng.uniform(0.9, 2.2, size=count).astype(np.float32)
    phase = rng.uniform(0.0, math.tau, size=count).astype(np.float32)

    # Star field (ambient white particles).
    star_count = max(120, int((width * height) / 12000))
    star_pos = rng.random((star_count, 2), dtype=np.float32) * np.array([width, height], dtype=np.float32)
    star_vel = np.column_stack(
        (
            rng.uniform(-0.06, 0.06, size=star_count),
            rng.uniform(0.025, 0.10, size=star_count),
        )
    ).astype(np.float32)
    star_size = rng.uniform(0.65, 2.1, size=star_count).astype(np.float32)
    star_alpha = rng.uniform(0.20, 0.95, size=star_count).astype(np.float32)
    star_phase = rng.uniform(0.0, math.tau, size=star_count).astype(np.float32)
    star_freq = rng.uniform(0.6, 1.8, size=star_count).astype(np.float32)

    if spec.theme == "white":
        bg_color = np.array([250, 252, 255], dtype=np.uint8)
        brace_rgb = (46, 117, 230)
        star_rgb = (70, 85, 105)
    else:
        bg_color = np.array([2, 4, 9], dtype=np.uint8)
        brace_rgb = (66, 133, 244)
        star_rgb = (250, 253, 255)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    writer = imageio.get_writer(
        out_path.as_posix(),
        fps=fps,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p",
        macro_block_size=1,
    )

    started = time.time()
    try:
        for i in range(frames):
            t = i / fps

            # Update brace particles.
            target_wobble = np.column_stack(
                (
                    np.sin(phase + t * 1.35) * 0.75,
                    np.cos(phase + t * 1.11) * 0.75,
                )
            ).astype(np.float32)
            desired = targets + target_wobble
            force = (desired - pos) * 0.082
            noise = np.column_stack(
                (
                    np.sin((phase * 0.7) + t * 1.7) * 0.030,
                    np.cos((phase * 0.5) + t * 1.5) * 0.030,
                )
            ).astype(np.float32)
            vel = (vel + force + noise) * 0.80
            pos = pos + vel

            # Update stars and wrap.
            star_pos += star_vel
            star_pos[:, 0] = np.where(star_pos[:, 0] < -2, width + 2, star_pos[:, 0])
            star_pos[:, 0] = np.where(star_pos[:, 0] > width + 2, -2, star_pos[:, 0])
            star_pos[:, 1] = np.where(star_pos[:, 1] < -2, height + 2, star_pos[:, 1])
            star_pos[:, 1] = np.where(star_pos[:, 1] > height + 2, -2, star_pos[:, 1])

            frame = np.empty((height, width, 3), dtype=np.uint8)
            frame[:, :] = bg_color

            # Draw white ambient stars first.
            twinkle = star_alpha + 0.22 * np.sin(star_phase + t * star_freq * math.tau)
            twinkle = np.clip(twinkle, 0.08, 1.0)
            for j in range(star_count):
                alpha = float(twinkle[j])
                if spec.theme == "white":
                    alpha *= 0.42
                _draw_circle(frame, float(star_pos[j, 0]), float(star_pos[j, 1]), float(star_size[j]), star_rgb, alpha)

            # Draw blue brace particles.
            for j in range(count):
                _draw_circle(frame, float(pos[j, 0]), float(pos[j, 1]), float(size[j]), brace_rgb, 1.0)

            writer.append_data(frame)

            if (i + 1) % 30 == 0:
                elapsed = time.time() - started
                print(f"[{out_path.name}] frame {i + 1}/{frames} ({elapsed:.1f}s)")
    finally:
        writer.close()


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "docs" / "marketing" / "assets"

    specs = [
        RenderSpec(width=1080, height=1350, seconds=10, fps=30, theme="dark"),
        RenderSpec(width=1080, height=1920, seconds=10, fps=30, theme="dark"),
        RenderSpec(width=1080, height=1350, seconds=10, fps=30, theme="white"),
        RenderSpec(width=1080, height=1920, seconds=10, fps=30, theme="white"),
    ]

    for idx, spec in enumerate(specs, start=1):
        suffix = "white_bg" if spec.theme == "white" else "dark_bg"
        filename = f"brace_particles_no_text_{suffix}_{spec.width}x{spec.height}_10s.mp4"
        out_file = output_dir / filename
        print(f"Rendering {out_file} ...")
        render_animation(spec, out_file, seed=202603 + idx)
        print(f"Done: {out_file}")


if __name__ == "__main__":
    main()
