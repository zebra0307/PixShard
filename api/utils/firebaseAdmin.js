/**
 * Firebase Admin SDK initializer.
 *
 * Two modes:
 *  1. PRODUCTION — set FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json in .env
 *     Download from: Firebase Console → Project Settings → Service accounts → Generate new key
 *
 *  2. DEV mode — if no service account is configured, tokens are decoded WITHOUT cryptographic
 *     verification (base64 decode only). This is INSECURE and for local dev only.
 *     A loud console warning is printed.
 *
 * Set FIREBASE_PROJECT_ID in .env to your Firebase project ID.
 */

const admin  = require('firebase-admin');
const path   = require('path');
const fs     = require('fs');
require('dotenv').config();

let useDevMode = false;

if (!admin.apps.length) {
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (saEnv) {
    let serviceAccount;

    // Option A: it's a JSON string (pasted directly as env var — works on Render/Railway)
    if (saEnv.trim().startsWith('{')) {
      try {
        serviceAccount = JSON.parse(saEnv);
        console.log('[Firebase Admin] ✓ Initialized from inline JSON env var');
      } catch (e) {
        console.error('[Firebase Admin] ✗ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    } else {
      // Option B: it's a file path (local dev with serviceAccountKey.json)
      const saPath = path.isAbsolute(saEnv)
        ? saEnv
        : path.resolve(__dirname, '..', saEnv);

      if (fs.existsSync(saPath)) {
        serviceAccount = require(saPath);
        console.log('[Firebase Admin] ✓ Initialized from service account file →', saPath);
      } else {
        console.error('[Firebase Admin] ✗ Service account file not found:', saPath);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      useDevMode = true;
    }
  } else {
    useDevMode = true;
  }

  if (useDevMode) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'pixshard' });
    console.warn('');
    console.warn('┌──────────────────────────────────────────────────────────────┐');
    console.warn('│  [Firebase Admin]  ⚠  DEV MODE — TOKENS NOT VERIFIED  ⚠      │');
    console.warn('│                                                              │');
    console.warn('│  To enable secure token verification, add to your .env:     │');
    console.warn('│    FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json         │');
    console.warn('│                                                              │');
    console.warn('│  Download: Firebase Console → Project Settings →            │');
    console.warn('│            Service accounts → Generate new private key       │');
    console.warn('└──────────────────────────────────────────────────────────────┘');
    console.warn('');
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
  if (!useDevMode) {
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
