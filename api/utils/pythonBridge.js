const { spawn } = require('child_process');
const { execSync } = require('child_process');

/**
 * Detect the correct Python binary name for this OS.
 * Windows typically only has 'python', not 'python3'.
 * Some Unix systems only have 'python3'.
 */
const detectPython = () => {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']   // Windows — try python first
    : ['python3', 'python'];         // Unix — try python3 first

  for (const cmd of candidates) {
    try {
      const result = execSync(`${cmd} --version`, { stdio: 'pipe', timeout: 3000 }).toString();
      if (result.includes('Python 3')) {
        console.log(`[PixShard] Python binary: ${cmd} (${result.trim()})`);
        return cmd;
      }
    } catch { /* try next */ }
  }
  throw new Error(
    'Python 3 not found. Install Python 3 and ensure it is in PATH.\n' +
    `Tried: ${candidates.join(', ')}`
  );
};

// Detect once at startup and cache
let PYTHON_CMD;
try {
  PYTHON_CMD = detectPython();
} catch (e) {
  console.error('[PixShard] WARNING:', e.message);
  PYTHON_CMD = 'python'; // fallback
}

/**
 * Run a Python script and return a Promise<{stdout, stderr}>.
 * Rejects with the stderr output if the process exits with code ≠ 0.
 *
 * @param {string} scriptPath - Absolute path to the .py script
 * @param {string[]} args     - CLI arguments array
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
const runPythonScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    console.log(`[PixShard] Running: ${PYTHON_CMD} ${scriptPath} ${args.join(' ')}`);

    const child = spawn(PYTHON_CMD, [scriptPath, ...args], {
      shell: false,
      // Inherit env so Python can find site-packages from the active venv/conda/system
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write('[py] ' + data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write('[py-err] ' + data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(
          `Python script exited with code ${code}.\n` +
          `Script: ${scriptPath}\n` +
          `stderr: ${stderr.trim() || '(no stderr)'}`
        ));
      }
    });

    child.on('error', (err) => {
      reject(new Error(
        `Failed to spawn "${PYTHON_CMD}": ${err.message}\n` +
        'Make sure Python 3 is installed and in your PATH.'
      ));
    });
  });
};

module.exports = { runPythonScript };
