-- ================================================================
-- MIGRATION: Sistema de Confirmação de Entrega (CDC Compliance)
-- Data: 2025-11-19
-- Descrição: Implementa confirmação de entrega pelo cliente e
--            auto-confirmação após 7 dias conforme CDC
-- ================================================================

-- 1. Adicionar campos de controle de entrega
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS carrier_delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier_status VARCHAR(50);

-- 2. Comentários explicativos
COMMENT ON COLUMN orders.shipped_at IS 'Data/hora em que o pedido foi marcado como enviado pelo parceiro/admin';
COMMENT ON COLUMN orders.carrier_delivered_at IS 'Data/hora em que a TRANSPORTADORA confirmou a entrega (via API/webhook)';
COMMENT ON COLUMN orders.delivered_at IS 'Data/hora em que o CLIENTE confirmou o recebimento (ou auto-confirmado)';
COMMENT ON COLUMN orders.auto_confirmed IS 'TRUE se a entrega foi confirmada automaticamente após 7 dias';
COMMENT ON COLUMN orders.carrier_name IS 'Nome da transportadora (Correios, FedEx, Loggi, etc)';
COMMENT ON COLUMN orders.carrier_status IS 'Status do rastreamento (POSTADO, EM_TRANSITO, SAIU_PARA_ENTREGA, ENTREGUE, etc)';

-- 3. Atualizar dados existentes: definir shipped_at para pedidos já enviados
UPDATE orders
SET shipped_at = updated_at
WHERE status = 'shipped' AND shipped_at IS NULL;

-- 4. Atualizar dados existentes: definir delivered_at para pedidos já entregues
UPDATE orders
SET delivered_at = updated_at
WHERE status = 'delivered' AND delivered_at IS NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at) WHERE status = 'shipped';
CREATE INDEX IF NOT EXISTS idx_orders_carrier_delivered ON orders(carrier_delivered_at) WHERE carrier_delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_auto_confirm ON orders(status, carrier_delivered_at) WHERE status = 'shipped' AND carrier_delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_carrier_status ON orders(carrier_status) WHERE carrier_status IS NOT NULL;

-- 6. Criar função para auto-confirmação de entregas (após 7 dias DA TRANSPORTADORA CONFIRMAR)
CREATE OR REPLACE FUNCTION auto_confirm_deliveries()
RETURNS TABLE(
  order_id UUID,
  carrier_delivered_date TIMESTAMP WITH TIME ZONE,
  days_since_carrier_delivery INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_updated INTEGER;
BEGIN
  -- Buscar pedidos onde transportadora confirmou há mais de 7 dias e cliente não confirmou
  WITH orders_to_confirm AS (
    SELECT 
      id,
      carrier_delivered_at,
      EXTRACT(DAY FROM NOW() - carrier_delivered_at)::INTEGER as days_passed
    FROM orders
    WHERE status = 'shipped'
      AND carrier_delivered_at IS NOT NULL
      AND carrier_delivered_at < NOW() - INTERVAL '7 days'
      AND delivered_at IS NULL  -- Cliente ainda não confirmou
  )
  -- Atualizar para delivered (auto-confirmação)
  UPDATE orders o
  SET 
    status = 'delivered',
    delivered_at = NOW(),
    auto_confirmed = TRUE,
    updated_at = NOW()
  FROM orders_to_confirm otc
  WHERE o.id = otc.id
  RETURNING o.id, otc.carrier_delivered_at, otc.days_passed;

  -- Retornar pedidos atualizados
  GET DIAGNOSTICS orders_updated = ROW_COUNT;
  
  RAISE NOTICE 'Auto-confirmados: % pedido(s)', orders_updated;
  
  RETURN QUERY
  SELECT o.id, o.carrier_delivered_at, EXTRACT(DAY FROM NOW() - o.carrier_delivered_at)::INTEGER
  FROM orders o
  WHERE o.auto_confirmed = TRUE
    AND o.delivered_at >= NOW() - INTERVAL '1 minute';
END;
$$;

COMMENT ON FUNCTION auto_confirm_deliveries() IS 'Auto-confirma entregas após 7 dias DA TRANSPORTADORA CONFIRMAR (CDC). Cliente tem 7 dias para reclamar após entrega física.';

-- 7. Criar view para monitoramento de entregas pendentes
CREATE OR REPLACE VIEW pending_delivery_confirmations AS
SELECT 
  o.id as order_id,
  o.customer_email,
  o.customer_name,
  o.shipped_at,
  o.carrier_delivered_at,
  o.carrier_name,
  o.carrier_status,
  o.tracking_code,
  CASE 
    WHEN o.carrier_delivered_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM NOW() - o.carrier_delivered_at)::INTEGER
  END as days_since_carrier_delivery,
  CASE 
    WHEN o.carrier_delivered_at IS NULL THEN NULL
    ELSE 7 - EXTRACT(DAY FROM NOW() - o.carrier_delivered_at)::INTEGER
  END as days_until_auto_confirm,
  o.total_amount,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'shipped'
  AND o.shipped_at IS NOT NULL
