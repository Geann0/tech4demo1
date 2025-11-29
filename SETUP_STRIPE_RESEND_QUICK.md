# 🔐 GUIA COMPLETO: SETUP STRIPE + RESEND

Este guia mostra exatamente como obter cada chave e configurar tudo em 15 minutos.

---

## 🚀 PARTE 1: STRIPE SETUP (5 minutos)

### Passo 1: Criar Conta Stripe

1. Acesse https://stripe.com
2. Clique em **"Start now"** (canto superior direito)
3. Preencha o formulário:
   - Email
   - Senha
   - Aceite termos
4. Verifique seu email
5. Você receberá acesso ao Dashboard

### Passo 2: Obter Chaves de API

1. No Dashboard, clique no **menu de hambúrguer** (≡) no canto superior esquerdo
2. Vá para **Developers** → **API keys**
3. Você verá duas seções:

```
📍 TEST MODE (use para desenvolvimento)
├─ Publishable key:  pk_test_51234567890...
└─ Secret key:       sk_test_abcdef123...

📍 LIVE MODE (use após go-live)
├─ Publishable key:  pk_live_51234567890...
└─ Secret key:       sk_live_abcdef123...
```

4. **Para desenvolvimento**, copie as chaves de TEST MODE
5. Adicione ao `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51234567890...
STRIPE_SECRET_KEY=sk_test_abcdef123...
```

### Passo 3: Setup Webhook (crítico!)

**O que é webhook?** Um endpoint que Stripe chama quando um pagamento acontece.

#### Opção A: Setup para DESENVOLVIMENTO (local)

1. Instale **Stripe CLI**:
   - Windows: https://github.com/stripe/stripe-cli/releases
   - Mac: `brew install stripe/stripe-cli/stripe`

2. Abra um terminal e faça login:

   ```bash
   stripe login
   ```

   Você verá uma URL para confirmar no navegador. Clique em "Allow".

3. Em outro terminal, rode:

   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
   ```

4. Você verá algo assim:

   ```
   > Ready! Your webhook signing secret is: whsec_test_secret123...
   ```

5. Copie `whsec_test_secret123...` e adicione ao `.env.local`:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_test_secret123...
   ```

6. **MANTENHA ESTE TERMINAL ABERTO** enquanto testar pagamentos localmente!

#### Opção B: Setup para PRODUÇÃO (depois de go-live)

1. No Dashboard Stripe, vá para **Developers** → **Webhooks**
2. Clique em **"Add endpoint"**
3. Cole sua URL: `https://seu-dominio.com/api/payments/stripe-webhook`
4. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Clique em **"Add endpoint"**
6. Você receberá um `Signing secret` (whsec*live*...)
7. Adicione ao `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

### Passo 4: Testar Pagamento com Stripe Test Card

1. Abra seu aplicativo: http://localhost:3000
2. Vá para a página de checkout
3. Preencha com:
   - **Card**: `4242 4242 4242 4242` (cartão de teste)
   - **Exp**: `12/25` (qualquer data futura)
   - **CVC**: `123` (qualquer 3 dígitos)
4. Clique em "Pagar"
5. **Verificações**:
   - ✓ Viu mensagem de sucesso?
   - ✓ No Supabase, ordem tem `payment_status = 'completed'`?
   - ✓ Recebeu email de confirmação?
   - ✓ No webhook terminal, viu evento `payment_intent.succeeded`?

Se tudo passou ✓, Stripe está funcionando!

---

## 📧 PARTE 2: RESEND SETUP (5 minutos)

### Passo 1: Criar Conta Resend

1. Acesse https://resend.com
2. Clique em **"Sign up"**
3. Preencha com:
   - Email
   - Senha
4. Verifique seu email
5. Você receberá acesso ao Dashboard

### Passo 2: Obter API Key

1. No Dashboard, vá para **API Keys** (menu lateral)
2. Clique em **"Create API Key"**
3. Nomeiee: `Tech4Loop Development`
4. Você receberá uma chave tipo: `re_XXXXXXXXXXXXX`
5. Copie e adicione ao `.env.local`:

```env
RESEND_API_KEY=re_XXXXXXXXXXXXX
```

### Passo 3: Testar Envio de Email

```bash
# 1. Abra um terminal na raiz do projeto
npm run dev

# 2. Em outro terminal, teste a API de email:
curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmation",
    "email": "seu_email@gmail.com",
    "data": {
      "userName": "João",
      "verificationToken": "test123"
    }
  }'

