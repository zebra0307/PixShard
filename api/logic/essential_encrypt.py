#!/usr/bin/env python3
"""
PixShard Essential (t,k,n) Encryption

Example:
  python essential_encrypt.py --input img.png --t 2 --k 3 --n 5 --shares_dir ./images --public_dir ./public_datas
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

Q = 257


def get_vandermonde_matrix(n, k):
    # Matches the essential scheme design from Secret_Sharing_Schemes.
    return np.array([[pow(i, j, Q) for j in range(k)] for i in range(1, n + 1)], dtype=np.int64)


def encrypt_essential(image_path, t, k, n, shares_dir, public_dir):
    os.makedirs(shares_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    img = Image.open(image_path)
    is_rgb = img.mode in ("RGB", "RGBA")
    img = img.convert("RGB") if is_rgb else img.convert("L")

    data = np.array(img, dtype=np.int64)
    shape = data.shape

    flat = data.flatten()
    pad_len = (k - (len(flat) % k)) % k
    if pad_len:
        flat = np.append(flat, [0] * pad_len)

    num_blocks = len(flat) // k
    secrets_blocks = flat.reshape(num_blocks, k)

    A = get_vandermonde_matrix(n, k)
    rng = np.random.default_rng()

    # Random participant values (c_i), one row per block.
    C = rng.integers(0, Q, size=(num_blocks, n), endpoint=False, dtype=np.int64)
    alpha = np.sum(C[:, :t], axis=1) % Q

    # Enforce alpha != 0 for each block.
    bad = np.where(alpha == 0)[0]
    while len(bad) > 0:
        C[bad] = rng.integers(0, Q, size=(len(bad), n), endpoint=False, dtype=np.int64)
        alpha[bad] = np.sum(C[bad, :t], axis=1) % Q
        bad = bad[alpha[bad] == 0]

    # b = alpha * A*s + c (mod Q)
    AS = (A @ secrets_blocks.T).T % Q  # shape: blocks x n
    B = (alpha[:, None] * AS + C) % Q

    share_files = []
    for j in range(n):
        filename = f"participant_{j + 1}.npy"
        np.save(os.path.join(shares_dir, filename), C[:, j].astype(np.uint16))
        share_files.append(filename)

    np.save(os.path.join(public_dir, "matrix_A.npy"), A)
    np.save(os.path.join(public_dir, "public_b.npy"), B.astype(np.uint16))

    # Match tested essential reference format: metadata is saved as .npy dict.
    metadata = {
        "shape": shape,
        "is_color": bool(is_rgb),
        "pad": int(pad_len),
        "t": t,
        "k": k,
        "n": n,
        "share_files": share_files,
    }
    np.save(os.path.join(public_dir, "metadata.npy"), metadata)

    print(f"[PixShard] Essential ({t},{k},{n}) complete", flush=True)


def main():
    parser = argparse.ArgumentParser(description="PixShard Essential (t,k,n) encryption")
    parser.add_argument("--input", required=True)
    parser.add_argument("--t", type=int, required=True)
    parser.add_argument("--k", type=int, required=True)
    parser.add_argument("--n", type=int, required=True)
    parser.add_argument("--shares_dir", required=True)
    parser.add_argument("--public_dir", required=True)
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    if args.k < 2:
        print("ERROR: k must be >= 2", file=sys.stderr)
        sys.exit(1)
    if args.k >= args.n:
        print("ERROR: k must be < n", file=sys.stderr)
        sys.exit(1)
    if args.t < 1:
        print("ERROR: t must be >= 1", file=sys.stderr)
        sys.exit(1)
    if args.t >= args.k:
        print("ERROR: t must be < k", file=sys.stderr)
        sys.exit(1)

    try:
        encrypt_essential(args.input, args.t, args.k, args.n, args.shares_dir, args.public_dir)
        sys.exit(0)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
