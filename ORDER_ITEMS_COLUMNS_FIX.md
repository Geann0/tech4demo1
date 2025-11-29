# 🔧 Fix: Missing order_items Columns

## Problem

When adding products to an order (checkout), the system fails with:

```
Erro ao adicionar produtos ao pedido: Could not find the 'partner_amount' column of 'order_items' in the schema cache
```

This happens because the `order_items` table is missing the following columns:

- `partner_amount` - Value the partner receives (92.5% of item total)
- `platform_fee` - Platform fee (7.5% of item total)
- `platform_fee_rate` - Fee percentage (default 7.5%)
- `quantity` - Number of items
- `price_at_purchase` - Unit price at time of purchase

## Root Cause

The `order_items` table was created with only basic columns (id, created_at, updated_at) but the application code is trying to insert additional columns that don't exist in the schema.

## Solution

### Step 1: Run the Migration in Supabase

1. **Open Supabase Dashboard** → SQL Editor
2. **Create a new query** and paste the contents of:
   ```
   database_migrations/add_missing_order_items_columns.sql
   ```
3. **Run the query**
4. **Wait for completion** (should be instant)

### Step 2: Verify the Columns

Run this verification query in Supabase SQL Editor:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
```

**Expected columns:**

- ✅ id (uuid)
- ✅ order_id (uuid)
- ✅ product_id (uuid)
- ✅ quantity (integer)
- ✅ price_at_purchase (numeric)
- ✅ partner_amount (numeric)
- ✅ platform_fee (numeric)
- ✅ platform_fee_rate (numeric)
- ✅ created_at (timestamp)
- ✅ updated_at (timestamp)

## What Changed

### Database Schema

```sql
ALTER TABLE order_items
ADD COLUMN quantity INT DEFAULT 1;
ADD COLUMN price_at_purchase DECIMAL(10,2);
ADD COLUMN partner_amount DECIMAL(10,2);
ADD COLUMN platform_fee DECIMAL(10,2);
ADD COLUMN platform_fee_rate DECIMAL(5,2) DEFAULT 7.5;
```

### Why These Columns Matter

| Column              | Purpose                  | Example                       |
| ------------------- | ------------------------ | ----------------------------- |
| `quantity`          | Number of items ordered  | 2 units                       |
| `price_at_purchase` | Unit price at checkout   | R$ 99.90                      |
| `partner_amount`    | Partner's share (92.5%)  | R$ 184.74 for R$ 199.80 total |
| `platform_fee`      | Tech4Loop's share (7.5%) | R$ 15.06 for R$ 199.80 total  |
| `platform_fee_rate` | Fee percentage           | 7.5%                          |

### Fee Calculation Example

For an item with total value of R$ 199.80 (2 × R$ 99.90):

```
Total:           R$ 199.80
Partner (92.5%): R$ 184.74  ← inserted in partner_amount
Platform (7.5%): R$  15.06  ← inserted in platform_fee
```

## Testing

After applying the migration:

1. **Go to the product page** → http://localhost:3001/produtos
2. **Click on a product**
3. **Click "Adicionar ao Carrinho"**
4. **Complete checkout** with payment
5. **Verify success** - No more schema cache errors ✅

## Files Modified

- **database_migrations/add_missing_order_items_columns.sql** - NEW
  - Migration file with all column additions
  - Includes indexes for performance

## Next Steps

1. ✅ Run migration in Supabase
2. ✅ Verify columns exist
3. ✅ Test checkout flow
4. ✅ Monitor console for errors
5. ✅ Verify partner_amount and platform_fee are calculated correctly

## Rollback (if needed)

If you need to revert this migration:

```sql
ALTER TABLE order_items
DROP COLUMN IF EXISTS quantity,
DROP COLUMN IF EXISTS price_at_purchase,
DROP COLUMN IF EXISTS partner_amount,
DROP COLUMN IF EXISTS platform_fee,
DROP COLUMN IF EXISTS platform_fee_rate;

DROP INDEX IF EXISTS idx_order_items_partner_amount;
DROP INDEX IF EXISTS idx_order_items_platform_fee;
```

## Related Code

### Checkout Code (src/app/checkout/cartActions.ts)

The code that tries to insert these values:

```typescript
const orderItems = cart.items.map((item) => {
  const itemTotal = item.product_price * item.quantity;
  const partnerAmount =
    Math.round(((itemTotal * (100 - platformFeeRate)) / 100) * 100) / 100;
  const platformFee =
    Math.round(((itemTotal * platformFeeRate) / 100) * 100) / 100;

  return {
    order_id: orderData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.product_price,
    partner_amount: partnerAmount, // ← These columns
    platform_fee: platformFee, // ← were missing
    platform_fee_rate: platformFeeRate, // ← from the table
  };
});
```

## Summary

This is a simple schema alignment fix - the application code was already calculating and trying to insert partner fees, but the database table wasn't prepared to receive these values. Running the migration adds the necessary columns and indexes to support the complete payment flow.

**Status:** Ready for deployment ✅
