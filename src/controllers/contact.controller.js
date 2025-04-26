const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');

const { Contact } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new contact submission
const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return errorResponse(res, 400, "All fields are required.");
    }

    const contactData = { name, email, message };
    const contact = await create(Contact, contactData);

    return successResponse(res, 201, messages.CONTACT_SUBMITTED, { contact });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get all contact submissions
const getAllContacts = async (req, res) => {
  try {
    const contacts = await findMany(Contact);

    if (!contacts.length) {
      return successResponse(res, 200, messages.CONTACTS_NOT_FOUND, { contacts });
    }

    return successResponse(res, 200, messages.CONTACTS_RETRIEVED, { contacts });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get a single contact submission by ID
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await findOne(Contact, { _id: id });

    if (!contact) {
      return errorResponse(res, 404, messages.CONTACT_NOT_FOUND);
    }

    return successResponse(res, 200, messages.CONTACT_RETRIEVED, { contact });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Resolved'].includes(status)) {
      return errorResponse(res, 400, "Invalid status value.");
    }

    const contact = await findAndUpdate(Contact, { _id: id }, { status });

    if (!contact) {
      return errorResponse(res, 404, messages.CONTACT_NOT_FOUND);
    }

    return successResponse(res, 200, messages.CONTACT_STATUS_UPDATED, { contact });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Delete a contact submission
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteOne(Contact, { _id: id });

    if (result.deletedCount === 0) {
      return errorResponse(res, 404, messages.CONTACT_NOT_FOUND);
    }

    return successResponse(res, 200, messages.CONTACT_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
