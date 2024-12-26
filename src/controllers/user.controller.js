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
const { User } = require("../models/index");
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
		let token
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber) {
      return errorResponse(res, 400, messages.PHONE_REQUIRED);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

    // Check if user exists
    let user = await findByPhone(User, phoneNumber);

    // Generate token
     token = jwt.sign(
      { id: user ? user._id : undefined },
      process.env.JWT_SECRET_KEY,
      {
        // expiresIn: "1h", // Token expiration time
      }
    );

    if (user) {
      // Update existing user with token and OTP
      user.token = token;
      user.otp = otp;
      await user.save();
    } else {
      // Create new user with token and OTP
      user = await create(User, { phoneNumber, token, otp });
      // Generate token
       token = jwt.sign(
        { id: user ? user._id : undefined },
        process.env.JWT_SECRET_KEY,
        {
          // expiresIn: "1h", // Token expiration time
        }
      );
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
    const { phoneNumber, otp } = req.body;

    // if (!phoneNumber || !otp) {
    // 	return errorResponse(res, 400, messages.PHONE_REQUIRED);
    // }
    // Check if user exists
    console.log(req.user, "req.userreq.userreq.user");
    let user = await findOne(User, { _id: req.user._id, otp: otp });

    if (!user) {
      return errorResponse(res, 401, messages.OTP_INVALID);
    }

    const token = jwt.sign(
      { id: req.user ? req.user._id : undefined },
      process.env.JWT_SECRET_KEY,
      {
        // expiresIn: "1h",
      }
    );

    return successResponse(res, 200, messages.OTP_VERIFIED, { token });
  } catch (error) {
    return errorResponse(res, 500, messages.OTP_VERIFY_FAILED, {
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  updateUserById,
  deleteUserById,
  getUserById,
  getAllUsers,
  createUser,
  verifyOTP,
};
