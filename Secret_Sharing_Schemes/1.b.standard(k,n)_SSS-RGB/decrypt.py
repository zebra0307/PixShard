import numpy as np
from PIL import Image

def lagrange_at_zero(x_coords, y_coords):
    secret = 0
    k = len(x_coords)
    for j in range(k):
        num, den = 1, 1
        for m in range(k):
            if m != j:
                num *= x_coords[m]
                den *= (x_coords[m] - x_coords[j])
        secret += y_coords[j] * (num / den)
    return int(round(secret)) % 256

def decrypt_image_rgb(share_indices, k):
    share_images = [np.array(Image.open(f'shares/share_{idx}.png'), dtype=np.int32) for idx in share_indices]
    h, w, _ = share_images[0].shape
    reconstructed = np.zeros((h, w, 3), dtype=np.uint8)
    
    for r in range(h):
        for c in range(w):
            for ch in range(3):
                y_values = [share[r, c, ch] for share in share_images]
                reconstructed[r, c, ch] = lagrange_at_zero(share_indices, y_values)
            
    Image.fromarray(reconstructed).save('reconstructed_rgb.png')
    print("RGB Reconstruction complete.")

if __name__ == "__main__":
    decrypt_image_rgb([1, 2, 3], k=3)