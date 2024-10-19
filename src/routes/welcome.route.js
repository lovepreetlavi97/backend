const express = require('express');
const router = express.Router();
const constants = require('../utils/responses/constants');
const { SuccessResponse, InternalErrorResponse } = require('../utils/responses/apiResponse');

// Welcome route
router.get('/', (req, res) => {
    try {
        const response = new SuccessResponse(constants.success.welcome);
        return res.send(response);
    } catch (error) {
        const errorResponse = new InternalErrorResponse(constants.error.internalServer);
        return errorResponse.send(res);
    }
});

module.exports = router;
