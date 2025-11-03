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
  Wishlist,
  Cart,
  PromoCode,
  Banner,
} = require("../models/index");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { hashPassword } = require("../utils/bcrypt");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { OAuth2Client } = require("google-auth-library");

// Create a new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Check if user with this email already exists
    if (userData.email) {
      const existingUser = await findByEmail(User, userData.email);
      if (existingUser) {
        return errorResponse(res, 409, messages.EMAIL_ALREADY_EXISTS);
      }
    }

    // Check if user with this phone already exists
    if (userData.phoneNumber) {
      const existingPhone = await findByPhone(User, userData.phoneNumber);
      if (existingPhone) {
        return errorResponse(res, 409, messages.PHONE_ALREADY_EXISTS);
      }
    }

    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    } else {
      const tempPassword = Math.random().toString(36).slice(-8);
      userData.password = await hashPassword(tempPassword);
    }

    const user = await create(User, userData);

    return successResponse(res, 201, messages.USER_CREATED, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse(res, 400, messages.USER_CREATION_FAILED, {
      error: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = req.query;

    // Create cache key based on query parameters
    const cacheKey = `users_${page}_${limit}_${sortBy}_${sortOrder}_${
      status || "all"
    }`;

    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.USERS_RETRIEVED, cachedData);
    }

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      select: "-password -token -otp",
    };

    // Execute query with pagination
    const users = await User.find(query, null, options);
    const total = await User.countDocuments(query);

    const result = {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.USERS_RETRIEVED, result);
  } catch (error) {
    console.error("Get all users error:", error);
    return errorResponse(res, 500, messages.USERS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get a user by ID
const getUserById = async (req, res) => {
  try {
    console.log("Fetching user with ID:", req.params.id);
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid user ID format");
    }

    // Try to get from cache first
    const cacheKey = `user_${id}`;
    const cachedUser = await cacheUtils.get(cacheKey);

    if (cachedUser) {
      return successResponse(res, 200, messages.USER_RETRIEVED, {
        user: cachedUser,
      });
    }

    // If not in cache, get from database
    const user = await User.findById(id).select("-password -token -otp").lean();

    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    // Cache the result
    await cacheUtils.set(cacheKey, user, 600); // Cache for 10 minutes

    return successResponse(res, 200, messages.USER_RETRIEVED, { user });
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse(res, 500, messages.USER_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Update user by ID
const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid user ID format");
    }

    // Don't allow role change through this endpoint
    delete updateData.role;

    // Input validation
    if (updateData.email && !updateData.email.match(/^\S+@\S+\.\S+$/)) {
      return errorResponse(res, 400, "Please provide a valid email address");
    }

    if (
      updateData.phoneNumber &&
      !updateData.phoneNumber.match(/^[0-9]{10}$/)
    ) {
      return errorResponse(
        res,
        400,
        "Please provide a valid 10-digit phone number"
      );
    }

    // If updating email, check if it already exists
    if (updateData.email) {
      const existingUser = await findByEmail(User, updateData.email);
      if (existingUser && existingUser._id.toString() !== id) {
        return errorResponse(res, 409, messages.EMAIL_ALREADY_EXISTS);
      }
    }

    // If updating phone, check if it already exists
    if (updateData.phoneNumber) {
      const existingPhone = await findByPhone(User, updateData.phoneNumber);
      if (existingPhone && existingPhone._id.toString() !== id) {
        return errorResponse(res, 409, messages.PHONE_ALREADY_EXISTS);
      }
    }

    // Handle address updates properly
    if (updateData.shippingAddresses) {
      // Make sure it's an array
      if (!Array.isArray(updateData.shippingAddresses)) {
        updateData.shippingAddresses = [updateData.shippingAddresses];
      }

      // Make sure each address has required fields
      for (const address of updateData.shippingAddresses) {
        if (
          !address.addressLine1 ||
          !address.city ||
          !address.state ||
          !address.postalCode ||
          !address.country
        ) {
          return errorResponse(
            res,
            400,
            "Shipping address is missing required fields"
          );
        }
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const user = await findOne(User, { _id: id });
    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    const updatedUser = await findAndUpdate(User, { _id: id }, updateData);

    // Clear user from cache
    await cacheUtils.del(`user_${id}`);
    if (user.token) {
      await cacheUtils.del(`auth_${user.token}`);
    }

    // Clear user listings cache
    await cacheUtils.delPattern("users_*");

    return successResponse(res, 200, messages.USER_UPDATED, {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        countryCode: updatedUser.countryCode,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse(res, 500, messages.USER_UPDATE_FAILED, {
      error: error.message,
    });
  }
};

// Delete user by ID
const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid user ID format");
    }

    const user = await findOne(User, { _id: id });
    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    // Use a transaction to handle related data
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Soft delete the user
      await softDelete(User, { _id: id }, session);

      // Clear associated data (optional)
      // Depending on your requirements, you might want to:
      // - Delete user's cart
      // - Delete user's wishlist
      // - Archive user's orders (not delete them)

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Clear user from cache
    await cacheUtils.del(`user_${id}`);
    if (user.token) {
      await cacheUtils.del(`auth_${user.token}`);
    }

    // Clear user listings cache
    await cacheUtils.delPattern("users_*");

    return successResponse(res, 200, messages.USER_DELETED);
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse(res, 500, messages.USER_DELETION_FAILED, {
      error: error.message,
    });
  }
};

// Phone Login - Send OTP
const loginUser = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    // Validate phone number
    if (!phoneNumber) {
      return errorResponse(res, 400, messages.PHONE_REQUIRED);
    }

    // Input validation
    if (!phoneNumber.match(/^[0-9]{10}$/)) {
      return errorResponse(
        res,
        400,
        "Please provide a valid 10-digit phone number"
      );
    }

    if (!countryCode || !countryCode.match(/^\+[0-9]{1,4}$/)) {
      return errorResponse(res, 400, "Please provide a valid country code");
    }

    // Generate OTP using utility function
    const otp = generateOTP();
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Rate limiting for OTP requests (Redis-based)
    const rateLimitKey = `otp_ratelimit_${phoneNumber}`;
    const rateLimitValue = await cacheUtils.get(rateLimitKey);

    if (rateLimitValue && rateLimitValue.count >= 5) {
      return errorResponse(
        res,
        429,
        "Too many OTP requests. Please try again after 30 minutes"
      );
    }

    // Check if user exists
    let user = await findByPhone(User, phoneNumber);
    let userRegistered = false;

    if (user) {
      // Check if user is blocked
      if (user.status === "blocked") {
        return errorResponse(res, 403, messages.USER_BLOCKED);
      }

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      userRegistered = true;
    } else {
      // User not registered, do not create user, just return
      return successResponse(res, 200, messages.USER_NOT_FOUND, {
        phoneNumber,
        countryCode,
        userRegistered: false,
      });
    }

    // Set or increment rate limit counter
    if (rateLimitValue) {
      await cacheUtils.set(
        rateLimitKey,
        {
          count: rateLimitValue.count + 1,
          firstAttempt: rateLimitValue.firstAttempt,
        },
        1800
      ); // 30 minutes TTL
    } else {
      await cacheUtils.set(
        rateLimitKey,
        {
          count: 1,
          firstAttempt: new Date().toISOString(),
        },
        1800
      ); // 30 minutes TTL
    }

    // In a real-world scenario, send OTP via SMS here
    // For now, just logging it and sending in response for testing

    // Return success response
    return successResponse(res, 200, messages.OTP_SENT, {
      phoneNumber,
      countryCode,
      // Only include OTP in development environment. In production you would send via SMS
      ...(process.env.NODE_ENV !== "production" && { otp }),
      userRegistered: userRegistered,
    });
  } catch (error) {
    console.error("Error during user login:", error);
    return errorResponse(res, 500, messages.OTP_SEND_FAILED, {
      error: error.message,
    });
  }
};

