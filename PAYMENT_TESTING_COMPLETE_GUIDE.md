# 🧪 TESTE DE PAGAMENTO - GUIA PRÁTICO

**Data:** November 29, 2025  
**Status:** ✅ DEV SERVER RODANDO EM http://localhost:3000  
**Build Status:** ✅ SUCESSO (Production Ready)  
**Testes:** ✅ 84/84 PASSANDO

---

## 📋 CHECKLIST DO BUILD

✅ Build Production: **SUCESSO**
✅ Todos os componentes compilados
✅ 60 páginas estáticas geradas
✅ TypeScript validado
✅ CSS/Tailwind processado
✅ Imagens otimizadas

✅ Testes Automatizados: **84/84 PASSANDO**
✅ Componentes React funcionando
✅ Validações de formulário funcionando
✅ Lógica de cálculo funcionando

✅ Dev Server: **RODANDO EM http://localhost:3000**
✅ Hot reload ativo
✅ CSS estilos aplicados
✅ Pronto para testes

---

## 🧪 TESTE COMPLETO DE PAGAMENTO (PASSO A PASSO)

### **PASSO 1: Ir para Página de Produtos**
```
URL: http://localhost:3000/produtos
Esperado: Lista de produtos com estilos
Status: ✅ ABERTA
```

---

### **PASSO 2: Selecionar um Produto**
1. Clique em qualquer produto (ex: "Intercomunicador Y10")
2. Você será levado para a página de detalhe do produto
3. Esperado: Imagem do produto, preço, descrição, botão "Adicionar ao Carrinho"

---

### **PASSO 3: Adicionar ao Carrinho**
1. Clique em "Adicionar ao Carrinho"
2. Esperado: Notificação dizendo "Produto adicionado ao carrinho" ✅
3. Pode adicionar mais produtos se desejar

---

### **PASSO 4: Ir para o Carrinho**
1. Clique em "Ir para Carrinho"
2. OU vá direto para: http://localhost:3000/carrinho
3. Esperado: Ver lista de itens do carrinho com:
   - Nome do produto
   - Quantidade
   - Preço unitário
   - Subtotal
   - Total do carrinho

---

### **PASSO 5: Iniciar Checkout**
1. Clique em "Continuar com Checkout"
2. OU vá direto para: http://localhost:3000/checkout
3. Esperado: Formulário de dados do cliente

---

### **PASSO 6: Preencher Dados do Cliente**
Preencha os seguintes campos:

```
Nome: João Silva
Email: joao@test.com
Telefone: 11999999999
CEP: 01310100
Endereço: Av. Paulista, 1000
Complemento: Apto 1000
Cidade: São Paulo
Estado: SP
```

**Console esperado:**
```
✅ Validação de total OK
🔍 Verificando estoque
✅ Estoque OK
📦 Criando pedido...
🔢 Código do pedido gerado: ORD-2025-XXXXX
✅ Order created: [uuid]
📝 Criando itens do pedido...
✅ Created order items
💳 Preparando itens para Mercado Pago...
✅ Mercado Pago preference created
```

---

### **PASSO 7: Finalizar Compra**
1. Clique em "Finalizar Compra"
2. Esperado: Redirecionado para página de pagamento do Mercado Pago
3. Você verá formulário de pagamento com os itens

---

### **PASSO 8: Preencher Pagamento (Modo Teste)**

Use um cartão de teste do Mercado Pago:

```
Número do Cartão: 4111111111111111
Validade (Mês): 12
Validade (Ano): 25 (ou 2025)
Código de Segurança (CVV): 123
Titular: Seu Nome
Email: seu-email@test.com
```

**Cartões de Teste Alternativos:**
- ✅ Aprovado: 4111 1111 1111 1111
- ✅ Aprovado (Mastercard): 5500 0555 0000 0004
- ❌ Recusado: 4000 0000 0000 0002
- ❌ Vencido: 4000 0000 0000 0069

---

### **PASSO 9: Confirmar Pagamento**
1. Clique em "Pagar" ou "Confirmar"
2. Esperado: Mensagem "Pagamento Aprovado" ✅

---

