# 🚀 GUIA: Executar Migração de Automação e Códigos

**Data:** 29 de Novembro de 2025  
**Status:** ✅ Arquivo SQL corrigido e pronto para uso

---

## 📋 O que faz esta migração?

Adiciona ao seu sistema:

✅ **Códigos de Produtos**

- SKU (Stock Keeping Unit) - ex: `TECH-MOUS-042`
- EAN-13 (Código de barras) - ex: `7891234567890`
- Código interno curto - ex: `PRD001`
- QR Code para rastreamento

✅ **Códigos de Pedidos**

- Código único de pedido - ex: `ORD-2025-00001`
- Código de rastreio - ex: `TC123456789BR`
- Etiqueta de envio

✅ **Automações**

- Auto-aprovação de pedidos com pagamento confirmado
- Geração automática de códigos de rastreio
- Geração automática de SKUs para produtos

✅ **Monitoramento**

- Views para acompanhar pedidos aguardando aprovação
- Estatísticas de automação
- Produtos sem códigos

---

## 🔧 COMO EXECUTAR

### **Opção 1: Via Supabase SQL Editor (RECOMENDADO)**

1. Abra https://app.supabase.com
2. Vá para seu projeto Tech4Loop
3. Clique em **SQL Editor** no menu esquerdo
4. Clique em **+ New query**
5. Copie e cole TODO o conteúdo do arquivo:
   ```
   database_migrations/automation_and_codes_system.sql
   ```
6. Clique em **▶️ Run** (ou Ctrl+Enter)

**Esperado:**

```
Query executed successfully ✓
```

---

### **Opção 2: Via SQL Editor (Em Partes)**

Se o arquivo for muito grande, execute em partes:

#### **Parte 1: Adicionar Colunas**

```sql
-- Copie linhas 1-57 (até CREATE INDEX IF NOT EXISTS idx_products_internal_code)
```

Clique ▶️ Run

#### **Parte 2: Adicionar Funções**

```sql
-- Copie linhas 58-180 (até CREATE TRIGGER)
```

Clique ▶️ Run

#### **Parte 3: Views de Monitoramento**

```sql
-- Copie linhas 181-280 (até final da última view)
```

Clique ▶️ Run

#### **Parte 4: Atualizar Dados Existentes**

```sql
-- Copie linhas 281-300 (DO $$...END $$;)
```

Clique ▶️ Run

---

## ✅ VERIFICAR SE FOI EXECUTADO COM SUCESSO

Após executar, você deve ver as novas colunas e funções:

### **1. Verificar Colunas**

No SQL Editor, execute:

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('sku', 'ean13', 'barcode', 'qr_code_data', 'internal_code')
ORDER BY column_name;
```

**Esperado:**

```
column_name      | data_type | is_nullable
-----------------+-----------+------------
barcode          | character varying | YES
ean13            | character varying | YES
internal_code    | character varying | YES
qr_code_data     | text | YES
sku              | character varying | YES
```

### **2. Verificar Funções**

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%order_code%'
  OR routine_name LIKE '%generate_%'
ORDER BY routine_name;
```

**Esperado:**

```
routine_name                | routine_type
---------------------------+--------------
auto_approve_paid_orders    | FUNCTION
auto_generate_product_skus  | FUNCTION
auto_generate_tracking_codes| FUNCTION
generate_order_code         | FUNCTION
generate_product_sku        | FUNCTION
generate_tracking_code      | FUNCTION
set_order_code              | FUNCTION
```

### **3. Verificar Views**

```sql
SELECT
  table_name
FROM information_schema.tables
WHERE table_type = 'VIEW'
  AND table_schema = 'public'
  AND table_name LIKE '%order%'
  OR table_name LIKE '%product%'
  OR table_name LIKE '%automation%'
ORDER BY table_name;
```

**Esperado:**

```
table_name
---------------------------
automation_statistics
orders_pending_auto_approval
products_without_codes
```

---

## 🧪 TESTAR GERAÇÃO DE CÓDIGOS

Execute no SQL Editor:

```sql
SELECT
  generate_order_code() as novo_pedido_codigo,
  generate_tracking_code() as novo_rastreio,
  generate_product_sku('TECH', 'Mouse Gamer RGB') as novo_sku;
```

**Esperado:**

```
novo_pedido_codigo | novo_rastreio   | novo_sku
-------------------+-----------------+------------------
ORD-2025-00001     | TC123456789BR   | TECH-MOUS-042
```

---

## 📊 VER DADOS GERADOS

### **Pedidos Aguardando Auto-Aprovação**

```sql
SELECT * FROM orders_pending_auto_approval;
```

### **Produtos Sem Códigos**

```sql
SELECT * FROM products_without_codes LIMIT 10;
```

### **Estatísticas de Automação**

```sql
SELECT * FROM automation_statistics;
```

---

