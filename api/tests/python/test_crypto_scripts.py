import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


API_DIR = Path(__file__).resolve().parents[2]
LOGIC_DIR = API_DIR / 'logic'


class CryptoScriptRoundTripTests(unittest.TestCase):
    def _run(self, script_name, *args):
        script = LOGIC_DIR / script_name
        cmd = [sys.executable, str(script), *args]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            self.fail(
                f"Script failed: {' '.join(cmd)}\n"
                f"stdout:\n{result.stdout}\n"
                f"stderr:\n{result.stderr}"
            )

    def _write_sample_image(self, image_path):
        rng = np.random.default_rng(42)
        arr = rng.integers(0, 256, size=(10, 12, 3), dtype=np.uint8)
        Image.fromarray(arr).save(image_path)
        return arr

    def test_standard_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            image_path = tmp_path / 'input.png'
            shares_dir = tmp_path / 'shares'
            public_dir = tmp_path / 'public'
            output_path = tmp_path / 'reconstructed.png'

            original = self._write_sample_image(image_path)

            self._run(
                'standard_encrypt.py',
                '--input', str(image_path),
                '--k', '3',
                '--n', '5',
                '--shares_dir', str(shares_dir),
                '--public_dir', str(public_dir),
            )

            metadata_path = public_dir / 'metadata.json'
            self.assertTrue(metadata_path.exists())
            with metadata_path.open('r', encoding='utf-8') as f:
                metadata = json.load(f)
            self.assertEqual(metadata['scheme'], 'standard')
            self.assertEqual(metadata['k'], 3)
            self.assertEqual(metadata['n'], 5)

            self._run(
                'standard_decrypt.py',
                '--shares_dir', str(shares_dir),
                '--public_dir', str(public_dir),
                '--indices', '1,2,3',
                '--output', str(output_path),
            )

            reconstructed = np.array(Image.open(output_path).convert('RGB'), dtype=np.uint8)
            self.assertTrue(np.array_equal(original, reconstructed))

    def test_essential_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            image_path = tmp_path / 'input.png'
            shares_dir = tmp_path / 'shares'
            public_dir = tmp_path / 'public'
            output_path = tmp_path / 'reconstructed.png'

            original = self._write_sample_image(image_path)

            self._run(
                'essential_encrypt.py',
                '--input', str(image_path),
                '--t', '2',
                '--k', '3',
                '--n', '5',
                '--shares_dir', str(shares_dir),
                '--public_dir', str(public_dir),
            )

            metadata_path = public_dir / 'metadata.json'
            self.assertTrue(metadata_path.exists())
            with metadata_path.open('r', encoding='utf-8') as f:
                metadata = json.load(f)
            self.assertEqual(metadata['scheme'], 'essential')
            self.assertEqual(metadata['t'], 2)
            self.assertEqual(metadata['k'], 3)

            self._run(
                'essential_decrypt.py',
                '--shares_dir', str(shares_dir),
                '--public_dir', str(public_dir),
                '--indices', '1,2,3',
                '--output', str(output_path),
            )

            reconstructed = np.array(Image.open(output_path).convert('RGB'), dtype=np.uint8)
            self.assertTrue(np.array_equal(original, reconstructed))


if __name__ == '__main__':
    unittest.main()