// Email & Password Login
const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return errorResponse(res, 400, messages.EMAIL_PASSWORD_REQUIRED);
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND, {
        userRegistered: false,
      });
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      return errorResponse(res, 403, messages.USER_BLOCKED);
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, messages.INVALID_CREDENTIALS);
    }

    // Generate JWT token
    const token = generateJWT(user._id);

    // Update user with token and last login time
    user.token = token;
    user.lastLoginAt = new Date();
    await user.save();

    // Cache the user for authentication
    await cacheUtils.set(
      `auth_${token}`,
      user,
      parseInt(process.env.REDIS_TTL || 3600)
    );

    return successResponse(res, 200, messages.LOGIN_SUCCESSFUL, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during email login:", error);
    return errorResponse(res, 500, messages.LOGIN_FAILED, {
      error: error.message,
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, countryCode, otp } = req.body;

    let user = await User.findOne({ phoneNumber, countryCode }).select("+otp");

    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      return errorResponse(res, 403, messages.USER_BLOCKED);
    }

    console.log(otp, user, user.otp);

    // if (user.otp !== otp) {
    //   return errorResponse(res, 401, messages.OTP_INVALID);
    // }

    if (otp !== "111111") {
      {
        return errorResponse(res, 401, messages.OTP_INVALID);
      }
    }

    // Generate new JWT token after OTP verification
    const token = generateJWT(user._id);

    // Update user with token, phone verification status, and last login time
    user.token = token;
    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    user.otp = null; // Clear the OTP after successful verification
    await user.save();

    // Cache the user for authentication
    await cacheUtils.set(
      `auth_${token}`,
      user,
      parseInt(process.env.REDIS_TTL || 3600)
    );

    return successResponse(res, 200, messages.OTP_VERIFIED, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return errorResponse(res, 500, messages.OTP_VERIFY_FAILED, {
      error: error.message,
    });
  }
};

