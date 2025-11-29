# ✅ STRIPE LOGIN COMPLETO - PRÓXIMOS PASSOS

## 🎉 STATUS ATUAL

```
✅ Stripe CLI instalado em C:\stripe-cli
✅ Stripe CLI logado na sua conta
✅ Webhook listener rodando
✅ Webhook Secret obtido
✅ .env.local atualizado com webhook secret
```

---

## 🔑 CHAVES QUE VOCÊ PRECISA OBTER AGORA

### 1️⃣ STRIPE PUBLISHABLE KEY (pk*test*...)

```
1. Abra: https://dashboard.stripe.com/apikeys
2. Verifique: Mode = "Test" (canto superior direito)
3. Procure por: "Publishable key"
4. Copie: pk_test_XXXXXXXXX
5. Cole em: .env.local linha 13
```

**Seu .env.local linha 13 deve ficar assim:**

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXX
```

### 2️⃣ STRIPE SECRET KEY (sk*test*...)

```
1. Abra: https://dashboard.stripe.com/apikeys
2. Procure por: "Secret key"
3. Copie: sk_test_XXXXXXXXX
4. Cole em: .env.local linha 14
```

**Seu .env.local linha 14 deve ficar assim:**

```env
STRIPE_SECRET_KEY=sk_test_XXXXXXXXX
```

### 3️⃣ RESEND API KEY (re\_...)

```
1. Abra: https://resend.com/api-keys
2. Clique: "Create API Key"
3. Nome: "Tech4Loop Dev"
4. Copie: re_XXXXXXXXX
5. Cole em: .env.local linha 16
```

**Seu .env.local linha 16 deve ficar assim:**

```env
RESEND_API_KEY=re_XXXXXXXXX
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

```
✅ Stripe CLI logado
✅ Webhook rodando (terminal aberto)
✅ STRIPE_WEBHOOK_SECRET no .env.local

⏳ AGORA VOCÊ PRECISA:
  [ ] Obter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  [ ] Obter STRIPE_SECRET_KEY
  [ ] Obter RESEND_API_KEY
  [ ] Colar tudo no .env.local
  [ ] Salvar .env.local
  [ ] Abrir novo terminal
  [ ] npm run dev
  [ ] Testar pagamento em localhost:3000
```

---

## 🚀 COMO OBTER AS CHAVES (PASSO A PASSO)

### PASSO 1: Stripe Publishable Key (2 min)

1. **Abra no navegador:**

   ```
   https://dashboard.stripe.com/apikeys
   ```

2. **Verifique o MODE:**
   - Canto superior direito
   - Deve estar em "Test mode" (não Live)
   - Se estiver em Live, clique para mudar para Test

3. **Procure por "Publishable key":**
   - Começa com `pk_test_`
   - Exemplo: `pk_test_51PynQxJXrYZaBcDeFgHiJkLmNoPqRsT`

4. **Copie a chave:**

   ```
   pk_test_51PynQxJXrYZaBcDeFgHiJkLmNoPqRsT
   ```

5. **Cole no arquivo .env.local:**

   ```
   C:\Users\haduk\OneDrive\Desktop\Tech4Loop (1)\Tech4Loop\.env.local

   Linha 13:
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51PynQxJXrYZaBcDeFgHiJkLmNoPqRsT
   ```

### PASSO 2: Stripe Secret Key (2 min)

⚠️ **IMPORTANTE: Esta chave é SECRETA! Nunca compartilhe!**

1. **Volte para:**

   ```
   https://dashboard.stripe.com/apikeys
   ```

2. **Procure por "Secret key":**
   - Começa com `sk_test_`
   - Exemplo: `sk_test_4eC39HqLyjWDarhtT123456789AbCdEfG`

3. **Clique em "Reveal token key"** se não aparecer a chave completa

4. **Copie:**

   ```
   sk_test_4eC39HqLyjWDarhtT123456789AbCdEfG
   ```

5. **Cole no .env.local:**
   ```
   Linha 14:
   STRIPE_SECRET_KEY=sk_test_4eC39HqLyjWDarhtT123456789AbCdEfG
   ```

### PASSO 3: Resend API Key (2 min)

1. **Abra no navegador:**

   ```
   https://resend.com/api-keys
   ```

2. **Clique em "Create API Key":**
   - Nome: `Tech4Loop Dev` (ou qualquer nome)
   - Deixar "Permissions" no padrão
   - Clique "Create"

3. **Copie a chave:**
   - Começa com `re_`
   - Exemplo: `re_8r2QJ9Kd1F2mP3nQ4rS5tU6vW7xY8z9A`

4. **Cole no .env.local:**
   ```
   Linha 16:
   RESEND_API_KEY=re_8r2QJ9Kd1F2mP3nQ4rS5tU6vW7xY8z9A
   ```

---

## 📝 VERIFICAR .env.local

Seu arquivo deve ter estas linhas preenchidas:

