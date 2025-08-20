const express = require('express');
const { userAuth } = require('../middlewares/auth/auth.middleware');
const { 
  getAllAddresses, 
  getAddressById, 
  addAddress, 
  updateAddress, 
  deleteAddress,
  setDefaultAddress
} = require('../controllers/address.controller');
const { check, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your bearer token in the format **Bearer &lt;token&gt;**
 */

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Address management for users
 */

/**
 * Input validation middleware
 */
const validateAddress = [
  check('name').notEmpty().withMessage('Name is required'),
  check('phone').notEmpty().withMessage('Phone number is required'),
  check('address').notEmpty().withMessage('Address is required'),
  check('city').notEmpty().withMessage('City is required'),
  check('state').notEmpty().withMessage('State is required'),
  check('pincode').notEmpty().withMessage('Pincode is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Addresses fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c85"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           phone:
 *                             type: string
 *                             example: "9876543210"
 *                           address:
 *                             type: string
 *                             example: "123 Main Street, Apt 4B"
 *                           city:
 *                             type: string
 *                             example: "Mumbai"
 *                           state:
 *                             type: string
 *                             example: "Maharashtra"
 *                           pincode:
 *                             type: string
 *                             example: "400001"
 *                           country:
 *                             type: string
 *                             example: "India"
 *                           isDefault:
 *                             type: boolean
 *                             example: true
 *                           label:
 *                             type: string
 *                             example: "Home"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Get all addresses
router.get('/', userAuth, getAllAddresses);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Address fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phone:
 *                           type: string
 *                           example: "9876543210"
 *                         address:
 *                           type: string
 *                           example: "123 Main Street, Apt 4B"
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                         pincode:
 *                           type: string
 *                           example: "400001"
 *                         country:
 *                           type: string
 *                           example: "India"
 *                         isDefault:
 *                           type: boolean
 *                           example: true
 *                         label:
 *                           type: string
 *                           example: "Home"
 *       400:
 *         description: Bad Request - Invalid address ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
// Get a specific address
router.get('/:id', userAuth, getAddressById);

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, address, city, state, pincode]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact name for the address
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "9876543210"
 *               address:
 *                 type: string
 *                 description: Street address, apartment, etc.
 *                 example: "123 Main Street, Apt 4B"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 description: State name
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 description: Postal/ZIP code
 *                 example: "400001"
 *               country:
 *                 type: string
 *                 description: Country name (defaults to India if not provided)
 *                 example: "India"
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default address
 *                 example: false
 *               label:
 *                 type: string
 *                 description: Label for the address (Home, Work, Other)
 *                 enum: [Home, Work, Other]
 *                 example: "Home"
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Address added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phone:
 *                           type: string
 *                           example: "9876543210"
 *                         address:
 *                           type: string
 *                           example: "123 Main Street, Apt 4B"
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                         pincode:
 *                           type: string
 *                           example: "400001"
 *                         country:
 *                           type: string
 *                           example: "India"
 *                         isDefault:
 *                           type: boolean
 *                           example: false
 *                         label:
 *                           type: string
 *                           example: "Home"
 *       400:
 *         description: Bad Request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Add a new address
router.post('/', userAuth, validateAddress, addAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the address
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, address, city, state, pincode]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact name for the address
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "9876543210"
 *               address:
 *                 type: string
 *                 description: Street address, apartment, etc.
 *                 example: "123 Main Street, Apt 4B"
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 description: State name
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 description: Postal/ZIP code
 *                 example: "400001"
 *               country:
 *                 type: string
 *                 description: Country name
 *                 example: "India"
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default address
 *                 example: false
 *               label:
 *                 type: string
 *                 description: Label for the address (Home, Work, Other)
 *                 enum: [Home, Work, Other]
 *                 example: "Home"
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phone:
 *                           type: string
 *                           example: "9876543210"
 *                         address:
 *                           type: string
 *                           example: "123 Main Street, Apt 4B"
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                         pincode:
 *                           type: string
 *                           example: "400001"
 *                         country:
 *                           type: string
 *                           example: "India"
 *                         isDefault:
 *                           type: boolean
 *                           example: false
 *                         label:
 *                           type: string
 *                           example: "Home"
 *       400:
 *         description: Bad Request - Invalid address ID or missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
// Update an address
router.put('/:id', userAuth, validateAddress, updateAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Address deleted successfully"
 *       400:
 *         description: Bad Request - Invalid address ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
// Delete an address
router.delete('/:id', userAuth, deleteAddress);

/**
 * @swagger
 * /addresses/{id}/default:
 *   patch:
 *     summary: Set an address as default
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default address set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Default address set successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phone:
 *                           type: string
 *                           example: "9876543210"
 *                         address:
 *                           type: string
 *                           example: "123 Main Street, Apt 4B"
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                         state:
 *                           type: string
 *                           example: "Maharashtra"
 *                         pincode:
 *                           type: string
 *                           example: "400001"
 *                         country:
 *                           type: string
 *                           example: "India"
 *                         isDefault:
 *                           type: boolean
 *                           example: true
 *                         label:
 *                           type: string
 *                           example: "Home"
 *       400:
 *         description: Bad Request - Invalid address ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
// Set an address as default
router.patch('/:id/default', userAuth, setDefaultAddress);

module.exports = router;
