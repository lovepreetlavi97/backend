
/**
 * @description - This class is used for the the Creating error instances
 * @constructor - This constructor is used to intialise the GeneralError instance with the messag and error Object
 * @example -
 */

class GeneralError extends Error {
  constructor(message, error) {
    super();
    this.message = message;
    if (error) {
      this.errorObj = error;
    }
  }

  getCode() {
    if (this instanceof BadRequest) {
      return 400;
    }
    if (this instanceof NotFound) {
      return 404;
    }

    if (this instanceof Unauthorized) {
      return 401;
    }

    if (this instanceof ValidationFailure) {
      return 422;
    }

    return 500;
  }
}

/*** @description - This class is used for the the Bad request  */

class BadRequest extends GeneralError {}

/*** @description - This class is used for the the Unauthorized  */

class Unauthorized extends GeneralError {}

/*** @description - This class is used for the the NotFound  */

class NotFound extends GeneralError {}

/*** @description - This class is used for the the Validation Failuret  */

class ValidationFailure extends GeneralError {}

module.exports = {
  GeneralError,
  Unauthorized,
  BadRequest,
  NotFound,
  ValidationFailure,
};
