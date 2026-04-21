#!/usr/bin/env python3
"""
PixShard Essential (t,k,n) Decryption

Example:
  python essential_decrypt.py --shares_dir ./images --public_dir ./public_datas --indices 1,2,3 --output out.png
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

Q = 257


def gf_inv(a: int) -> int:
    return pow(int(a) % Q, Q - 2, Q)


def matrix_inverse_mod_prime(matrix: np.ndarray) -> np.ndarray:
    """Exact modular inverse using Gauss-Jordan elimination."""
    n = matrix.shape[0]
    A = matrix.astype(np.int64) % Q
    I = np.eye(n, dtype=np.int64)
    aug = np.concatenate([A, I], axis=1)

    for col in range(n):
        pivot = None
        for row in range(col, n):
            if aug[row, col] % Q != 0:
                pivot = row
                break

        if pivot is None:
            raise ValueError("Selected participant matrix is not invertible")

        if pivot != col:
            aug[[col, pivot]] = aug[[pivot, col]]

        pivot_val = aug[col, col] % Q
        inv_pivot = gf_inv(pivot_val)
        aug[col] = (aug[col] * inv_pivot) % Q

        for row in range(n):
            if row == col:
                continue
            factor = aug[row, col] % Q
            if factor:
                aug[row] = (aug[row] - factor * aug[col]) % Q

    return aug[:, n:]


def decrypt_essential(shares_dir, public_dir, indices, output_path):
    metadata_path = os.path.join(public_dir, "metadata.npy")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError("metadata.npy not found")

    meta = np.load(metadata_path, allow_pickle=True).item()

    t = int(meta["t"])
    k = int(meta["k"])
    shape = tuple(meta["shape"])
    pad = int(meta.get("pad", 0))

    matrix_a_path = os.path.join(public_dir, "matrix_A.npy")
    public_b_path = os.path.join(public_dir, "public_b.npy")

    if not os.path.exists(matrix_a_path):
        raise FileNotFoundError("matrix_A.npy missing")
    if not os.path.exists(public_b_path):
        raise FileNotFoundError("public_b.npy missing")

    A_full = np.load(matrix_a_path).astype(np.int64)
    all_b = np.load(public_b_path).astype(np.int64)

    num_blocks = len(all_b)

    use_idx = sorted(set(indices))[:k]
    if len(use_idx) < k:
        raise ValueError(f"Need {k} participants, got {len(use_idx)}")

    required_essential = set(range(1, t + 1))
    provided = set(use_idx)
    missing = sorted(required_essential - provided)
    if missing:
        raise ValueError(
            f"Missing essential participants: {missing}. Essential reconstruction requires all participants 1..{t}."
        )

    share_data = {}
    for idx in use_idx:
        fp = os.path.join(shares_dir, f"participant_{idx}.npy")
        if not os.path.exists(fp):
            raise FileNotFoundError(f"Missing share file: participant_{idx}.npy")
        share_data[idx] = np.load(fp).astype(np.int64)

    rows = [idx - 1 for idx in use_idx]
    A_k_inv = matrix_inverse_mod_prime(A_full[rows])

    reconstructed = []

    for i in range(num_blocks):
        alpha_i = sum(int(share_data[essential_idx][i]) for essential_idx in range(1, t + 1)) % Q
        if alpha_i == 0:
            raise ValueError(
                "Encountered alpha=0 during reconstruction. Shares/public data are inconsistent or corrupted."
            )

        alpha_inv = gf_inv(alpha_i)
        b_k = all_b[i][rows].reshape(k, 1)
        c_k = np.array([int(share_data[idx][i]) for idx in use_idx], dtype=np.int64).reshape(k, 1)

        s_i = (alpha_inv * (A_k_inv @ ((b_k - c_k) % Q))) % Q
        reconstructed.extend(s_i.flatten().tolist())

    recon = np.array(reconstructed, dtype=np.int64)
    if pad > 0:
        recon = recon[:-pad]

    img_data = (recon.reshape(shape) % 256).astype(np.uint8)
    Image.fromarray(img_data).save(output_path)
    print(f"[PixShard] Essential reconstruction saved -> {output_path}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="PixShard Essential (t,k,n) decryption")
    parser.add_argument("--shares_dir", required=True)
    parser.add_argument("--public_dir", required=True)
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
        decrypt_essential(args.shares_dir, args.public_dir, indices, args.output)
        sys.exit(0)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
