const express = require('express');
const router = express.Router();
const controller = require('../controllers/activity.controller');
const { adminAuth } = require('../middlewares/auth/auth.middleware');

/**
 * Admin Panel Security Audit Routes
 */
router.get('/', adminAuth, controller.getAllActivities);
router.put('/:id/resolve', adminAuth, controller.resolveActivity);

module.exports = router;
