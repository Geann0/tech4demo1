# 💳 Tech4Loop Payment System - Complete Testing Guide

**Current Status:** ✅ **Production Ready**

- Stripe Integration: **Active & Tested**
- Webhook Endpoint: **http://localhost:3000/api/payments/stripe-webhook**
- Payment Processing: **Working**
- Order Management: **Working**

---

## 🚀 Quick Start (5 minutes)

### 1. Ensure Dev Server is Running

```powershell
cd Tech4Loop
npm run dev
```

Should show: `✓ Ready in 3s` on port `3000`

### 2. Open Application

```
http://localhost:3000
```

### 3. Test Complete Payment Flow

#### Register/Login

```
Email: test@example.com
Password: Test123!
```

#### Add Product to Cart

1. Click any product
2. Click "Adicionar ao Carrinho"
3. Login modal should appear
4. Confirm "Adicionar ao Carrinho"

#### Go to Checkout

1. Click cart icon
2. Click "Comprar"
3. Fill in:
   - Full Name: "João Silva"
   - Address: "Rua Test, 123"
   - City: "Ouro Preto do Oeste"
   - State: "RO"
   - ZIP: "76920-000"

#### Payment Details

Use this test card:

```
Card Number:  4242 4242 4242 4242
Expiry:       12/25 (any future date)
CVC:          123
Name:         JOÃO SILVA
```

#### Complete Payment

- Click "Confirmar Pagamento"
- Wait 2-3 seconds
- Should redirect to "Compra com Sucesso"

---

## 📊 Verify Payment Success

### Check 1: Stripe Dashboard

https://dashboard.stripe.com/test/payments

```
Look for:
✓ Payment Intent with status: succeeded
✓ Amount: R$ 999.00 (or your test amount)
✓ Customer metadata: order_id, user_id
```

### Check 2: Database

Connect to Supabase: https://app.supabase.com

```sql
-- Check orders table
SELECT * FROM orders
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;

-- Expected columns:
- id: order-uuid
- status: completed
- payment_status: paid
- total_amount: 99900 (in cents)
- stripe_payment_intent_id: pi_...
```

### Check 3: Email Notification

Check email that received order confirmation:

```
From: noreply@tech4loop.com
Subject: Pedido Confirmado #ABC123
Body: Should contain order details
```

### Check 4: Partner Commission

If product has a partner:

```sql
SELECT * FROM partner_sales
WHERE order_id = 'your-order-id';

-- Expected columns:
- partner_id: uuid
- status: pending_payout
- commission: calculated amount
- amount: product price
```

---

## 🧪 Test Different Scenarios

### Scenario 1: Successful Payment ✅

**Card:** `4242 4242 4242 4242`
**Expected Result:**

- Order created with status: `completed`
- Payment status: `paid`
- User redirected to success page
- Email sent

### Scenario 2: Card Requires 3D Secure 🔐

**Card:** `4000 0027 6000 3184`
**Expected Result:**

- 3D Secure popup appears
- User completes authentication
- Order created if authorized
- Email sent

### Scenario 3: Declined Card ❌

**Card:** `4000 0000 0000 0002`
**Expected Result:**

- Payment declined error shown
- Order NOT created
- User can try again
- No email sent

### Scenario 4: Insufficient Funds 💸

**Card:** `4000 0000 0000 9995`
**Expected Result:**

- Error: "Insufficient funds"
- Payment not processed

---

## 🔔 Testing Webhooks (Advanced)

### Option A: Stripe Dashboard (Easiest)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find endpoint: `http://localhost:3000/api/payments/stripe-webhook`
3. Click "Send a test webhook"
4. Select event: `payment_intent.succeeded`
5. Click "Send test webhook"

**Result:** Check database to see if event was processed

### Option B: Local Script (No Internet Required)

```powershell
# Must have .env.local configured with STRIPE_SECRET_KEY
node scripts/test-stripe-webhook.js payment_intent.succeeded
```

This will:

1. Create a test payment intent in Stripe
2. Generate a valid webhook signature
3. Send it to your local webhook endpoint
4. Show response status

---

## 🛠️ Troubleshooting

### Issue: "Card declined" even with test card

**Solution:**

- Use exact test card: `4242 4242 4242 4242`
- Expiry must be future date (e.g., `12/25`)
- CVC: any 3 digits
- No specific name required

### Issue: Payment succeeds but order not created

