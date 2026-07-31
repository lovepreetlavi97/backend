const { DesignRequest } = require('../models/index');
const { create, findOne, findMany, findAndUpdate } = require('../services/mysql/mysqlService');
const { uploadToSpaces, getPublicUrl } = require('../middlewares/uploadMiddleware');
const { successResponse, errorResponse } = require('../utils/responseUtil');

/**
 * User: Create a new custom design request
 */
const createDesignRequest = async (req, res) => {
    try {
        const { name, contact, description } = req.body;
        const file = req.file;

        if (!name || !contact) {
            return errorResponse(res, 400, "Name and contact info are required");
        }
        if (!file) {
            return errorResponse(res, 400, "Design image is required");
        }

        // 1. Upload logic (Reuse existing Spaces setup)
        const key = await uploadToSpaces(file.buffer, file.originalname, file.mimetype, 'design-requests');
        const imageUrl = getPublicUrl(key);

        // 2. Database save
        const newRequest = await create(DesignRequest, {
            userId: req.user ? req.user.id : null, 
            name,
            email: contact,
            phone: contact,
            contact,
            description,
            imageUrl,
            referenceImages: [imageUrl],
            status: 'pending'
        });

        return successResponse(res, 201, "Design request submitted successfully", newRequest);
    } catch (error) {

        return errorResponse(res, 500, "Failed to submit request", { error: error.message });
    }
};

/**
 * Admin: List all requests (with filter)
 */
const getAllDesignRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const requests = await findMany(DesignRequest, query, null, { sort: { createdAt: -1 } });
        return successResponse(res, 200, "Design requests retrieved", requests);
    } catch (error) {
        return errorResponse(res, 500, "Error fetching requests");
    }
};

/**
 * Admin: Get single details
 */
const getDesignRequestById = async (req, res) => {
    try {
        const request = await findOne(DesignRequest, { id: req.params.id });
        if (!request) return errorResponse(res, 404, "Request not found");
        return successResponse(res, 200, "Request details", request);
    } catch (error) {
        return errorResponse(res, 500, "Error fetching details");
    }
};

/**
 * Admin: Update status or notes
 */
const updateDesignRequestStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const request = await findAndUpdate(
            DesignRequest, 
            { id: req.params.id }, 
            updateData
        );

        if (!request) return errorResponse(res, 404, "Request not found");

        return successResponse(res, 200, "Request updated successfully", request);
    } catch (error) {
        return errorResponse(res, 500, "Error updating status");
    }
};

module.exports = {
    createDesignRequest,
    getAllDesignRequests,
    getDesignRequestById,
    updateDesignRequestStatus
};
