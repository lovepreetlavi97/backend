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
const jwt = require("jsonwebtoken"); // Import JWT
// Import the password verification function

const { Admin } = require("../models/index");
const { hashPassword } = require("../utils/bcrypt");

// Create a new admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await findByEmail(Admin, email);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify the password
    const isMatch = await verifyPassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h", // Token expiration time
    });
    // Update the admin's token in the database
    admin.token = token; // Set the token
    await admin.save(); // Save the updated admin document
    // Respond with token and admin details (without password)
    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Failed to log in admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createAdmin = async (req, res) => {
  try {
    const adminData = req.body;
    if (adminData.password)
      adminData.password = await hashPassword(adminData.password);

    const createdAdmin = await create(Admin, adminData);
    res.status(201).json(createdAdmin);
  } catch (error) {
    console.error("Failed to create admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await findMany(Admin);
    res.status(200).json(admins);
  } catch (error) {
    console.error("Failed to get admins:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get an admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await findOne(Admin, { _id: req.params.id });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(admin);
  } catch (error) {
    console.error("Failed to get admin by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an admin by ID
const updateAdminById = async (req, res) => {
  try {
    const updatedData = req.body;
    const admin = await findOne(Admin, { _id: req.params.id });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Optimistically return the updated data before the update is confirmed
    const optimisticUpdatedAdmin = { ...admin.toObject(), ...updatedData };
    res.status(200).json(optimisticUpdatedAdmin);

    await findAndUpdate(Admin, { _id: req.params.id }, updatedData);
  } catch (error) {
    console.error("Failed to update admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete an admin by ID
const deleteAdminById = async (req, res) => {
  try {
    const admin = await findOne(Admin, { _id: req.params.id });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Optimistically return success response before deletion is confirmed
    res.status(204).send();

    await softDelete(Admin, { _id: req.params.id });
  } catch (error) {
    console.error("Failed to delete admin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an admin's password
const updateAdminPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const admin = await findByEmail(Admin, email);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const isMatch = await verifyPassword(oldPassword, admin.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid old password" });

    // Optimistically update password in response
    res.status(200).json({ message: "Password updated successfully" });

    await updatePassword(admin, newPassword);
  } catch (error) {
    console.error("Failed to update password:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
};
