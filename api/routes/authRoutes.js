const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Auth routes — Firebase handles register/login on the CLIENT side.
 * This API only needs /me to return the current user's info (from verified token).
 */

// GET /api/auth/me — return current Firebase user info
router.get('/me', protect, (req, res) => {
  res.json({
    uid:   req.user._id,
    email: req.user.email,
    name:  req.user.name,
  });
});

module.exports = router;
