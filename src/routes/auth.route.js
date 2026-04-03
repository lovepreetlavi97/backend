const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter');

/**
 * POST /auth/refresh-token
 * Public
 */
router.post('/refresh-token', authLimiter, userController.refreshAuthToken);

/**
 * POST /auth/logout
 * Single session invalidate
 */
router.post('/logout', userController.logoutSessionController);

/**
 * POST /auth/logout-all
 * All sessions invalidate (Protected)
 */
router.post('/logout-all', protect, userController.logoutAllSessionsController);

module.exports = router;