## ⏰ CONFIGURAR CRON JOBS (OPCIONAL)

Se você quiser que as automações rodem automaticamente, você precisa:

1. Ter extensão `pg_cron` habilitada no Supabase (Enterprise plan)

2. No SQL Editor, execute:

```sql
-- Auto-aprovar pedidos pagos a cada 5 minutos
SELECT cron.schedule(
  'auto-approve-paid-orders',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  'SELECT * FROM auto_approve_paid_orders();'
);

-- Gerar códigos de rastreio todos os dias às 4h
SELECT cron.schedule(
  'auto-generate-tracking',
  '0 4 * * *',
  'SELECT * FROM auto_generate_tracking_codes();'
);

-- Gerar SKUs todos os dias às 5h
SELECT cron.schedule(
  'auto-generate-skus',
  '0 5 * * *',
  'SELECT * FROM auto_generate_product_skus();'
);
```

**Nota:** Se você receber erro `"pg_cron" extension does not exist`, você está em um plano que não suporta cron jobs. Neste caso, você pode:

- Executar manualmente as funções quando necessário
- Usar a API do seu backend para chamar as funções em intervalos
- Fazer upgrade para plano Enterprise

---

## 🔙 DESFAZER (ROLLBACK)

Se precisar desfazer a migração, execute:

```sql
-- Remover views
DROP VIEW IF EXISTS automation_statistics CASCADE;
DROP VIEW IF EXISTS products_without_codes CASCADE;
DROP VIEW IF EXISTS orders_pending_auto_approval CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS auto_generate_product_skus() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_tracking_codes() CASCADE;
DROP FUNCTION IF EXISTS auto_approve_paid_orders() CASCADE;
DROP FUNCTION IF EXISTS set_order_code() CASCADE;
DROP FUNCTION IF EXISTS generate_tracking_code() CASCADE;
DROP FUNCTION IF EXISTS generate_product_sku(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_order_code() CASCADE;

-- Remover trigger
DROP TRIGGER IF EXISTS trigger_set_order_code ON orders;

-- Remover sequência
DROP SEQUENCE IF EXISTS order_code_seq;

-- Remover colunas
ALTER TABLE orders
DROP COLUMN IF EXISTS order_code,
DROP COLUMN IF EXISTS order_barcode,
DROP COLUMN IF EXISTS order_qr_code,
DROP COLUMN IF EXISTS shipping_label_url,
DROP COLUMN IF EXISTS auto_approved,
DROP COLUMN IF EXISTS auto_processed_at;

ALTER TABLE products
DROP COLUMN IF EXISTS sku,
DROP COLUMN IF EXISTS ean13,
DROP COLUMN IF EXISTS barcode,
DROP COLUMN IF EXISTS qr_code_data,
DROP COLUMN IF EXISTS internal_code;
```

---

## 📝 FORMATOS DE CÓDIGOS GERADOS

| Tipo          | Formato        | Exemplo        | Uso               |
| ------------- | -------------- | -------------- | ----------------- |
| Order Code    | ORD-YYYY-NNNNN | ORD-2025-00001 | ID único pedido   |
| Tracking Code | TCNNNNNNNNNBR  | TC123456789BR  | Rastreamento      |
| SKU           | CAT-NAME-NNN   | TECH-MOUS-042  | Controle estoque  |
| EAN-13        | 13 dígitos     | 7891234567890  | Código barras     |
| Internal Code | PRDN           | PRD001         | Referência rápida |

---

## ✨ PRÓXIMOS PASSOS

1. ✅ Executar a migração
2. ✅ Verificar se foi bem-sucedida
3. ✅ Testar geração de códigos
4. ⏳ (Opcional) Configurar cron jobs
5. 🚀 Usar os novos campos no seu sistema

---

## 🆘 PROBLEMAS?

### **Erro: "syntax error at or near..."**

- Certifique-se de que copiou o arquivo INTEIRO
- Verifique se não há caracteres especiais ou espaços extras
- Tente copiar em partes (veja "Opção 2" acima)

### **Erro: "table 'orders' already has column..."**

- A migração já foi executada anteriormente
- Execute a verificação (✅ VERIFICAR SE FOI EXECUTADO COM SUCESSO)
- Se as funções/views existem, pode ignorar este erro

### **Erro: "cron extension not available"**

- Seu plano Supabase não suporta pg_cron
- Use plano Enterprise ou execute as funções manualmente

### **Nenhum pedido gerado**

- Certifique-se de que há pedidos com `payment_status = 'approved'`
- Verifique a view: `SELECT * FROM orders_pending_auto_approval;`

---

**Status:** Pronto para usar ✅  
**Arquivo:** `database_migrations/automation_and_codes_system.sql`  
**Data de Criação:** 19 de Novembro de 2025  
**Última Atualização:** 29 de Novembro de 2025 (Correção de sintaxe)
