# 🔧 DEBUG: Problemas com Pagamento no Mercado Pago

**Problema Reportado:**
```
❌ "Número do cartão"
❌ "Não é possível continuar o pagamento com este cartão."
❌ "Nome do titular... não estamos finalizando pagamento"
```

---

## ✅ CARTÕES DE TESTE VERIFICADOS

### **1️⃣ CARTÃO DE TESTE MAIS CONFIÁVEL (Visa)**

```
Número do Cartão:    4111 1111 1111 1111
Validade (Mês):      11
Validade (Ano):      2025 (ou 25)
Código de Segurança: 123
Nome do Titular:     APRO (ou seu nome)
Email:               test@test.com
```

**Status:** ✅ DEVE SER APROVADO

---

### **2️⃣ CARTÃO ALTERNATIVO (Mastercard)**

```
Número do Cartão:    5500 0555 0000 0004
Validade (Mês):      11
Validade (Ano):      2025 (ou 25)
Código de Segurança: 123
Nome do Titular:     APRO
Email:               test@test.com
```

**Status:** ✅ DEVE SER APROVADO

---

### **3️⃣ CARTÕES COM RESULTADO ESPECÍFICO**

| Número | Resultado | Descrição |
|--------|-----------|-----------|
| `4111 1111 1111 1111` | ✅ Aprovado | Visa padrão |
| `5500 0555 0000 0004` | ✅ Aprovado | Mastercard |
| `4000 0000 0000 0002` | ❌ Recusado | Cartão recusado |
| `4000 0000 0000 0069` | ❌ Vencido | Cartão vencido |
| `5031 4333 3010 0003` | ✅ Aprovado | Mastercard alternativa |
| `3530 1113 3330 0000` | ✅ Aprovado | JCB |

---

## 🚨 POSSÍVEIS CAUSAS DO ERRO

### **1. Número do Cartão Inválido**
- ❌ Usando número real de cartão (NUNCA em modo teste!)
- ❌ Número com espaços ou caracteres especiais
- ❌ Número incompleto

**SOLUÇÃO:** Use exatamente `4111 1111 1111 1111` (sem espaços ao digitar)

---

### **2. Dados do Titular Incorretos**
- ❌ Campo de nome vazio
- ❌ Nome com caracteres especiais
- ❌ Email inválido

**SOLUÇÃO:**
```
Nome: APRO (ou João Silva)
Email: teste@teste.com
```

---

### **3. Data de Validade Expirada**
- ❌ Ano 2024 ou anterior
- ❌ Mês/ano no passado

**SOLUÇÃO:**
```
Validade: 11/2025 ou 12/2025
```

---

### **4. CVV/Código de Segurança Ausente**
- ❌ Deixado em branco
- ❌ Número incorreto

**SOLUÇÃO:**
```
CVV: 123 (qualquer número de 3 dígitos)
```

---

## 📋 PASSO-A-PASSO CORRETO

### **Etapa 1: Abra a página de checkout**
```
http://localhost:3000/checkout
```

### **Etapa 2: Preencha dados pessoais**
```
Nome Completo:    João Silva
Email:            teste@teste.com
Telefone:         11999999999
CEP:              01310100
Endereço:         Av. Paulista 1000
Complemento:      (deixe em branco)
Cidade:           São Paulo
Estado:           SP
```

### **Etapa 3: Selecione método de pagamento**
```
☑️ Cartão de Crédito (Selecionado por padrão)
```

### **Etapa 4: Clique "Continuar para Pagamento com Cartão"**
```
Console esperado:
✅ Validação de total OK
🔍 Verificando estoque
✅ Estoque OK
📦 Criando pedido
🔢 Código do pedido gerado: ORD-202511-XXXXX
✅ Mercado Pago preference created
```

### **Etapa 5: No formulário do Mercado Pago, preencha:**

**IMPORTANTE: Siga EXATAMENTE este formato**

```
┌─────────────────────────────────────┐
│ NÚMERO DO CARTÃO                    │
│ 4111 1111 1111 1111                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ VALIDADE                            │
│ 11 / 25                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ CÓDIGO DE SEGURANÇA                 │
│ 123                                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NOME DO TITULAR                     │
│ APRO                                │
└─────────────────────────────────────┘
```

### **Etapa 6: Clique "Continuar" ou "Pagar"**

**Esperado:**
```
✅ Pagamento Aprovado
✅ Redirecionado para /compra-sucesso
✅ Número do pedido exibido
```

---

## 🔍 VERIFICAR NO CONSOLE

Abra o DevTools do navegador (F12 → Console) e procure por:

### **✅ Sucesso:**
```javascript
POST /checkout 200
✅ Mercado Pago preference created: 692891333-xxxxx
```

### **❌ Erro (exemplo):**
```javascript
POST /checkout 500
❌ Checkout error: Invalid payment method
```

---

## 💡 TROUBLESHOOTING

### **Problema: "Cartão Recusado"**

1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Feche e reabra o navegador
3. Tente com o cartão `4111 1111 1111 1111`
4. Confirme se Data de Validade é FUTURA (ex: 11/2025)
5. Verifique se CVV tem 3 dígitos

### **Problema: Formulário não aparece após checkout**

1. Verifique se a preferência foi criada (console)
2. Confirme se `MERCADO_PAGO_ACCESS_TOKEN` está em `.env.local`
3. Tente recarregar a página (F5)
4. Limpe cookies: DevTools → Application → Cookies → Delete

### **Problema: "Nome do titular"**

1. Não deixe em branco
2. Use apenas letras (sem números ou caracteres especiais)
3. Tente: `APRO` ou `TESTE`
4. Email deve ser válido: `teste@teste.com`

---

## ✅ CHECKLIST FINAL

- [ ] Usando cartão `4111 1111 1111 1111`
- [ ] Data de validade `11/2025` ou `12/2025`
- [ ] CVV preenchido com `123`
- [ ] Nome do titular preenchido (ex: `APRO`)
- [ ] Email válido
- [ ] Número de cartão digitado SEM ESPAÇOS
- [ ] Console mostra `✅ Mercado Pago preference created`
- [ ] Botão "Pagar" está clicável (não desabilitado)

---

## 📞 Se o problema persistir

**Colete estas informações:**
1. Screenshot exato da mensagem de erro
2. Output completo do console (F12)
3. Resposta da rede (DevTools → Network → Busque "checkout")
4. URL atual quando o erro ocorre

Envie para análise técnica.
