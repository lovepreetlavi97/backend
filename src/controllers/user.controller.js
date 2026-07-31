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
  countDocuments
} = require("../services/mysql/mysqlService");
const { sequelize } = require("../config/database");
const { generateOTP, generateJWT } = require("../utils/authUtils");
const {
  User,
  Festival,
  SubCategory,
  Category,
  Product,
  Wishlist,
  Cart,
  Relation,
  PromoCode,
  Banner,
  Review,
  InstagramVideo,
  CuratedCollection,
  Gift,
  PriceFilter,
  UserSession // Added UserSession for device tracking
} = require("../models/index");

// --- NEW Auth Integrations ---
const otpService = require("../services/otp.service");
const sessionService = require("../services/session.service");
const jwtUtils = require("../utils/jwt");

const { isValidId } = require("../utils/idUtils");
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

    return errorResponse(res, 400, messages.USER_CREATION_FAILED, {
      error: error.message,
    });
  }
};
const getRelatedProducts = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return errorResponse(res, 400, "Product IDs are required");
    }

    // Convert URL ?ids=1,2,3 into array
    const idArray = ids.split(",").map((id) => id.trim()).filter(id => isValidId(id));

    if (idArray.length === 0) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { products: [] });
    }

    const cacheKey = `related_products_v2_${idArray.sort().join("_")}`;
    const cachedRaw = await cacheUtils.get(cacheKey);

    if (cachedRaw) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cachedRaw);
    }

    // 1. Find the categories/subcategories of the products in the cart
    const cartProducts = await findMany(Product, { id: { $in: idArray } });

    const categoryIds = cartProducts.map(p => p.categoryId).filter(Boolean);
    const subCategoryIds = cartProducts.map(p => p.subcategoryId).filter(Boolean);
    const manualRelatedIds = cartProducts.flatMap(p => p.relatedProductIds || []).filter(Boolean);

    // 2. Find products that are related (same subcategory, same category, or manually linked)
    // and are NOT already in the cart
    const query = {
      id: { $nin: idArray },
      isDeleted: false,
      isBlocked: false,
      $or: [
        { id: { $in: manualRelatedIds } },
        { subcategoryId: { $in: subCategoryIds } },
        { categoryId: { $in: categoryIds } }
      ]
    };

    const relatedProducts = await findMany(Product, query, {}, { limit: 10, sort: { createdAt: -1 }, populate: "priceRuleId" });


    // 3. Enhance products with dynamic prices
    const enhancedProducts = relatedProducts.map((product) => {
      // Dynamic price calculation
      if (
        product.isPriceFixed === false &&
        product.priceRuleId &&
        product.priceRuleId.price
      ) {
        const pricePerUnit = product.priceRuleId.price;
        const weight = product.weight || 0;
        const makingCharges = product.makingCharges || 0;

        product.actualPrice = (pricePerUnit * weight) + makingCharges;

        // If there's a discount percentage, calculate discountedPrice
        if (product.discountPercent && product.discountPercent > 0) {
          const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
          product.discountedPrice = Math.floor(discounted); // Match frontend floor logic
        }
      }

      // Final discount percentage for display
      if (
        product.actualPrice &&
        product.discountedPrice &&
        product.actualPrice > 0
      ) {
        product.discountPercentage = Math.round(
          ((product.actualPrice - product.discountedPrice) /
            product.actualPrice) *
          100
        );
      } else {
        product.discountPercentage = 0;
      }

      return product;
    });

    const responseData = { products: enhancedProducts };

    await cacheUtils.set(cacheKey, responseData, 3600);

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, responseData);
  } catch (error) {

    return errorResponse(
      res,
      500,
      error.message || "Error retrieving related products"
    );
  }
};

