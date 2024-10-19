const httpStatus = require("http-status");

/**
 * @description - For checking the http status code and code names
 * https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
 *
 */
const ResponseStatus = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  FAILURE: 400,
};

Object.freeze(ResponseStatus);

/**
 * @description - This class is used for the the Api response instance
 * @constructor - This constructor is used to intialise the ApiResponse instance with the status, message and statusCode
 * @example -
 */
class ApiResponse {
  constructor(statusCode, status, message, error) {
    this.status = status;
    this.message = message;
    this.statusCode = statusCode;
    // if (error) this.error = error;
  }

  prepare(res, resp) {
    return res
      .status(this.statusCode)
      .json({ ...this, ...this.prepareJsonResponse(resp) });
  }

  prepareErrorResponse(res, resp) {
    return res.status(this.statusCode).json({ ...this });
  }
  send(res) {
    return this.prepare(res, this);
  }
  prepareJsonResponse(response) {
    const clone = {};
    Object.assign(clone, response);
    for (const i in clone) {
      if (typeof clone[i] === "undefined") {
        delete clone[i];
      }
    }
    return clone;
  }
}

class SuccessResponse extends ApiResponse {
  constructor(message = "Success", data) {
    super(httpStatus.OK, httpStatus[200], message);
    this.message = message;
    if (data) {
      this.data = data;
    }
  }
  send(res) {
    return super.prepare(res, this);
  }
}
class AuthFailureResponse extends ApiResponse {
  constructor(message = "Authentication Failure") {
    super(httpStatus.UNAUTHORIZED, httpStatus[401], message);
  }
}

class NotFoundResponse extends ApiResponse {
  constructor(message = "Not Found", data) {
    super(httpStatus.NOT_FOUND, httpStatus[404], message, data);
    this.message = message;
    // if (data) {
    //   this.data = data;
    // }
  }

  send(res) {
    return super.prepareErrorResponse(res, this);
  }
}

class ForbiddenResponse extends ApiResponse {
  constructor(message = "Forbidden") {
    super(httpStatus.FORBIDDEN, httpStatus[403], message);
  }
}

class BadRequestResponse extends ApiResponse {
  constructor(message = "Bad Parameters", data) {
    super(httpStatus.BAD_REQUEST, httpStatus[400], message, data);
    this.message = message;
    // if (data) {
    //   this.data = data;
    // }
  }
  send(res) {
    return super.prepareErrorResponse(res, this);
  }
}

class InternalErrorResponse extends ApiResponse {
  constructor(message = "Internal Error", data) {
    super(httpStatus.INTERNAL_SERVER_ERROR, httpStatus[500], message, data);
    this.message = message;
    // if (data) {
    //   this.data = data;
    // }
  }
  send(res) {
    return super.prepareErrorResponse(res, this);
  }
}

class SuccessMsgResponse extends ApiResponse {
  constructor(message) {
    super(httpStatus.OK, httpStatus[200], message);
  }
}

class FailureMsgResponse extends ApiResponse {
  constructor(message) {
    super(httpStatus.BAD_REQUEST, httpStatus[400], message);
  }
}

class AccessTokenErrorResponse extends ApiResponse {
  constructor(message = "Access Token Unauthorized", data) {
    super(httpStatus.UNAUTHORIZED, message, message, data);
    // console.log("acess token", data,message)
    this.message = data.message;
    // if (data) {
    //   this.data = data;
    // }
  }

  send(res) {
    return super.prepareErrorResponse(res, this);
  }
}

class ValidationFailureErrorResponse extends ApiResponse {
  constructor(message = "Validation Error", data) {
    super(httpStatus.UNPROCESSABLE_ENTITY, message, message, data);
    let msg = data.error
    this.message = msg[0].msg;
    // if (data) {
    //   this.data = data;
    // }
  }

  send(res) {
    return super.prepareErrorResponse(res, this);
  }
}

class TokenRefreshResponse extends ApiResponse {
  constructor(message, accessToken, refreshToken) {
    super(StatusCode.SUCCESS, httpStatus[200], message);
  }

  send(res) {
    return super.prepare(res, this);
  }
}

module.exports = {
  ApiResponse,
  SuccessResponse,
  AuthFailureResponse,
  NotFoundResponse,
  ValidationFailureErrorResponse,
  ForbiddenResponse,
  BadRequestResponse,
  InternalErrorResponse,
  SuccessMsgResponse,
  FailureMsgResponse,
  AccessTokenErrorResponse,
  TokenRefreshResponse,
};
