const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  softDelete,
  findByEmail,
} = require("../services/mongodb/mongoService");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models/index");
const { hashPassword } = require("../utils/bcrypt");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");

// Create a new admin (SuperAdmin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;

    // Check if admin with this email already exists
    const existingAdmin = await findByEmail(Admin, email);
    if (existingAdmin) {
      return errorResponse(res, 409, "Admin with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the admin with permissions
    const admin = await create(Admin, {
      name,
      email,
      password: hashedPassword,
      role: 'admin', // Default role is admin (not superadmin)
      permissions: permissions || {}, // Default permissions or provided ones
      createdBy: req.user._id // Track who created this admin
    });

    // Clear admin cache patterns
    await cacheUtils.delPattern('route_/api/v1/admin*');

    return successResponse(res, 201, "Admin created successfully", {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return errorResponse(res, 500, "Failed to create admin");
  }
};

// Get all admins (SuperAdmin only)
const getAllAdmins = async (req, res) => {
  try {
    // Exclude superadmins from the results and sensitive fields
    const admins = await findMany(Admin, { role: 'admin' }, { password: 0, token: 0 });

    return successResponse(res, 200, "Admins retrieved successfully", { admins });
  } catch (error) {
    console.error("Get all admins error:", error);
    return errorResponse(res, 500, "Failed to retrieve admins");
  }
};

// Get admin by ID (SuperAdmin only)
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await findOne(Admin, { _id: id, role: 'admin' }, { password: 0, token: 0 });
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }

    return successResponse(res, 200, "Admin retrieved successfully", { admin });
  } catch (error) {
    console.error("Get admin by ID error:", error);
    return errorResponse(res, 500, "Failed to retrieve admin");
  }
};

// Update admin (SuperAdmin only)
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, permissions, status } = req.body;

    // Check if admin exists
    const admin = await findOne(Admin, { _id: id, role: 'admin' });
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if the new email is already in use by another admin
      if (email !== admin.email) {
        const existingAdmin = await findByEmail(Admin, email);
        if (existingAdmin && existingAdmin._id.toString() !== id) {
          return errorResponse(res, 409, "This email is already in use by another admin");
        }
        updateData.email = email;
      }
    }
    if (permissions) updateData.permissions = permissions;
    if (status) updateData.status = status;

    // Update the admin
    const updatedAdmin = await findAndUpdate(
      Admin,
      { _id: id },
      updateData
    );

    // Clear admin cache patterns
    await cacheUtils.delPattern('route_/api/v1/admin*');
    await cacheUtils.delPattern(`auth_${admin.token}`);

    return successResponse(res, 200, "Admin updated successfully", {
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        permissions: updatedAdmin.permissions,
        status: updatedAdmin.status
      }
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return errorResponse(res, 500, "Failed to update admin");
  }
};

// Delete admin (SuperAdmin only)
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if admin exists
    const admin = await findOne(Admin, { _id: id, role: 'admin' });
    if (!admin) {
      return errorResponse(res, 404, "Admin not found");
    }

    // Delete the admin
    await softDelete(Admin, { _id: id });

    // Clear admin cache patterns
    await cacheUtils.delPattern('route_/api/v1/admin*');
    await cacheUtils.delPattern(`auth_${admin.token}`);

    return successResponse(res, 200, "Admin deleted successfully");
  } catch (error) {
    console.error("Delete admin error:", error);
    return errorResponse(res, 500, "Failed to delete admin");
  }
};

// Create superadmin (Initial setup or emergency use only)
const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    // Verify secret key from environment to enable this sensitive operation
    if (secretKey !== process.env.SUPERADMIN_SECRET_KEY) {
      return errorResponse(res, 403, "Invalid secret key");
    }

    // Check if a superadmin already exists
    const existingSuperAdmin = await findOne(Admin, { role: 'superadmin' });
    if (existingSuperAdmin) {
      return errorResponse(res, 409, "A SuperAdmin already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the superadmin with all permissions
    const superAdmin = await create(Admin, {
      name,
      email,
      password: hashedPassword,
      role: 'superadmin'
      // All permissions will be set to true automatically by the pre-save hook
    });

    return successResponse(res, 201, "SuperAdmin created successfully", {
      admin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role
      }
    });
  } catch (error) {
    console.error("Create superadmin error:", error);
    return errorResponse(res, 500, "Failed to create SuperAdmin");
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  createSuperAdmin
}; 