# 3. Verifique sua caixa de email (pode ir para spam!)
# 4. Se recebeu, Resend está funcionando!
```

### Passo 4: Verificar Whitelisting (Importante!)

Na trial do Resend, você pode enviar para até 50 emails diferentes.

**Sua whitelist deve incluir**:

- Seu email pessoal (para testes)
- Email da empresa
- Email suporte
- Emails dos primeiros 50 clientes (após)

**Para adicionar emails à whitelist**:

1. No Dashboard → **Sent Emails**
2. Procure emails que falharam
3. Se vir "Email domain not verified", você pode usar apenas `resend.dev`:
   ```env
   NEXT_PUBLIC_APP_EMAIL=noreply@resend.dev
   ```

### Passo 5: Setup de Domínio Customizado (Opcional, depois)

Para enviar de seu domínio (ex: noreply@tech4loop.com):

1. No Dashboard → **Domains**
2. Clique **"Add Domain"**
3. Insira seu domínio: `tech4loop.com`
4. Resend fornecerá registros DNS a adicionar
5. Adicione ao seu provedor DNS (Namecheap, GoDaddy, etc)
6. Resend verifica automaticamente após configuração
7. Depois de verificado, use: `NEXT_PUBLIC_APP_EMAIL=noreply@tech4loop.com`

---

## ✅ PASSO 3: VERIFICAR TUDO ESTÁ FUNCIONANDO

Abra um terminal e rode:

```bash
# 1. Verificar arquivo .env.local existe
cat .env.local

# 2. Rodar a aplicação
npm run dev

# 3. Em outro terminal, rodar Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# 4. Abrir navegador: http://localhost:3000
```

### Teste Integrado:

1. **Pagar um pedido**:
   - Vá para http://localhost:3000/checkout
   - Preencha formulário
   - Use cartão de teste: 4242 4242 4242 4242
   - Clique "Pagar"
   - Verificar se:
     - ✓ Mensagem de sucesso aparece
     - ✓ No terminal de webhook, vê `payment_intent.succeeded`
     - ✓ No Supabase, order tem `payment_status = 'completed'`
     - ✓ Recebeu email de confirmação

2. **Verificar email**:
   - Vá para http://localhost:3000/register
   - Crie conta com novo email
   - Verifique se recebeu email com link de verificação
   - Clique no link
   - Verificar se página mostra "Email verificado ✓"

3. **Dashboard de parceiro**:
   - Se tiver parceiro, vá para http://localhost:3000/dashboard-parceiro
   - Verificar se mostra métricas e vendas

---

## 🎯 RESUMO DO QUE VOCÊ FARÁ:

| Serviço    | Ação                                        | Tempo      |
| ---------- | ------------------------------------------- | ---------- |
| Stripe     | Criar conta + copiar chaves + setup webhook | 5 min      |
| Resend     | Criar conta + copiar API key + testar email | 5 min      |
| .env.local | Adicionar todas as chaves                   | 2 min      |
| Testes     | Verificar pagamento + email + dashboard     | 3 min      |
| **TOTAL**  | **Tudo pronto para desenvolvimiento**       | **15 min** |

---

## 🆘 SE ALGO DER ERRADO

### Stripe: "Webhook secret verification failed"

```bash
# Solução:
# 1. Parar aplicação (Ctrl+C)
# 2. Parar stripe CLI (Ctrl+C)
# 3. Rodar novamente:
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook
# 4. Copiar webhook secret NOVO do output
# 5. Atualizar .env.local
# 6. Rodar aplicação novamente
```

### Resend: "Email not sending"

```bash
# Solução:
# 1. Verificar se RESEND_API_KEY está correto em .env.local
# 2. Verificar se o email é da whitelist (primeiros 50)
# 3. Testar com resend.dev: NEXT_PUBLIC_APP_EMAIL=noreply@resend.dev
# 4. Verificar logs: Dashboard Resend → Sent Emails
```

### Stripe: "Invalid API Key"

```bash
# Solução:
# 1. Ir para https://dashboard.stripe.com/apikeys
# 2. Verificar se está em TEST MODE (não LIVE)
# 3. Copiar chaves novamente, com cuidado
# 4. Atualizar .env.local
# 5. Rodar aplicação novamente
```

---

## 📋 CHECKLIST FINAL

- [ ] Conta Stripe criada
- [ ] Chaves Stripe adicionadas ao .env.local
- [ ] Webhook Stripe configurado (local com stripe CLI)
- [ ] Conta Resend criada
- [ ] API Key Resend adicionada ao .env.local
- [ ] Testou pagamento com cartão de teste ✓
- [ ] Recebeu email de confirmação ✓
- [ ] Dashboard de parceiro carrega dados ✓
- [ ] Todos os testes passam: `npm test` ✓

**PRONTO!** Seu sistema de pagamento e emails está vivo! 🎉

---

## 🚀 PRÓXIMO PASSO

Agora você pode:

1. ✅ Executar pagamentos reais (em test mode)
2. ✅ Enviar emails automáticos
3. ✅ Rastrear comissões de parceiros
4. ✅ Verificar emails de usuários

Quando estiver pronto para go-live:

1. Criar conta Stripe LIVE
2. Obter chaves LIVE (pk*live*, sk*live*)
3. Atualizar .env.local com chaves LIVE
4. Setup webhook LIVE
5. Fazer teste com cartão real (sua operadora pode bloquear)
6. Ir ao vivo! 🚀

---

**Dúvidas?** Revisite este guia ou cheque a documentação oficial:

- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
