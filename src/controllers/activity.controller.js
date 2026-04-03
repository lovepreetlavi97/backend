const SuspiciousActivity = require('../models/suspiciousActivity.model');
const { successResponse, errorResponse } = require('../utils/responseUtil');

/**
 * Admin: Get all security alerts
 */
const getAllActivities = async (req, res) => {
    try {
        const { type, severity, isResolved } = req.query;
        const query = {};
        if (type) query.activityType = type;
        if (severity) query.severity = severity;
        if (isResolved !== undefined) query.isResolved = isResolved === 'true';

        const activities = await SuspiciousActivity.find(query)
            .populate('userId', 'name phoneNumber email')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, "Security activities retrieved", activities);
    } catch (error) {
        return errorResponse(res, 500, "Error fetching activities");
    }
};

/**
 * Admin: Resolve alert
 */
const resolveActivity = async (req, res) => {
    try {
        const activity = await SuspiciousActivity.findByIdAndUpdate(
            req.params.id,
            { isResolved: true },
            { new: true }
        );

        if (!activity) return errorResponse(res, 404, "Alert not found");

        return successResponse(res, 200, "Alert marked as resolved", activity);
    } catch (error) {
        return errorResponse(res, 500, "Error updating activity");
    }
};

module.exports = {
    getAllActivities,
    resolveActivity
};
