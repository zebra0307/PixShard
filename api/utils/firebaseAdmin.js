/**
 * Firebase Admin SDK initializer.
 *
 * Production mode:
 *  - FIREBASE_SERVICE_ACCOUNT is REQUIRED.
 *  - The process fails fast if missing/invalid.
 *
 * Local dev/test mode:
 *  - If FIREBASE_SERVICE_ACCOUNT is missing, insecure decode-only mode is allowed
 *    so local setup remains simple.
 *  - This mode must never be used in production.
 */

const admin  = require('firebase-admin');
const path   = require('path');
const fs     = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
let useInsecureDevMode = false;

const loadServiceAccount = () => {
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saEnv) return null;

  // Option A: inline JSON in environment variable.
  if (saEnv.trim().startsWith('{')) {
    return JSON.parse(saEnv);
  }

  // Option B: path to JSON file.
  const saPath = path.isAbsolute(saEnv)
    ? saEnv
    : path.resolve(__dirname, '..', saEnv);

  if (!fs.existsSync(saPath)) {
    throw new Error(`Service account file not found: ${saPath}`);
  }

  return require(saPath);
};

if (!admin.apps.length) {
  try {
    const serviceAccount = loadServiceAccount();

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('[Firebase Admin] Secure token verification enabled');
    } else if (isProduction) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is required in production. Refusing to start without secure token verification.'
      );
    } else {
      useInsecureDevMode = true;
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'pixshard' });
      console.warn('');
      console.warn('┌──────────────────────────────────────────────────────────────┐');
      console.warn('│  [Firebase Admin]  INSECURE DEV MODE ENABLED                │');
      console.warn('│  Tokens are decoded but NOT cryptographically verified.      │');
      console.warn('│  This mode is allowed only outside production.               │');
      console.warn('└──────────────────────────────────────────────────────────────┘');
      console.warn('');
    }
  } catch (err) {
    const prefix = '[Firebase Admin] Startup failed:';
    console.error(prefix, err.message);
    throw err;
  }
}

/**
 * Verify a Firebase ID token.
 * In prod mode: cryptographically verified via Firebase Admin.
 * In dev mode: base64-decoded (no signature check — local dev only).
 *
 * @param {string} token  - Firebase ID token (JWT)
 * @returns {Promise<{uid, email, name}>}
 */
const verifyToken = async (token) => {
  if (!useInsecureDevMode) {
    return admin.auth().verifyIdToken(token);
  }

  // DEV MODE: decode without verification
  try {
    const parts   = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1] + '==', 'base64url').toString('utf8'));
    return {
      uid:   payload.user_id || payload.sub,
      email: payload.email,
      name:  payload.name,
    };
  } catch {
    throw new Error('Invalid token format (dev mode decode failed)');
  }
};

module.exports = { admin, verifyToken };
