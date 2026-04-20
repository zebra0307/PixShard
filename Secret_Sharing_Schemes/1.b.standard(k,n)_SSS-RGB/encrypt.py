import numpy as np
from PIL import Image
import os
import random

def encrypt_image_rgb(image_path, k, n):
    img = Image.open(image_path).convert('RGB')
    data = np.array(img, dtype=np.int32)
    h, w, channels = data.shape
    
    # Create n empty RGB share matrices
    shares = [np.zeros((h, w, 3), dtype=np.uint8) for _ in range(n)]
    
    for r in range(h):
        for c in range(w):
            for ch in range(3): # Process R, G, and B
                pixel_val = data[r, c, ch]
                coeffs = [pixel_val] + [random.randint(0, 255) for _ in range(k-1)]
                
                for i in range(1, n + 1):
                    val = 0
                    for deg, coeff in enumerate(coeffs):
                        val += coeff * (i ** deg)
                    shares[i-1][r, c, ch] = val % 256
                
    if not os.path.exists('shares'): os.makedirs('shares')
    for i, share_data in enumerate(shares):
        Image.fromarray(share_data).save(f'shares/share_{i+1}.png')
    print(f"Generated {n} RGB shares. Threshold is {k}.")

if __name__ == "__main__":
    encrypt_image_rgb('input.jpg', k=3, n=5)