const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const { isValidId } = require('../utils/idUtils');

const getAllAddresses = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findByPk(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const shippingAddresses = Array.isArray(user.shippingAddresses) ? user.shippingAddresses : [];
    const addresses = shippingAddresses.map(address => ({
      id: address.id || address._id,
      name: address.contactName || address.name,
      phone: address.contactPhone || address.phone,
      address: address.addressLine1 || address.address,
      city: address.city,
      state: address.state,
      pincode: address.postalCode || address.pincode,
      country: address.country || 'India',
      isDefault: Boolean(address.isDefault),
      label: address.label || 'Home'
    }));

    return successResponse(res, 200, 'Addresses fetched successfully', { addresses });
  } catch (error) {
    return errorResponse(res, 500, 'Error fetching addresses', error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, address, city, state, pincode, country = 'India', isDefault, label = 'Home' } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return errorResponse(res, 400, 'All fields are required');
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const shippingAddresses = Array.isArray(user.shippingAddresses) ? [...user.shippingAddresses] : [];
    const newId = Date.now().toString();

    const newAddress = {
      id: newId,
      _id: newId,
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

    if (isDefault || shippingAddresses.length === 0) {
      shippingAddresses.forEach(addr => {
        addr.isDefault = false;
      });
      newAddress.isDefault = true;
    }

    shippingAddresses.push(newAddress);
    await user.update({ shippingAddresses });

    const formattedAddress = {
      id: newId,
      name: newAddress.contactName,
      phone: newAddress.contactPhone,
      address: newAddress.addressLine1,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.postalCode,
      country: newAddress.country,
      isDefault: newAddress.isDefault,
      label: newAddress.label
    };

    return successResponse(res, 201, 'Address added successfully', { address: formattedAddress });
  } catch (error) {
    return errorResponse(res, 500, 'Error adding address', error.message);
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const addressId = req.params.id;

    if (!isValidId(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    const { name, phone, address, city, state, pincode, country, isDefault, label } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return errorResponse(res, 400, 'All fields are required');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const shippingAddresses = Array.isArray(user.shippingAddresses) ? [...user.shippingAddresses] : [];
    const addressIndex = shippingAddresses.findIndex(
      addr => String(addr.id || addr._id) === String(addressId)
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    shippingAddresses[addressIndex].contactName = name;
    shippingAddresses[addressIndex].contactPhone = phone;
    shippingAddresses[addressIndex].addressLine1 = address;
    shippingAddresses[addressIndex].city = city;
    shippingAddresses[addressIndex].state = state;
    shippingAddresses[addressIndex].postalCode = pincode;
    if (country) shippingAddresses[addressIndex].country = country;
    if (label) shippingAddresses[addressIndex].label = label;

    if (isDefault) {
      shippingAddresses.forEach((addr, idx) => {
        shippingAddresses[idx].isDefault = idx === addressIndex;
      });
    }

    await user.update({ shippingAddresses });

    const updatedAddress = {
      id: addressId,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: Boolean(shippingAddresses[addressIndex].isDefault),
      label: label || 'Home'
    };

    return successResponse(res, 200, 'Address updated successfully', { address: updatedAddress });
  } catch (error) {
    return errorResponse(res, 500, 'Error updating address', error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const addressId = req.params.id;

    if (!isValidId(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    let shippingAddresses = Array.isArray(user.shippingAddresses) ? [...user.shippingAddresses] : [];
    const addressIndex = shippingAddresses.findIndex(
      addr => String(addr.id || addr._id) === String(addressId)
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    const wasDefault = shippingAddresses[addressIndex].isDefault;
    shippingAddresses.splice(addressIndex, 1);

    if (wasDefault && shippingAddresses.length > 0) {
      shippingAddresses[0].isDefault = true;
    }

    await user.update({ shippingAddresses });

    return successResponse(res, 200, 'Address deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Error deleting address', error.message);
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const addressId = req.params.id;

    if (!isValidId(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const shippingAddresses = Array.isArray(user.shippingAddresses) ? [...user.shippingAddresses] : [];
    const addressIndex = shippingAddresses.findIndex(
      addr => String(addr.id || addr._id) === String(addressId)
    );

    if (addressIndex === -1) {
      return errorResponse(res, 404, 'Address not found');
    }

    shippingAddresses.forEach((addr, idx) => {
      shippingAddresses[idx].isDefault = idx === addressIndex;
    });

    await user.update({ shippingAddresses });

    return successResponse(res, 200, 'Default address set successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Error setting default address', error.message);
  }
};

const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const addressId = req.params.id;

    if (!isValidId(addressId)) {
      return errorResponse(res, 400, 'Invalid address ID');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const shippingAddresses = Array.isArray(user.shippingAddresses) ? user.shippingAddresses : [];
    const address = shippingAddresses.find(
      addr => String(addr.id || addr._id) === String(addressId)
    );

    if (!address) {
      return errorResponse(res, 404, 'Address not found');
    }

    const formattedAddress = {
      id: addressId,
      name: address.contactName || address.name,
      phone: address.contactPhone || address.phone,
      address: address.addressLine1 || address.address,
      city: address.city,
      state: address.state,
      pincode: address.postalCode || address.pincode,
      country: address.country || 'India',
      isDefault: Boolean(address.isDefault),
      label: address.label || 'Home'
    };

    return successResponse(res, 200, 'Address fetched successfully', { address: formattedAddress });
  } catch (error) {
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
