const express = require('express');
const router = express.Router();
const { adminOrSuperAdminAuth } = require('../middlewares/auth/auth.middleware');
const { getDashboardCounts, getDashboardPerformance } = require('../controllers/dashboard.controller');

/**
 * GET /admin/dashboard
 * Protected route for admins/superadmins
 */
router.get('/', adminOrSuperAdminAuth, getDashboardCounts);
router.get('/performance', adminOrSuperAdminAuth, getDashboardPerformance);

module.exports = router;
