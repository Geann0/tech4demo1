# 🧪 CHECKOUT FLOW - TESTING GUIDE

## Test Instructions

### ✅ Test 1: Navigate to Products Page

1. **URL:** http://localhost:3001/produtos
2. **Expected:** Product listing page loads with all products visible
3. **Verify:** No console errors about missing columns

### ✅ Test 2: Add Single Product to Cart

1. **Click** on any product card
2. **On product detail page:**
   - ✅ Verify product info displays correctly
   - ✅ Verify images load without errors
3. **Click "Adicionar ao Carrinho"**
4. **Expected result:**
   - ✅ Product added to cart
   - ✅ No "schema cache" error in console
   - ✅ Cart notification appears

### ✅ Test 3: View Cart

1. **Click "Ir para Carrinho"** (if button appears)
2. Or **Navigate to:** http://localhost:3001/checkout
3. **Verify:**
   - ✅ Cart items display correctly
   - ✅ Quantities show correctly
   - ✅ Prices calculated correctly

### ✅ Test 4: Complete Checkout

1. **On checkout page, click "Continuar com Checkout"**
2. **Fill in customer details:**
   - Name: `João Silva`
   - Email: `joao@example.com`
   - Phone: `11999999999`
   - CEP: `01310100`
   - Address: `Av. Paulista, 1000`
   - City: `São Paulo`
   - State: `SP`
3. **Click "Confirmar Pedido"**
4. **Expected behavior:**
   - ✅ Order created without errors
   - ✅ No "partner_amount column not found" error
   - ✅ Redirects to payment page

### ✅ Test 5: Verify Database

After completing checkout, check Supabase:

1. **Open Supabase Dashboard**
2. **Navigate to:** Table Editor → `order_items`
3. **Find your recent order item**
4. **Verify these columns are populated:**
   - ✅ `quantity` - should be `1` or more
   - ✅ `price_at_purchase` - should show product price (e.g., `99.90`)
   - ✅ `partner_amount` - should show 92.5% of total
   - ✅ `platform_fee` - should show 7.5% of total
   - ✅ `platform_fee_rate` - should be `7.5`

### Example Order Item Data

For a product costing R$ 99.90 with quantity 1:

```
id:                   [uuid]
order_id:             [uuid of parent order]
product_id:           [uuid of product]
quantity:             1
price_at_purchase:    99.90
partner_amount:       92.41       (99.90 × 0.925)
platform_fee:         7.49        (99.90 × 0.075)
platform_fee_rate:    7.5
created_at:           2025-11-29 [timestamp]
updated_at:           2025-11-29 [timestamp]
```

---

## Console Errors to Watch For

### ❌ BAD - Schema Error (This is what we fixed)
```
Erro ao adicionar produtos ao pedido: Could not find the 'partner_amount' column of 'order_items' in the schema cache
```

### ✅ GOOD - No Schema Errors
Console should be clean when adding products

---

## Troubleshooting

### If you still see the schema error:

1. **Clear browser cache:**
   - Press F12 → Application → Clear storage
   
2. **Restart Next.js dev server:**
   ```bash
   # Stop: Ctrl+C
   # Clear cache:
   rm -r .next
   # Restart:
   npm run dev
   ```

3. **Verify migration in Supabase:**
   - Check that the SQL was executed without errors
   - Run: `SELECT COUNT(*) FROM order_items;` to verify table exists

### If prices look wrong:

1. Check that `price_at_purchase` matches product price
2. Verify calculation: `partner_amount = price × quantity × 0.925`
3. Check console logs for calculation details

---

## Quick Test Scenario

**Total Time: ~5 minutes**

```
Step 1: Open http://localhost:3001/produtos (30 sec)
Step 2: Click a product (30 sec)
Step 3: Click "Adicionar ao Carrinho" (30 sec)
Step 4: Go to checkout (30 sec)
Step 5: Fill in details (2 min)
Step 6: Click "Confirmar Pedido" (30 sec)
Step 7: Check console for errors (30 sec)
Step 8: Verify in Supabase (1 min)

TOTAL: ~5 minutes ✅
```

---

## What to Report Back

After testing, please provide:

1. ✅ Did checkout complete without "schema cache" errors?
2. ✅ Did the order get created in Supabase?
3. ✅ Are the partner_amount and platform_fee populated correctly?
4. ✅ Any other errors in the console?

**Status: READY FOR TESTING** 🚀
