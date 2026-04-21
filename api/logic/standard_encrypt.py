#!/usr/bin/env python3
"""
PixShard Standard (k,n) Encryption

Example:
  python standard_encrypt.py --input img.png --k 3 --n 5 --shares_dir ./images --public_dir ./public_datas
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

Q = 257  # prime field for lossless 8-bit reconstruction


def encrypt_standard(image_path, k, n, shares_dir, public_dir):
    os.makedirs(shares_dir, exist_ok=True)

    img = Image.open(image_path)
    is_rgb = img.mode in ("RGB", "RGBA")
    img = img.convert("RGB") if is_rgb else img.convert("L")

    data = np.array(img, dtype=np.int64)
    shape = data.shape
    flat = data.flatten()
    count = len(flat)

    rng = np.random.default_rng()

    # f(x) = a0 + a1*x + ... + a(k-1)*x^(k-1), where a0 is the secret pixel
    coeffs = np.empty((count, k), dtype=np.int64)
    coeffs[:, 0] = flat
    coeffs[:, 1:] = rng.integers(0, Q, size=(count, k - 1), endpoint=False)

    x_powers = np.array(
        [[pow(i + 1, deg, Q) for i in range(n)] for deg in range(k)],
        dtype=np.int64,
    )

    share_matrix = (coeffs @ x_powers) % Q  # shape: pixels x n

    for i in range(n):
        filename = f"share_{i + 1}.npy"
        # Standard scheme does not require public metadata files.
        # Store each share with original image shape so reconstruction is metadata-free.
        share_arr = share_matrix[:, i].reshape(shape).astype(np.uint16)
        np.save(os.path.join(shares_dir, filename), share_arr)

    print(f"[PixShard] Standard ({k},{n}) complete", flush=True)


def main():
    parser = argparse.ArgumentParser(description="PixShard Standard (k,n) encryption")
    parser.add_argument("--input", required=True)
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

    try:
        encrypt_standard(args.input, args.k, args.n, args.shares_dir, args.public_dir)
        sys.exit(0)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
