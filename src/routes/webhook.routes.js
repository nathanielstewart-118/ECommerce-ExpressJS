const express = require('express');
const { stripeService } = require('../services');
const { Order } = require('../models');
const { logger } = require('../config');

const router = express.Router();

/**
 * @route   POST /api/v1/webhooks/stripe
 * @desc    Handle Stripe webhooks
 * @access  Public (Stripe signature verified)
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err) {
      logger.error(`Stripe webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.type, event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'succeeded',
        'payment.stripeChargeId': paymentIntent.latest_charge,
        'payment.paidAt': new Date(),
        status: 'confirmed',
      });

      logger.info(`Payment succeeded for order: ${orderId}`);
    }
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'failed',
        status: 'pending',
      });

      logger.info(`Payment failed for order: ${orderId}`);
    }
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  try {
    const order = await Order.findOne({ 'payment.stripeChargeId': charge.id });

    if (order) {
      const isPartialRefund = charge.amount_refunded < charge.amount;

      await Order.findByIdAndUpdate(order._id, {
        'payment.status': isPartialRefund ? 'partially_refunded' : 'refunded',
        status: isPartialRefund ? order.status : 'refunded',
      });

      logger.info(`Refund processed for order: ${order._id}`);
    }
  } catch (error) {
    logger.error('Error handling refund:', error);
  }
}

/**
 * Handle checkout session complete
 */
async function handleCheckoutComplete(session) {
  try {
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'succeeded',
        'payment.paidAt': new Date(),
        status: 'confirmed',
      });

      logger.info(`Checkout completed for order: ${orderId}`);
    }
  } catch (error) {
    logger.error('Error handling checkout complete:', error);
  }
}

/**
 * Handle subscription events
 */
async function handleSubscriptionEvent(eventType, subscription) {
  try {
    logger.info(`Subscription event: ${eventType}`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    // Add your subscription handling logic here
  } catch (error) {
    logger.error('Error handling subscription event:', error);
  }
}

module.exports = router;
