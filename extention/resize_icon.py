import os
from PIL import Image

src_path = r"C:\Users\vivek001\.gemini\antigravity\brain\421880de-ce87-4afb-9e50-186cb051f1bf\downloader_icon_1784695804453.jpg"
dest_dir = r"e:\extention\icons"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

try:
    img = Image.open(src_path)
    
    # Resize to 16, 48, 128
    sizes = [16, 48, 128]
    for size in sizes:
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(dest_dir, f"icon{size}.png")
        resized_img.save(out_path, "PNG")
        print(f"Saved {out_path}")
        
    print("Icons successfully created.")
except Exception as e:
    print(f"Error creating icons: {e}")
