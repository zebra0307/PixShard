const { verifyToken } = require('../utils/firebaseAdmin');

/**
 * Protect a route by verifying the Firebase ID token in the Authorization header.
 * Sets req.user = { _id: uid, email, name } to match existing route code.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = await verifyToken(token);
    // Map Firebase fields to the shape the rest of the API expects
    req.user = {
      _id:   decoded.uid,              // Firebase UID (string)
      email: decoded.email || '',
      name:  decoded.name || decoded.email?.split('@')[0] || 'User',
    };
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    res.status(401).json({ message: 'Firebase token invalid or expired' });
  }
};

module.exports = { protect };
