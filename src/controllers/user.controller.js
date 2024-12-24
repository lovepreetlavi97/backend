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
        const { phoneNumber } = req.body;

        // Validate request data
        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        // Generate a random OTP (for demonstration purposes)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // TODO: Integrate with an SMS service to send the OTP to the user's phone number
        console.log(`OTP for ${phoneNumber}: ${otp}`); // Log the OTP for debugging

        return res.status(200).json({
			status:200,
            message: "OTP sent successfully",
            otp, // Provide OTP in the response for now (only for testing/demo purposes)
        });
    } catch (error) {
        console.error("Failed to send OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
const verifyOTP=  async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        // Validate request data
        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: "Phone number and OTP are required" });
        }

        // TODO: Validate the OTP (in production, retrieve and compare with stored OTP)
        // For demonstration, assume OTP is always valid
        const isValidOtp = true; // Replace with actual validation logic

        if (!isValidOtp) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        // Generate a JWT token
        const token = jwt.sign({ phoneNumber }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h", // Token expiration time
        });

        return res.status(200).json({
            message: "OTP verified successfully",
            token,
        });
    } catch (error) {
        console.error("Failed to verify OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
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
	verifyOTP
};