```env
# 🔐 STRIPE CONFIGURATION
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXX
STRIPE_WEBHOOK_SECRET=whsec_09da57b9d2ac8e29064f0dcd488932f11c18e60c388fa5fefd022c7c93f8ab22

# Email Configuration (Resend)
RESEND_API_KEY=re_XXXXXX
EMAIL_FROM=hadukcomenta@gmail.com
ADMIN_EMAIL=hadukcomenta@gmail.com
```

---

## ⚡ PRÓXIMOS PASSOS

### Passo 1: Salvar .env.local

```
Abra o arquivo
Preencha as 3 chaves
Salve (Ctrl+S)
```

### Passo 2: Abrir novo terminal

```bash
# Terminal NOVO (terminal anterior continue rodando)
cd C:\Users\haduk\OneDrive\Desktop\Tech4Loop

# Rodar servidor
npm run dev
```

### Passo 3: Testar em 3 terminais

```bash
# Terminal 1 (já aberto com npm run dev)
npm run dev
# Resultado esperado: "✓ Ready in XXXms" em http://localhost:3000

# Terminal 2 (continua aberto)
$env:PATH += ";C:\stripe-cli"; stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
# Resultado esperado: "Ready! Your webhook signing secret is whsec_..."

# Terminal 3 (NOVO)
npm run test:api
# Resultado esperado: ✅ All tests passing
```

### Passo 4: Testar pagamento

1. **Abra browser:**

   ```
   http://localhost:3000/checkout
   ```

2. **Preencha com dados de teste:**

   ```
   Email: teste@example.com
   Cartão: 4242 4242 4242 4242
   Data: 12/34
   CVV: 567
   ```

3. **Clique: "Pagar"**

4. **Verifique:**
   - ✅ Mensagem "Pagamento confirmado"
   - ✅ No terminal de webhook, viu `payment_intent.succeeded`
   - ✅ Email de confirmação recebido
   - ✅ Pedido aparece em `/admin/orders`

---

## 🎯 RESUMO VISUAL

```
┌──────────────────────────────────────────────┐
│  Stripe Setup: 75% Completo                   │
├──────────────────────────────────────────────┤
│                                              │
│  ✅ Stripe CLI instalado                    │
│  ✅ Stripe CLI logado                       │
│  ✅ Webhook rodando                         │
│  ✅ STRIPE_WEBHOOK_SECRET no .env.local     │
│                                              │
│  ⏳ Obter PUBLISHABLE KEY                    │
│  ⏳ Obter SECRET KEY                         │
│  ⏳ Obter RESEND API KEY                     │
│                                              │
│  Tempo: 10 minutos                           │
│                                              │
└──────────────────────────────────────────────┘
```

---

## ❌ TROUBLESHOOTING

### Erro: "stripe command not found"

```
Solução:
1. Terminal NOVO
2. $env:PATH += ";C:\stripe-cli"
3. stripe --version
4. stripe login
```

### Erro: "STRIPE_PUBLISHABLE_KEY not in .env"

```
Solução:
1. Abra .env.local
2. Procure por linha 13
3. Preencha com pk_test_...
4. Salve (Ctrl+S)
5. npm run dev novamente
```

### Erro: "Invalid Stripe keys"

```
Solução:
1. https://dashboard.stripe.com/apikeys
2. Copie chaves NOVAMENTE com cuidado
3. Colar em .env.local
4. Salve
5. npm run dev novamente
```

### Erro: "Webhook verification failed"

```
Solução:
1. Fechar Stripe CLI (Ctrl+C)
2. stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
3. Copiar webhook secret NOVO do output
4. Atualizar .env.local linha 15
5. Salve
6. npm run dev novamente
```

---

## ✅ CHECKLIST FINAL

- [ ] Stripe CLI instalado em C:\stripe-cli
- [ ] Stripe CLI logado em sua conta
- [ ] Webhook rodando em terminal (Terminal 2)
- [ ] STRIPE_WEBHOOK_SECRET no .env.local
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no .env.local
- [ ] STRIPE_SECRET_KEY no .env.local
- [ ] RESEND_API_KEY no .env.local
- [ ] npm run dev rodando sem erros (Terminal 1)
- [ ] npm run test:api passando (Terminal 3)
- [ ] Pagamento de teste bem-sucedido
- [ ] Email de confirmação recebido
- [ ] Webhook viu `payment_intent.succeeded`

**Quando TUDO estiver ✓, você está pronto para go-live!** 🚀

---

## 📞 PRÓXIMO PASSO

**Quando terminar a configuração acima:**

1. Enviar mensagem aqui
2. Vamos testar checkout completo
3. Vamos validar integração com parceiros
4. Vamos fazer deploy

**Tempo total restante:** 2-3 horas até LIVE! 🎉

---

**Dúvidas?** Volte a este arquivo ou consulte:

- Stripe Docs: https://stripe.com/docs
- Resend Docs: https://resend.com/docs
- SETUP_STRIPE_RESEND_QUICK.md (guia completo)
