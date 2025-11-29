# 🚀 VOCÊ ESTÁ AQUI: OBTER 3 CHAVES (10 MINUTOS)

---

## 🎯 OBJETIVO: 3 CHAVES SIMPLES

```
CHAVE 1: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
CHAVE 2: STRIPE_SECRET_KEY=sk_test_...
CHAVE 3: RESEND_API_KEY=re_...
```

**Tempo para obter:** 10 minutos  
**Arquivo para editar:** `.env.local`  
**Teste depois:** npm run test:api

---

## 📝 ARQUIVO A EDITAR

Abra seu editor favorito em:

```
C:\Users\haduk\OneDrive\Desktop\Tech4Loop (1)\Tech4Loop\.env.local
```

Procure por estas linhas (devem estar por volta da linha 13-16):

```env
# 🔐 STRIPE CONFIGURATION
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXX
STRIPE_WEBHOOK_SECRET=whsec_09da57b9d2ac8e29064f0dcd488932f11c18e60c388fa5fefd022c7c93f8ab22

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here
```

---

## 🔑 CHAVE #1: STRIPE PUBLISHABLE KEY (2 min)

### PASSO 1: Abra dashboard Stripe

```
https://dashboard.stripe.com/apikeys
```

### PASSO 2: Verifique MODE = Test

- Canto superior direito
- Deve estar em "Test mode" (azul escuro)
- Se estiver "Live mode", clique para mudar

### PASSO 3: Copie Publishable Key

Procure por:

```
📍 PUBLISHABLE KEY
Começa com: pk_test_
Exemplo: pk_test_51Pyn...
```

Copie a chave inteira!

### PASSO 4: Cole no .env.local

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Pyn...
                                   ↑ Cole aqui
```

---

## 🔐 CHAVE #2: STRIPE SECRET KEY (2 min)

### PASSO 1: Volte ao dashboard Stripe

```
https://dashboard.stripe.com/apikeys
```

### PASSO 2: Copie Secret Key

Procure por:

```
📍 SECRET KEY
Começa com: sk_test_
Exemplo: sk_test_4eC3...
```

⚠️ **IMPORTANTE:** Esta é SECRETA!

- Nunca compartilhe em chat/email
- Nunca faça commit no Git
- Guarde em local seguro

Copie a chave inteira!

### PASSO 3: Cole no .env.local

```env
STRIPE_SECRET_KEY=sk_test_4eC3...
                  ↑ Cole aqui
```

---

## 📧 CHAVE #3: RESEND API KEY (2 min)

### PASSO 1: Abra dashboard Resend

```
https://resend.com/api-keys
```

### PASSO 2: Clique "Create API Key"

- Nome: `Tech4Loop Dev` (ou qualquer)
- Clique "Create"
- Copie a chave que aparecer

### PASSO 3: Cole no .env.local

```env
RESEND_API_KEY=re_XXXXXXXXX
               ↑ Cole aqui
```

---

## ✅ DEPOIS DE COLAR AS 3 CHAVES

### Salve o arquivo

```
Ctrl+S  (ou seu editor favorito)
```

### Abra um novo terminal

```bash
# Terminal NOVO (não use o que tem npm run dev aberto)
cd "C:\Users\haduk\OneDrive\Desktop\Tech4Loop (1)\Tech4Loop"

# Verifique que as chaves foram salvas
cat .env.local | findstr "pk_test\|sk_test\|re_"

# Deve mostrar algo assim:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
# RESEND_API_KEY=re_...
```

### Teste as APIs

```bash
# No terminal NOVO, rode:
npm run test:api

