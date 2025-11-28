-- ================================================================
-- MIGRATION: Adicionar coluna payment_status
-- Data: 2025-11-19
-- Descrição: Adiciona coluna payment_status que está sendo usada
--            pelo sistema de checkout mas estava faltando no schema
-- ================================================================

-- Adicionar coluna payment_status à tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Comentário
COMMENT ON COLUMN orders.payment_status IS 'Status do pagamento: pending, approved, rejected, cancelled, refunded';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Atualizar registros existentes baseado no status do pedido
UPDATE orders
SET payment_status = 
  CASE 
    WHEN status = 'delivered' OR status = 'shipped' OR status = 'processing' THEN 'approved'
    WHEN status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END
WHERE payment_status IS NULL;

-- Adicionar constraint para valores válidos
ALTER TABLE orders
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'));
