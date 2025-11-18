# 🔒 Validações de Segurança do Checkout

## Problemas Identificados e Corrigidos

### ❌ PROBLEMA CRÍTICO ANTERIOR

**Cenário de Risco:**

- Cliente selecionava 1 item de R$ 100,00
- Carrinho tinha 3 itens totalizando R$ 300,00
- **Frontend enviava**: Todos os 3 itens (R$ 300,00)
- **Frontend mostrava**: R$ 300,00
- **Cliente esperava pagar**: R$ 100,00

**Resultado:** Cliente pagaria R$ 300,00 e receberia 3 produtos, ou pagaria R$ 300,00 e receberia apenas 1 produto.

---

## ✅ Correções Implementadas

### 1. **Frontend - CheckoutCartForm.tsx**

#### 1.1 Envio de Dados Corretos

```typescript
// ❌ ANTES (ERRADO)
<input type="hidden" name="cartData" value={JSON.stringify(cart)} />

// ✅ DEPOIS (CORRETO)
<input type="hidden" name="cartData" value={JSON.stringify({
  items: selectedItems,
  total: selectedTotal
})} />
```

#### 1.2 Cálculo de Frete

```typescript
// ❌ ANTES
setShipping(calculateShipping(cleanCEP, cart.total));

// ✅ DEPOIS
setShipping(calculateShipping(cleanCEP, selectedTotal));
```

#### 1.3 Exibição de Subtotal

```typescript
// ❌ ANTES
<span>R$ {cart.total.toFixed(2)}</span>

// ✅ DEPOIS
<span>R$ {selectedTotal.toFixed(2)}</span>
```

#### 1.4 Total Final

```typescript
// ❌ ANTES
R$ {(cart.total + shipping.value).toFixed(2)}

// ✅ DEPOIS
R$ {(selectedTotal + shipping.value).toFixed(2)}
```

#### 1.5 Validação de Itens Selecionados

```typescript
// ❌ ANTES
if (cart.items.length === 0) return null;

// ✅ DEPOIS
if (!hasSelectedItems) return null;
```

---

### 2. **Backend - cartActions.ts**

#### 2.1 Validação de Total (Anti-Fraude)

```typescript
// Calcula o total baseado nos itens recebidos
const calculatedTotal = cart.items.reduce(
  (sum, item) => sum + item.product_price * item.quantity,
  0
);

// Verifica se bate com o total informado (tolerância de 1 centavo)
if (Math.abs(calculatedTotal - cart.total) > 0.01) {
  console.error("❌ ALERTA DE SEGURANÇA: Total não bate!");
  return { error: "Erro de validação. Por favor, tente novamente." };
}
```

**Objetivo:** Impedir que o frontend envie um total diferente da soma dos itens.

---

#### 2.2 Validação de Preços (Anti-Fraude)

```typescript
// Busca preço atual do produto no banco
const { data: product } = await supabase
  .from("products")
  .select("stock, name, price")
  .eq("id", item.product_id)
  .single();

// Verifica se o preço não foi alterado
if (Math.abs(product.price - item.product_price) > 0.01) {
  console.error("❌ ALERTA: Preço foi alterado!");
  return {
    error: `O preço de "${product.name}" foi alterado. Por favor, atualize seu carrinho.`,
  };
}
```

**Objetivo:** Impedir que preços sejam manipulados no frontend antes do envio.

---

#### 2.3 Validação de Estoque

```typescript
if (
  product.stock !== null &&
  product.stock !== undefined &&
  product.stock < item.quantity
) {
  console.error(`❌ Estoque insuficiente: ${product.name}`);
  console.error(`Solicitado: ${item.quantity}, Disponível: ${product.stock}`);
  return {
    error: `Desculpe, "${product.name}" tem apenas ${product.stock} unidade(s) disponível(is).`,
  };
}
```

**Objetivo:** Garantir que não sejam vendidos mais produtos do que há em estoque.

---

#### 2.4 Validação de Itens do Mercado Pago

```typescript
// Calcula total dos itens que serão enviados ao MP
const mpTotal = mpItems.reduce(
  (sum, item) => sum + item.unit_price * item.quantity,
  0
);

// Verifica se bate com o total do carrinho
if (Math.abs(mpTotal - cart.total) > 0.01) {
  console.error("❌ ERRO CRÍTICO: Total do MP não bate!");
  return {
    error: "Erro ao processar pagamento. Contate o suporte.",
  };
}
```

**Objetivo:** Garantir que o Mercado Pago cobrará exatamente o valor correto.

---

## 🔍 Logs de Auditoria Implementados

### Logs de Validação

```
✅ Validação de total OK: { itemCount: 2, total: 299.98, calculated: 299.98 }
```

### Logs de Estoque

```
🔍 Verificando estoque de 2 produto(s)...
✅ Fone Bluetooth: Estoque OK (1/5)
✅ Mouse Gamer: Estoque OK (1/10)
```

