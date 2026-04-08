const express = require('express');
const { metalController } = require('../controllers');
const { adminOrSuperAdminAuth } = require('../middlewares/auth/auth.middleware');

const router = express.Router();

router.get('/', metalController.getAllMetals);
router.get('/:id', metalController.getMetal);

// Admin only routes
router.use(adminOrSuperAdminAuth);

router.post('/', metalController.createMetal);
router.patch('/:id', metalController.updateMetal);
router.patch('/:id/position', metalController.updateMetalPosition);
router.delete('/:id', metalController.deleteMetal);

module.exports = router;
