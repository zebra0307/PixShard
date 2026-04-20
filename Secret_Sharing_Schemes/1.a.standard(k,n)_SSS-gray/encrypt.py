import numpy as np
from PIL import Image
import os
import secrets

def encrypt_image_grayscale(image_path, k, n):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    # 'L' mode is 8-bit pixels, black and white (Grayscale)
    img = Image.open(image_path).convert('L')
    data = np.array(img, dtype=np.uint16) 
    h, w = data.shape #2 dimensions
    
    #list of n empty black images (matrices filled with zeros)
    shares = [np.zeros((h, w), dtype=np.uint8) for _ in range(n)]
    
    print(f"Generating {n} Grayscale shares...")
    for r in range(h):
        for col in range(w):
            pixel = int(data[r, col]) # Single value per pixel
            
            # Polynomial coefficients: a0 = pixel value
            coeffs = [pixel] + [secrets.randbelow(256) for _ in range(k-1)] #To have a threshold of k, we need a polynomial of degree (k-1)
            
            for i in range(1, n + 1):
                val = 0
                for deg, coeff in enumerate(coeffs):
                    val = (val + coeff * (i ** deg)) % 256
                shares[i-1][r, col] = val
    
    if not os.path.exists('shares'): 
        os.makedirs('shares')
        
    for i in range(n):
        Image.fromarray(shares[i]).save(f'shares/share_{i+1}.png')
    print("Success: Grayscale shares generated.")

if __name__ == "__main__":
    encrypt_image_grayscale('input.jpg', k=3, n=5)