#!/usr/bin/env python3
"""
PixShard - Unified Encryption CLI
  Standard:  python encrypt.py --type k,n  --input img.jpg --k 3 --n 5 --shares_dir ./images --public_dir ./public_datas
  Essential: python encrypt.py --type t,k,n --input img.jpg --t 2 --k 3 --n 5 --shares_dir ./images --public_dir ./public_datas
Exit: 0=success, 1=error
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image

Q = 257  # GF(257) prime — supports pixel values 0-255 losslessly

# ── GF(257) helpers ───────────────────────────────────────────────────────────

def gf_inv(a: int) -> int:
    return pow(int(a) % Q, Q - 2, Q)

# ── Standard (k,n) Shamir SSS over GF(257) ───────────────────────────────────

def encrypt_standard(image_path, k, n, shares_dir, public_dir):
    os.makedirs(shares_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    img = Image.open(image_path)
    is_rgb = img.mode in ('RGB', 'RGBA')
    img = img.convert('RGB') if is_rgb else img.convert('L')
    data = np.array(img, dtype=np.int64)
    shape = data.shape
    flat = data.flatten()
    N = len(flat)

    rng = np.random.default_rng()
    # coeffs[i, 0] = secret, coeffs[i, 1..k-1] = random
    coeffs = np.empty((N, k), dtype=np.int64)
    coeffs[:, 0] = flat
    coeffs[:, 1:] = rng.integers(0, Q, size=(N, k - 1))

    # powers[j, i] = (i+1)^j mod Q  → shape (k, n)
    powers = np.array([[pow(i + 1, j, Q) for i in range(n)] for j in range(k)], dtype=np.int64)

    # share_matrix: N×n — share_matrix[pixel, participant_i] = f(i+1) mod Q
    share_matrix = (coeffs @ powers) % Q   # vectorized, fast

    share_files = []
    for i in range(n):
        fname = f"share_{i + 1}.npy"
        np.save(os.path.join(shares_dir, fname), share_matrix[:, i].astype(np.uint16))
        share_files.append(fname)

    meta = {
        "scheme": "standard", "k": k, "n": n,
        "shape": list(shape), "is_rgb": bool(is_rgb),
        "share_files": share_files,
        "original_filename": os.path.basename(image_path),
    }
    with open(os.path.join(public_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"[PixShard] Standard ({k},{n}) complete — {n} shares saved.", flush=True)

# ── Essential (t,k,n) SSS over GF(257) ───────────────────────────────────────

def _vandermonde(n, k):
    return np.array([[pow(i, j, Q) for j in range(k)] for i in range(1, n + 1)], dtype=np.int64)

def encrypt_essential(image_path, t, k, n, shares_dir, public_dir):
    os.makedirs(shares_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    img = Image.open(image_path)
    is_rgb = img.mode in ('RGB', 'RGBA')
    img = img.convert('RGB') if is_rgb else img.convert('L')
    data = np.array(img, dtype=np.int64)
    shape = data.shape

    flat = data.flatten()
    pad_len = (k - (len(flat) % k)) % k
    if pad_len:
        flat = np.concatenate([flat, np.zeros(pad_len, dtype=np.int64)])
    num_blocks = len(flat) // k

    A = _vandermonde(n, k)          # n×k Vandermonde
    share_lists = [[] for _ in range(n)]
    all_b = []
    rng = np.random.default_rng()

    print(f"[PixShard] Essential encryption: t={t} k={k} n={n} blocks={num_blocks}", flush=True)

    for i in range(num_blocks):
        s_i = flat[i * k:(i + 1) * k].reshape(k, 1)
        # Rejection sample until alpha ≠ 0
        while True:
            c_i = rng.integers(0, 256, size=(n, 1), dtype=np.int64)
            alpha_i = int(np.sum(c_i[:t]) % Q)
            if alpha_i != 0:
                break
        # b = alpha * A*s + c  (mod Q)
        b_i = (alpha_i * (A @ s_i) + c_i) % Q
        all_b.append(b_i.flatten().tolist())
        for j in range(n):
            share_lists[j].append(int(c_i[j, 0]))

    share_files = []
    for j in range(n):
        fname = f"participant_{j + 1}.npy"
        np.save(os.path.join(shares_dir, fname), np.array(share_lists[j], dtype=np.uint16))
        share_files.append(fname)

    np.save(os.path.join(public_dir, "matrix_A.npy"), A)
    with open(os.path.join(public_dir, "public_b.json"), "w") as f:
        json.dump(all_b, f)

    meta = {
        "scheme": "essential", "t": t, "k": k, "n": n,
        "shape": list(shape), "is_rgb": bool(is_rgb), "pad": pad_len,
        "share_files": share_files,
        "original_filename": os.path.basename(image_path),
    }
    with open(os.path.join(public_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"[PixShard] Essential ({t},{k},{n}) complete.", flush=True)

# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="PixShard Encryption")
    p.add_argument("--type", required=True, choices=["k,n", "t,k,n"])
    p.add_argument("--input", required=True)
    p.add_argument("--shares_dir", default="./images")
    p.add_argument("--public_dir", default="./public_datas")
    p.add_argument("--k", type=int, required=True)
    p.add_argument("--n", type=int, required=True)
    p.add_argument("--t", type=int)
    args = p.parse_args()

    if not os.path.exists(args.input):
        print(f"ERROR: File not found: {args.input}", file=sys.stderr); sys.exit(1)
    if args.k >= args.n:
        print("ERROR: k must be < n", file=sys.stderr); sys.exit(1)

    try:
        if args.type == "k,n":
            encrypt_standard(args.input, args.k, args.n, args.shares_dir, args.public_dir)
        else:
            if args.t is None:
                print("ERROR: --t required for t,k,n scheme", file=sys.stderr); sys.exit(1)
            if args.t >= args.k:
                print("ERROR: t must be < k", file=sys.stderr); sys.exit(1)
            encrypt_essential(args.input, args.t, args.k, args.n, args.shares_dir, args.public_dir)
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr); sys.exit(1)

if __name__ == "__main__":
    main()
