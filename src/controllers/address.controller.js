const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const mongoose = require('mongoose');

/**
 * @description Get all addresses for a user
 * @route GET /api/addresses
 * @access Private (User)
 */
const getAllAddresses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user and get their addresses
    const user = await User.findById(userId).select('shippingAddresses');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Transform the addresses to match the frontend structure
    const addresses = user.shippingAddresses.map(address => ({
      id: address._id,
      name: address.contactName,
      phone: address.contactPhone,
      address: address.addressLine1 + (address.addressLine2 ? `, ${address.addressLine2}` : ''),
      city: address.city,
      state: address.state,
      pincode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      label: address.label
    }));

    return successResponse(res, 200, 'Addresses fetched successfully', { addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return errorResponse(res, 500, 'Error fetching addresses', error.message);
  }
};

/**
 * @description Add a new address for a user
 * @route POST /api/addresses
 * @access Private (User)
 */
const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, address, city, state, pincode, country = 'India', isDefault, label = 'Home' } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !pincode) {
      return errorResponse(res, 400, 'All fields are required');
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Format the address for backend storage
    const newAddress = {
      contactName: name,
      contactPhone: phone,
      addressLine1: address,
      city,
      state,
      postalCode: pincode,
      country,
      isDefault: Boolean(isDefault),
      label
    };

    // If this is the first address or isDefault is true, handle default address logic
    if (isDefault || user.shippingAddresses.length === 0) {
      user.shippingAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Add the new address
    user.shippingAddresses.push(newAddress);
    await user.save();

    // Get the newly created address with its generated ID
    const createdAddress = user.shippingAddresses[user.shippingAddresses.length - 1];

    // Format the response to match frontend structure
    const formattedAddress = {
      id: createdAddress._id,
      name: createdAddress.contactName,
      phone: createdAddress.contactPhone,
      address: createdAddress.addressLine1,
      city: createdAddress.city,
      state: createdAddress.state,
      pincode: createdAddress.postalCode,
      country: createdAddress.country,
      isDefault: createdAddress.isDefault,
      label: createdAddress.label
    };

    return successResponse(res, 201, 'Address added successfully', { address: formattedAddress });
  } catch (error) {
    console.error('Error adding address:', error);
    return errorResponse(res, 500, 'Error adding address', error.message);
  }
};

/**
 * @description Update an existing address
 * @route PUT /api/addresses/:id
 * @access Private (User)
 */
const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    const { name, phone, address, city, state, pincode, country, isDefault, label } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !pincode) {
      return errorResponse(res, 400, 'All fields are required');
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Find the address to update
    const addressIndex = user.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    // Update the address fields
    user.shippingAddresses[addressIndex].contactName = name;
    user.shippingAddresses[addressIndex].contactPhone = phone;
    user.shippingAddresses[addressIndex].addressLine1 = address;
    user.shippingAddresses[addressIndex].city = city;
    user.shippingAddresses[addressIndex].state = state;
    user.shippingAddresses[addressIndex].postalCode = pincode;
    if (country) user.shippingAddresses[addressIndex].country = country;
    if (label) user.shippingAddresses[addressIndex].label = label;

    // Handle default address logic
    if (isDefault) {
      user.shippingAddresses.forEach((addr, index) => {
        user.shippingAddresses[index].isDefault = index === addressIndex;
      });
    }

    await user.save();

    // Format the updated address for response
    const updatedAddress = {
      id: user.shippingAddresses[addressIndex]._id,
      name: user.shippingAddresses[addressIndex].contactName,
      phone: user.shippingAddresses[addressIndex].contactPhone,
      address: user.shippingAddresses[addressIndex].addressLine1,
      city: user.shippingAddresses[addressIndex].city,
      state: user.shippingAddresses[addressIndex].state,
      pincode: user.shippingAddresses[addressIndex].postalCode,
      country: user.shippingAddresses[addressIndex].country,
      isDefault: user.shippingAddresses[addressIndex].isDefault,
      label: user.shippingAddresses[addressIndex].label
    };

    return successResponse(res, 200, 'Address updated successfully', { address: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    return errorResponse(res, 500, 'Error updating address', error.message);
  }
};

/**
 * @description Delete an address
 * @route DELETE /api/addresses/:id
 * @access Private (User)
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Find the address to delete
    const addressIndex = user.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    // Check if the address being deleted is the default
    const wasDefault = user.shippingAddresses[addressIndex].isDefault;

    // Remove the address
    user.shippingAddresses.splice(addressIndex, 1);

    // If the deleted address was the default and there are other addresses,
    // set the first one as default
    if (wasDefault && user.shippingAddresses.length > 0) {
      user.shippingAddresses[0].isDefault = true;
    }

    await user.save();

    return successResponse(res, 200, 'Address deleted successfully');
  } catch (error) {
    console.error('Error deleting address:', error);
    return errorResponse(res, 500, 'Error deleting address', error.message);
  }
};

/**
 * @description Set an address as default
 * @route PATCH /api/addresses/:id/default
 * @access Private (User)
 */
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Find the address to set as default
    const addressIndex = user.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    // Set this address as default and others as non-default
    user.shippingAddresses.forEach((addr, index) => {
      user.shippingAddresses[index].isDefault = index === addressIndex;
    });

    await user.save();

    // Format the default address for response
    const defaultAddress = {
      id: user.shippingAddresses[addressIndex]._id,
      name: user.shippingAddresses[addressIndex].contactName,
      phone: user.shippingAddresses[addressIndex].contactPhone,
      address: user.shippingAddresses[addressIndex].addressLine1,
      city: user.shippingAddresses[addressIndex].city,
      state: user.shippingAddresses[addressIndex].state,
      pincode: user.shippingAddresses[addressIndex].postalCode,
      country: user.shippingAddresses[addressIndex].country,
      isDefault: user.shippingAddresses[addressIndex].isDefault,
      label: user.shippingAddresses[addressIndex].label
    };

    return successResponse(res, 200, 'Default address set successfully', { address: defaultAddress });
  } catch (error) {
    console.error('Error setting default address:', error);
    return errorResponse(res, 500, 'Error setting default address', error.message);
  }
};

/**
 * @description Get an address by ID
 * @route GET /api/addresses/:id
 * @access Private (User)
 */
const getAddressById = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Find the specific address
    const address = user.shippingAddresses.find(
      addr => addr._id.toString() === addressId
    );

    if (!address) {
      return errorResponse(res, 404, 'Address not found');
    }

    // Format the address for response
    const formattedAddress = {
      id: address._id,
      name: address.contactName,
      phone: address.contactPhone,
      address: address.addressLine1 + (address.addressLine2 ? `, ${address.addressLine2}` : ''),
      city: address.city,
      state: address.state,
      pincode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      label: address.label
    };

    return successResponse(res, 200, 'Address fetched successfully', { address: formattedAddress });
  } catch (error) {
    console.error('Error fetching address:', error);
    return errorResponse(res, 500, 'Error fetching address', error.message);
  }
};

module.exports = {
  getAllAddresses,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
