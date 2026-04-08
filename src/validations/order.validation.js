const Joi = require('joi');

const createOrderSchema = {
  products: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    addressLine1: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    contactName: Joi.string().required(),
    contactPhone: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('COD', 'ONLINE', 'UPI').required(),
  promoCode: Joi.string().allow('', null),
  idempotencyKey: Joi.string().guid({ version: 'uuidv4' }),
  guestEmail: Joi.string().email().when('userId', { is: Joi.not().exist(), then: Joi.required() }),
};

const updateOrderStatusSchema = {
  status: Joi.string().valid(
    'Pending', 'Processing', 'Confirmed', 'Shipped', 
    'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'
  ).required()
};

const updatePaymentStatusSchema = {
  paymentStatus: Joi.string().valid('Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded').required(),
  transactionId: Joi.string().allow('', null),
  paymentDetails: Joi.object().allow(null)
};

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema
};
