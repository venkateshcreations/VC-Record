import math
from PIL import Image, ImageDraw, ImageFilter

def create_3d_icon():
    # Supersampled canvas size for crisp anti-aliasing
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    
    # 1. Background Squircle
    # Draw dark rounded rectangle with neon gradient border
    bg_pad = 48
    bg_rad = 220
    
    # Create background mask with rounded rectangle
    mask = Image.new("L", (S, S), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([bg_pad, bg_pad, S - bg_pad, S - bg_pad], radius=bg_rad, fill=255)
    
    # Background gradient from #1a1e32 (top-left) to #0c0e17 (bottom-right)
    bg_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_layer)
    for y in range(bg_pad, S - bg_pad):
        t = (y - bg_pad) / (S - 2 * bg_pad)
        r = int(26 * (1 - t) + 12 * t)
        g = int(30 * (1 - t) + 14 * t)
        b = int(50 * (1 - t) + 23 * t)
        bg_draw.line([(bg_pad, y), (S - bg_pad, y)], fill=(r, g, b, 255))
    
    img.paste(bg_layer, (0, 0), mask)
    
    # Squircle border with subtle cyan/magenta neon gradient
    border_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(border_layer)
    b_draw.rounded_rectangle([bg_pad, bg_pad, S - bg_pad, S - bg_pad], radius=bg_rad, outline=(0, 229, 255, 110), width=9)
    b_draw.rounded_rectangle([bg_pad + 2, bg_pad + 2, S - bg_pad - 2, S - bg_pad - 2], radius=bg_rad - 2, outline=(255, 0, 127, 80), width=5)
    img = Image.alpha_composite(img, border_layer)
    
    # 2. Ambient drop glow behind 3D Play Triangle
    glow_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    
    p_tl = (340, 260)
    p_bl = (340, 764)
    p_rx = (760, 512)
    p_ct = (490, 512)
    
    g_draw.polygon([p_tl, p_rx, p_bl], fill=(255, 0, 85, 120))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=40))
    img = Image.alpha_composite(img, glow_layer)
    
    # 3. 3D Triangular Play Prism Facets
    # Helper to interpolate colors
    def interp_color(c1, c2, t):
        return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))

    # Facet 1: Top Facet (p_tl -> p_rx -> p_ct)
    # Gradient: Yellow/Amber (#FFD166) -> Coral/Pink (#FF0055)
    f1_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    f1_draw = ImageDraw.Draw(f1_layer)
    f1_mask = Image.new("L", (S, S), 0)
    f1_mask_draw = ImageDraw.Draw(f1_mask)
    f1_mask_draw.polygon([p_tl, p_rx, p_ct], fill=255)
    
    c_amber = (255, 209, 102, 255)
    c_coral = (255, 0, 85, 255)
    for x in range(p_tl[0], p_rx[0] + 1):
        t = (x - p_tl[0]) / (p_rx[0] - p_tl[0])
        col = interp_color(c_amber, c_coral, t)
        f1_draw.line([(x, p_tl[1]), (x, p_rx[1] + 10)], fill=col)
    img.paste(f1_layer, (0, 0), f1_mask)
    
    # Facet 2: Bottom Facet (p_bl -> p_rx -> p_ct)
    # Gradient: Hot Pink (#FF0055) -> Purple (#7209B7) -> Deep Violet (#3A0CA3)
    f2_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    f2_draw = ImageDraw.Draw(f2_layer)
    f2_mask = Image.new("L", (S, S), 0)
    f2_mask_draw = ImageDraw.Draw(f2_mask)
    f2_mask_draw.polygon([p_bl, p_rx, p_ct], fill=255)
    
    c_pink = (255, 0, 85, 255)
    c_violet = (58, 12, 163, 255)
    for x in range(p_bl[0], p_rx[0] + 1):
        t = (x - p_bl[0]) / (p_rx[0] - p_bl[0])
        col = interp_color(c_pink, c_violet, t)
        f2_draw.line([(x, p_ct[1] - 10), (x, p_bl[1] + 10)], fill=col)
    img.paste(f2_layer, (0, 0), f2_mask)
    
    # Facet 3: Left / Base Face (p_tl -> p_bl -> p_ct)
    # Gradient: Rose (#FF758F) -> Purple (#9D4EDD) -> Dark Indigo (#480CA8)
    f3_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    f3_draw = ImageDraw.Draw(f3_layer)
    f3_mask = Image.new("L", (S, S), 0)
    f3_mask_draw = ImageDraw.Draw(f3_mask)
    f3_mask_draw.polygon([p_tl, p_bl, p_ct], fill=255)
    
    c_rose = (255, 117, 143, 255)
    c_indigo = (72, 12, 168, 255)
    for y in range(p_tl[1], p_bl[1] + 1):
        t = (y - p_tl[1]) / (p_bl[1] - p_tl[1])
        col = interp_color(c_rose, c_indigo, t)
        f3_draw.line([(p_tl[0], y), (p_ct[0], y)], fill=col)
    img.paste(f3_layer, (0, 0), f3_mask)
    
    # 4. Specular Highlight Ridge Lines
    ridges = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ridges)
    
    # Center to Apex ridge line (bright white shine)
    r_draw.line([p_ct, p_rx], fill=(255, 255, 255, 220), width=6)
    # Center to Top-Left ridge line
    r_draw.line([p_ct, p_tl], fill=(255, 255, 255, 180), width=5)
    # Center to Bottom-Left ridge line
    r_draw.line([p_ct, p_bl], fill=(255, 255, 255, 100), width=4)
    # Top outer ridge (ambient gloss)
    r_draw.line([p_tl, p_rx], fill=(255, 255, 255, 160), width=6)
    
    img = Image.alpha_composite(img, ridges)
    
    # 5. Center Inset Lens / Core Play Dot
    core_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(core_layer)
    
    cx, cy = 440, 512
    # Dark recessed socket
    c_draw.ellipse([cx - 56, cy - 56, cx + 56, cy + 56], fill=(14, 16, 26, 220), outline=(255, 255, 255, 90), width=5)
    # Glowing magenta inner glow
    c_draw.ellipse([cx - 40, cy - 40, cx + 40, cy + 40], fill=(255, 0, 85, 80))
    # Bright center pearl / lens reflection
    c_draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=(255, 255, 255, 245))
    c_draw.ellipse([cx - 16, cy - 18, cx - 4, cy - 6], fill=(255, 255, 255, 255))
    
    img = Image.alpha_composite(img, core_layer)
    
    # 6. High quality downsampling
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
    
    # Save PNGs
    img_512.save("public/icon.png", format="PNG")
    try:
        img_512.save("dist/icon.png", format="PNG")
    except Exception:
        pass
    print("Saved public/icon.png (512x512)")
    
    # Save Multi-resolution Windows ICO
    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img_256.save("public/icon.ico", format="ICO", sizes=ico_sizes)
    try:
        img_256.save("dist/icon.ico", format="ICO", sizes=ico_sizes)
    except Exception:
        pass
    print("Saved public/icon.ico with sizes:", ico_sizes)

if __name__ == "__main__":
    create_3d_icon()
