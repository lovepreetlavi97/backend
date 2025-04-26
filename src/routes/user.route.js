const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { uploadImagesToBucket } = require('../middlewares/multerUploads');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');
/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */
/**
 * @swagger
 * /user/festivals:
 *   get:
 *     summary: Get all festivals (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of festivals
 */
router.get('/festivals', cacheRoute(1800), userController.getAllFestivals);

/**
 * @swagger
 * /user/subcategories:
 *   get:
 *     summary: Get all subcategories (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of subcategories
 */
router.get('/subcategories', cacheRoute(1800), userController.getAllSubCategories);
/**
 * @swagger
 * /user/categories:
 *   get:
 *     summary: Get all categories (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get('/categories', cacheRoute(1800), userController.getAllCategories);
/**
 * @swagger
 * /user/products:
 *   get:
 *     summary: Get all products with pagination and filtering (user-facing)
 *     tags: [User]
 *     parameters:
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
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: subcategoryId
 *         schema:
 *           type: string
 *         description: Filter by subcategory ID
 *       - in: query
 *         name: festivalId
 *         schema:
 *           type: string
 *         description: Filter by festival ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name/description
 *     responses:
 *       200:
 *         description: A list of products with pagination
 */
router.get('/products', cacheRoute(600), userController.getAllProducts);
/**
 * @swagger
 * /user/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/products/:slug', cacheRoute(1800), userController.getProductBySlug);

/**
 * @swagger
 * /user/counts:
 *   get:
 *     summary: Get counts for navbar (cart and wishlist)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Counts retrieved successfully
 */
router.get('/counts', userAuth, userController.getCountsOfNavbar);

/**
 * @swagger
 * /user/promo/{code}:
 *   get:
 *     summary: Check promo code validity
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code is valid
 *       404:
 *         description: Promo code not found
 */
router.get('/promo/:code', userController.checkPromoCode);

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email or phone number already exists
 *       400:
 *         description: Bad request
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /user/login/phone:
 *   post:
 *     summary: Send OTP to the user's phone number
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *               countryCode:
 *                 type: string
 *                 description: Country code (e.g., "+91")
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request, phone number is required
 *       500:
 *         description: Internal Server Error
 */
router.post('/login/phone', userController.loginUser);

/**
 * @swagger
 * /user/login/email:
 *   post:
 *     summary: Login with email and password
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email or password missing
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post('/login/email', userController.loginWithEmail);

/**
 * @swagger
 * /user/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *               countryCode:
 *                 type: string
 *                 description: Country code (e.g., "+91")
 *               otp:
 *                 type: string
 *                 description: OTP received on phone
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       401:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', userController.verifyOTP);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Logout user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', userAuth, userController.logoutUser);

/**
 * @swagger
 * /user/upload:
 *   post:
 *     summary: Upload images
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/upload', userAuth, uploadImagesToBucket, userController.uploadImages);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', userAuth, userController.getUserById);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', userAuth, clearRouteCache('user_*'), userController.updateUserById);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', userAuth, clearRouteCache('user_*'), userController.deleteUserById);

module.exports = router;
