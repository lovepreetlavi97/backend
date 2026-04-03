const express = require('express');
const router = express.Router();
const controller = require('../controllers/designRequest.controller');
const { uploadSingleImage } = require('../middlewares/uploadMiddleware');
const { adminAuth, optionalUserAuth } = require('../middlewares/auth/auth.middleware');

/**
 * Public User Facing API: Create Design Request
 * Supports optional login
 */
router.post('/', optionalUserAuth, uploadSingleImage, controller.createDesignRequest);

/**
 * Admin Panel APIs: Manage Design Requests
 */
router.get('/admin', adminAuth, controller.getAllDesignRequests);

router.get('/admin/:id', adminAuth, controller.getDesignRequestById);

router.put('/admin/:id/status', adminAuth, controller.updateDesignRequestStatus);

module.exports = router;