GROUP BY o.id, o.customer_email, o.customer_name, o.shipped_at, o.carrier_delivered_at, o.carrier_name, o.carrier_status, o.tracking_code, o.total_amount
ORDER BY o.carrier_delivered_at ASC NULLS LAST;

COMMENT ON VIEW pending_delivery_confirmations IS 'Lista pedidos enviados aguardando confirmação de entrega pelo cliente (após transportadora confirmar)';

-- 8. Criar trigger para garantir shipped_at quando status = shipped
CREATE OR REPLACE FUNCTION set_shipped_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' AND NEW.shipped_at IS NULL THEN
    NEW.shipped_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_shipped_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_shipped_at_timestamp();

-- 9. Criar trigger para garantir delivered_at quando status = delivered
CREATE OR REPLACE FUNCTION set_delivered_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_delivered_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivered_at_timestamp();

-- ================================================================
-- TESTES E VALIDAÇÕES
-- ================================================================

-- Verificar estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('shipped_at', 'carrier_delivered_at', 'delivered_at', 'auto_confirmed', 'carrier_name', 'carrier_status');

-- Verificar view
SELECT * FROM pending_delivery_confirmations LIMIT 5;

-- Testar função de auto-confirmação (não executa UPDATE sem WHERE)
-- SELECT * FROM auto_confirm_deliveries();

-- ================================================================
-- INSTRUÇÕES PARA CRON JOB
-- ================================================================

-- No Supabase Dashboard > Database > Cron Jobs, criar:
-- Nome: Auto-confirm deliveries
-- Schedule: 0 3 * * * (todo dia às 3h da manhã)
-- Query: SELECT * FROM auto_confirm_deliveries();

-- Ou via SQL:
/*
SELECT cron.schedule(
  'auto-confirm-deliveries',
  '0 3 * * *', -- Todo dia às 3h
  $$SELECT * FROM auto_confirm_deliveries();$$
);
*/

-- ================================================================
-- ROLLBACK (SE NECESSÁRIO)
-- ================================================================

/*
-- Remover cron job
SELECT cron.unschedule('auto-confirm-deliveries');

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_set_shipped_at ON orders;
DROP TRIGGER IF EXISTS trigger_set_delivered_at ON orders;
DROP FUNCTION IF EXISTS set_shipped_at_timestamp();
DROP FUNCTION IF EXISTS set_delivered_at_timestamp();

-- Remover view e função
DROP VIEW IF EXISTS pending_delivery_confirmations;
DROP FUNCTION IF EXISTS auto_confirm_deliveries();

-- Remover colunas (CUIDADO: perda de dados!)
ALTER TABLE orders
DROP COLUMN IF EXISTS shipped_at,
DROP COLUMN IF EXISTS delivered_at,
DROP COLUMN IF EXISTS auto_confirmed;
*/
