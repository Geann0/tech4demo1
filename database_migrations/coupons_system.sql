-- ============================================
-- SISTEMA DE CUPONS DE DESCONTO
-- ============================================

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- Código do cupom (ex: "BEMVINDO10")
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')), -- Porcentagem ou valor fixo
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0), -- Valor do desconto
  
  -- Regras de aplicação
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0, -- Valor mínimo de compra
  max_discount_amount DECIMAL(10, 2), -- Desconto máximo (para porcentagem)
  
  -- Limitações
  usage_limit INTEGER, -- Limite total de usos (NULL = ilimitado)
  usage_limit_per_user INTEGER DEFAULT 1, -- Limite por usuário
  usage_count INTEGER DEFAULT 0, -- Contador de usos
  
  -- Validade
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Restrições
  applicable_to_products UUID[], -- IDs de produtos específicos (NULL = todos)
  applicable_to_categories UUID[], -- IDs de categorias específicas (NULL = todas)
  first_purchase_only BOOLEAN DEFAULT false, -- Apenas primeira compra
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de uso de cupons (histórico)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10, 2) NOT NULL, -- Valor real do desconto aplicado
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON coupons(valid_from);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar cupons ativos
CREATE POLICY "Public can view active coupons"
ON coupons
FOR SELECT
USING (status = 'active' AND valid_until > NOW());

-- Admin pode fazer tudo
CREATE POLICY "Admins can manage coupons"
ON coupons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Usuários podem ver seus próprios usos de cupom
CREATE POLICY "Users can view own coupon usage"
ON coupon_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Sistema pode inserir uso de cupom
CREATE POLICY "System can insert coupon usage"
ON coupon_usage
FOR INSERT
WITH CHECK (true);

-- Admin pode ver todo o histórico
CREATE POLICY "Admins can view all coupon usage"
ON coupon_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Função para validar cupom
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_cart_total DECIMAL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  error_message TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  discount_amount DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_calculated_discount DECIMAL;
BEGIN
  -- Buscar cupom (case-insensitive)
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  AND status = 'active'
  LIMIT 1;
  
  -- Cupom não encontrado ou inativo
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, 'Cupom inválido ou expirado', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar data de validade
  IF v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, 'Cupom ainda não está válido', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 'Cupom expirado', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar limite de uso global
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 'Cupom esgotado', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar limite por usuário
  SELECT COUNT(*) INTO v_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;
  
  IF v_usage_count >= v_coupon.usage_limit_per_user THEN
    RETURN QUERY SELECT false, 'Você já usou este cupom o máximo de vezes permitido', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar valor mínimo de compra
  IF p_cart_total < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT 
      false, 
      'Valor mínimo de compra não atingido: R$ ' || v_coupon.min_purchase_amount::TEXT,
      NULL::TEXT,
      NULL::DECIMAL,
      NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar primeira compra (se aplicável)
  IF v_coupon.first_purchase_only THEN
    IF EXISTS (
      SELECT 1 FROM orders
      WHERE customer_email = (SELECT email FROM auth.users WHERE id = p_user_id)
      AND payment_status = 'approved'
    ) THEN
      RETURN QUERY SELECT false, 'Cupom válido apenas para primeira compra', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;
  
  -- Verificar restrições de produtos/categorias
  IF v_coupon.applicable_to_products IS NOT NULL AND p_product_ids IS NOT NULL THEN
    IF NOT (v_coupon.applicable_to_products && p_product_ids) THEN
      RETURN QUERY SELECT false, 'Cupom não aplicável aos produtos no carrinho', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;
  
  IF v_coupon.applicable_to_categories IS NOT NULL AND p_category_ids IS NOT NULL THEN
    IF NOT (v_coupon.applicable_to_categories && p_category_ids) THEN
      RETURN QUERY SELECT false, 'Cupom não aplicável às categorias no carrinho', NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;
  
  -- Calcular desconto
  IF v_coupon.discount_type = 'percentage' THEN
    v_calculated_discount := p_cart_total * (v_coupon.discount_value / 100);
    
    -- Aplicar desconto máximo (se definido)
    IF v_coupon.max_discount_amount IS NOT NULL AND v_calculated_discount > v_coupon.max_discount_amount THEN
      v_calculated_discount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_calculated_discount := LEAST(v_coupon.discount_value, p_cart_total);
  END IF;
  
  -- Cupom válido!
  RETURN QUERY SELECT 
    true,
    NULL::TEXT,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_calculated_discount;
END;
$$;

-- Função para aplicar cupom (após pagamento aprovado)
CREATE OR REPLACE FUNCTION apply_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Buscar ID do cupom
  SELECT id INTO v_coupon_id
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;
  
  IF v_coupon_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Registrar uso
  INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
  VALUES (v_coupon_id, p_user_id, p_order_id, p_discount_amount);
  
  -- Incrementar contador
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE id = v_coupon_id;
  
  RETURN true;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_coupons_updated_at();

-- Trigger para expirar cupons automaticamente
CREATE OR REPLACE FUNCTION expire_coupons()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coupons
  SET status = 'expired'
  WHERE valid_until < NOW()
  AND status = 'active';
END;
$$;

-- Comentários
COMMENT ON TABLE coupons IS 'Cupons de desconto para o e-commerce';
COMMENT ON TABLE coupon_usage IS 'Histórico de uso de cupons';
COMMENT ON FUNCTION validate_coupon IS 'Valida se um cupom pode ser aplicado ao carrinho';
COMMENT ON FUNCTION apply_coupon IS 'Registra uso de cupom após pagamento aprovado';

-- Adicionar campo coupon_code na tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN orders.coupon_code IS 'Código do cupom aplicado';
COMMENT ON COLUMN orders.coupon_discount IS 'Valor do desconto do cupom';

-- Cupons iniciais de exemplo (executar apenas em desenvolvimento)
-- INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, usage_limit_per_user, valid_until)
-- VALUES 
-- ('BEMVINDO10', 'Cupom de boas-vindas - 10% OFF', 'percentage', 10, 50, 1, NOW() + INTERVAL '30 days'),
-- ('PRIMEIRACOMPRA', 'Primeira compra - R$ 20 OFF', 'fixed', 20, 100, 1, NOW() + INTERVAL '60 days'),
-- ('FRETEGRATIS', 'Frete grátis acima de R$ 150', 'fixed', 15, 150, 3, NOW() + INTERVAL '90 days');
