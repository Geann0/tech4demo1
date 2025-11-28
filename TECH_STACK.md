# 🛠️ TECH STACK - Tech4Loop

## 📦 Dependências Principais (package.json)

### Core Framework

```json
{
  "next": "^14.2.3",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5"
}
```

### Banco de Dados & Auth

```json
{
  "@supabase/supabase-js": "^2.43.4",
  "@supabase/auth-helpers-nextjs": "^0.10.0"
}
```

### Validação & Segurança

```json
{
  "zod": "^3.22.4",
  "dompurify": "^3.3.0"
}
```

### Pagamentos

```json
{
  "mercadopago": "^2.0.9"
}
```

### Email

```json
{
  "resend": "^3.2.0",
  "@react-email/components": "^0.5.7"
}
```

### Geradores

```json
{
  "qrcode": "^1.5.4",
  "bwip-js": "^4.8.0",
  "pdfkit": "^0.17.2"
}
```

### UI & Icons

```json
{
  "lucide-react": "^0.554.0",
  "tailwindcss": "^3.4.1",
  "@tailwindcss/forms": "^0.5.7",
  "@tailwindcss/typography": "^0.5.19"
}
```

### Logging

```json
{
  "winston": "^3.11.0"
}
```

---

## 🧪 Dependências de Desenvolvimento

### Testing

```json
{
  "jest": "latest",
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "@testing-library/user-event": "latest",
  "ts-jest": "latest",
  "jest-environment-jsdom": "latest",
  "@types/jest": "latest"
}
```

### Linting & Formatting

```json
{
  "eslint": "^8",
  "eslint-config-next": "14.2.3",
  "prettier": "^3.2.5"
}
```

### Types

```json
{
  "@types/node": "^20",
  "@types/react": "18.3.27",
  "@types/react-dom": "^18",
  "@types/qrcode": "^1.5.6",
  "@types/pdfkit": "^0.17.3",
  "@types/bwip-js": "^3.2.3",
  "@types/dompurify": "^3.0.5"
}
```

---

## 📊 Versões Exigidas

| Ferramenta | Versão    | Status       |
| ---------- | --------- | ------------ |
| Node.js    | >= 18.0.0 | ✅ Instalado |
| npm        | >= 9.0.0  | ✅ Instalado |
| TypeScript | >= 5.0.0  | ✅ Instalado |
| Next.js    | 14.2.3    | ✅ Instalado |

---

## 🔄 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em localhost:3000

# Produção
npm run build            # Build para produção
npm start                # Inicia servidor de produção

# Linting & Formatting
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige erros de linting
npm run format           # Formata código com Prettier
npm run type-check       # Verifica tipos TypeScript

# Testes
npm test                 # Executa testes Jest
npm run test:watch       # Modo watch
npm run test:coverage    # Cobertura de testes
```

---

## 🔌 Integrações Externas

### Supabase

- **PostgreSQL Database** para armazenamento de dados
- **Auth** para autenticação de usuários
- **RLS (Row Level Security)** para permissões
- **Storage** para armazenamento de arquivos

### Mercado Pago

- **API de Pagamentos** para processar transações
- **Webhooks** para confirmação de pagamentos
- **Client-side Integration** para checkout

### ViaCEP

- **API de CEP** para busca de endereços
- **Cache em Memória** por 24 horas
- **Rate Limit** automático

### Resend

- **Email Service** para notificações
- **Templates React** para emails dinâmicos
- **Rastreamento de entrega**

---

## 📈 Performance

### Otimizações Implementadas

- ✅ Next.js Image Optimization
- ✅ Code Splitting automático
- ✅ Lazy Loading de componentes
- ✅ Cache de API responses (ViaCEP 24h)
- ✅ Database Indexing

### Recomendações Futuras

- [ ] Implementar Redis para cache
- [ ] CDN para assets estáticos
- [ ] Database query optimization
- [ ] Component memoization
- [ ] Service Worker para offline support

---

## 🔒 Segurança

### Implementado

- ✅ HTTPS/TLS em produção
- ✅ RLS (Row Level Security) no Supabase
- ✅ Input Validation com Zod
- ✅ XSS Prevention (React escaping)
- ✅ CSRF Protection (Next.js middleware)
- ✅ Rate Limiting em webhooks
- ✅ Error Handling estruturado

### Recomendações Futuras

- [ ] Implementar Sentry para error tracking
- [ ] Adicionar 2FA (Two-Factor Authentication)
- [ ] Implementar API Key rotation
- [ ] Audit logging completo
- [ ] Penetration testing

---

## 📝 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Mercado Pago
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=xxx
MERCADO_PAGO_ACCESS_TOKEN=xxx

# Email
RESEND_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 🚀 Deployment

### Suportado

- ✅ Vercel (recomendado para Next.js)
- ✅ AWS (EC2, Lambda)
- ✅ Google Cloud
- ✅ DigitalOcean
- ✅ Self-hosted

### Recomendação

**Vercel** é o provider recomendado para máxima performance e integração com Next.js.

---

## 📚 Documentação Oficial

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Mercado Pago Docs](https://www.mercadopago.com.br/developers/pt/docs)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Winston Docs](https://github.com/winstonjs/winston)

---

## 🔄 Atualizações Recomendadas

```bash
# Verificar versões desatualizadas
npm outdated

# Atualizar dependências
npm update

# Atualizar para major versions (cuidado!)
npm install next@latest

# Verificar vulnerabilidades
npm audit
npm audit fix
```
