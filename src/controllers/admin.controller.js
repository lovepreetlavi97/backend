const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  softDelete,
  findByEmail,
  updatePassword,
  verifyPassword,
} = require("../services/mongodb/mongoService");
const jwt = require("jsonwebtoken");
const { Admin, User } = require("../models/index");
const { hashPassword,  } = require("../utils/bcrypt");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await findByEmail(Admin, email);
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }

    // Check if admin account is inactive
    if (admin.status === 'inactive') {
      return errorResponse(res, 403, "Your account has been deactivated. Please contact SuperAdmin.");
    }

    const isMatch = await verifyPassword(password, admin.password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid password");
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    
    // Update admin with token and last login time
    admin.token = token;
    admin.lastLoginAt = new Date();
    await admin.save();

    // Cache the admin for authentication
    await cacheUtils.set(`auth_${token}`, admin, parseInt(process.env.REDIS_TTL || 3600));

    return successResponse(res, 200, "Login successful", {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const logoutAdmin = async (req, res) => {
  try {
    const admin = req.user;
    const token = req.headers.authorization?.split(' ')[1];

    // Clear token from the admin
    admin.token = null;
    await admin.save();

    // Clear from Redis cache
    await cacheUtils.del(`auth_${token}`);

    return successResponse(res, 200, "Logout successful");
  } catch (error) {
    console.error("Admin logout error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const createAdmin = async (req, res) => {
  try {
    const adminData = req.body;
    if (adminData.password) {
      adminData.password = await hashPassword(adminData.password);
    }

    const createdAdmin = await create(Admin, adminData);
    
    // Clear admin cache patterns
    await cacheUtils.delPattern('route_/api/v1/admin*');
    
    return successResponse(res, 201, "Admin created successfully", {
      admin: {
        id: createdAdmin._id,
        name: createdAdmin.name,
        email: createdAdmin.email,
        role: createdAdmin.role
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await findMany(Admin, {}, { password: 0, token: 0 });
    return successResponse(res, 200, "Admins retrieved successfully", { admins });
  } catch (error) {
    console.error("Get all admins error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const getAdminById = async (req, res) => {
  try {
    const admin = await findOne(Admin, { _id: req.params.id }, { password: 0, token: 0 });
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }
    return successResponse(res, 200, "Admin retrieved successfully", { admin });
  } catch (error) {
    console.error("Get admin by ID error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const updateAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow role changes through this endpoint
    delete updateData.role;
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    
    const updatedAdmin = await findAndUpdate(Admin, { _id: id }, updateData);
    if (!updatedAdmin) {
      return errorResponse(res, 404, "Admin not found");
    }
    
    // Clear cache for this admin
    if (updatedAdmin.token) {
      await cacheUtils.del(`auth_${updatedAdmin.token}`);
    }
    await cacheUtils.delPattern('route_/api/v1/admin*');
    
    return successResponse(res, 200, "Admin updated successfully", {
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        status: updatedAdmin.status
      }
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const deleteAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get admin before deletion
    const admin = await findOne(Admin, { _id: id });
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }
    
    await softDelete(Admin, { _id: id });
    
    // Clear cache for this admin
    if (admin.token) {
      await cacheUtils.del(`auth_${admin.token}`);
    }
    await cacheUtils.delPattern('route_/api/v1/admin*');
    
    return successResponse(res, 200, "Admin deleted successfully");
  } catch (error) {
    console.error("Delete admin error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

const updateAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = req.user;

    const isMatch = await verifyPassword(oldPassword, admin.password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid old password");
    }

    await updatePassword(admin, newPassword);
    
    // Clear cache for this admin
    if (admin.token) {
      await cacheUtils.del(`auth_${admin.token}`);
    }
    
    return successResponse(res, 200, "Password updated successfully");
  } catch (error) {
    console.error("Update admin password error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

// Create user (Admin feature)
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user with this email already exists
    if (userData.email) {
      const existingUser = await findByEmail(User, userData.email);
      if (existingUser) {
        return errorResponse(res, 409, "User with this email already exists");
      }
    }
    
    // Check if user with this phone already exists
    if (userData.phoneNumber) {
      const existingPhone = await findOne(User, { phoneNumber: userData.phoneNumber });
      if (existingPhone) {
        return errorResponse(res, 409, "User with this phone number already exists");
      }
    }
    
    // Hash password if provided
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    // Create the user (role will be 'user' by default)
    const user = await create(User, userData);
    
    // Clear cache if needed
    await cacheUtils.delPattern('route_/api/v1/user*');
    
    return successResponse(res, 201, "User created successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse(res, 500, "Failed to create user");
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById,
  updateAdminPassword,
  loginAdmin,
  logoutAdmin,
  createUser
};
