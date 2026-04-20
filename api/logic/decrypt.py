#!/usr/bin/env python3
"""
PixShard - Unified Decryption CLI
  python decrypt.py --shares_dir ./images --public_dir ./public_datas --indices 1,2,3 --output out.png
Exit: 0=success, 1=error
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image

Q = 257

def gf_inv(a: int) -> int:
    return pow(int(a) % Q, Q - 2, Q)

def matrix_inverse_mod_q(matrix: np.ndarray):
    """Adjugate-based matrix inverse mod Q (for small k×k matrices)."""
    n = matrix.shape[0]
    det = int(round(np.linalg.det(matrix.astype(float)))) % Q
    if det == 0:
        return None
    det_inv = gf_inv(det)
    adj = np.zeros((n, n), dtype=np.int64)
    for i in range(n):
        for j in range(n):
            minor = np.delete(np.delete(matrix, i, axis=0), j, axis=1)
            adj[j, i] = int(((-1) ** (i + j)) * round(np.linalg.det(minor.astype(float)))) % Q
    return (adj * det_inv) % Q

# ── Standard (k,n) Decrypt ────────────────────────────────────────────────────

def decrypt_standard(shares_dir, public_dir, indices, output_path):
    with open(os.path.join(public_dir, "metadata.json")) as f:
        meta = json.load(f)
    k, shape, is_rgb = meta["k"], tuple(meta["shape"]), meta["is_rgb"]

    use_idx = sorted(set(indices))[:k]
    if len(use_idx) < k:
        print(f"ERROR: Need {k} shares, got {len(use_idx)}", file=sys.stderr); sys.exit(1)

    shares = []
    for idx in use_idx:
        fp = os.path.join(shares_dir, f"share_{idx}.npy")
        if not os.path.exists(fp):
            print(f"ERROR: {fp} not found", file=sys.stderr); sys.exit(1)
        shares.append(np.load(fp).astype(np.int64))

    N = len(shares[0])
    secret = np.zeros(N, dtype=np.int64)

    # Vectorized Lagrange interpolation at x=0 over GF(257)
    for j in range(k):
        num, den = 1, 1
        for m in range(k):
            if m != j:
                num = num * (Q - use_idx[m]) % Q
                den = den * ((use_idx[j] - use_idx[m]) % Q) % Q
        basis = int(num * gf_inv(den) % Q)
        secret = (secret + shares[j] * basis) % Q

    img_data = secret.reshape(shape).astype(np.uint8)
    Image.fromarray(img_data).save(output_path)
    print(f"[PixShard] Standard reconstruction saved → {output_path}", flush=True)

# ── Essential (t,k,n) Decrypt ─────────────────────────────────────────────────

def decrypt_essential(shares_dir, public_dir, indices, output_path):
    with open(os.path.join(public_dir, "metadata.json")) as f:
        meta = json.load(f)
    t, k = meta["t"], meta["k"]
    shape, pad = tuple(meta["shape"]), meta["pad"]

    A_full = np.load(os.path.join(public_dir, "matrix_A.npy"))
    with open(os.path.join(public_dir, "public_b.json")) as f:
        all_b = np.array(json.load(f), dtype=np.int64)        # num_blocks × n
    num_blocks = len(all_b)

    use_idx = sorted(set(indices))[:k]
    if len(use_idx) < k:
        print(f"ERROR: Need {k} participants, got {len(use_idx)}", file=sys.stderr); sys.exit(1)

    essential = set(range(1, t + 1))
    missing_essential = essential - set(use_idx)
    if missing_essential:
        print(f"WARNING: Missing essential participants {sorted(missing_essential)} — output will be garbled.", flush=True)

    # Load participant share arrays
    share_data = {}
    for idx in use_idx:
        fp = os.path.join(shares_dir, f"participant_{idx}.npy")
        share_data[idx] = np.load(fp).astype(np.int64) if os.path.exists(fp) else np.zeros(num_blocks, dtype=np.int64)

    rows = [idx - 1 for idx in use_idx]
    A_k_inv = matrix_inverse_mod_q(A_full[rows])
    if A_k_inv is None:
        print("ERROR: Selected matrix not invertible. Choose different participants.", file=sys.stderr); sys.exit(1)

    recon = []
    for i in range(num_blocks):
        # alpha_i = sum of c values from essential participants (1..t)
        alpha_i = sum(int(share_data[ei][i]) for ei in range(1, t + 1) if ei in share_data) % Q
        if alpha_i == 0:
            recon.extend([0] * k); continue

        alpha_inv = gf_inv(alpha_i)
        b_k = all_b[i][rows].reshape(k, 1)
        c_k = np.array([int(share_data[idx][i]) for idx in use_idx], dtype=np.int64).reshape(k, 1)
        s_i = (alpha_inv * (A_k_inv @ ((b_k - c_k) % Q))) % Q
        recon.extend(s_i.flatten().tolist())

    recon = np.array(recon, dtype=np.int64)
    if pad > 0:
        recon = recon[:-pad]
    img_data = (recon.reshape(shape) % 256).astype(np.uint8)
    Image.fromarray(img_data).save(output_path)
    print(f"[PixShard] Essential reconstruction saved → {output_path}", flush=True)

# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="PixShard Decryption")
    p.add_argument("--shares_dir", default="./images")
    p.add_argument("--public_dir", default="./public_datas")
    p.add_argument("--indices", required=True, help="Comma-separated, e.g. 1,2,3")
    p.add_argument("--output", required=True, help="Output image path (.png)")
    args = p.parse_args()

    meta_path = os.path.join(args.public_dir, "metadata.json")
    if not os.path.exists(meta_path):
        print(f"ERROR: {meta_path} not found", file=sys.stderr); sys.exit(1)

    with open(meta_path) as f:
        meta = json.load(f)
    indices = [int(x.strip()) for x in args.indices.split(",")]

    try:
        if meta["scheme"] == "standard":
            decrypt_standard(args.shares_dir, args.public_dir, indices, args.output)
        else:
            decrypt_essential(args.shares_dir, args.public_dir, indices, args.output)
        sys.exit(0)
    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"ERROR: {e}", file=sys.stderr); sys.exit(1)

if __name__ == "__main__":
    main()