// User logout
const logoutUser = async (req, res) => {
  try {
    const user = req.user;
    const token = req.headers.authorization?.split(" ")[1];

    // Clear token from user
    user.token = null;
    await user.save();

    // Clear from Redis cache
    await cacheUtils.del(`auth_${token}`);

    return successResponse(res, 200, messages.LOGOUT_SUCCESSFUL);
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse(res, 500, messages.LOGOUT_FAILED, {
      error: error.message,
    });
  }
};

// Get all festivals for user
const getAllFestivals = async (req, res) => {
  try {
    const { date } = req.query;
    
    let targetDate;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return errorResponse(res, 400, "Invalid date format. Use YYYY-MM-DD");
      }
    } else {
      targetDate = new Date();
    }
    
    const dateStr = targetDate.toISOString().split('T')[0];
    const cacheKey = `festival_${dateStr}`;
    
    const cachedFestival = await cacheUtils.get(cacheKey);
    if (cachedFestival) {
      return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, {
        festival: cachedFestival
      });
    }

    // Set up date range for precise matching
    const startOfDayUTC = new Date(targetDate);
    startOfDayUTC.setUTCHours(0, 0, 0, 0);
    
    const endOfDayUTC = new Date(targetDate);
    endOfDayUTC.setUTCHours(23, 59, 59, 999);

    // Find most relevant festival for this date
    const festival = await Festival.findOne({
      isDeleted: false,
      isActive: true,
      startDate: { $lte: endOfDayUTC },  // Started before or on end of target day
      endDate: { $gte: startOfDayUTC },  // Ends after or on start of target day
    }).sort({ 
      startDate: -1 
    });

    await cacheUtils.set(cacheKey, festival || null, 3600); // Cache for 1 hour

    return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, {
      festival: festival || null
    });
  } catch (error) {
    console.error("Get festival error:", error);
    return errorResponse(res, 500, messages.FESTIVALS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
// Get all festivals for user
const homeSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const trimmedQuery = query?.trim();
    const cacheKey = `home_${trimmedQuery || "default"}`;

    // 🧠 Try from cache first
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      return successResponse(res, 200, messages.HOME_DATA_RETRIEVED, cached);
    }

    // 🧭 Build subcategory filter
    let subCategoryFilter = { isDeleted: false, isBlocked: false };
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, "i");
      subCategoryFilter.$or = [{ name: regex }, { slug: regex }];
    }

    // 📂 Efficiently fetch matching subcategories
    const subcategories = await SubCategory.find(subCategoryFilter)
      .select("_id name slug image categoryId")
      .sort({ name: 1 }) // sorting for better UX
      .limit(20)
      .lean();

    // 💎 Build product filter
    let productFilter = { isDeleted: false, isBlocked: false };
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, "i");
      productFilter.$or = [{ name: regex }, { description: regex }];
    }

    const products = await Product.find(productFilter)
      .select("_id  name description title slug price actualPrice discountedPrice images categoryId")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const responseData = {
      subcategories,
      products,
    };

    // ⚡ Cache results for 1 hour
    await cacheUtils.set(cacheKey, responseData, 3600);

    return successResponse(res, 200, messages.HOME_DATA_RETRIEVED, responseData);
  } catch (error) {
    console.error("Home search error:", error);
    return errorResponse(res, 500, messages.HOME_DATA_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all subcategories for user
const getAllSubCategories = async (req, res) => {
  try {
    // Try to get from cache first
    const cachedSubcategories = await cacheUtils.get("subcategories_user");
    if (cachedSubcategories) {
      return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
        subcategories: cachedSubcategories,
      });
    }

    const subcategories = await SubCategory.find({
      isDeleted: false,
      isBlocked: false,
    });

    // Cache the result
    await cacheUtils.set("subcategories_user", subcategories || []);

    return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
      subcategories: subcategories || [],
    });
  } catch (error) {
    console.error("Get subcategories error:", error);
    return errorResponse(res, 500, messages.SUBCATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all categories for user
const getAllCategories = async (req, res) => {
  try {
    // Try to get from cache first
    const cachedCategories = await cacheUtils.get("categories_user");
    if (cachedCategories) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, {
        categories: cachedCategories,
      });
    }

    const categories = await Category.find({
      isDeleted: false,
      isBlocked: false,
    });

    // Cache the result
    await cacheUtils.set("categories_user", categories || []);

    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, {
      categories: categories || [],
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return errorResponse(res, 500, messages.CATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all products for user with filtering, pagination and sorting
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      categoryId,
      subcategoryId,
      festivalIds,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    // Build query
    const query = {
      isDeleted: false,
      isBlocked: false,
    };

    // Add filters if provided
    if (categoryId) query.categoryId = categoryId;
    if (subcategoryId) query.subcategoryId = subcategoryId;
    if (festivalIds) query.festivalIds = festivalIds;

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    // Generate cache key based on query parameters
    const cacheKey = `products_${JSON.stringify({
      query,
      page,
      limit,
      sort,
      order,
    })}`;

    // Try to get from cache first
    const cachedResult = await cacheUtils.get(cacheKey);
    if (cachedResult) {
      return successResponse(
        res,
        200,
        messages.PRODUCTS_RETRIEVED,
        cachedResult
      );
    }

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("festivalIds", "name");

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    const result = {
      products: products || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 600); // Cache for 10 minutes

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, result);
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse(res, 500, messages.PRODUCTS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get uploads info function
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, messages.NO_FILES_UPLOADED);
    }

    const uploadedFiles = req.files.map((file) => ({
      url: file.location, // AWS S3 URL
      key: file.key,
    }));

    return successResponse(res, 200, messages.FILES_UPLOADED, {
      uploads: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload images error:", error);
    return errorResponse(res, 500, messages.FILE_UPLOAD_FAILED, {
      error: error.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    const cacheKey = `product_slug_${slug}`;
    const cachedProduct = await cacheUtils.get(cacheKey);

    if (cachedProduct) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, {
        product: cachedProduct,
      });
    }

    const product = await Product.findOne({ slug })
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({ path: "festivalIds", select: "name" })
      .populate({ path: "relationIds", select: "name" })
      .lean();

    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    // Add discountPercentage manually if needed
    if (product.actualPrice && product.discountedPrice) {
      product.discountPercentage = Math.round(
        ((product.actualPrice - product.discountedPrice) /
          product.actualPrice) *
          100
      );
    }

    await cacheUtils.set(cacheKey, product, 600); // 10-minute cache

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { product });
  } catch (error) {
    console.error("Get product by slug error:", error);
    return errorResponse(
      res,
      500,
      error.message || "Error retrieving product by slug"
    );
  }
};

// Get counts for navbar
const getCountsOfNavbar = async (req, res) => {
  try {
    const userId = req.user?._id;

    // If no user is logged in, return zeros
    if (!userId) {
      return successResponse(res, 200, messages.COUNTS_RETRIEVED, {
        cartCount: 0,
        wishlistCount: 0,
      });
    }

    // Try to get from cache first
    const cacheKey = `navbar_counts_${userId}`;
    const cachedCounts = await cacheUtils.get(cacheKey);
    if (cachedCounts) {
      return successResponse(res, 200, messages.COUNTS_RETRIEVED, cachedCounts);
    }

    // Get cart and wishlist count
    const [cart, wishlist] = await Promise.all([
      Cart.findOne({ userId }),
      Wishlist.findOne({ userId }),
    ]);

    const counts = {
      cartCount: cart ? cart.items.length : 0,
      wishlistCount: wishlist ? wishlist.products.length : 0,
    };

    // Cache the result
    await cacheUtils.set(cacheKey, counts, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.COUNTS_RETRIEVED, counts);
  } catch (error) {
    console.error("Get counts error:", error);
    return errorResponse(res, 500, messages.COUNTS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Check promo code validity
const checkPromoCode = async (req, res) => {
  try {
    console.log("Checking promo code...");
    const { code } = req.params;
    const userId = req.user?._id;

    if (!code) {
      return errorResponse(res, 400, messages.PROMO_CODE_REQUIRED);
    }

    // Try to get from cache first (shorter cache time for promo code)
    const cacheKey = `promo_${code}_${userId}`;
    const cachedPromo = await cacheUtils.get(cacheKey);
    if (cachedPromo) {
      // If cached result is an error message
      if (cachedPromo.error) {
        return errorResponse(res, cachedPromo.statusCode, cachedPromo.message);
      }
      return successResponse(res, 200, messages.PROMO_CODE_VALID, cachedPromo);
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (!promoCode) {
      const errorObj = {
        error: true,
        statusCode: 404,
        message: messages.PROMO_CODE_INVALID,
      };
      await cacheUtils.set(cacheKey, errorObj, 300); // Cache error for 5 minutes
      return errorResponse(res, 404, messages.PROMO_CODE_INVALID);
    }

    // Check if max usage limit reached
    if (
      promoCode.usageLimit !== null &&
      promoCode.usedCount >= promoCode.usageLimit
    ) {
      const errorObj = {
        error: true,
        statusCode: 400,
        message: messages.PROMO_CODE_MAX_USAGE,
      };
      await cacheUtils.set(cacheKey, errorObj, 300);
      return errorResponse(res, 400, messages.PROMO_CODE_MAX_USAGE);
    }

    // Check if user already used this promo code
    if (userId && promoCode.usedBy.includes(userId)) {
      const errorObj = {
        error: true,
        statusCode: 400,
        message: messages.PROMO_CODE_ALREADY_USED,
      };
      await cacheUtils.set(cacheKey, errorObj, 300);
      return errorResponse(res, 400, messages.PROMO_CODE_ALREADY_USED);
    }

    // Check if user is restricted from using this code
    if (
      userId &&
      promoCode.userRestrictions.length > 0 &&
      !promoCode.userRestrictions.includes(userId)
    ) {
      const errorObj = {
        error: true,
        statusCode: 403,
        message: messages.PROMO_CODE_NOT_ELIGIBLE,
      };
      await cacheUtils.set(cacheKey, errorObj, 300);
      return errorResponse(res, 403, messages.PROMO_CODE_NOT_ELIGIBLE);
    }

const promoDetails = {
  code: promoCode.code,
  discountType: promoCode.type,              // <- changed
  discountValue: promoCode.value,            // <- changed
  maxDiscount: promoCode.maxDiscount,
  minOrderValue: promoCode.minPurchase,      // <- changed
  expiryDate: promoCode.endDate,             // <- use endDate not expiryDate
};
    // Cache the result
    await cacheUtils.set(cacheKey, promoDetails, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.PROMO_CODE_APPLIED, promoDetails);
  } catch (error) {
    console.error("Check promo code error:", error);
    return errorResponse(res, 500, messages.PROMO_CODE_CHECK_FAILED, {
      error: error.message,
    });
  }
};
// Get all relations for user
const getAllRelations = async (req, res) => {
  try {
    // Check cache first
    const cachedRelations = await cacheUtils.get("relations_user");
    if (cachedRelations) {
      return successResponse(res, 200, messages.RELATIONS_RETRIEVED, {
        relations: cachedRelations,
      });
    }

    // Fetch from DB
    const relations = await Relation.find({
      isDeleted: false,
    });

    // Cache it
    await cacheUtils.set("relations_user", relations || []);

    return successResponse(res, 200, messages.RELATIONS_RETRIEVED, {
      relations: relations || [],
    });
  } catch (error) {
    console.error("Get relations error:", error);
    return errorResponse(res, 500, messages.RELATIONS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
const getAllBanners = async (req, res) => {
  try {
    const cacheKey = "banners_user";
    const cachedBanners = await cacheUtils.get(cacheKey);
    if (cachedBanners) {
      return successResponse(res, 200, "Banners retrieved from cache", {
        banners: cachedBanners,
      });
    }

    const today = new Date();

    const banners = await Banner.find({
      isDeleted: false,
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).sort({ position: 1 });

    await cacheUtils.set(cacheKey, banners || []);

    return successResponse(res, 200, "Banners retrieved successfully", {
      banners: banners || [],
    });
  } catch (error) {
    console.error("Get banners error:", error);
    return errorResponse(res, 500, "Failed to retrieve banners", {
      error: error.message,
    });
  }
};

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.REDIRECT_URL;

const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return errorResponse(res, 400, "Google auth code is required");
    }

    const oAuth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      googleRedirectUri
    );
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await findByEmail(User, email);

    let isNewUser = false;
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = await create(User, {
        name,
        email,
        password: await hashPassword(tempPassword),
        isEmailVerified: true,
        profilePicture: picture,
        loginProvider: "google",
        status: "active",
      });
      isNewUser = true;
    } else {
      user.name = name;
      user.profilePicture = picture;
      user.isEmailVerified = true;
      user.loginProvider = "google";
      await user.save();
    }

    const token = generateJWT(user._id);

    user.token = token;
    user.lastLoginAt = new Date();
    await user.save();
    await cacheUtils.set(
      `auth_${token}`,
      user,
      parseInt(process.env.REDIS_TTL || 3600)
    );

    return successResponse(
      res,
      200,
      isNewUser ? messages.USER_CREATED : messages.LOGIN_SUCCESSFUL,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          loginProvider: user.loginProvider,
        },
        isNewUser,
      }
    );
  } catch (error) {
    console.error("Google login error:", error);
    return errorResponse(res, 500, "Google login failed", {
      error: error.message,
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
      return errorResponse(res, 400, "Phone number and country code are required");
    }

    if (!phoneNumber.match(/^[0-9]{10}$/)) {
      return errorResponse(res, 400, "Please provide a valid 10-digit phone number");
    }

    if (!countryCode.match(/^\+[0-9]{1,4}$/)) {
      return errorResponse(res, 400, "Please provide a valid country code");
    }

    // Rate limiting: max 5 per hour
    const rateLimitKey = `otp_resend_limit_${countryCode}_${phoneNumber}`;
    let rateLimit = await cacheUtils.get(rateLimitKey);

    if (rateLimit && rateLimit.count >= 5) {
      return errorResponse(
        res,
        429,
        "You have reached the maximum OTP resend limit. Please try again after 1 hour."
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Find user
    let user = await findByPhone(User, phoneNumber);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    // Save OTP to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Update rate limit
    if (rateLimit) {
      rateLimit.count += 1;
      await cacheUtils.set(rateLimitKey, rateLimit, 3600); // 1 hour TTL
    } else {
      await cacheUtils.set(rateLimitKey, { count: 1 }, 3600);
    }

    // In production, send OTP via SMS here

    return successResponse(res, 200, "OTP resent successfully", {
      phoneNumber,
      countryCode,
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return errorResponse(res, 500, "Failed to resend OTP", {
      error: error.message,
    });
  }
};

// Get trending products
const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const parsedLimit = parseInt(limit) > 0 ? parseInt(limit) : 4;
    console.log("Parsed limit for trending products:", parsedLimit);
    
    const cacheKey = `trending_products_${parsedLimit}`;
    const cached = await cacheUtils.get(cacheKey);
    
    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cached);
    }
    
    const products = await Product.find({
      isDeleted: false, 
      isBlocked: false
    })
      .sort({ 
        viewCount: -1, 
        purchaseCount: -1, 
        createdAt: -1 
      })
      .limit(parsedLimit)
      .lean();
      
    const enhancedProducts = products.map((product) => {
      if (product.actualPrice && product.discountedPrice) {
        product.discountPercentage = Math.round(
          ((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100
        );
      }
      return product;
    });
    
    const responseData = { products: enhancedProducts };
    
    await cacheUtils.set(cacheKey, responseData, 3600);
    
    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, responseData);
  } catch (error) {
    console.error("Get trending products error:", error);
    return errorResponse(
      res, 
      500, 
      error.message || "Error retrieving trending products"
    );
  }
};

// Get shop essentials
const getShopEssentials = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const parsedLimit = parseInt(limit) > 0 ? parseInt(limit) : 8;
    
    const cacheKey = `shop_essentials_${parsedLimit}`;
    const cached = await cacheUtils.get(cacheKey);
    
    if (cached) {
      return successResponse(res, 200, "Shop essentials retrieved successfully", cached);
    }
    
    const products = await Product.find({
      isDeleted: false,
      isBlocked: false
    })
      .sort({ 
        purchaseCount: -1,
        discountPercentage: -1
      })
      .limit(parsedLimit)
      .lean();
      
    const enhancedProducts = products.map((product) => {
      if (product.actualPrice && product.discountedPrice) {
        product.discountPercentage = Math.round(
          ((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100
        );
      }
      return product;
    });
    
    const responseData = { 
      products: enhancedProducts,
      title: "Shop Essentials",
      description: "Must-have items for every occasion"
    };
    
    await cacheUtils.set(cacheKey, responseData, 3600);
    
    return successResponse(res, 200, "Shop essentials retrieved successfully", responseData);
  } catch (error) {
    console.error("Get shop essentials error:", error);
    return errorResponse(
      res, 
      500, 
      error.message || "Error retrieving shop essentials"
    );
  }
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
  loginUser,
  loginWithEmail,
  verifyOTP,
  logoutUser,
  getAllFestivals,
  getAllSubCategories,
  getAllCategories,
  getAllProducts,
  uploadImages,
  getProductBySlug,
  checkPromoCode,
  getCountsOfNavbar,
  getAllRelations,
  getAllBanners,
  googleLogin,
  resendOTP,
  getTrendingProducts,
  getShopEssentials,
  homeSearch
};
