#!/usr/bin/env python3
"""
Crop a portrait photo into a circle with a colored border, output PNG.
Usage: python3 crop-photo-round.py input.jpg [--output out.png] [--size 354] [--border 2.5] [--border-color c9a227]
"""
import argparse
from PIL import Image, ImageDraw

def crop_circle(input_path, output_path, size=354, border_px=2.5, border_color="#c9a227"):
    img = Image.open(input_path).convert("RGBA")
    # Crop to square center
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img = img.crop((left, top, left + min_dim, top + min_dim))
    img = img.resize((size, size), Image.LANCZOS)

    # Circle mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    # Apply mask
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)

    # Add border by compositing a larger colored circle behind
    if border_px > 0:
        total = size + int(border_px * 2)
        bordered = Image.new("RGBA", (total, total), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bordered)
        rgb = tuple(int(border_color.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
        bd.ellipse((0, 0, total, total), fill=rgb + (255,))
        bordered.paste(result, (int(border_px), int(border_px)), result)
        result = bordered

    result.save(output_path)
    print(f"Saved: {output_path} ({result.size[0]}x{result.size[1]})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crop photo to circle with border")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("--output", "-o", default="photo_round.png", help="Output PNG path")
    parser.add_argument("--size", type=int, default=354, help="Output square size in px")
    parser.add_argument("--border", type=float, default=2.5, help="Border width in px")
    parser.add_argument("--border-color", default="c9a227", help="Border hex color (no #)")
    args = parser.parse_args()
    crop_circle(args.input, args.output, args.size, args.border, f"#{args.border_color}")
