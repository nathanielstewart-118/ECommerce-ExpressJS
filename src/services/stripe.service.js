const Stripe = require('stripe');
const { config, logger } = require('../config');
const { BadRequestError } = require('../utils');

// Initialize Stripe
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;

/**
 * Check if Stripe is configured
 */
const isConfigured = () => {
  return !!stripe;
};

/**
 * Create a Stripe customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} - Stripe customer object
 */
const createCustomer = async (customerData) => {
  if (!isConfigured()) {
    logger.warn('Stripe not configured');
    return null;
  }

  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: {
        userId: customerData.userId,
      },
    });

    logger.info(`Stripe customer created: ${customer.id}`);
    return customer;
  } catch (error) {
    logger.error('Stripe create customer error:', error);
    throw new BadRequestError('Failed to create customer');
  }
};

/**
 * Create a payment intent
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} - Payment intent object
 */
const createPaymentIntent = async (paymentData) => {
  if (!isConfigured()) {
    throw new BadRequestError('Payment service not available');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'usd',
      customer: paymentData.customerId,
      metadata: {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info(`Payment intent created: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error('Stripe payment intent error:', error);
    throw new BadRequestError('Failed to create payment intent');
  }
};

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} - Payment intent object
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  if (!isConfigured()) {
    throw new BadRequestError('Payment service not available');
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.error('Stripe retrieve payment error:', error);
    throw new BadRequestError('Failed to retrieve payment intent');
  }
};

/**
 * Create a refund
 * @param {Object} refundData - Refund data
 * @returns {Promise<Object>} - Refund object
 */
const createRefund = async (refundData) => {
  if (!isConfigured()) {
    throw new BadRequestError('Payment service not available');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: refundData.paymentIntentId,
      amount: refundData.amount ? Math.round(refundData.amount * 100) : undefined, // Full refund if no amount
      reason: refundData.reason || 'requested_by_customer',
    });

    logger.info(`Refund created: ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error('Stripe refund error:', error);
    throw new BadRequestError('Failed to create refund');
  }
};

/**
 * Construct webhook event from raw body
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} - Stripe event object
 */
const constructWebhookEvent = (rawBody, signature) => {
  if (!isConfigured()) {
    throw new BadRequestError('Payment service not available');
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    throw new BadRequestError('Webhook signature verification failed');
  }
};

/**
 * Create a checkout session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} - Checkout session object
 */
const createCheckoutSession = async (sessionData) => {
  if (!isConfigured()) {
    throw new BadRequestError('Payment service not available');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: sessionData.items.map((item) => ({
        price_data: {
          currency: sessionData.currency || 'usd',
          product_data: {
            name: item.name,
            images: item.images || [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: sessionData.successUrl,
      cancel_url: sessionData.cancelUrl,
      customer: sessionData.customerId,
      metadata: {
        orderId: sessionData.orderId,
        userId: sessionData.userId,
      },
    });

    logger.info(`Checkout session created: ${session.id}`);
    return session;
  } catch (error) {
    logger.error('Stripe checkout session error:', error);
    throw new BadRequestError('Failed to create checkout session');
  }
};

module.exports = {
  isConfigured,
  createCustomer,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund,
  constructWebhookEvent,
  createCheckoutSession,
  stripe,
};
