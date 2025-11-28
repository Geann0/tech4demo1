-- ============================================
-- SISTEMA DE DADOS LEGAIS DE PARCEIROS + TAXAS
-- ============================================
-- Data: 19/11/2025
-- Objetivo: Proteger dados sensíveis dos parceiros e implementar taxa de 7.5%

-- ============================================
-- 1. TABELA DE DADOS LEGAIS DOS PARCEIROS (PRIVADA)
-- ============================================
-- Apenas o próprio parceiro pode acessar, ADMIN NÃO VÊ

CREATE TABLE IF NOT EXISTS partner_legal_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da empresa
  company_name VARCHAR(200), -- Nome fantasia ou razão social
  legal_name VARCHAR(200),   -- Razão social completa
  
  -- Documentos
  cpf VARCHAR(14),           -- CPF (pessoa física)
  cnpj VARCHAR(18),          -- CNPJ (pessoa jurídica)
  state_registration VARCHAR(50), -- Inscrição estadual
  municipal_registration VARCHAR(50), -- Inscrição municipal
  
  -- Endereço completo (para NF-e)
  company_street VARCHAR(200),
  company_number VARCHAR(20),
  company_complement VARCHAR(100),
  company_neighborhood VARCHAR(100),
  company_city VARCHAR(100),
  company_state CHAR(2),
  company_postal_code VARCHAR(10),
  
  -- Contatos
  legal_phone VARCHAR(20),   -- Telefone principal
  legal_email VARCHAR(200),  -- Email fiscal (diferente do login)
  
  -- Dados bancários (para receber pagamentos)
  bank_name VARCHAR(100),
  bank_code VARCHAR(10),
  agency VARCHAR(20),
  account_number VARCHAR(30),
  account_type VARCHAR(20),  -- 'corrente', 'poupanca'
  pix_key VARCHAR(200),      -- Chave PIX (CPF, CNPJ, email, telefone, aleatória)
  pix_key_type VARCHAR(20),  -- 'cpf', 'cnpj', 'email', 'phone', 'random'
  
  -- Integração Mercado Pago (para split automático)
  mercadopago_account_id VARCHAR(100), -- ID da conta no Mercado Pago
  mercadopago_access_token TEXT,       -- Token de acesso (criptografado)
  
  -- Dados para NF-e
  nfe_certificate_path TEXT, -- Caminho do certificado A1
  nfe_certificate_password TEXT, -- Senha do certificado (criptografado)
  
  -- Controle
  profile_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: apenas um registro por parceiro
  UNIQUE(partner_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_partner_legal_data_partner_id ON partner_legal_data(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_legal_data_completed ON partner_legal_data(profile_completed);

-- Comentários
COMMENT ON TABLE partner_legal_data IS 'Dados legais e fiscais dos parceiros - PROTEGIDO DO ADMIN';
COMMENT ON COLUMN partner_legal_data.cpf IS 'CPF do parceiro pessoa física';
COMMENT ON COLUMN partner_legal_data.cnpj IS 'CNPJ do parceiro pessoa jurídica';
COMMENT ON COLUMN partner_legal_data.mercadopago_account_id IS 'ID para split automático de pagamentos';
COMMENT ON COLUMN partner_legal_data.profile_completed IS 'Se parceiro completou cadastro legal';

-- ============================================
-- 2. RLS POLICIES - PROTEÇÃO MÁXIMA
-- ============================================
ALTER TABLE partner_legal_data ENABLE ROW LEVEL SECURITY;

-- Parceiro só vê seus próprios dados
CREATE POLICY "Partners can view own legal data"
ON partner_legal_data
FOR SELECT
USING (auth.uid() = partner_id);

-- Parceiro pode inserir seus dados (primeira vez)
CREATE POLICY "Partners can insert own legal data"
ON partner_legal_data
FOR INSERT
WITH CHECK (auth.uid() = partner_id);

-- Parceiro pode atualizar seus dados
CREATE POLICY "Partners can update own legal data"
ON partner_legal_data
FOR UPDATE
USING (auth.uid() = partner_id);

-- ❌ ADMIN NÃO TEM ACESSO! (sem policy para admins)
-- ✅ Apenas o próprio parceiro acessa seus dados legais

COMMENT ON POLICY "Partners can view own legal data" ON partner_legal_data 
IS '✅ Apenas o próprio parceiro vê seus dados - ADMIN NÃO ACESSA';

-- ============================================
-- 3. ADICIONAR CAMPOS DE TRACKING E NF-E EM ORDERS
-- ============================================

-- Campos de rastreamento e envio
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100), -- 'Correios', 'Jadlog', etc
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS nfe_pdf_url TEXT, -- URL do PDF da NF-e
ADD COLUMN IF NOT EXISTS nfe_xml_url TEXT, -- URL do XML da NF-e
ADD COLUMN IF NOT EXISTS nfe_number VARCHAR(50), -- Número da NF-e
ADD COLUMN IF NOT EXISTS nfe_series VARCHAR(10), -- Série da NF-e
ADD COLUMN IF NOT EXISTS nfe_access_key VARCHAR(44); -- Chave de acesso (44 dígitos)

-- Comentários
COMMENT ON COLUMN orders.tracking_code IS 'Código de rastreamento da entrega';
COMMENT ON COLUMN orders.carrier IS 'Transportadora responsável';
COMMENT ON COLUMN orders.shipped_at IS 'Data/hora do envio';
COMMENT ON COLUMN orders.delivered_at IS 'Data/hora da entrega';
COMMENT ON COLUMN orders.nfe_pdf_url IS 'URL do PDF da Nota Fiscal Eletrônica';
COMMENT ON COLUMN orders.nfe_access_key IS 'Chave de acesso NF-e (44 dígitos)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_nfe_number ON orders(nfe_number);

-- ============================================
-- 4. TABELA DE ITENS COM TAXA DA PLATAFORMA (7.5%)
-- ============================================

-- Adicionar campos de taxa em order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS partner_amount DECIMAL(10,2), -- Valor que o parceiro recebe (92.5%)
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),   -- Taxa da plataforma (7.5%)
ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(5,2) DEFAULT 7.5; -- Taxa em percentual

