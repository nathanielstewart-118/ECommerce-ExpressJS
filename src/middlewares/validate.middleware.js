const Joi = require('joi');
const { BadRequestError } = require('../utils');
const { helpers } = require('../utils');

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi schema with body, query, params keys
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = helpers.pick(schema, ['params', 'query', 'body']);
  const object = helpers.pick(req, Object.keys(validSchema));

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
    }));
    
    return next(new BadRequestError(errorMessage));
  }

  // Replace req values with validated values
  Object.assign(req, value);
  return next();
};

module.exports = validate;