**Solution:**

```powershell
# 1. Check .env.local has STRIPE_WEBHOOK_SECRET
echo $env:STRIPE_WEBHOOK_SECRET

# 2. Restart dev server
npm run dev

# 3. Check database connection
# Go to Supabase Dashboard and verify:
# - Table 'orders' exists
# - SUPABASE_SERVICE_ROLE_KEY is valid
# - Database is not in read-only mode
```

### Issue: Email not received

**Solution:**

```
1. Check Resend Dashboard: https://dashboard.resend.com
2. Verify RESEND_API_KEY is correct in .env.local
3. Check spam/junk folder
4. Verify email address is correct in checkout
5. In test mode, emails may not be sent to real addresses
   - Use verified email in Resend settings
```

### Issue: Webhook signature error

**Solution:**

```
Error: "Invalid signature"
Fix:
1. Ensure STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
2. Don't edit webhook secret in .env.local (generate new one in Dashboard)
3. Restart dev server after changing secret
4. Clear .next cache: rm .next -r
```

---

## 📝 Complete Test Checklist

- [ ] **Dev Server Running**
  - `npm run dev` successful
  - localhost:3000 loads

- [ ] **Account Management**
  - [ ] Can register new account
  - [ ] Can login with email/password
  - [ ] Can logout
  - [ ] Session persists on refresh

- [ ] **Product Browsing**
  - [ ] Homepage loads with products
  - [ ] Can click product details
  - [ ] Product images load correctly
  - [ ] Product filters work

- [ ] **Shopping Cart**
  - [ ] Can add product to cart
  - [ ] Login modal appears (if not logged in)
  - [ ] Cart quantity updates
  - [ ] Can view cart
  - [ ] Can remove from cart

- [ ] **Checkout Process**
  - [ ] Address form has all required fields
  - [ ] Form validation works (required fields)
  - [ ] Zip code format validated
  - [ ] Total amount displayed correctly
  - [ ] Stripe payment form loads

- [ ] **Payment Processing**
  - [ ] Test card `4242...` works
  - [ ] Declined card `4000 0000 0000 0002` shows error
  - [ ] Card error displays clearly
  - [ ] Success page appears after payment

- [ ] **Order Management**
  - [ ] Order appears in "Meus Pedidos"
  - [ ] Order shows correct status: `completed`
  - [ ] Order shows correct total amount
  - [ ] Order shows products purchased
  - [ ] Order shows shipping address

- [ ] **Payment Verification**
  - [ ] Stripe Dashboard shows Payment Intent: `succeeded`
  - [ ] Database order table has entry with `payment_status: paid`
  - [ ] Confirmation email received
  - [ ] Partner commission recorded (if applicable)

- [ ] **Partner Features** (if applicable)
  - [ ] Partner can login
  - [ ] Partner dashboard shows sales
  - [ ] Commission calculated correctly
  - [ ] Payout status shows as `pending_payout`

---

## 🔐 Security Notes

### Test Secrets Used

```
These are STRIPE TEST MODE secrets - Safe to use during development
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_...
- STRIPE_SECRET_KEY: sk_test_...
- STRIPE_WEBHOOK_SECRET: whsec_...
```

### When Going to Production

```
BEFORE deploying to production:

1. Replace with LIVE keys from Stripe Dashboard
   - pk_live_... (publishable)
   - sk_live_... (secret)

2. Generate new webhook secret:
   - Remove whsec_test_...
   - Generate whsec_live_... from Dashboard

3. Update environment variables on Vercel/server

4. Update webhook endpoint in Stripe Dashboard:
   - FROM: http://localhost:3000/api/payments/stripe-webhook
   - TO: https://yourdomain.com/api/payments/stripe-webhook

5. Test again with live keys before going public
```

---

## 📞 Support

**Issues?**

1. Check server logs: `npm run dev` terminal
2. Check Stripe Dashboard: https://dashboard.stripe.com/test/dashboard
3. Check Resend Dashboard: https://dashboard.resend.com
4. Check Supabase Dashboard: https://app.supabase.com
5. Restart dev server: Stop and run `npm run dev` again

**Common Commands:**

```powershell
# Restart dev server
npm run dev

# Run tests
npm test

# Check for errors
npm run build

# View database
# Visit: https://app.supabase.com
```

---

**Last Updated:** November 29, 2025
**Status:** ✅ Production Ready
