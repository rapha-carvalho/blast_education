from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import math

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont


@dataclass(frozen=True)
class RenderSpec:
    width: int
    height: int
    theme: str  # dark | white
    seconds: int = 10
    fps: int = 30

    @property
    def frame_count(self) -> int:
        return self.seconds * self.fps


def _pick_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if bold:
        candidates = [
            "C:/Windows/Fonts/seguisb.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    for font_path in candidates:
        if Path(font_path).exists():
            try:
                return ImageFont.truetype(font_path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


def _layout_values(w: int, h: int) -> dict[str, float]:
    # Keep the full content block vertically centered on ad canvases.
    min_dim = min(w, h)
    block_center_y = h * 0.52
    kicker_y = block_center_y - min_dim * 0.115
    h1_y = block_center_y - min_dim * 0.020
    h2_y = block_center_y + min_dim * 0.036  # tighter line spacing between title lines
    subtitle_y = block_center_y + min_dim * 0.112
    stats_y = block_center_y + min_dim * 0.168
    button_y = block_center_y + min_dim * 0.262
    return {
        "kicker_y": kicker_y,
        "h1_y": h1_y,
        "h2_y": h2_y,
        "subtitle_y": subtitle_y,
        "stats_y": stats_y,
        "button_y": button_y,
        "brace_center_y": (h1_y + h2_y) * 0.5,
    }


def _build_brace_targets(width: int, height: int, center_y: float, spacing: int = 6) -> np.ndarray:
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    brace_size = int(min(width * 0.34, 300))
    brace_font = _pick_font(brace_size, bold=False)

    center_x = width * 0.5
    brace_offset = max(min(width * 0.40, 440), 250)
    draw.text((center_x - brace_offset, center_y), "{", fill=255, font=brace_font, anchor="mm")
    draw.text((center_x + brace_offset, center_y), "}", fill=255, font=brace_font, anchor="mm")

    data = np.array(mask)
    pts: list[tuple[float, float]] = []
    for y in range(0, height, spacing):
        row = data[y]
        for x in range(0, width, spacing):
            if row[x] > 80:
                pts.append((float(x), float(y)))
    return np.array(pts, dtype=np.float32)


def _text_overlay(spec: RenderSpec) -> np.ndarray:
    w, h = spec.width, spec.height
    min_dim = min(w, h)
    vals = _layout_values(w, h)

    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    if spec.theme == "white":
        kicker_color = (42, 111, 230, 245)
        h1_color = (20, 25, 33, 255)
        h2_color = (89, 95, 105, 255)
        subtitle_color = (140, 148, 159, 255)
        stats_color = (96, 103, 113, 240)
        button_bg = (20, 24, 30, 255)
        button_fg = (255, 255, 255, 255)
    else:
        kicker_color = (100, 156, 255, 245)
        h1_color = (246, 249, 255, 255)
        h2_color = (184, 195, 209, 255)
        subtitle_color = (141, 153, 168, 245)
        stats_color = (126, 140, 156, 240)
        button_bg = (255, 255, 255, 255)
        button_fg = (14, 18, 24, 255)

    # Slightly smaller typography for ad-safe composition on vertical canvases.
    kicker_font = _pick_font(max(20, int(min_dim * 0.024)), bold=True)
    h1_font = _pick_font(max(46, int(min_dim * 0.060)), bold=True)
    h2_font = _pick_font(max(46, int(min_dim * 0.060)), bold=True)
    subtitle_font = _pick_font(max(22, int(min_dim * 0.024)), bold=False)
    stats_font = _pick_font(max(18, int(min_dim * 0.020)), bold=False)
    button_font = _pick_font(max(22, int(min_dim * 0.026)), bold=True)

    cx = w * 0.5
    draw.text((cx, vals["kicker_y"]), "SQL DO BÁSICO AO AVANÇADO", fill=kicker_color, font=kicker_font, anchor="mm")
    draw.text((cx, vals["h1_y"]), "De zero queries a análises", fill=h1_color, font=h1_font, anchor="mm")
    draw.text((cx, vals["h2_y"]), "complexas de negócio", fill=h2_color, font=h2_font, anchor="mm")
    draw.text((cx, vals["subtitle_y"]), "Aprenda SQL de forma prática com datasets reais e exercícios interativos.", fill=subtitle_color, font=subtitle_font, anchor="mm")
    draw.text((cx, vals["stats_y"]), "11 módulos · 35 aulas · 35 concluídas · 100% completo", fill=stats_color, font=stats_font, anchor="mm")

    button_w = min(int(w * 0.42), 460)
    button_h = max(66, int(h * 0.038))
    bx0 = int(cx - button_w / 2)
    by0 = int(vals["button_y"] - button_h / 2)
    bx1 = int(cx + button_w / 2)
    by1 = int(vals["button_y"] + button_h / 2)
    radius = int(button_h / 2)
    draw.rounded_rectangle((bx0, by0, bx1, by1), radius=radius, fill=button_bg)
    draw.text((cx, vals["button_y"]), "Começar primeira aula  →", fill=button_fg, font=button_font, anchor="mm")

    return np.array(canvas, dtype=np.uint8)


def _draw_circle(img: np.ndarray, x: float, y: float, r: float, rgb: tuple[int, int, int], alpha: float) -> None:
    h, w, _ = img.shape
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
    patch = img[y0 : y1 + 1, x0 : x1 + 1]
    col = np.array(rgb, dtype=np.float32)
    a = np.clip(alpha, 0.0, 1.0)
    patch[mask] = (patch[mask] * (1.0 - a) + col * a).astype(np.uint8)


def _blend_overlay(base: np.ndarray, overlay_rgba: np.ndarray) -> np.ndarray:
    alpha = (overlay_rgba[..., 3:4].astype(np.float32) / 255.0)
    over_rgb = overlay_rgba[..., :3].astype(np.float32)
    out = base.astype(np.float32) * (1.0 - alpha) + over_rgb * alpha
    return out.astype(np.uint8)


def render_pair(spec: RenderSpec, output_dir: Path, seed: int) -> tuple[Path, Path]:
    rng = np.random.default_rng(seed)
    w, h = spec.width, spec.height
    vals = _layout_values(w, h)

    targets = _build_brace_targets(w, h, vals["brace_center_y"], spacing=6)
    if len(targets) == 0:
        raise RuntimeError(f"No brace targets for {spec.width}x{spec.height}")

    overlay = _text_overlay(spec)

    # Theme colors.
    if spec.theme == "white":
        bg_color = np.array([245, 247, 250], dtype=np.uint8)
        brace_rgb = (58, 127, 244)
        star_rgb = (84, 95, 110)
        star_alpha_scale = 0.44
    else:
        bg_color = np.array([3, 6, 12], dtype=np.uint8)
        brace_rgb = (66, 133, 244)
        star_rgb = (246, 250, 255)
        star_alpha_scale = 1.0

    # Brace particles.
    n = len(targets)
    pos = rng.random((n, 2), dtype=np.float32) * np.array([w, h], dtype=np.float32)
    vel = (rng.random((n, 2), dtype=np.float32) - 0.5) * 0.45
    size = rng.uniform(0.9, 2.15, size=n).astype(np.float32)
    phase = rng.uniform(0.0, math.tau, size=n).astype(np.float32)

    # Ambient particles.
    star_count = max(120, int((w * h) / 12000))
    star_pos = rng.random((star_count, 2), dtype=np.float32) * np.array([w, h], dtype=np.float32)
    star_vel = np.column_stack(
        (
            rng.uniform(-0.05, 0.05, size=star_count),
            rng.uniform(0.02, 0.095, size=star_count),
        )
    ).astype(np.float32)
    star_size = rng.uniform(0.6, 1.9, size=star_count).astype(np.float32)
    star_alpha = rng.uniform(0.18, 0.95, size=star_count).astype(np.float32) * star_alpha_scale
    star_phase = rng.uniform(0.0, math.tau, size=star_count).astype(np.float32)
    star_freq = rng.uniform(0.55, 1.7, size=star_count).astype(np.float32)

    suffix = "white_bg" if spec.theme == "white" else "dark_bg"
    mp4_path = output_dir / f"course_hero_anim_{suffix}_{w}x{h}_10s.mp4"
    png_path = output_dir / f"course_hero_static_{suffix}_{w}x{h}.png"
    output_dir.mkdir(parents=True, exist_ok=True)

    writer = imageio.get_writer(
        mp4_path.as_posix(),
        fps=spec.fps,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p",
        macro_block_size=1,
    )

    static_frame_idx = spec.frame_count // 2
    try:
        for i in range(spec.frame_count):
            t = i / spec.fps

            # Brace dynamics.
            wobble = np.column_stack(
                (
                    np.sin(phase + t * 1.32) * 0.75,
                    np.cos(phase + t * 1.08) * 0.75,
                )
            ).astype(np.float32)
            desired = targets + wobble
            force = (desired - pos) * 0.082
            noise = np.column_stack(
                (
                    np.sin((phase * 0.7) + t * 1.72) * 0.03,
                    np.cos((phase * 0.5) + t * 1.48) * 0.03,
                )
            ).astype(np.float32)
            vel = (vel + force + noise) * 0.80
            pos += vel

            # Ambient motion + wrap.
            star_pos += star_vel
            star_pos[:, 0] = np.where(star_pos[:, 0] < -2, w + 2, star_pos[:, 0])
            star_pos[:, 0] = np.where(star_pos[:, 0] > w + 2, -2, star_pos[:, 0])
            star_pos[:, 1] = np.where(star_pos[:, 1] < -2, h + 2, star_pos[:, 1])
            star_pos[:, 1] = np.where(star_pos[:, 1] > h + 2, -2, star_pos[:, 1])

            frame = np.empty((h, w, 3), dtype=np.uint8)
            frame[:, :] = bg_color

            twinkle = star_alpha + 0.22 * np.sin(star_phase + t * star_freq * math.tau)
            twinkle = np.clip(twinkle, 0.08, 1.0)

            for j in range(star_count):
                _draw_circle(
                    frame,
                    float(star_pos[j, 0]),
                    float(star_pos[j, 1]),
                    float(star_size[j]),
                    star_rgb,
                    float(twinkle[j]),
                )

            for j in range(n):
                _draw_circle(frame, float(pos[j, 0]), float(pos[j, 1]), float(size[j]), brace_rgb, 1.0)

            frame = _blend_overlay(frame, overlay)
            writer.append_data(frame)

            if i == static_frame_idx:
                Image.fromarray(frame, mode="RGB").save(png_path.as_posix(), format="PNG", optimize=True)
    finally:
        writer.close()

    return mp4_path, png_path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "docs" / "marketing" / "assets"
    specs = [
        RenderSpec(1080, 1350, "dark", seconds=10, fps=30),
        RenderSpec(1080, 1920, "dark", seconds=10, fps=30),
        RenderSpec(1080, 1350, "white", seconds=10, fps=30),
        RenderSpec(1080, 1920, "white", seconds=10, fps=30),
    ]
    for idx, spec in enumerate(specs, start=1):
        print(f"Rendering hero assets: theme={spec.theme} {spec.width}x{spec.height}")
        mp4_path, png_path = render_pair(spec, out_dir, seed=404000 + idx)
        print(f"Done MP4: {mp4_path}")
        print(f"Done PNG: {png_path}")


if __name__ == "__main__":
    main()
