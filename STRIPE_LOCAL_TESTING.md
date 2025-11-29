# Stripe Local Testing Guide

## Current Status ✅

- Dev server: **Running on localhost:3000**
- Stripe integration: **Ready**
- Webhook endpoint: **http://localhost:3000/api/payments/stripe-webhook**
- Environment: **Stripe Test Mode**

## Option 1: Use Stripe Dashboard Test Mode (Recommended)

### 1. Use Test Card Numbers

Test payments in your app using these card numbers:

**Successful payment:**

- Card: `4242 4242 4242 4242`
- Expiry: `12/25` (any future date)
- CVC: `123` (any 3 digits)

**Payment that requires authentication:**

- Card: `4000 0027 6000 3184`
- Expiry: `12/25`
- CVC: `123`

**Payment that will be declined:**

- Card: `4000 0000 0000 0002`
- Expiry: `12/25`
- CVC: `123`

### 2. Trigger Test Webhooks from Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint" if not already created
3. Enter: `http://localhost:3000/api/payments/stripe-webhook`
4. Select events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
5. To test: Click on the endpoint → "Send a test webhook" → Select event type

### 3. Monitor Webhooks

- Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
- View all webhook events and responses

---

## Option 2: Install Stripe CLI (Alternative)

### Windows Installation (Manual)

1. Download: https://github.com/stripe/stripe-cli/releases/download/v1.18.0/stripe_1.18.0_windows_x86_64.zip

2. Extract to: `C:\stripe-cli\`

3. Add to PATH:

   ```powershell
   $env:PATH += ";C:\stripe-cli"
   ```

4. Verify installation:

   ```powershell
   stripe --version
   ```

5. Login to Stripe:

   ```powershell
   stripe login
   ```

   This will open a browser and ask for API key. Paste your test key when prompted.

6. Start listening to webhooks:

   ```powershell
   stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
   ```

7. You'll get a webhook signing secret. Copy it and add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

---

## Option 3: Local Testing Script

Create `scripts/test-webhook.js`:

```javascript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

async function testWebhook() {
  try {
    // Create a test payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: "brl",
      payment_method: "pm_card_visa", // Test payment method
      confirm: true,
    });

    console.log("✅ Payment Intent Created:", paymentIntent.id);
    console.log("Status:", paymentIntent.status);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testWebhook();
```

Run: `node scripts/test-webhook.js`

---

## Testing Checklist

### 1. Login/Register

- [ ] Register new account with email
- [ ] Login with credentials
- [ ] Test "Remember me"

### 2. Product Purchase

- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete payment

### 3. Verify Payment

- Check Stripe Dashboard: https://dashboard.stripe.com/test/payments
- Look for Payment Intent with status: `succeeded`
- Check database: Should have order with payment_status = 'paid'

### 4. Verify Email Notifications

- Confirmation email should be sent to the registered email
- Check Resend Dashboard: https://dashboard.resend.com
- Verify email in database: `email_logs` table

### 5. Partner Commission

- If product has partner, check `partner_sales` table
- Status should be: `pending_payout`
- Commission should be: `(amount * commission_percentage) / 100`

---

## Common Issues

### Issue: Webhook not triggering

**Solution:**

- Ensure env var `STRIPE_WEBHOOK_SECRET` is set correctly
- Check `.env.local` has the secret from `stripe listen` output
- Restart dev server after updating `.env.local`

### Issue: Payment succeeds but order not created

**Solution:**

- Check database connection: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check server logs in terminal
- Verify webhook endpoint is accessible

### Issue: Email not sent

**Solution:**

- Check Resend API key: `RESEND_API_KEY`
- Check dashboard: https://dashboard.resend.com
- Verify email address is in allowlist (if not in production)

---

## Quick Start Commands

```powershell
# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run local production build
npm run build && npm start
```

---

## Useful Links

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Test Mode: https://dashboard.stripe.com/test/dashboard
- Stripe Webhooks: https://dashboard.stripe.com/test/webhooks
- Resend Dashboard: https://dashboard.resend.com
- Supabase Dashboard: https://app.supabase.com

---

## Next Steps

1. ✅ Start dev server: `npm run dev`
2. Open: http://localhost:3000
3. Test payment with card: `4242 4242 4242 4242`
4. Verify order in dashboard
5. Check webhook in Stripe Dashboard
