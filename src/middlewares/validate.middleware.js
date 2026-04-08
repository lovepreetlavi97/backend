const Joi = require('joi');
const { errorResponse } = require('../utils/responseUtil');

const validate = (schema) => (req, res, next) => {
  const { value, error } = Joi.compile(schema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(req.body);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return errorResponse(res, 400, errorMessage);
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;
