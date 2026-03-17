const express = require("express");
const router = express.Router();
const kittyController = require("../controllers/kitty.controller");
const { userAuth, adminAuth } = require("../middlewares/auth/auth.middleware");
const {
  cacheRoute,
  clearRouteCache,
} = require("../middlewares/cache/cache.middleware");

/**
 * @swagger
 * tags:
 *   name: Kitty
 *   description: Kitty management operations
 */

/**
 * @swagger
 * /kitty/plans:
 *   get:
 *     summary: Get all active kitty plans
 *     tags: [Kitty]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [gold, silver, diamond, platinum]
 *         description: Filter by category
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum monthly amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum monthly amount
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Kitty plans fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/plans", cacheRoute(300), kittyController.getActiveKittyPlans);

/**
 * @swagger
 * /kitty/plans/{planId}:
 *   get:
 *     summary: Get kitty plan by ID
 *     tags: [Kitty]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan fetched successfully
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.get("/plans/:planId", cacheRoute(300), kittyController.getKittyPlanById);

// Helpful message if someone opens this endpoint in browser
router.get("/enroll", (req, res) => {
  return res.status(405).json({
    success: false,
    message: "Method Not Allowed. Use POST /kitty/enroll with Bearer token and JSON body: { planId }",
  });
});

/**
 * @swagger
 * /kitty/enroll:
 *   post:
 *     summary: Enroll in a kitty plan
 *     tags: [Kitty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Plan ID to enroll in
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.post(
  "/enroll",
  (req, _res, next) => {
    try {
      const hasAuth = Boolean(req.headers.authorization);
      const bodyKeys = req.body && typeof req.body === "object" ? Object.keys(req.body) : [];
      console.log("[KITTY_ENROLL] hit", {
        hasAuth,
        bodyKeys,
      });
    } catch (_e) {
      // ignore
    }
    next();
  },
  userAuth,
  clearRouteCache,
  kittyController.enrollInKittyPlan,
);

/**
 * @swagger
 * /kitty/my-kitties:
 *   get:
 *     summary: Get user's kitties
 *     tags: [Kitty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Kitties fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/my-kitties", userAuth, cacheRoute(60), kittyController.getMyKitties);

/**
 * @swagger
 * /kitty/my-kitties/{kittyId}:
 *   get:
 *     summary: Get specific kitty details
 *     tags: [Kitty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kittyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kitty ID
 *     responses:
 *       200:
 *         description: Kitty details fetched successfully
 *       404:
 *         description: Kitty not found
 *       500:
 *         description: Server error
 */
router.get("/my-kitties/:kittyId", userAuth, cacheRoute(60), kittyController.getKittyDetails);

/**
 * @swagger
 * /kitty/payment/initiate:
 *   post:
 *     summary: Initiate kitty payment
 *     tags: [Kitty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: Payment ID to initiate
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post("/payment/initiate", userAuth, kittyController.initiateKittyPayment);

// Admin routes

/**
 * @swagger
 * /kitty/admin/plans:
 *   post:
 *     summary: Create new kitty plan (Admin only)
 *     tags: [Kitty Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - duration
 *               - monthlyAmount
 *               - totalAmount
 *               - maturityAmount
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Plan name
 *               description:
 *                 type: string
 *                 description: Plan description
 *               duration:
 *                 type: integer
 *                 description: Duration in months
 *               monthlyAmount:
 *                 type: number
 *                 description: Monthly amount
 *               totalAmount:
 *                 type: number
 *                 description: Total amount
 *               maturityAmount:
 *                 type: number
 *                 description: Maturity amount
 *               category:
 *                 type: string
 *                 enum: [gold, silver, diamond, platinum]
 *                 description: Plan category
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Plan benefits
 *               maxParticipants:
 *                 type: integer
 *                 description: Maximum participants
 *               terms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Plan terms
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get("/admin/plans", adminAuth, cacheRoute(60), kittyController.getAllKittyPlans);
router.post("/admin/plans", adminAuth, clearRouteCache, kittyController.createKittyPlan);

/**
 * @swagger
 * /kitty/admin/plans/{planId}:
 *   put:
 *     summary: Update kitty plan (Admin only)
 *     tags: [Kitty Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               maxParticipants:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.put("/admin/plans/:planId", adminAuth, clearRouteCache, kittyController.updateKittyPlan);

/**
 * @swagger
 * /kitty/admin/plans/{planId}:
 *   delete:
 *     summary: Delete kitty plan (Admin only)
 *     tags: [Kitty Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 *       404:
 *         description: Plan not found
 *       400:
 *         description: Cannot delete plan with active enrollments
 *       500:
 *         description: Server error
 */
router.delete("/admin/plans/:planId", adminAuth, clearRouteCache, kittyController.deleteKittyPlan);

/**
 * @swagger
 * /kitty/admin/enrollments:
 *   get:
 *     summary: Get all kitty enrollments (Admin only)
 *     tags: [Kitty Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *         description: Filter by plan ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Enrollments fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/admin/enrollments", adminAuth, cacheRoute(60), kittyController.getAllKittyEnrollments);

/**
 * @swagger
 * /kitty/admin/statistics:
 *   get:
 *     summary: Get kitty statistics (Admin only)
 *     tags: [Kitty Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/admin/statistics", adminAuth, cacheRoute(300), kittyController.getKittyStatistics);

// Dev / QA helper: seed dummy kitty plans & enrollments
router.post("/admin/dummy-seed", adminAuth, clearRouteCache, kittyController.seedDummyKittyData);

module.exports = router;
