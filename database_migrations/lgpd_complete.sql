-- ============================================
-- LGPD COMPLIANCE TABLES
-- ============================================

-- Adicionar campos de consentimento LGPD na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_personalization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lgpd_consent_updated_at TIMESTAMPTZ;

-- Comentários sobre os campos
COMMENT ON COLUMN profiles.lgpd_consent IS 'Consentimento inicial (aceite de termos)';
COMMENT ON COLUMN profiles.lgpd_consent_date IS 'Data do consentimento inicial';
COMMENT ON COLUMN profiles.consent_marketing IS 'Consentimento para receber e-mails de marketing';
COMMENT ON COLUMN profiles.consent_analytics IS 'Consentimento para coleta de dados de analytics';
COMMENT ON COLUMN profiles.consent_personalization IS 'Consentimento para personalização de conteúdo';
COMMENT ON COLUMN profiles.lgpd_consent_updated_at IS 'Última atualização das preferências de consentimento';

-- Tabela de solicitações de exclusão de conta
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_at ON deletion_requests(requested_at);

-- Comentários
COMMENT ON TABLE deletion_requests IS 'Solicitações de exclusão de conta (direito LGPD ao esquecimento)';
COMMENT ON COLUMN deletion_requests.status IS 'Status: pending, processing, completed, cancelled';

-- RLS Policies para deletion_requests
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias solicitações
CREATE POLICY "Users can view own deletion requests"
ON deletion_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar solicitações para si mesmos
CREATE POLICY "Users can create own deletion requests"
ON deletion_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin pode ver todas as solicitações
CREATE POLICY "Admins can view all deletion requests"
ON deletion_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar solicitações
CREATE POLICY "Admins can update deletion requests"
ON deletion_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Tabela de logs de acesso a dados pessoais (auditoria LGPD)
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('export', 'view', 'update', 'delete')),
  data_types TEXT[], -- Array de tipos de dados acessados: ['profile', 'orders', 'favorites']
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_timestamp ON data_access_logs(timestamp);

-- RLS Policies
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs"
ON data_access_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert access logs"
ON data_access_logs
FOR INSERT
WITH CHECK (true); -- Permitir inserção (será feito via service role)

-- Função para registrar acesso a dados
CREATE OR REPLACE FUNCTION log_data_access(
  p_user_id UUID,
  p_access_type TEXT,
  p_data_types TEXT[],
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO data_access_logs (
    user_id,
    accessed_by,
    access_type,
    data_types,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    auth.uid(),
    p_access_type,
    p_data_types,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Trigger para atualizar updated_at em deletion_requests
CREATE OR REPLACE FUNCTION update_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deletion_requests_updated_at
BEFORE UPDATE ON deletion_requests
FOR EACH ROW
EXECUTE FUNCTION update_deletion_requests_updated_at();

-- Comentários finais
COMMENT ON TABLE data_access_logs IS 'Logs de acesso a dados pessoais para auditoria LGPD';
COMMENT ON FUNCTION log_data_access IS 'Registra acessos a dados pessoais para compliance LGPD';
