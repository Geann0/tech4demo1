-- ============================================
-- ADD MISSING COLUMNS TO order_items TABLE
-- ============================================
-- Purpose: Add partner_amount, platform_fee, platform_fee_rate, quantity, and price_at_purchase columns
-- This migration fixes the "Could not find the 'partner_amount' column" error
-- Date: 2025-11-29

-- Adicionar campos necessários para cálculo de taxa da plataforma
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS partner_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(5,2) DEFAULT 7.5;

-- Adicionar comentários descritivos
COMMENT ON COLUMN order_items.quantity IS 'Quantidade de itens do pedido';
COMMENT ON COLUMN order_items.price_at_purchase IS 'Preço unitário do produto no momento da compra';
COMMENT ON COLUMN order_items.partner_amount IS 'Valor que o parceiro recebe (92.5% do total do item)';
COMMENT ON COLUMN order_items.platform_fee IS 'Taxa da plataforma Tech4Loop (7.5% do total do item)';
COMMENT ON COLUMN order_items.platform_fee_rate IS 'Percentual da taxa (padrão: 7.5%)';

-- Criar índices para performance em queries de partner_amount
CREATE INDEX IF NOT EXISTS idx_order_items_partner_amount ON order_items(partner_amount);
CREATE INDEX IF NOT EXISTS idx_order_items_platform_fee ON order_items(platform_fee);

-- Verificação: Listar todas as colunas da tabela order_items
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY ordinal_position;
