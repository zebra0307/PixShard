import numpy as np
from PIL import Image
import os

def decrypt_image_grayscale(indices, k):
    share_paths = [f'shares/share_{idx}.png' for idx in indices]
    
    # Load shares as Grayscale ('L')
    share_imgs = [np.array(Image.open(p).convert('L'), dtype=np.int32) for p in share_paths]
    h, w = share_imgs[0].shape
    reconstructed = np.zeros((h, w), dtype=np.uint8)

    print("Reconstructing Grayscale image...")
    x = indices 

    for r in range(h):
        for col in range(w):
            y = [int(img[r, col]) for img in share_imgs]
            
            # Lagrange Interpolation for x=0
            pixel_sum = 0.0
            for j in range(k):
                basis = 1.0
                for m in range(k):
                    if m != j:
                        basis *= (0 - x[m]) / (x[j] - x[m])
                pixel_sum += y[j] * basis
            
            reconstructed[r, col] = np.uint8(int(round(pixel_sum)) % 256)

    Image.fromarray(reconstructed).save('reconstructed_gray.png')
    print("Success: Reconstructed image saved as 'reconstructed_gray.png'.")

if __name__ == "__main__":
    decrypt_image_grayscale([1, 2, 3], k=3)