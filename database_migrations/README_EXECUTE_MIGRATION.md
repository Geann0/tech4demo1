# 🚨 EXECUTAR MIGRATION URGENTE

## ❌ Erro Atual

```
Could not find the 'payment_status' column of 'orders' in the schema cache
```

## ✅ Solução

### 1. Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto Tech4Loop
3. Vá em **SQL Editor** (menu lateral)

### 2. Executar Migration

1. Clique em **New Query**
2. Copie TODO o conteúdo do arquivo: `database_migrations/EXECUTE_THIS_FIRST.sql`
3. Cole no editor
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### 3. Aguardar Conclusão

Você verá mensagens como:

```
✅ MIGRATION COMPLETA EXECUTADA COM SUCESSO!

📊 Resumo das alterações:
   ✅ payment_status adicionado (CRÍTICO)
   ✅ Sistema de confirmação de entrega (CDC)
   ✅ Campos de rastreamento de transportadora
   ✅ Sistema de códigos profissionais (SKU, order_code)
   ✅ Funções de automação criadas
   ✅ Índices de performance criados
```

### 4. Testar Checkout Novamente

Após executar a migration, o erro de `payment_status` será resolvido e você poderá:

- ✅ Criar pedidos normalmente
- ✅ Processar pagamentos
- ✅ Receber etiquetas por email
- ✅ Sistema de confirmação de entrega funcionando

---

## 📋 O Que a Migration Faz

### PARTE 1: Payment Status (CRÍTICO)

```sql
ALTER TABLE orders
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
```

- Adiciona coluna que estava faltando
- Resolve erro do checkout
- Valores: pending, approved, rejected, cancelled, refunded

### PARTE 2: Sistema de Confirmação de Entrega

```sql
ALTER TABLE orders
ADD COLUMN shipped_at TIMESTAMP,
ADD COLUMN carrier_delivered_at TIMESTAMP,
ADD COLUMN delivered_at TIMESTAMP,
ADD COLUMN auto_confirmed BOOLEAN,
ADD COLUMN carrier_name VARCHAR(100),
ADD COLUMN carrier_status VARCHAR(50);
```

- Controle completo de entregas
- Confirmação por transportadora
- Auto-confirmação após 7 dias (CDC)

### PARTE 3: Códigos Profissionais

```sql
ALTER TABLE products
ADD COLUMN sku VARCHAR(50),
ADD COLUMN ean13 VARCHAR(13);

ALTER TABLE orders
ADD COLUMN order_code VARCHAR(20);
```

- SKU para produtos
- Códigos de pedido (ORD-2025-00001)
- Códigos de barras e QR codes

---

## ⚠️ Importante

**EXECUTAR APENAS UMA VEZ!**

A migration verifica se as colunas já existem antes de criar, então é seguro executar múltiplas vezes, mas idealmente execute apenas uma vez.

---

## 🧪 Após Executar

### Teste o Checkout:

1. Acesse o site
2. Adicione produto ao carrinho
3. Vá para checkout
4. Preencha dados
5. Finalize pedido
6. ✅ Deve funcionar sem erros!

### Verifique no Banco:

```sql
-- Ver estrutura da tabela orders
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders';

-- Deve mostrar:
-- payment_status | character varying
-- order_code | character varying
-- shipped_at | timestamp with time zone
-- delivered_at | timestamp with time zone
-- etc.
```

---

## 🆘 Se Tiver Problemas

### Erro de Permissão:

- Certifique-se de estar logado como admin no Supabase
- Use o SQL Editor (não o Table Editor)

### Erro de Sintaxe:

- Copie TODO o arquivo EXECUTE_THIS_FIRST.sql
- Não copie apenas partes

### Erro de Constraint:

- A migration já trata isso com `IF NOT EXISTS`
- Se persistir, execute linha por linha

---

## 📞 Suporte

Após executar com sucesso, você verá:

- ✅ Tabela `orders` com nova coluna `payment_status`
- ✅ Checkout funcionando normalmente
- ✅ Sistema de etiquetas pronto
- ✅ Automações configuradas

**Tempo estimado:** 30 segundos de execução
