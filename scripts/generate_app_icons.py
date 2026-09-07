import os
from PIL import Image, ImageDraw

src_path = r"c:\Users\AGM\Documents\teach\teacher-rn\src\assets\app_icon.png"
img = Image.open(src_path).convert("RGBA")

android_res = r"c:\Users\AGM\Documents\teach\teacher-rn\android\app\src\main\res"

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def make_round(im, size):
    # Crop slightly to remove outer margins and center the icon inside the circle
    w, h = im.size
    # Focus bounding box of the logo
    crop_box = (int(w * 0.08), int(h * 0.08), int(w * 0.92), int(h * 0.92))
    cropped = im.crop(crop_box)
    im_resized = cropped.resize((size, size), Image.Resampling.LANCZOS)
    
    # Create circular antialiased mask
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * scale, size * scale), fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    
    round_img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    round_img.paste(im_resized, (0, 0), mask)
    return round_img

for folder, sz in sizes.items():
    folder_path = os.path.join(android_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. Standard square/squircle icon
    sq = img.resize((sz, sz), Image.Resampling.LANCZOS)
    sq.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # 2. Round icon
    rd = make_round(img, sz)
    rd.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

print("Regenerated all mipmaps perfectly!")
