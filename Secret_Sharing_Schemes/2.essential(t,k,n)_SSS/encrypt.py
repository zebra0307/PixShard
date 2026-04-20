import numpy as np
from PIL import Image
import os
import secrets

def get_vandermonde_matrix(n, k, q):
    # Generates matrix A where any kxk sub-matrix is invertible [cite: 133]
    return np.array([[pow(i, j, q) for j in range(k)] for i in range(1, n + 1)], dtype=int)

def encrypt(image_path, t, k, n):
    q = 257  # Modulo 257 for lossless recovery [cite: 87, 89]
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    img = Image.open(image_path)
    is_color = img.mode == 'RGB'
    data = np.array(img, dtype=int)
    
    # Flattening treats Gray (2D) and RGB (3D) identically [cite: 97, 98]
    flat_data = data.flatten()
    pad_len = (k - (len(flat_data) % k)) % k
    flat_data = np.append(flat_data, [0] * pad_len)
    
    num_blocks = len(flat_data) // k
    A = get_vandermonde_matrix(n, k, q)
    
    shares = [[] for _ in range(n)]
    all_b = []

    print(f"Encrypting {image_path}...")
    for i in range(num_blocks):
        s_i = flat_data[i*k : (i+1)*k].reshape(k, 1)
        
        # Ensure sum of essential shares (alpha) is not zero [cite: 141, 146]
        while True:
            c_i = np.array([secrets.randbelow(256) for _ in range(n)]).reshape(n, 1)
            alpha_i = np.sum(c_i[:t]) % q
            if alpha_i != 0:
                break
        
        # Public value b = alpha * A * s + c (mod 257) [cite: 147, 148]
        b_i = (alpha_i * (A @ s_i) + c_i) % q
        all_b.append(b_i.flatten())
        
        for j in range(n):
            shares[j].append(c_i[j][0])

    if not os.path.exists('shares'): os.makedirs('shares')
    for j in range(n):
        np.save(f'shares/participant_{j+1}.npy', np.array(shares[j], dtype=np.uint8))
    
    np.save('public_b.npy', np.array(all_b, dtype=np.uint16))
    np.save('matrix_A.npy', A)
    np.save('metadata.npy', {
        'shape': data.shape, 'is_color': is_color, 'pad': pad_len, 
        't': t, 'k': k, 'n': n
    })
    print("Encryption complete. All files generated.")

if __name__ == "__main__":
    # Settings: t=2 essential, k=3 total needed, n=5 total created [cite: 357, 358]
    encrypt('input2.jpg', t=2, k=3, n=5)