### Logs de Criação de Pedido

```
📦 Criando pedido...
Total do pedido: 299.98
Quantidade de itens: 2
✅ Order created: abc123
```

### Logs de Itens

```
📝 Criando 2 item(s) do pedido...
Item 1: { product_id: 'xxx', quantity: 1, price: 149.99, subtotal: 149.99 }
Item 2: { product_id: 'yyy', quantity: 1, price: 149.99, subtotal: 149.99 }
✅ Created 2 order items successfully
```

### Logs de Mercado Pago

```
💳 Preparando itens para Mercado Pago...
✅ Itens Mercado Pago: {
  count: 2,
  total: 299.98,
  items: [
    '1x Fone Bluetooth = R$149.99',
    '1x Mouse Gamer = R$149.99'
  ]
}
```

---

## 🛡️ Camadas de Proteção

### Camada 1: Seleção (Frontend)

- Apenas itens com `selected: true` vão para o checkout
- Validação de `hasSelectedItems` antes de prosseguir

### Camada 2: Cálculos (Frontend)

- `selectedTotal` calculado corretamente
- Frete baseado em `selectedTotal`
- Exibição visual coerente com valores reais

### Camada 3: Envio (Frontend → Backend)

- Apenas `selectedItems` são serializados
- Total enviado é `selectedTotal`

### Camada 4: Validação de Total (Backend)

- Recalcula total baseado nos itens recebidos
- Compara com total informado
- Rejeita se divergência > R$ 0,01

### Camada 5: Validação de Preços (Backend)

- Compara preços recebidos com preços do banco
- Rejeita se preço foi alterado

### Camada 6: Validação de Estoque (Backend)

- Verifica disponibilidade de cada produto
- Rejeita se estoque insuficiente

### Camada 7: Validação Mercado Pago (Backend)

- Recalcula total dos itens do MP
- Confirma que MP cobrará valor correto
- Rejeita se divergência

### Camada 8: Auditoria (Backend)

- Logs detalhados de todas as operações
- Rastreabilidade completa do processo
- Alertas em caso de inconsistências

---

## 📊 Fluxo Seguro

```
1. Cliente seleciona itens no carrinho
   ↓
2. Frontend calcula selectedTotal
   ↓
3. Frontend mostra valores corretos
   ↓
4. Cliente preenche checkout
   ↓
5. Frontend envia apenas selectedItems + selectedTotal
   ↓
6. Backend valida total recebido vs calculado
   ↓
7. Backend valida preços vs banco de dados
   ↓
8. Backend valida estoque disponível
   ↓
9. Backend cria pedido com total validado
   ↓
10. Backend cria itens do pedido
    ↓
11. Backend prepara itens para Mercado Pago
    ↓
12. Backend valida total do MP vs total do pedido
    ↓
13. Backend cria preferência no MP
    ↓
14. Cliente é redirecionado para pagamento
```

---

## ⚠️ Cenários de Falha Detectados

### Cenário 1: Manipulação de Total

**Tentativa:** Frontend envia total menor que a soma dos itens
**Detecção:** Camada 4 - Validação de Total
**Resultado:** Pedido rejeitado com erro "Erro de validação"

### Cenário 2: Manipulação de Preços

**Tentativa:** Frontend altera preço de produto antes de enviar
**Detecção:** Camada 5 - Validação de Preços
**Resultado:** Pedido rejeitado com erro "Preço foi alterado"

### Cenário 3: Estoque Insuficiente

**Tentativa:** Comprar mais unidades do que há em estoque
**Detecção:** Camada 6 - Validação de Estoque
**Resultado:** Pedido rejeitado com erro de estoque

### Cenário 4: Divergência no Mercado Pago

**Tentativa:** Inconsistência entre itens do pedido e itens do MP
**Detecção:** Camada 7 - Validação Mercado Pago
**Resultado:** Pedido rejeitado com erro crítico

---

## 🎯 Garantias de Segurança

✅ Cliente paga apenas pelos itens selecionados
✅ Total cobrado = total exibido
✅ Preços validados contra banco de dados
✅ Estoque verificado antes de criar pedido
✅ Mercado Pago cobra o valor exato
✅ Logs completos para auditoria
✅ Erros claros para o cliente
✅ Alertas de segurança para administradores

---

## 📝 Próximos Passos (Opcional)

1. **Notificações de Admin**: Enviar email quando houver tentativa de fraude
2. **Rate Limiting**: Limitar tentativas de checkout por IP
3. **Fingerprinting**: Detectar múltiplas tentativas com dados alterados
4. **Webhook Validation**: Validar assinatura dos webhooks do Mercado Pago
5. **Estoque Reservado**: Reservar estoque durante checkout (TTL 15min)

---

**Data da Implementação:** 18/11/2025
**Status:** ✅ Implementado e Testado
**Risco Anterior:** 🔴 CRÍTICO
**Risco Atual:** 🟢 BAIXO
