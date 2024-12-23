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

const jwt = require("jsonwebtoken"); // Import JWT

const User = require("../models/user.model"); // Replace with your actual model
const { hashPassword } = require("../utils/bcrypt");
// Create a new user
const createUser = async (req, res) => {
	try {
		const userData = req.body;
		if (userData.password)
			userData.password = await hashPassword(userData.password);

		const user = await create(User, userData);

		res.status(201).json(user);
	} catch (error) {
		res.status(400).json({ error: error.message });
		0;
	}
};

// Get all users
const getAllUsers = async (req, res) => {
	try {
		const users = await User.find();
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get a user by ID
const getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Update a user by ID
const updateUserById = async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!user) return res.status(404).json({ message: "User not found" });
		res.status(200).json(user);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

// Delete a user by ID
const deleteUserById = async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const loginUser = async (req, res) => {
	try {
		const { phoneNumber, otp } = req.body;

		// Validate request data
		if (!phoneNumber) {
			return res.status(400).json({ message: "Phone number is required" });
		}

		// Find user by phone number
		let user = await findByPhone(User, phoneNumber);

		// If user exists, log them in
		if (user) {
			// Generate a JWT token
			const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
				expiresIn: "1h", // Token expiration time
			});

			// Update the user's token in the database
			user.token = token;
			await user.save();

			return res.status(200).json({
				message: "Login successful",
				token,
				user: {
					id: user._id,
					name: user.name || null, // Handle cases where name might not exist
					phoneNumber: user.phoneNumber,
				},
			});
		}

		// Create a new user
		user = new User({
			phoneNumber,
			token: null, // Token will be generated after successful login
		});
		await user.save();

		// Generate a JWT token
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
			expiresIn: "1h",
		});

		// Update the user's token in the database
		user.token = token;
		await user.save();

		// Respond with token and user details
		res.status(201).json({
			message: "User created and logged in successfully",
			token,
			user: {
				id: user._id,
				name: user.name || null,
				phoneNumber: user.phoneNumber,
			},
		});
	} catch (error) {
		console.error("Failed to log in user:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

// // Example function to verify OTP with an external API
// const verifyOtpWithExternalApi = async (phoneNumber, otp) => {
//   try {
//     // Replace this with your external API call
//     // Example: Using Axios to call the external OTP verification API
//     const response = await axios.post("https://example.com/verify-otp", {
//       phoneNumber,
//       otp,
//     });

//     // Check the response from the API
//     return response.data.success; // Adjust according to your API's response format
//   } catch (error) {
//     console.error("OTP verification failed:", error);
//     return false;
//   }
// };

// Exporting functions
module.exports = {
	loginUser,
	updateUserById,
	deleteUserById,
	getUserById,
	getAllUsers,
	createUser,
};
