-- ==========================================
-- SISTEMA DE CUPONS DE DESCONTO
-- ==========================================

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Código do cupom (ex: "BLACKFRIDAY2024")
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')), -- 'percentage' = %, 'fixed' = R$
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0), -- 10 = 10% ou R$10
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0, -- Valor mínimo de compra
  max_discount_amount DECIMAL(10, 2), -- Desconto máximo (para cupons de %)
  usage_limit INTEGER, -- Limite total de usos (NULL = ilimitado)
  usage_per_customer INTEGER DEFAULT 1, -- Quantas vezes cada cliente pode usar
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  categories_allowed UUID[], -- IDs de categorias permitidas (NULL = todas)
  products_allowed UUID[], -- IDs de produtos permitidos (NULL = todos)
  first_purchase_only BOOLEAN DEFAULT FALSE, -- Apenas para primeira compra?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Tabela de uso de cupons (histórico)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);

-- ==========================================
-- POLICIES (RLS)
-- ==========================================

-- Ativar RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Admin pode tudo
CREATE POLICY "Admin gerencia cupons"
  ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Todos podem visualizar cupons ativos
CREATE POLICY "Visualizar cupons ativos"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (active = TRUE AND valid_until > NOW());

-- Usuários podem ver próprio histórico de uso
CREATE POLICY "Ver próprio uso de cupons"
  ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Sistema pode inserir uso de cupons
CREATE POLICY "Sistema registra uso"
  ON coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

-- Função para validar cupom
CREATE OR REPLACE FUNCTION validate_coupon(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_cart_total DECIMAL(10, 2)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_usage_count INTEGER;
  v_user_usage_count INTEGER;
  v_discount_amount DECIMAL(10, 2);
  v_is_first_purchase BOOLEAN;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_coupon_code)
  AND active = TRUE
  AND valid_from <= NOW()
  AND valid_until >= NOW();

  -- Cupom não encontrado ou inválido
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', FALSE,
      'error', 'Cupom inválido ou expirado'
    );
  END IF;

  -- Verificar valor mínimo de compra
  IF p_cart_total < v_coupon.min_purchase_amount THEN
    RETURN json_build_object(
      'valid', FALSE,
      'error', format('Valor mínimo de compra: R$ %.2f', v_coupon.min_purchase_amount)
    );
  END IF;

  -- Verificar limite total de usos
  IF v_coupon.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage
    WHERE coupon_id = v_coupon.id;

    IF v_usage_count >= v_coupon.usage_limit THEN
      RETURN json_build_object(
        'valid', FALSE,
        'error', 'Cupom esgotado'
      );
    END IF;
  END IF;

  -- Verificar limite por cliente
  SELECT COUNT(*) INTO v_user_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;

  IF v_user_usage_count >= v_coupon.usage_per_customer THEN
    RETURN json_build_object(
      'valid', FALSE,
      'error', 'Você já utilizou este cupom o número máximo de vezes'
    );
  END IF;

  -- Verificar se é apenas para primeira compra
  IF v_coupon.first_purchase_only THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM orders WHERE customer_id = p_user_id AND status = 'completed'
    ) INTO v_is_first_purchase;

    IF NOT v_is_first_purchase THEN
      RETURN json_build_object(
        'valid', FALSE,
        'error', 'Cupom válido apenas para primeira compra'
      );
    END IF;
  END IF;

  -- Calcular desconto
  IF v_coupon.type = 'percentage' THEN
    v_discount_amount := (p_cart_total * v_coupon.value / 100);
    
    -- Aplicar desconto máximo se configurado
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
      v_discount_amount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    -- Desconto fixo
    v_discount_amount := v_coupon.value;
  END IF;

  -- Cupom válido!
  RETURN json_build_object(
    'valid', TRUE,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'type', v_coupon.type,
    'value', v_coupon.value,
    'discount_amount', v_discount_amount,
    'description', v_coupon.description
  );
END;
$$;

-- ==========================================
-- CUPONS DE EXEMPLO (SEED)
-- ==========================================

INSERT INTO coupons (code, description, type, value, min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until)
VALUES
  ('BEMVINDO10', 'Cupom de boas-vindas: 10% OFF na primeira compra', 'percentage', 10, 50, 30, NULL, NOW(), NOW() + INTERVAL '1 year'),
  ('FRETEGRATIS', 'Frete grátis em compras acima de R$ 100', 'fixed', 15, 100, NULL, 100, NOW(), NOW() + INTERVAL '3 months'),
  ('BLACKFRIDAY50', 'Black Friday: 50% OFF (limitado)', 'percentage', 50, 0, 100, 50, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;
