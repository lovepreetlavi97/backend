const Joi = require('joi');

const validateUser = (data) => {
   const schema = Joi.object({
      username: Joi.string().min(3).required(),
   });
   return schema.validate(data);
};

module.exports = { validateUser };