-- Comentários
COMMENT ON COLUMN order_items.partner_amount IS 'Valor que o parceiro recebe (92.5% do total)';
COMMENT ON COLUMN order_items.platform_fee IS 'Taxa da plataforma Tech4Loop (7.5% do total)';
COMMENT ON COLUMN order_items.platform_fee_rate IS 'Percentual da taxa (padrão: 7.5%)';

-- ============================================
-- 5. TABELA DE REPASSES (PAYOUTS)
-- ============================================
-- Controle de pagamentos da plataforma para os parceiros

CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Valores
  total_sales DECIMAL(10,2) NOT NULL,      -- Total de vendas do período
  partner_amount DECIMAL(10,2) NOT NULL,    -- Valor a receber (92.5%)
  platform_fee DECIMAL(10,2) NOT NULL,      -- Taxa retida (7.5%)
  
  -- Pagamento
  status VARCHAR(20) DEFAULT 'pending',     -- 'pending', 'processing', 'paid', 'failed'
  payment_method VARCHAR(50),               -- 'pix', 'bank_transfer', 'mercadopago_split'
  payment_date TIMESTAMPTZ,
  payment_proof_url TEXT,                   -- Comprovante de pagamento
  
  -- Controle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  paid_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Constraint: apenas um repasse por parceiro por período
  UNIQUE(partner_id, period_start, period_end)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_payment_date ON partner_payouts(payment_date);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_period ON partner_payouts(period_start, period_end);

-- Comentários
COMMENT ON TABLE partner_payouts IS 'Controle de repasses da plataforma para parceiros';
COMMENT ON COLUMN partner_payouts.partner_amount IS 'Valor líquido a receber pelo parceiro (92.5%)';
COMMENT ON COLUMN partner_payouts.platform_fee IS 'Taxa da plataforma Tech4Loop (7.5%)';

-- ============================================
-- 6. RLS POLICIES - PAYOUTS
-- ============================================
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

-- Parceiro vê apenas seus repasses
CREATE POLICY "Partners can view own payouts"
ON partner_payouts
FOR SELECT
USING (auth.uid() = partner_id);

-- Admin pode ver todos os repasses
CREATE POLICY "Admins can view all payouts"
ON partner_payouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode criar repasses
CREATE POLICY "Admins can create payouts"
ON partner_payouts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar repasses
CREATE POLICY "Admins can update payouts"
ON partner_payouts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 7. TABELA DE AUDIT LOG (AUDITORIA)
-- ============================================
-- Registrar todas ações críticas para compliance

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(200),
  user_role VARCHAR(20),
  
  -- Ação
  action VARCHAR(100) NOT NULL, -- 'update_product', 'cancel_order', 'create_partner', etc
  table_name VARCHAR(100),
  record_id UUID,
  
  -- Dados
  old_values JSONB,
  new_values JSONB,
  
  -- Contexto
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance em queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);

