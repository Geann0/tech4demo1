-- ================================================================
-- FIX: Adicionar campos faltantes na tabela products
-- Data: 2025-11-21
-- Descrição: Adiciona campos que o código está tentando usar mas não existem
-- ================================================================

-- Adicionar campo availability (disponibilidade)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS availability VARCHAR(20) DEFAULT 'in_stock';

-- Adicionar campo brand (marca)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Adicionar campo condition (condição do produto)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'new';

-- Adicionar campo weight (peso em gramas para cálculo de frete)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Adicionar campo dimensions (dimensões para cálculo de frete)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS length INTEGER,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Adicionar campo warranty (garantia em meses)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS warranty_months INTEGER;

-- Adicionar campo meta tags para SEO
ALTER TABLE products
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Comentários explicativos
COMMENT ON COLUMN products.availability IS 'Disponibilidade: in_stock, out_of_stock, pre_order, discontinued';
COMMENT ON COLUMN products.brand IS 'Marca do produto (ex: Samsung, Apple, Dell)';
COMMENT ON COLUMN products.condition IS 'Condição do produto: new, used, refurbished';
COMMENT ON COLUMN products.weight IS 'Peso em gramas (para cálculo de frete)';
COMMENT ON COLUMN products.length IS 'Comprimento em cm (para cálculo de frete)';
COMMENT ON COLUMN products.width IS 'Largura em cm (para cálculo de frete)';
COMMENT ON COLUMN products.height IS 'Altura em cm (para cálculo de frete)';
COMMENT ON COLUMN products.warranty_months IS 'Garantia em meses';
COMMENT ON COLUMN products.meta_title IS 'Título para SEO';
COMMENT ON COLUMN products.meta_description IS 'Descrição para SEO';
COMMENT ON COLUMN products.meta_keywords IS 'Palavras-chave para SEO';

-- Adicionar constraints
DO $$ 
BEGIN
  -- Constraint para availability
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_product_availability'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_product_availability 
    CHECK (availability IN ('in_stock', 'out_of_stock', 'pre_order', 'discontinued'));
  END IF;
  
  -- Constraint para condition
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_product_condition'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_product_condition 
    CHECK (condition IN ('new', 'used', 'refurbished'));
  END IF;
  
  -- Constraint para peso (não pode ser negativo)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_product_weight'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_product_weight 
    CHECK (weight IS NULL OR weight >= 0);
  END IF;
  
  -- Constraint para dimensões (não podem ser negativas)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_product_dimensions'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_product_dimensions 
    CHECK (
      (length IS NULL OR length >= 0) AND
      (width IS NULL OR width >= 0) AND
      (height IS NULL OR height >= 0)
    );
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);

-- Atualizar produtos existentes com valores padrão
UPDATE products
SET availability = 'in_stock'
WHERE availability IS NULL;

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Campos faltantes adicionados com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Novos campos na tabela products:';
  RAISE NOTICE '   ✅ availability (disponibilidade)';
  RAISE NOTICE '   ✅ brand (marca)';
  RAISE NOTICE '   ✅ condition (condição: new, used, refurbished)';
  RAISE NOTICE '   ✅ weight (peso)';
  RAISE NOTICE '   ✅ length, width, height (dimensões)';
  RAISE NOTICE '   ✅ warranty_months (garantia)';
  RAISE NOTICE '   ✅ meta_title, meta_description, meta_keywords (SEO)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Agora você pode adicionar produtos!';
END $$;
