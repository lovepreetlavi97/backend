const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');

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
router.get('/festivals',userAuth,userController.getAllFestivals);

/**
 * @swagger
 * /user/subCategories:
 *   get:
 *     summary: Get all subCategories (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of subCategories
 */
router.get('/subCategories',userAuth,userController.getAllSubCategories);
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
router.get('/categories',userAuth,userController.getAllCategories);
/**
 * @swagger
 * /user/products:
 *   get:
 *     summary: Get all products (user-facing)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get('/products',userAuth,userController.getAllProducts);
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
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', userController.updateUserById);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', userController.deleteUserById);
/**
 * @swagger
 * /user/login:
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
 *                 type: number
 *                 description: User's phone number
 *               countryCode:
 *                 type: string
 *                 description: "+91"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 otp:
 *                   type: string
 *       400:
 *         description: Bad request, phone number is required
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', userController.loginUser);


/**
 * @swagger
 * /user/verify-otp:
 *   post:
 *     summary: Verify OTP and return JWT token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 description: OTP received by the user
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request, missing or invalid data
 *       401:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal Server Error
 */
router.post('/verify-otp', userAuth, userController.verifyOTP);


module.exports = router;