-- Comentários
COMMENT ON TABLE audit_log IS 'Registro de auditoria de todas ações críticas do sistema';
COMMENT ON COLUMN audit_log.action IS 'Tipo de ação realizada';
COMMENT ON COLUMN audit_log.old_values IS 'Valores antes da alteração (JSON)';
COMMENT ON COLUMN audit_log.new_values IS 'Valores depois da alteração (JSON)';

-- ============================================
-- 8. RLS POLICIES - AUDIT LOG
-- ============================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Admins can view audit logs"
ON audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert audit logs"
ON audit_log
FOR INSERT
WITH CHECK (true);

-- ============================================
-- 9. FUNÇÃO HELPER: CALCULAR TAXA
-- ============================================
-- Função para calcular valores com taxa de 7.5%

CREATE OR REPLACE FUNCTION calculate_platform_fee(
  item_total DECIMAL(10,2),
  fee_rate DECIMAL(5,2) DEFAULT 7.5
)
RETURNS TABLE(
  partner_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(item_total * (100 - fee_rate) / 100, 2) as partner_amount,
    ROUND(item_total * fee_rate / 100, 2) as platform_fee;
END;
$$;

COMMENT ON FUNCTION calculate_platform_fee IS 'Calcula valor do parceiro (92.5%) e taxa da plataforma (7.5%)';

-- Exemplo de uso:
-- SELECT * FROM calculate_platform_fee(100.00, 7.5);
-- Retorna: partner_amount = 92.50, platform_fee = 7.50

-- ============================================
-- 10. FUNÇÃO HELPER: LOG DE AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION log_audit(
  p_action VARCHAR(100),
  p_table_name VARCHAR(100),
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_user_email VARCHAR(200);
  v_user_role VARCHAR(20);
BEGIN
  -- Obter dados do usuário atual
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NOT NULL THEN
    SELECT email, role INTO v_user_email, v_user_role
    FROM profiles
    WHERE id = v_user_id;
  END IF;
  
  -- Inserir log
  INSERT INTO audit_log (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_ip_address
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_audit IS 'Função helper para registrar ações no audit_log';

-- Exemplo de uso:
-- SELECT log_audit(
--   'update_product',
--   'products',
--   'uuid-do-produto',
--   '{"price": 100}'::jsonb,
--   '{"price": 150}'::jsonb,
--   '192.168.1.1'
-- );

-- ============================================
-- 11. TRIGGER: ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_legal_data_updated_at
BEFORE UPDATE ON partner_legal_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. VIEW: RESUMO DE VENDAS POR PARCEIRO
-- ============================================
-- View para facilitar dashboard de repasses

CREATE OR REPLACE VIEW partner_sales_summary AS
SELECT 
  o.partner_id,
  p.partner_name,
  p.email as partner_email,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(oi.id) as total_items,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.price_at_purchase * oi.quantity) as gross_amount,
  SUM(oi.partner_amount) as partner_amount,
  SUM(oi.platform_fee) as platform_fee,
  DATE_TRUNC('month', o.created_at) as period_month
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN profiles p ON p.id = o.partner_id
WHERE o.status = 'paid' OR o.status = 'completed' OR o.status = 'processing'
GROUP BY o.partner_id, p.partner_name, p.email, DATE_TRUNC('month', o.created_at);

COMMENT ON VIEW partner_sales_summary IS 'Resumo de vendas por parceiro para dashboard de repasses';

-- ============================================
-- 13. SEEDS: DADOS INICIAIS
-- ============================================

-- Atualizar orders existentes com taxa padrão
UPDATE order_items 
SET 
  platform_fee_rate = 7.5,
  partner_amount = ROUND((price_at_purchase * quantity) * 0.925, 2),
  platform_fee = ROUND((price_at_purchase * quantity) * 0.075, 2)
WHERE partner_amount IS NULL;

-- ============================================
-- FIM DA MIGRATION
-- ============================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   - partner_legal_data (dados legais protegidos)';
  RAISE NOTICE '   - partner_payouts (controle de repasses)';
  RAISE NOTICE '   - audit_log (auditoria de ações)';
  RAISE NOTICE '💰 Taxa da plataforma: 7.5%% (parceiro recebe 92.5%%)';
  RAISE NOTICE '🔒 Proteção: Admin NÃO vê dados legais dos parceiros';
  RAISE NOTICE '📈 Views criadas: partner_sales_summary';
END $$;
