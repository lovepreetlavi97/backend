const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnRequest.controller');
const { adminOrSuperAdminAuth } = require('../middlewares/auth/auth.middleware')
// Note: If you have an upload middleware, you'd insert it before createReturnRequest

// Admin Routes
router.get('/', adminOrSuperAdminAuth, returnController.getAllReturnRequests);
router.get('/:id', adminOrSuperAdminAuth, returnController.getReturnRequestById);
router.patch('/:id/status', returnController.updateReturnStatus);
router.put('/:id', returnController.updateReturn);
router.post('/:id/refund', returnController.processRefund);

// Public / User Route
router.post('/', returnController.createReturnRequest);

module.exports = router;