// Get all users (with search by name/email/phone)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      search
    } = req.query;


    // Create cache key based on query parameters (include search)
    const cacheKey = `users_${page}_${limit}_${sortBy}_${sortOrder}_${status || "all"}_${search || ""}`;

    // Try cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.USERS_RETRIEVED, cachedData);
    }

    // Build query
    const query = {};
    if (status) query.status = status;

    if (search) {
      const searchStr = String(search).trim();
      if (searchStr) {
        const regex = new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { phoneNumber: regex }
        ];
      }
    }

    // Pagination & sorting options
    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      select: "-password -token -otp",
    };

    const users = await findMany(User, query, null, options);
    const total = await countDocuments(User, query);

    const result = {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    await cacheUtils.set(cacheKey, result, 300); // 5 minutes

    return successResponse(res, 200, messages.USERS_RETRIEVED, result);
  } catch (error) {

    return errorResponse(res, 500, messages.USERS_RETRIEVAL_FAILED, { error: error.message });
  }
};

// Get a user by ID
const getUserById = async (req, res) => {
  try {

    const { id } = req.params;

    // Validate ObjectId
    if (!isValidId(id)) {
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
    const user = await findOne(User, { id });

    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    // Cache the result
    await cacheUtils.set(cacheKey, user, 600); // Cache for 10 minutes

    return successResponse(res, 200, messages.USER_RETRIEVED, { user });
  } catch (error) {

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

    // SEC-003: IDOR Prevention - Ensure user can only update their own profile
    // Admin can update any profile
    if (req.user.role !== "Admin" && req.user._id.toString() !== id) {
      return errorResponse(res, 403, "You are not authorized to update this profile");
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

    return errorResponse(res, 500, messages.USER_UPDATE_FAILED, {
      error: error.message,
    });
  }
};

// Delete user by ID
const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // SEC-003: IDOR Prevention - Ensure user can only delete their own profile
    // Admin can delete any profile
    if (req.user.role !== "Admin" && req.user._id.toString() !== id) {
      return errorResponse(res, 403, "You are not authorized to delete this profile");
    }

    const user = await findOne(User, { _id: id });
    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    await user.update({ isDeleted: true });

    // Clear user from cache
    await cacheUtils.del(`user_${id}`);
    if (user.token) {
      await cacheUtils.del(`auth_${user.token}`);
    }

    // Clear user listings cache
    await cacheUtils.delPattern("users_*");

    return successResponse(res, 200, messages.USER_DELETED);
  } catch (error) {

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
      
      // Save to Redis-based OTP Service as well
      await otpService.saveOTP(phoneNumber, otp);

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
    const user = await findOne(User, { email });
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
    const token = generateJWT(user.id);

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

    return errorResponse(res, 500, messages.LOGIN_FAILED, {
      error: error.message,
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, countryCode, otp } = req.body;

    let user = await findOne(User, { phoneNumber, countryCode });

    if (!user) {
      return errorResponse(res, 404, messages.USER_NOT_FOUND);
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      return errorResponse(res, 403, messages.USER_BLOCKED);
    }



    // --- AUTH-003: OTP Brute Force Protection ---
    const verifyRateLimitKey = `otp_verify_limit_${phoneNumber}`;
    const verifyAttempts = await cacheUtils.get(verifyRateLimitKey);
    if (verifyAttempts && verifyAttempts.count >= 5) {
        return errorResponse(res, 429, "Too many verification attempts. Please try again after 15 minutes");
    }

    // 2. Verify OTP from Redis-based service (supports Static mode)
    const isOTPValid = await otpService.verifyOTP(phoneNumber, otp);
    if (!isOTPValid) {
        // Increment failure counter
        const currentCount = verifyAttempts ? verifyAttempts.count + 1 : 1;
        await cacheUtils.set(verifyRateLimitKey, { count: currentCount }, 900); // 15 mins
        return errorResponse(res, 401, messages.OTP_INVALID);
    }

    // Clear rate limit on success
    await cacheUtils.del(verifyRateLimitKey);

    // Generate dual tokens after OTP verification
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const refreshToken = jwtUtils.generateRefreshToken(user._id);

    // Update user with Access token (for legacy support)
    user.token = accessToken;
    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    user.otp = null; 
    await user.save();

    // Track Session/Device
    await sessionService.trackSession(
      user._id, 
      refreshToken, 
      req.ip, 
      req.headers['user-agent']
    );

    // Cache the user for authentication (Access Token)
    await cacheUtils.set(
      `auth_${accessToken}`,
      user,
      parseInt(process.env.REDIS_TTL || 3600)
    );

    return successResponse(res, 200, messages.OTP_VERIFIED, {
      token: accessToken,
      refreshToken,
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

    return errorResponse(res, 500, messages.LOGOUT_FAILED, {
      error: error.message,
    });
  }
};
const checkCartStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, 400, "Invalid items array");
    }

    // Get product IDs
    const productIds = items.map((item) => item.productId);

    // Fetch products from DB
    const products = await findMany(Product, { id: { $in: productIds }, isDeleted: false });

    // Map stock status
    const results = items.map((item) => {
      const product = products.find(p => (p.id || p._id).toString() === item.productId.toString());

      if (!product) {
        return { ...item, inStock: false, availableQuantity: 0 };
      }

      const inStock = product.stock >= item.quantity;
      return {
        ...item,
        inStock,
        availableQuantity: product.stock,
      };
    });

    return successResponse(res, 200, "Cart stock validated", { results });
  } catch (error) {

    return errorResponse(res, 500, "Failed to validate cart stock", { error: error.message });
  }
};
// Get all festivals for user
const getAllFestivals = async (req, res) => {
  try {
    const { date, metalId } = req.query;

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
    const cacheKey = `festivals_list_${dateStr}_${metalId || 'all'}`;

    const cachedFestivals = await cacheUtils.get(cacheKey);
    if (cachedFestivals) {
      return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, {
        festivals: cachedFestivals
      });
    }

    const query = {
      isDeleted: false,
      isActive: true,
    };
    if (metalId && isValidId(metalId)) {
      query.metalIds = metalId;
    }

    // Find all active festivals
    const festivals = await findMany(Festival, query, {}, { sort: { startDate: -1 } });

    await cacheUtils.set(cacheKey, festivals || [], 3600); // Cache for 1 hour

    return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, {
      festivals: festivals || []
    });
  } catch (error) {

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

    // 🧠 Cache first (luxury = fast)
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      return successResponse(res, 200, messages.HOME_DATA_RETRIEVED, cached);
    }

    // 🧭 Subcategory filter
    let subCategoryFilter = { isDeleted: false, isBlocked: false };
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, "i");
      subCategoryFilter.$or = [{ name: regex }, { slug: regex }];
    }

    // 📂 ONLY 5 curated subcategories
    const subcategories = await findMany(SubCategory, subCategoryFilter, {}, { limit: 8, sort: { name: 1 } });

    // 💎 Product filter
    let productFilter = { isDeleted: false, isBlocked: false };
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, "i");
      productFilter.$or = [{ name: regex }, { description: regex }];
    }

    // 💍 ONLY 5 premium products
    const products = await findMany(Product, productFilter, {}, { limit: 5, sort: { createdAt: -1 }, populate: "priceRuleId" });

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
        product.actualPrice = (product.priceRuleId.price * (product.weight || 0)) + (product.makingCharges || 0);
        if (product.discountPercent && product.discountPercent > 0) {
          const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
          product.discountedPrice = parseFloat(discounted.toFixed(2));
        }
      }
    }

    const responseData = {
      subcategories,
      products,
    };

    // ⚡ Cache for 1 hour
    await cacheUtils.set(cacheKey, responseData, 3600);

    return successResponse(res, 200, messages.HOME_DATA_RETRIEVED, responseData);
  } catch (error) {

    return errorResponse(res, 500, messages.HOME_DATA_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};


// Get all subcategories for user
const getAllSubCategories = async (req, res) => {
  try {
    const { metalId } = req.query;
    const cacheKey = `subcategories_user_${metalId || 'all'}`;

    // Try to get from cache first
    const cachedSubcategories = await cacheUtils.get(cacheKey);
    if (cachedSubcategories) {
      return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
        subcategories: cachedSubcategories,
      });
    }

    const query = {
      isDeleted: false,
      isBlocked: false,
    };
    if (metalId && isValidId(metalId)) {
      query.metalIds = metalId;
    }

    const subcategories = await findMany(SubCategory, query);

    // Cache the result
    await cacheUtils.set(cacheKey, subcategories || []);

    return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, {
      subcategories: subcategories || [],
    });
  } catch (error) {

    return errorResponse(res, 500, messages.SUBCATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all categories for user
const getAllCategories = async (req, res) => {
  try {
    const { limit, metalId } = req.query;
    const cacheKey = `categories_user_${limit || "all"}_${metalId || 'all'}`;

    // Try to get from cache first
    const cachedCategories = await cacheUtils.get(cacheKey);
    if (cachedCategories) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, {
        categories: cachedCategories,
      });
    }

    const queryLimit = parseInt(limit) || 1000;


    const query = { isDeleted: false, isBlocked: false };
    if (metalId && isValidId(metalId)) {
      query.metalIds = metalId;
    }

    const [categories, subcategories] = await Promise.all([
      findMany(Category, query, {}, { limit: queryLimit }),
      findMany(SubCategory, query, {}, { limit: queryLimit * 5 }),
    ]);

    // Normalize categoryId for backward compatibility
    for (let i = 0; i < subcategories.length; i++) {
      const s = subcategories[i];
      if (!s.categoryId && s.category) s.categoryId = s.category;
    }

    const { buildTree } = require("../utils/treeBuilder");

    // Group subcategories by categoryId (O(n))
    const byCategory = new Map();
    for (const s of subcategories) {
      const cid = s.categoryId ? String(s.categoryId) : null;
      if (!cid) continue;
      if (!byCategory.has(cid)) byCategory.set(cid, []);
      byCategory.get(cid).push(s);
    }

    // Attach nested subcategory trees to categories
    const categoriesWithTree = categories.map((c) => {
      const flat = byCategory.get(String(c._id)) || [];
      const tree = buildTree(flat, { idKey: "_id", parentKey: "parentId", childrenKey: "subcategories" });
      return { ...c, subcategories: tree };
    });

    // Cache the result
    await cacheUtils.set(cacheKey, categoriesWithTree || [], 1800);

    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, {
      categories: categoriesWithTree || [],
    });
  } catch (error) {

    return errorResponse(res, 500, messages.CATEGORIES_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Get all products for user with filtering, pagination
const getAllProducts = async (req, res) => {
  try {
    const {
      limit = 12,
      lastId, // Cursor
      categoryId,
      subcategoryId,
      parentId,
      festivalIds,
      minPrice,
      maxPrice,
      search,
      gender,
      color,
      material,
      purity,
      occasion,
      giftId,
      giftIds,
      style,
      relationId,
      relationIds,
    } = req.query;

    // Build query
    const query = {
      isDeleted: false,
      isBlocked: false,
      ...(categoryId && { categoryId }),
      ...(subcategoryId && { subcategoryId }),
      ...(parentId && { parentId }),
      ...(festivalIds && { festivalIds: { $in: Array.isArray(festivalIds) ? festivalIds : [festivalIds] } }),
      ...(gender && { "attributes.gender": gender }),
      ...(color && { "attributes.color": color }),
      ...(material && { "attributes.material": material }),
      ...(purity && { "attributes.purity": purity }),
      ...(occasion && { "attributes.occasions": occasion }),
      ...(giftId && { "attributes.giftIds": giftId }),
      ...(giftIds && { "attributes.giftIds": { $in: Array.isArray(giftIds) ? giftIds : giftIds.split(",") } }),
      ...(style && { "attributes.style": style }),
      ...(relationId && { relationIds: relationId }),
      ...(relationIds && { relationIds: { $in: Array.isArray(relationIds) ? relationIds : relationIds.split(",") } }),
    };


    // Add price range filter
    if (minPrice || maxPrice) {
      query.actualPrice = {};
      if (minPrice) query.actualPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.actualPrice.$lte = parseFloat(maxPrice);
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // APPLY CURSOR
    if (lastId && isValidId(lastId)) {
      query._id = { $lt: lastId };
    }

    const cacheKey = `user_products_cursor_${lastId || "initial"}_${limit}_${JSON.stringify(query)}`;
    const cachedResult = await cacheUtils.get(cacheKey);
    if (cachedResult) {
      return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, cachedResult);
    }

    // Query products
    const products = await findMany(Product, query, {}, {
      limit: parseInt(limit),
      sort: { id: -1 },
      populate: "priceRuleId"
    });

    // Dynamic Pricing Calculation
    for (let product of products) {
      if (!product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
        const pricePerUnit = product.priceRuleId.price;
        const weight = product.weight || 0;
        const makingCharges = product.makingCharges || 0;

        product.actualPrice = (pricePerUnit * weight) + makingCharges;

        if (product.discountPercent && product.discountPercent > 0) {
          const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
          product.discountedPrice = Math.floor(discounted);
        }
      }

      // Calculate discount percentage for display
      if (product.actualPrice && product.discountedPrice && product.actualPrice > 0) {
        product.discountPercentage = Math.round(((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100);
      } else {
        product.discountPercentage = 0;
      }
    }


    const nextCursor = products.length === parseInt(limit) ? products[products.length - 1]._id : null;

    // Fetch distinct attributes for filters
    const availableColors = [];
    const availableMaterials = [];
    const availablePurities = [];
    const availableOccasions = [];

    const result = {
      data: products || [],
      nextCursor,
      hasMore: products.length === parseInt(limit),
      availableFilters: {
        color: availableColors,
        material: availableMaterials,
        purity: availablePurities,
        occasion: availableOccasions,
      }
    };

    await cacheUtils.set(cacheKey, result, 300);

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, result);
  } catch (error) {

    return errorResponse(res, 500, messages.PRODUCTS_RETRIEVAL_FAILED, { error: error.message });
  }
};

// Get products by category/subcategory slug or 'all'
const getProductsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      limit = 12,
      lastId,
      occasion,
      style,
      gender,
      color,
      material,
      minPrice,
      maxPrice,
      search,
      giftId,
      giftIds
    } = req.query;

    let query = { isDeleted: false, isBlocked: false };

    if (slug !== "all") {
      // Find category or subcategory by slug
      const [category, subcategory, relation] = await Promise.all([
        findOne(Category, { slug, isDeleted: false }),
        findOne(SubCategory, { slug, isDeleted: false }),
        findOne(Relation, { slug, isActive: true, isDeleted: false }),
      ]);

      if (subcategory) {
        query.subcategoryId = subcategory.id || subcategory._id;
      } else if (category) {
        query.categoryId = category.id || category._id;
      } else if (relation) {
        query.relationIds = relation.id || relation._id;
      } else {
        const giftMatch = await findOne(Gift, { slug, isActive: true, isDeleted: false });
        if (giftMatch) {
          query.giftId = giftMatch.id || giftMatch._id;
        } else {
          return successResponse(res, 200, "Collection not found", {
            data: [],
            nextCursor: null,
            hasMore: false,
          });
        }
      }

    }

    if (search) {
      query.name = { $regex: search };
    }

    if (lastId && isValidId(lastId)) {
      query.id = { $lt: lastId };
    }

    const cacheKey = `products_slug_${slug}_cursor_${lastId || "initial"}_${JSON.stringify(query)}`;
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, cached);
    }

    const products = await findMany(Product, query, {}, {
      limit: parseInt(limit),
      sort: { id: -1 },
      populate: ["categoryId", "subcategoryId", "priceRuleId"]
    });

    products.forEach(p => {
      if (!p.isPriceFixed && p.priceRuleId && p.priceRuleId.price) {
        const pricePerUnit = p.priceRuleId.price;
        const weight = p.weight || 0;
        const makingCharges = p.makingCharges || 0;

        p.actualPrice = (pricePerUnit * weight) + makingCharges;

        if (p.discountPercent && p.discountPercent > 0) {
          const discounted = p.actualPrice * (1 - (p.discountPercent / 100));
          p.discountedPrice = Math.floor(discounted);
        }
      }

      if (p.actualPrice && p.discountedPrice && p.actualPrice > 0) {
        p.discountPercentage = Math.round(((p.actualPrice - p.discountedPrice) / p.actualPrice) * 100);
      } else {
        p.discountPercentage = 0;
      }
    });


    const nextCursor = products.length === parseInt(limit) ? (products[products.length - 1].id || products[products.length - 1]._id) : null;

    const result = {
      data: products,
      nextCursor,
      hasMore: products.length === parseInt(limit),
    };

    await cacheUtils.set(cacheKey, result, 300);

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, result);
  } catch (error) {

    return errorResponse(res, 500, error.message);
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
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cachedProduct);
    }

    const product = await findOne(Product, { slug }, {}, { populate: ["categoryId", "subcategoryId", "priceRuleId"] });

    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    if (!product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
      product.actualPrice = (product.priceRuleId.price * (product.weight || 0)) + (product.makingCharges || 0);
      if (product.discountPercent && product.discountPercent > 0) {
        const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
        product.discountedPrice = parseFloat(discounted.toFixed(2));
      }
    }

    // 🔢 Discount percentage
    if (product.actualPrice && product.discountedPrice) {
      product.discountPercentage = Math.round(
        ((product.actualPrice - product.discountedPrice) /
          product.actualPrice) *
        100
      );
    }

    // ⭐ REVIEWS (summary + latest 3)
    const productIdVal = product.id || product._id;
    const reviews = await findMany(Review, { productId: productIdVal }, {}, { limit: 3, sort: { createdAt: -1 }, populate: "userId" });

    const totalReviews = await countDocuments(Review, { productId: productIdVal });
    const avgRes = await Review.findOne({
      where: { productId: productIdVal },
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']]
    });
    const avgVal = avgRes ? (parseFloat(avgRes.getDataValue('averageRating')) || 0) : 0;
    const reviewSummary = { averageRating: Number(avgVal.toFixed(1)), totalReviews };

    const responseData = {
      product,
      reviewSummary,
      reviews
    };

    await cacheUtils.set(cacheKey, responseData, 600); // 10 minutes

    return successResponse(
      res,
      200,
      messages.PRODUCT_RETRIEVED,
      responseData
    );
  } catch (error) {

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
      findOne(Cart, { userId: userId.toString() }),
      findOne(Wishlist, { userId: userId.toString() }),
    ]);

    const counts = {
      cartCount: cart && cart.items ? cart.items.length : 0,
      wishlistCount: wishlist && wishlist.products ? wishlist.products.length : 0,
    };

    // Cache the result
    await cacheUtils.set(cacheKey, counts, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.COUNTS_RETRIEVED, counts);
  } catch (error) {

    return errorResponse(res, 500, messages.COUNTS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};

// Check promo code validity
const checkPromoCode = async (req, res) => {
  try {

    const { code } = req.params;
    const userId = req.user?.id || req.user?._id;

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

    const promoCode = await findOne(PromoCode, {
      code: code.toUpperCase(),
      status: "active",
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

    const promoDetails = {
      code: promoCode.code,
      discountType: promoCode.type,
      discountValue: promoCode.value,
      maxDiscount: promoCode.maxDiscount,
      minOrderValue: promoCode.minPurchase,
      expiryDate: promoCode.endDate,
    };
    // Cache the result
    await cacheUtils.set(cacheKey, promoDetails, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.PROMO_CODE_APPLIED, promoDetails);
  } catch (error) {

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
    const relations = await findMany(Relation, {
      isDeleted: false,
    });

    // Cache it
    await cacheUtils.set("relations_user", relations || []);

    return successResponse(res, 200, messages.RELATIONS_RETRIEVED, {
      relations: relations || [],
    });
  } catch (error) {

    return errorResponse(res, 500, messages.RELATIONS_RETRIEVAL_FAILED, {
      error: error.message,
    });
  }
};
const getAllBanners = async (req, res) => {
  try {
    const { metalId } = req.query;
    const cacheKey = `banners_user_${metalId || 'all'}`;
    const cachedBanners = await cacheUtils.get(cacheKey);
    if (cachedBanners) {
      return successResponse(res, 200, "Banners retrieved from cache", {
        banners: cachedBanners,
      });
    }

    const query = {
      isDeleted: false,
      status: "active",
    };

    if (metalId && isValidId(metalId)) {
      query.metalIds = metalId;
    }

    const banners = await findMany(Banner, query, {}, { sort: { position: 1 } });

    await cacheUtils.set(cacheKey, banners || []);

    return successResponse(res, 200, "Banners retrieved successfully", {
      banners: banners || [],
    });
  } catch (error) {

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

    return errorResponse(res, 500, "Failed to resend OTP", {
      error: error.message,
    });
  }
};

const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 4, metalId } = req.query;
    const parsedLimit = parseInt(limit) > 0 ? parseInt(limit) : 4;

    const cacheKey = `trending_products_${parsedLimit}_${metalId || 'all'}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cached);
    }

    const matchQuery = {
      isDeleted: false,
      isBlocked: false,
    };

    if (metalId && isValidId(metalId)) {
      matchQuery.metalIds = metalId;
    }

    const products = await findMany(Product, matchQuery, {}, {
      limit: parsedLimit,
      sort: { viewCount: -1, purchaseCount: -1, createdAt: -1 },
      populate: "priceRuleId"
    });

    const responseData = { products };

    await cacheUtils.set(cacheKey, responseData, 3600);

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, responseData);

  } catch (error) {


    return errorResponse(
      res,
      500,
      error.message || "Error retrieving trending products"
    );
  }
};


const getShopEssentials = async (req, res) => {
  try {
    const LIMIT = 4; // 🔒 fixed

    const cacheKey = `shop_essentials_${LIMIT}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(
        res,
        200,
        "Shop essentials retrieved successfully",
        cached
      );
    }

    const products = await findMany(Product, { isDeleted: false, isBlocked: false }, {}, {
      limit: LIMIT,
      sort: { purchaseCount: -1, averageRating: -1 },
      populate: "priceRuleId"
    });

    const responseData = {
      products,
      title: "Shop Essentials",
      description: "Must-have items for every occasion",
    };

    await cacheUtils.set(cacheKey, responseData, 3600);

    return successResponse(
      res,
      200,
      "Shop essentials retrieved successfully",
      responseData
    );
  } catch (error) {

    return errorResponse(res, 500, error.message);
  }
};


