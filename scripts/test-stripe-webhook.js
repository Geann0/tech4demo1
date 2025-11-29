#!/usr/bin/env node

/**
 * Local Webhook Tester for Stripe
 * Sends test webhook events to your local server
 * 
 * Usage: node scripts/test-stripe-webhook.js [event_type]
 * Example: node scripts/test-stripe-webhook.js payment_intent.succeeded
 */

import Stripe from 'stripe';
import crypto from 'crypto';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_local';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/payments/stripe-webhook';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not set in .env.local');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

/**
 * Create a test payment intent and send webhook
 */
async function testPaymentSucceeded() {
  try {
    console.log('📝 Creating test payment intent...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 99900, // R$ 999.00
      currency: 'brl',
      description: 'Test Order #001',
      statement_descriptor: 'TECH4LOOP TEST',
      metadata: {
        order_id: 'test-order-001',
        user_id: 'test-user-001',
      },
    });

    console.log('✅ Payment Intent Created:', paymentIntent.id);
    console.log('   Amount: R$ ' + (paymentIntent.amount / 100).toFixed(2));
    console.log('   Status: ' + paymentIntent.status);

    // Create a test webhook event
    const event = {
      id: 'evt_' + crypto.randomBytes(16).toString('hex'),
      object: 'event',
      api_version: '2025-11-17.clover',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: paymentIntent,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded',
    };

    // Sign the event
    const timestamp = Math.floor(Date.now() / 1000);
    const signedContent = `${timestamp}.${JSON.stringify(event)}`;
    const signature = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET.replace('whsec_test_', '').slice(0, 32))
      .update(signedContent)
      .digest('hex');
    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log('\n📤 Sending webhook to:', WEBHOOK_URL);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: JSON.stringify(event),
    });

    console.log('Response Status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('\n✅ Webhook sent successfully!');
      console.log('💡 Check your database to see if the order was created');
    } else {
      console.log('\n❌ Webhook returned error');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Create a failed payment test
 */
async function testPaymentFailed() {
  try {
    console.log('📝 Creating test failed payment intent...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50000, // R$ 500.00
      currency: 'brl',
      description: 'Test Failed Order #002',
      payment_method: 'pm_card_visa_chargeCustomerFail', // This will fail
      confirm: true,
    }).catch(err => {
      // Expected to fail, just create intent without confirming
      return stripe.paymentIntents.create({
        amount: 50000,
        currency: 'brl',
        description: 'Test Failed Order #002',
        metadata: {
          order_id: 'test-order-002',
        },
      });
    });

    console.log('✅ Payment Intent Created:', paymentIntent.id);

    // Create event
    const event = {
      id: 'evt_' + crypto.randomBytes(16).toString('hex'),
      object: 'event',
      type: 'payment_intent.payment_failed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          ...paymentIntent,
          status: 'requires_payment_method',
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined',
            type: 'card_error',
          },
        },
      },
    };

    const timestamp = Math.floor(Date.now() / 1000);
    const signedContent = `${timestamp}.${JSON.stringify(event)}`;
    const signature = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET.replace('whsec_test_', '').slice(0, 32))
      .update(signedContent)
      .digest('hex');
    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log('\n📤 Sending failed payment webhook...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: JSON.stringify(event),
    });

    console.log('Response Status:', response.status);
    console.log('\n✅ Failed payment webhook sent!');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Main function
 */
async function main() {
  const eventType = process.argv[2] || 'payment_intent.succeeded';

  console.log('🔔 Stripe Local Webhook Tester\n');
  console.log('Event Type:', eventType);
  console.log('Webhook Secret:', STRIPE_WEBHOOK_SECRET);
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('---\n');

  switch (eventType) {
    case 'payment_intent.succeeded':
      await testPaymentSucceeded();
      break;
    case 'payment_intent.payment_failed':
      await testPaymentFailed();
      break;
    default:
      console.log('❌ Unknown event type:', eventType);
      console.log('\nSupported events:');
      console.log('  - payment_intent.succeeded');
      console.log('  - payment_intent.payment_failed');
      process.exit(1);
  }
}

main();