# Resultado esperado: ✅ All tests passing
```

---

## 🧪 TESTE RÁPIDO DE PAGAMENTO (5 min)

Se os testes passarem, faça este teste manual:

### PASSO 1: Abra o checkout

```
http://localhost:3000/checkout
```

### PASSO 2: Preencha formulário

```
Email: teste@seu-email.com
Cartão: 4242 4242 4242 4242
Data: 12/34
CVV: 567
```

### PASSO 3: Clique "Pagar"

Verifique:

- ✅ Mensagem "Pagamento confirmado"
- ✅ No Terminal 2 (webhook), vê: `payment_intent.succeeded`
- ✅ Email de confirmação recebido

---

## 🎯 COMO EU VEJO ISSO FUNCIONANDO?

### Terminal 1 (deve estar rodando):

```bash
npm run dev
```

Deve mostrar:

```
✓ Ready in XXXms
 ▲ Next.js 14.2.3
 ○ Listening on http://localhost:3000
```

### Terminal 2 (deve estar rodando):

```bash
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
```

Deve mostrar:

```
> Ready! Your webhook signing secret is whsec_...
```

Quando você fizer um pagamento, verá:

```
2025-11-29 14:35:22   payment_intent.succeeded   [evt_1234...]
```

### Terminal 3 (seu novo terminal):

```bash
npm run test:api
```

Deve mostrar:

```
✅ POST /api/payments/create-intent        PASS
✅ POST /api/emails/send                   PASS
✅ POST /api/auth/verify-email             PASS
✅ POST /api/partners/dashboard            PASS

All tests passing!
```

---

## ⚠️ ERROS COMUNS

### "pk*test* not found"

```
❌ ERRO: Você não preencheu a chave
✅ SOLUÇÃO: Volte ao dashboard Stripe e copie novamente
```

### "Invalid Stripe API key"

```
❌ ERRO: A chave está incorreta ou malformada
✅ SOLUÇÃO:
1. Copie EXATAMENTE como aparece no dashboard
2. Sem espaços extras no início/fim
3. Salve .env.local
4. Feche e abra novo terminal
5. npm run dev novamente
```

### "RESEND_API_KEY is missing"

```
❌ ERRO: Você não preencheu Resend
✅ SOLUÇÃO: Vá em https://resend.com/api-keys e crie nova chave
```

### "Webhook verification failed"

```
❌ ERRO: O webhook secret está errado
✅ SOLUÇÃO:
1. Terminal 2 (Stripe): Ctrl+C para parar
2. stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
3. Copiar novo webhook secret
4. Colar em .env.local
5. npm run dev novamente
```

---

## 📋 CHECKLIST FINAL

```
[ ] Abri https://dashboard.stripe.com/apikeys
[ ] Copiei NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...)
[ ] Copiei STRIPE_SECRET_KEY (sk_test_...)
[ ] Abri https://resend.com/api-keys
[ ] Copiei RESEND_API_KEY (re_...)
[ ] Colei tudo no .env.local
[ ] Salvei .env.local (Ctrl+S)
[ ] Abri novo terminal
[ ] npm run test:api passou ✅
[ ] Testei pagamento manualmente ✅
[ ] Vi "payment_intent.succeeded" no Terminal 2 ✅
[ ] Recebi email de confirmação ✅

✅ TUDO FUNCIONANDO!
```

---

## 🎉 PRÓXIMO PASSO

Quando o checklist acima estiver completo:

**Me avise:** "Chaves obtidas e testes passando! ✅"

**E vamos:**

1. ✅ Validar frontend
2. ✅ Testar dashboard de parceiros
3. ✅ Fazer deploy

---

## ⏱ TIMELINE

```
⏳ AGORA: Obter chaves (10 min) ← VOCÊ ESTÁ AQUI
⏳ DEPOIS: Testar pagamento (5 min)
⏳ DEPOIS: Validar emails (5 min)
⏳ AMANHÃ: Frontend components (2h)
⏳ DIA 3: Deploy (1h)

TOTAL: 3-4 horas até LIVE 🚀
```

---

**Vamos lá! Você consegue! 💪**

Precisa de ajuda? Volte aqui ou consulte `STRIPE_READY_NEXT_STEPS.md` para detalhes completos.
