const {
  create,
  findOne,
  findMany,
  findByPhone,
  findAndUpdate,
  softDelete,
  findByEmail,
  updatePassword,
  verifyPassword,
} = require("../services/mongodb/mongoService");
const { generateOTP, generateJWT } = require("../utils/authUtils");
const {
  User,
  Festival,
  SubCategory,
  Category,
  Product,
} = require("../models/index");
const jwt = require("jsonwebtoken");

const { hashPassword } = require("../utils/bcrypt");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    if (userData.password)
      userData.password = await hashPassword(userData.password);

    const user = await create(User, userData);

    return successResponse(res, 201, messages.USER_CREATED, { user });
  } catch (error) {
    return errorResponse(res, 400, messages.USER_CREATION_FAILED, {
      error: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return successResponse(res, 200, messages.USERS_RETRIEVED, { users });
  } catch (error) {
    console.log("yesssssssss1111111");
    return errorResponse(res, 500, messages.USER_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get a user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, messages.USER_NOT_FOUND);

    return successResponse(res, 200, messages.USER_RETRIEVED, { user });
  } catch (error) {
    console.log("yesssssssss2222222");
    return errorResponse(res, 500, messages.USER_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Update a user by ID
const updateUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return errorResponse(res, 404, messages.USER_NOT_FOUND);

    return successResponse(res, 200, messages.USER_UPDATED, { user });
  } catch (error) {
    return errorResponse(res, 400, messages.USER_UPDATE_FAILED, {
      error: error.message,
    });
  }
};

// Delete a user by ID
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 404, messages.USER_NOT_FOUND);

    return successResponse(res, 204, messages.USER_DELETED);
  } catch (error) {
    return errorResponse(res, 500, messages.USER_DELETION_FAILED, {
      error: error.message,
    });
  }
};

// Optimized Login User Controller
const loginUser = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    let token;
    // Validate phone number
    if (!phoneNumber) {
      return errorResponse(res, 400, messages.PHONE_REQUIRED);
    }

    // Generate OTP using utility function
    const otp = generateOTP();
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

    // Check if user exists
    let user = await findByPhone(User, phoneNumber);

    if (user) {
      token = generateJWT(user._id);
      user.token = token;
      user.otp = otp;
      await user.save();
    } else {
      // Create new user with token and OTP
      user = await create(User, { phoneNumber, countryCode, token, otp });
      // Generate token again after user creation
      token = generateJWT(user._id);
      user.token = token;
      await user.save();
    }

    // Return success response
    return successResponse(res, 200, messages.OTP_SENT, { user });
  } catch (error) {
    console.error("Error during user login:", error);
    return errorResponse(res, 500, messages.OTP_SEND_FAILED, {
      error: error.message,
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    let user = await findOne(User, { _id: req.user._id, otp: otp });

    if (!user) {
      return errorResponse(res, 401, messages.OTP_INVALID);
    }

    // Generate new JWT token after OTP verification
    const token = generateJWT(req.user._id);

    user.token = token;
    await user.save();
    return successResponse(res, 200, messages.OTP_VERIFIED, { token });
  } catch (error) {
    return errorResponse(res, 500, messages.OTP_VERIFY_FAILED, {
      error: error.message,
    });
  }
};
// Get all festivals for user
const getAllFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find({
      isDeleted: false,
      isBlocked: false,
    });

    return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, {
      festivals: festivals || [], // Ensuring an empty array if no data is found
    });
  } catch (error) {
    return errorResponse(res, 500, messages.FESTIVALS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all festivals for user
const getAllSubCategories = async (req, res) => {
  try {
    const subcategories = await SubCategory.find({
      isDeleted: false,
      isBlocked: false,
    });

    return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
      subcategories: subcategories || [], // Ensuring an empty array if no data is found
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SUBCATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
// Get all festivals for user
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isDeleted: false,
      isBlocked: false,
    });

    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, {
      categories: categories || [], // Ensuring an empty array if no data is found
    });
  } catch (error) {
    return errorResponse(res, 500, messages.CATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isDeleted: false,
      isBlocked: false,
    });

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, {
      products: products || [], // Ensuring an empty array if no data is found
    });
  } catch (error) {
    return errorResponse(res, 500, messages.PRODUCTS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
// Upload Images
const uploadImages = async (req, res) => {
  try {
    // Ensure images are uploaded
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, 'No images provided for upload.');
    }

    // Extract URLs of uploaded images from S3
    const imageUrls = req.files.map((file) => file.location);

    return successResponse(res, 200, 'Images uploaded successfully.', {
      images: imageUrls,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to upload images.', {
      error: error.message,
    });
  }
};

module.exports = {
  uploadImages,
};

module.exports = {
  loginUser,
  updateUserById,
  deleteUserById,
  getUserById,
  getAllUsers,
  createUser,
  verifyOTP,
  getAllFestivals,
  getAllSubCategories,
  getAllCategories,
  getAllProducts,
  uploadImages
};