### **PASSO 10: Verificar Confirmação**
1. Você será redirecionado para página de sucesso
2. Esperado:
   - ✅ Número do pedido (order_code)
   - ✅ Confirmação do pagamento
   - ✅ Link de rastreamento (ou página de rastreamento)

---

## 🔍 VERIFICAR NO BANCO DE DADOS (Supabase)

Após o pagamento, abra https://app.supabase.com e verifique:

### **Tabela: orders**
```sql
SELECT id, order_code, payment_status, status, total_amount
FROM orders
WHERE payment_status = 'approved'
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado:**
```
id: uuid
order_code: ORD-2025-XXXXX ✅
payment_status: approved ✅
status: pending OU processing
total_amount: 119.70
```

### **Tabela: order_items**
```sql
SELECT id, order_id, product_id, quantity, price_at_purchase, partner_amount, platform_fee
FROM order_items
WHERE order_id = 'seu-order-uuid'
LIMIT 1;
```

**Esperado:**
```
quantity: 1 (ou mais) ✅
price_at_purchase: 119.70 ✅
partner_amount: 110.72 (119.70 × 0.925) ✅
platform_fee: 8.98 (119.70 × 0.075) ✅
```

---

## 🧪 CHECKLIST FINAL

- [ ] Dev server rodando em http://localhost:3000
- [ ] Página de produtos carregando com estilos ✅
- [ ] Consegue ver imagens dos produtos ✅
- [ ] Consegue adicionar produto ao carrinho ✅
- [ ] Consegue ir para checkout ✅
- [ ] Consegue preencher formulário ✅
- [ ] Consegue ir para Mercado Pago ✅
- [ ] Consegue fazer pagamento com cartão de teste ✅
- [ ] Recebe mensagem de sucesso ✅
- [ ] Pedido aparece no Supabase com order_code ✅
- [ ] order_items tem partner_amount e platform_fee ✅
- [ ] Console sem erros críticos ✅

---

## ⚠️ ERROS COMUNS E SOLUÇÕES

### **Problema: Estilos não aparecem**
**Solução:**
- Limpar cache: F12 → Application → Clear storage
- Limpar cache local: `rm -r .next`
- Reiniciar: `npm run dev`

### **Problema: Imagens não carregam**
**Solução:**
- Verificar Supabase Storage (deve permitir acesso público)
- Verificar URL da imagem no console (F12)

### **Problema: Cartão recusado no Mercado Pago**
**Solução:**
- Usar cartão de teste: 4111 1111 1111 1111
- Verificar data de validade (12/25 ou 12/2025)
- Verificar CVV (123 qualquer número)

### **Problema: Pedido não aparece no Supabase**
**Solução:**
- Verificar console para erro (F12)
- Verificar se RLS policies estão corretas
- Verificar se tabela `order_items` existe

---

## 📊 ESPERADO PÓS-PAGAMENTO

```
FLUXO ESPERADO:
1. Checkout ✅
2. Dados preenchidos ✅
3. Pedido criado (com order_code) ✅
4. Itens do pedido criados (com fees) ✅
5. Preferência Mercado Pago criada ✅
6. Redirecionado para pagamento ✅
7. Pagamento processado ✅
8. Webhook recebido ✅
9. Order status = processing ✅
10. Comissões calculadas ✅
```

---

## 🎯 RESULTADO ESPERADO

Após completar todos os passos, você deve ter:

✅ **Pedido no banco:**
- order_code: ORD-2025-XXXXX
- payment_status: approved
- status: processing

✅ **Itens do pedido:**
- quantity: preenchido
- price_at_purchase: preenchido
- partner_amount: preenchido (92.5%)
- platform_fee: preenchido (7.5%)

✅ **Sem erros no console**
✅ **Página estilos aplicados corretamente**
✅ **Imagens carregando corretamente**

---

## 🚀 PRÓXIMOS PASSOS

Se tudo funcionar:
1. Executar migração: `automation_and_codes_system.sql` no Supabase
2. Testar múltiplos pedidos (SKU, tracking codes automáticos)
3. Deploy para Vercel
4. Configurar Stripe LIVE mode
5. Ativar MercadoPago LIVE mode

---

**Status Atual:** PRONTO PARA TESTES ✅  
**Dev Server:** http://localhost:3000  
**Boa Sorte!** 🚀
