const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { userAuth } = require("../middlewares/auth/auth.middleware");
// const { uploadImagesToBucket } = require('../middlewares/multerUploads');
const {
  cacheRoute,
  clearRouteCache,
} = require("../middlewares/cache/cache.middleware");
/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */
/**
 * @swagger
 * /user/promo/check/{code}:
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
router.get("/promo/check/:code", userController.checkPromoCode);

/**
 * @swagger
 * /cart/check-stock:
 *   post:
 *     summary: Validate cart items stock
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: List of items with stock status
 */
router.post("/cart/check-stock",  userController.checkCartStock);

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
router.get("/festivals", cacheRoute(1800), userController.getAllFestivals);
/**
 * @swagger
 * /user/home-search:
 *   get:
 *     summary: Get homepage data (subcategories + products)
 *     description: Returns subcategories and products, optionally filtered by search query.
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term to filter products
 *     responses:
 *       200:
 *         description: Successfully retrieved homepage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subcategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       image:
 *                         type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       price:
 *                         type: number
 *                       discountedPrice:
 *                         type: number
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Internal server error
 */

router.get("/home-search", userController.homeSearch);

/**
 * @swagger
 * /user/relations:
 *   get:
 *     summary: Get all relations (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of relations
 */
router.get("/relations", cacheRoute(1800), userController.getAllRelations);

/**
 * @swagger
 * /user/curated-collections:
 *   get:
 *     summary: Get all curated collections (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of curated collections
 */
router.get(
  "/curated-collections",
  cacheRoute(1800),
  userController.getAllCuratedCollections
);

/**
 * @swagger
 * /user/banners:
 *   get:
 *     summary: Get all active banners for users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of active banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banners fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     banners:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           link:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                           endDate:
 *                             type: string
 */
router.get("/banners", cacheRoute(1800), userController.getAllBanners);
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
router.get(
  "/subcategories",
  cacheRoute(1800),
  userController.getAllSubCategories
);
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
router.get("/categories", cacheRoute(1800), userController.getAllCategories);
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
router.get("/products", cacheRoute(600), userController.getAllProducts);
router.get("/gift-filters", cacheRoute(3600), userController.getGiftFilters);

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
router.get("/product/:slug", cacheRoute(1800), userController.getProductBySlug);

/**
 * @swagger
 * /user/products/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending products to return
 *     responses:
 *       200:
 *         description: List of trending products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 */
router.get("/trending-products", cacheRoute(1800), userController.getTrendingProducts);
/**
 * @swagger
 * /user/products/related:
 *   get:
 *     summary: Get related products
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated product IDs (e.g., ?ids=1,2,3)
 *     responses:
 *       200:
 *         description: List of related products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */

router.get(
  "/related-products",
  cacheRoute(1800),
  userController.getRelatedProducts
);

router.get("/price-filters", cacheRoute(3600), userController.getPriceFilters);


/**
 * @swagger
 * /user/products/essentials:
 *   get:
 *     summary: Get shop essential products
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of essential products to return
 *     responses:
 *       200:
 *         description: List of shop essential products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     title:
 *                       type: string
 *                       example: "Shop Essentials"
 *                     description:
 *                       type: string
 *                       example: "Must-have items for every occasion"
 *       500:
 *         description: Server error
 */
router.get("/products/essentials", cacheRoute(1800), userController.getShopEssentials);
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
router.get("/counts", userAuth, userController.getCountsOfNavbar);


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
router.post("/", userController.createUser);

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
router.post("/login/phone", userController.loginUser);

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
router.post("/login/email", userController.loginWithEmail);

/**
 * @swagger
 * /user/login/google:
 *   post:
 *     summary: Login or register with Google OAuth2
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Google OAuth2 authorization code from frontend
 *     responses:
 *       200:
 *         description: Login or registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     loginProvider:
 *                       type: string
 *                 isNewUser:
 *                   type: boolean
 *       400:
 *         description: Google auth code is required
 *       500:
 *         description: Google login failed
 */
router.post("/login/google", userController.googleLogin);

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
router.post("/verify-otp", userController.verifyOTP);

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
router.post("/logout", userAuth, userController.logoutUser);

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
router.post("/upload", userAuth, userController.uploadImages);

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
router.get("/:id", userAuth, userController.getUserById);

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
router.put(
  "/:id",
  userAuth,
  clearRouteCache("user_*"),
  userController.updateUserById
);

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
router.delete(
  "/:slug",
  userAuth,
  clearRouteCache("user_*"),
  userController.deleteUserById
);

/**
 * @swagger
 * /user/resend-otp:
 *   post:
 *     summary: Resend OTP to the user's phone number (max 5 times per hour)
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
 *                 example: "6398459134"
 *               countryCode:
 *                 type: string
 *                 description: Country code (e.g., "+91")
 *                 example: "+91"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP resent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                     otp:
 *                       type: string
 *                       description: OTP (only in non-production)
 *       400:
 *         description: Bad request, phone number or country code missing/invalid
 *       404:
 *         description: User not found
 *       429:
 *         description: OTP resend limit reached
 *       500:
 *         description: Failed to resend OTP
 */
router.post('/resend-otp', userController.resendOTP);
/**
 * @swagger
 * /instagram-videos:
 *   get:
 *     summary: Get all active Instagram videos (Public / Homepage)
 *     tags: [Instagram Videos]
 *     responses:
 *       200:
 *         description: Instagram videos fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", userController.getAllVideos);
module.exports = router;