const getAllVideos = async (req, res) => {
  try {
    const videos = await findMany(InstagramVideo, { isActive: true }, {}, { sort: { sortOrder: 1, createdAt: -1 } });

    return successResponse(res, 200, "Instagram videos fetched", { videos });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
const getGiftFilters = async (req, res) => {
  try {
    const cacheKey = "gift_filters_v3_user";
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      return successResponse(res, 200, "Gift filters retrieved", cached);
    }

    // Fetch unique occasions and styles from collections
    const [occasions, relations] = await Promise.all([
      findMany(Gift, { isActive: true, isDeleted: false }, {}, { sort: { name: 1 } }),
      findMany(Relation, { isActive: true, isDeleted: false }, {}, { sort: { name: 1 } }),
    ]);

    const result = {
      occasions: occasions || [],
      recipients: relations || [],
      styles: [],
    };

    await cacheUtils.set(cacheKey, result, 3600); // 1 hour cache

    return successResponse(res, 200, "Gift filters retrieved", result);
  } catch (error) {

    return errorResponse(res, 500, error.message);
  }
};


const getPriceFilters = async (req, res) => {
  try {
    const cacheKey = "price_filters_user";
    const cached = await cacheUtils.get(cacheKey);
    if (cached) {
      return successResponse(res, 200, "Price filters retrieved", { priceFilters: cached });
    }

    const priceFilters = await findMany(PriceFilter, { isActive: true, isDeleted: false }, {}, { sort: { minPrice: 1 } });

    await cacheUtils.set(cacheKey, priceFilters, 3600);

    return successResponse(res, 200, "Price filters retrieved", { priceFilters });
  } catch (error) {

    return errorResponse(res, 500, error.message);
  }
};

const getAllCuratedCollections = async (req, res) => {

  try {
    const { metalId } = req.query;
    const cacheKey = `curated_collections_user_${metalId || 'all'}`;

    // 1️⃣ Check cache
    const cachedCurated = await cacheUtils.get(cacheKey);
    if (cachedCurated) {
      return successResponse(
        res,
        200,
        "Curated collections retrieved successfully",
        { curatedCollections: cachedCurated }
      );
    }

    const query = {
      isDeleted: false,
      isActive: true
    };

    if (metalId && isValidId(metalId)) {
      query.metalIds = metalId;
    }

    // 2️⃣ Fetch from DB
    const curatedCollections = await findMany(CuratedCollection, query, {}, { sort: { position: 1 } });

    // 3️⃣ Cache result
    await cacheUtils.set(cacheKey, curatedCollections || [], 1800);

    return successResponse(
      res,
      200,
      "Curated collections retrieved successfully",
      { curatedCollections: curatedCollections || [] }
    );
  } catch (error) {

    return errorResponse(
      res,
      500,
      "Failed to retrieve curated collections",
      { error: error.message }
    );
  }
};
/**
 * Refresh Token Flow
 */
const refreshAuthToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 400, "Refresh token required");

    // 1. Verify token
    const decoded = jwtUtils.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key');
    if (!decoded) return errorResponse(res, 401, "Invalid refresh token");

    // 2. Check session store
    const session = await findOne(Session, { refreshToken, userId: decoded.id });
    if (!session) return errorResponse(res, 401, "Session expired, please login again");

    // 3. Issue new Access Token
    const accessToken = jwtUtils.generateAccessToken(decoded.id);

    return successResponse(res, 200, "Token refreshed", { token: accessToken });
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error");
  }
};

/**
 * Logout single session
 */
const logoutSessionController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 400, "Refresh token required");

    await sessionService.logoutSession(refreshToken);
    return successResponse(res, 200, messages.LOGOUT_SUCCESSFUL);
  } catch (error) {
    return errorResponse(res, 500, "Logout failed");
  }
};

/**
 * Logout all devices
 */
const logoutAllSessionsController = async (req, res) => {
  try {
    const userId = req.user.id;
    await sessionService.logoutAllSessions(userId);
    return successResponse(res, 200, "Logged out from all devices");
  } catch (error) {
    return errorResponse(res, 500, "Logout failed");
  }
};

module.exports = {
  getAllVideos,
  checkCartStock,
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
  homeSearch,
  getRelatedProducts,
  getAllCuratedCollections,
  getProductsBySlug,
  getGiftFilters,
  getPriceFilters,
  // NEW EXPORTS
  refreshAuthToken,
  logoutSessionController,
  logoutAllSessionsController
};
