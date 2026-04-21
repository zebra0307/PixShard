#!/usr/bin/env python3
"""
PixShard Standard (k,n) Decryption

Example:
  python standard_decrypt.py --shares_dir ./images --public_dir ./public_datas --indices 1,2,3 --output out.png
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

Q = 257


def gf_inv(a: int) -> int:
    return pow(int(a) % Q, Q - 2, Q)


def decrypt_standard(shares_dir, indices, output_path):
    use_idx = sorted(set(indices))
    if len(use_idx) < 2:
        raise ValueError("Need at least 2 shares for standard reconstruction")

    k = len(use_idx)

    shares = []
    shape = None
    for idx in use_idx:
        fp = os.path.join(shares_dir, f"share_{idx}.npy")
        if not os.path.exists(fp):
            raise FileNotFoundError(f"Missing share file: share_{idx}.npy")
        arr = np.load(fp).astype(np.int64)
        if shape is None:
            shape = arr.shape
        elif arr.shape != shape:
            raise ValueError("All standard share files must have identical shapes")
        shares.append(arr.flatten())

    secret = np.zeros(len(shares[0]), dtype=np.int64)

    # Lagrange interpolation at x=0 in GF(257)
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
    print(f"[PixShard] Standard reconstruction saved -> {output_path}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="PixShard Standard (k,n) decryption")
    parser.add_argument("--shares_dir", required=True)
    parser.add_argument("--public_dir", default="")
    parser.add_argument("--indices", required=True, help="Comma-separated indices, e.g. 1,2,3")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    try:
        indices = [int(x.strip()) for x in args.indices.split(",") if x.strip()]
    except ValueError:
        print("ERROR: --indices must be comma-separated integers", file=sys.stderr)
        sys.exit(1)

    if not indices:
        print("ERROR: At least one index is required", file=sys.stderr)
        sys.exit(1)

    try:
        decrypt_standard(args.shares_dir, indices, args.output)
        sys.exit(0)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
