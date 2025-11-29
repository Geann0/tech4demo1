-- ============================================================
-- Migration: Payment and Partner System Tables
-- Purpose: Create necessary tables for payment processing, 
--          partner commissions, email verification, and auditing
-- ============================================================

-- 1. Partner Sales Table (tracks commissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL COMMENT 'Amount in BRL cents',
  commission INTEGER NOT NULL COMMENT 'Commission in BRL cents (typically 10% of amount)',
  status TEXT DEFAULT 'pending_payout' CHECK (status IN ('pending_payout', 'completed', 'payout_processed', 'refunded')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_partner_sales_partner_id ON partner_sales(partner_id);
CREATE INDEX idx_partner_sales_order_id ON partner_sales(order_id);
CREATE INDEX idx_partner_sales_status ON partner_sales(status);
CREATE INDEX idx_partner_sales_created_at ON partner_sales(created_at DESC);

-- 2. Partner Payouts Table (tracks withdrawal requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL COMMENT 'Payout amount in BRL cents',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  date_from DATE NOT NULL COMMENT 'Start date of commission period',
  date_to DATE NOT NULL COMMENT 'End date of commission period',
  notes TEXT,
  bank_account_id UUID,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX idx_partner_payouts_created_at ON partner_payouts(created_at DESC);

-- 3. Email Verification Tokens Table
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL COMMENT 'Token expires after 24 hours',
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- 4. Email Logs Table (audit trail for all emails sent)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL COMMENT 'Type: confirmation, order, tracking, shipment, partner_sale',
  recipient TEXT NOT NULL COMMENT 'Email address',
  status TEXT CHECK (status IN ('sent', 'failed', 'bounced', 'complained')),
  message_id TEXT COMMENT 'Resend message ID for reference',
  error_message TEXT,
  metadata JSONB COMMENT 'Additional data like order_id, user_id, etc',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- 5. Audit Logs Table (tracks important transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL COMMENT 'Action type: payment_received, payment_failed, payout_created, etc',
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES partners(id),
  details JSONB COMMENT 'Additional context as JSON',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_partner_id ON audit_logs(partner_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- ALTER EXISTING TABLES
-- ============================================================

-- Add payment-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_intent_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT COMMENT 'credit_card, pix, boleto, etc';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error_message TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount INTEGER COMMENT 'Amount refunded in cents';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Create index on payment_status for efficient queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent_id ON orders(stripe_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at DESC);

-- Add email verification columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- ============================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================

-- Partner Sales: Users can only see their own partner's sales
ALTER TABLE partner_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own sales"
  ON partner_sales FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id = auth.uid()
    )
  );

-- Partner Payouts: Users can only see their own payouts
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own payouts"
  ON partner_payouts FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id = auth.uid()
    )
  );

-- Email Verification Tokens: No direct public access needed
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Email Logs: Only accessible by system
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs: Only accessible by system and admins
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Informational Comments
-- ============================================================

COMMENT ON TABLE partner_sales IS 'Tracks individual product sales by partners with commission amounts. Used to calculate partner earnings and payout eligibility.';
COMMENT ON TABLE partner_payouts IS 'Records payout requests from partners. Status tracks: pending (requested), processing (being transferred), completed (received), failed (rejected).';
COMMENT ON TABLE email_verification_tokens IS 'Temporary tokens for email verification during signup. Each token is valid for 24 hours and deleted after use.';
COMMENT ON TABLE email_logs IS 'Audit trail of all transactional emails sent (confirmations, orders, tracking, etc). Used for debugging delivery issues.';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of important business transactions and events for compliance and debugging.';

-- ============================================================
-- Success Message
-- ============================================================
-- All tables created successfully!
-- Next steps:
-- 1. Update src/app/api endpoints to use these tables
-- 2. Configure .env.local with Stripe and Resend keys
-- 3. Test payment flow with Stripe test cards
-- 4. Verify email sending with Resend
