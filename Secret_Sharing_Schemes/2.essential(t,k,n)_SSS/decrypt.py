import numpy as np
from PIL import Image
import os
import secrets

def modInverse(a, m):
    # Modular multiplicative inverse for prime m=257 [cite: 161]
    return pow(int(a), m - 2, m)

def matrix_inverse_mod_257(matrix):
    q = 257
    n = matrix.shape[0]
    det = int(np.round(np.linalg.det(matrix))) % q
    if det == 0:
        return None 
    det_inv = modInverse(det, q)
    
    adjugate = np.zeros((n, n), dtype=int)
    for i in range(n):
        for j in range(n):
            minor = np.delete(np.delete(matrix, i, axis=0), j, axis=1)
            minor_det = int(np.round(np.linalg.det(minor)))
            adjugate[j, i] = ((-1)**(i+j) * minor_det) % q
            
    return (adjugate * det_inv) % q

def decrypt_essential(participant_indices):
    participant_indices.sort()
    q = 257
    if not os.path.exists('metadata.npy'):
        print("CRITICAL ERROR: metadata.npy missing. Run encrypt.py first.")
        return

    meta = np.load('metadata.npy', allow_pickle=True).item()
    t, k = meta['t'], meta['k']
    A_full = np.load('matrix_A.npy')
    all_b = np.load('public_b.npy')
    num_blocks = len(all_b)

    # 1. Physical File Discovery
    found_shares = []
    found_indices = []
    missing_files = []

    for idx in participant_indices:
        file_path = f'shares/participant_{idx}.npy'
        if os.path.exists(file_path):
            found_shares.append(np.load(file_path))
            found_indices.append(idx)
        else:
            missing_files.append(f"participant_{idx}.npy")

    # 2. STRICT THRESHOLD CHECK 
    # If the number of ACTUAL files found is less than k, we stop.
    if len(found_shares) < k:
        print("-" * 60)
        print(f"RECONSTRUCTION ABORTED: Threshold k={k} not met.")
        print(f"Physical files found: {len(found_shares)}")
        print(f"Missing files: {missing_files}")
        print("-" * 60)
        return

    # 3. ESSENTIAL VALIDATION [cite: 65, 155]
    # Check if all essential indices (1 to t) are among the FOUND files
    essential_indices = list(range(1, t + 1))
    if not all(idx in found_indices for idx in essential_indices):
        print("WARNING: Essential shares are missing from the disk.")
        print("Generating a NOISY reconstruction to demonstrate security...")
        
        # Fill missing essential slots with noise to allow the math to run
        final_shares_to_use = []
        for idx in participant_indices[:k]:
            file_path = f'shares/participant_{idx}.npy'
            if os.path.exists(file_path):
                final_shares_to_use.append(np.load(file_path))
            else:
                final_shares_to_use.append(np.array([secrets.randbelow(256) for _ in range(num_blocks)], dtype=np.uint8))
    else:
        final_shares_to_use = found_shares[:k]

    # 4. Mathematical Reconstruction [cite: 165, 246]
    rows = [idx - 1 for idx in participant_indices[:k]]
    A_k_inv = matrix_inverse_mod_257(A_full[rows])
    
    if A_k_inv is None:
        print("FAILED: Matrix not invertible.")
        return
    
    reconstructed_flat = []
    print("Processing blocks...")
    for i in range(num_blocks):
        current_c_values = [int(share[i]) for share in final_shares_to_use]
        alpha_i = sum(current_c_values[:t]) % q
        
        if alpha_i == 0:
            reconstructed_flat.extend([0] * k)
            continue
            
        alpha_inv = modInverse(alpha_i, q)
        current_b_k = all_b[i][rows].reshape(k, 1)
        current_c_k = np.array(current_c_values).reshape(k, 1)
        
        s_i = (alpha_inv * (A_k_inv @ (current_b_k - current_c_k))) % q
        reconstructed_flat.extend(s_i.flatten())

    # Final Image Assembly [cite: 199, 206]
    reconstructed_flat = np.array(reconstructed_flat)
    if meta['pad'] > 0:
        reconstructed_flat = reconstructed_flat[:-meta['pad']]
    
    final_img = (reconstructed_flat.reshape(meta['shape']) % 256).astype(np.uint8)
    Image.fromarray(final_img).save('reconstructed_output.png')
    print("Process complete. Check 'reconstructed_output.png'.")

if __name__ == "__main__":
    # Test with your indices
    decrypt_essential([3,4,1,2])