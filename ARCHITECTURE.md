# 🏗️ ARQUITETURA DO TECH4LOOP

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitetura de Pastas](#arquitetura-de-pastas)
4. [Fluxos Principais](#fluxos-principais)
5. [Componentes Core](#componentes-core)
6. [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)

---

## 🎯 Visão Geral

Tech4Loop é uma plataforma de e-commerce completa com suporte a:

- **Múltiplos Parceiros (Marketplace)**
- **Sistema de Cobertura Geográfica** (CEP, Estados, Cidades)
- **Pagamentos via Mercado Pago**
- **Rastreamento de Pedidos**
- **Autenticação com RLS (Row Level Security)**
- **Geração de Etiquetas e QR Codes**

---

## 🛠️ Stack Tecnológico

### Frontend

- **Next.js 14.2.3** - Framework React com SSR
- **React 18** - UI Library
- **TypeScript 5** - Type Safety
- **Tailwind CSS 3.4.1** - Styling
- **Lucide React** - Icons

### Backend

- **Next.js API Routes** - Serverless API
- **Supabase PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase RLS** - Row Level Security

### Integrações

- **Mercado Pago** - Payment Gateway
- **Resend** - Email Service
- **ViaCEP** - CEP Lookup

### DevOps & Quality

- **Jest** - Unit Testing
- **React Testing Library** - Component Testing
- **Winston** - Logging
- **ESLint** - Code Linting
- **Prettier** - Code Formatting

---

## 📁 Arquitetura de Pastas

```
src/
├── app/                      # Next.js App Router
│   ├── admin/               # Admin Dashboard
│   ├── api/                 # API Routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── checkout/       # Checkout endpoints
│   │   ├── orders/         # Order endpoints
│   │   ├── products/       # Product endpoints
│   │   └── webhooks/       # Pagamento webhooks
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── [dynamic]/           # Dynamic pages
│
├── components/
│   ├── ErrorBoundary/       # Error Boundary Component
│   ├── ui/                  # Reusable UI components
│   └── checkout/            # Checkout-specific components
│
├── lib/
│   ├── __tests__/           # Unit Tests
│   │   ├── utils.test.ts
│   │   ├── validations.test.ts
│   │   └── geolocation.test.ts
│   ├── auth.ts              # Authentication utilities
│   ├── error-handler.ts     # Error handling
│   ├── geolocation.ts       # CEP & location validation
│   ├── logger.ts            # Logging utilities
│   ├── supabaseClient.ts    # Supabase initialization
│   ├── utils.ts             # General utilities
│   ├── validations.ts       # Zod schemas
│   └── [helpers]/           # Other helper utilities
│
├── types/
│   └── index.ts             # Global type definitions
│
└── contexts/
    └── [state]/             # React Context providers

database_migrations/
├── EXECUTE_THIS_FIRST.sql   # Initial setup
├── lgpd_complete.sql        # LGPD compliance
└── [feature]/               # Feature-specific migrations
```

---

## 🔄 Fluxos Principais

### 1️⃣ Fluxo de Checkout

```
Cliente → Seleciona Produto
         ↓
    Preenche Dados (CEP, Email, Telefone)
         ↓
    Validação de CEP (ViaCEP)
         ↓
    Verifica Cobertura do Parceiro
         ↓
    Valida Todas as Informações (Zod)
         ↓
    Cria Pedido no Supabase
         ↓
    Redireciona para Mercado Pago
         ↓
    Webhook Retorna (Aprovado/Rejeitado)
         ↓
    Atualiza Status do Pedido
```

### 2️⃣ Fluxo de Autenticação

```
Usuário → Login/Register
        ↓
   Supabase Auth
        ↓
   JWT Token
        ↓
   RLS Policies Aplicadas
        ↓
   Acesso Personalizado
```

### 3️⃣ Fluxo de Logging & Error Handling

```
Erro em Componente/API
        ↓
   Capturado por ErrorBoundary/Middleware
        ↓
   Logado via Winston
        ↓
   Resposta Padronizada Retornada
        ↓
   User-Friendly Message Exibida
```

---

## 🔧 Componentes Core

### Validações (Zod)

- **validations.ts** - Schemas de checkout, cupons, perfil
- **Validação de CEP** - Formato XX.XXX-XXX
- **Validação de Email** - Domínios conhecidos
- **Validação de Telefone** - (XX) 99999-9999

### Geolocalização

- **fetchCEPData()** - Busca dados via ViaCEP com cache 24h
- **isCityInCoverage()** - Verifica cobertura por cidade
- **isStateInCoverage()** - Verifica cobertura por estado
- **isCEPInCoverage()** - Valida cobertura completa

### Utilidades

- **formatCurrency()** - Formata valores BRL
- **formatCEP()** - Formata CEP para 12345-678
- **formatPhone()** - Formata telefone para (XX) 9XXXX-XXXX
- **generateSlug()** - Cria slugs a partir de textos
- **calculateFeeAmount()** - Calcula taxa de 7.5%

### Logging

- **logInfo()** - Informações gerais
- **logError()** - Erros com stack trace
- **logWarn()** - Avisos
- **logDebug()** - Debug info

### Error Handling

- **AppError** - Classe customizada de erro
- **ErrorBoundary** - Captura erros de componentes
- **handleAsync()** - Wrapper para tratamento em API routes
- **errorResponse()** - Resposta padronizada de erro

---

## 📐 Padrões de Desenvolvimento

### 1. Validação com Zod

```typescript
import { checkoutFormSchema } from "@/lib/validations";

const result = checkoutFormSchema.safeParse(data);
if (!result.success) {
  // Handle validation errors
}
```

### 2. API Routes com Error Handling

```typescript
import {
  handleAsync,
  successResponse,
  AppError,
  ErrorType,
} from "@/lib/error-handler";

export async function POST(req: NextRequest) {
  return handleAsync(req, async () => {
    // Your logic here
    return NextResponse.json(successResponse(data));
  });
}
```

### 3. Logging em Componentes

```typescript
import { logError, logInfo } from "@/lib/logger";

try {
  logInfo("Processing checkout", { userId });
  // Your logic
} catch (error) {
  logError("Checkout failed", error, { userId });
}
```

### 4. Error Boundary em Páginas

```typescript
import ErrorBoundary from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  )
}
```

### 5. Testes Unitários

```typescript
describe("Utils - formatCurrency", () => {
  it("should format value as BRL", () => {
    expect(formatCurrency(100)).toContain("100");
  });
});
```

---

## 🔐 Security Highlights

- ✅ **RLS Policies** - Row Level Security no Supabase
- ✅ **Input Validation** - Zod schemas em todas as inputs
- ✅ **XSS Prevention** - React escapa HTML automaticamente
- ✅ **CSRF Protection** - Next.js middleware
- ✅ **Rate Limiting** - Webhook rate limiting implementado
- ✅ **Error Handling** - Erros tratados gracefully

---

## 📊 Testes

**Total de Testes: 46**

- ✅ Utils: 16 testes
- ✅ Validations: 20 testes
- ✅ Geolocation: 10 testes

**Como Rodar:**

```bash
npm test                # Rodar testes uma vez
npm run test:watch     # Modo watch
npm run test:coverage  # Com cobertura
```

---

## 🚀 Próximos Passos

- [ ] Implementar Testes de Integração (Checkout Flow)
- [ ] Setup Husky + Pre-commit Hooks
- [ ] Configurar GitHub Actions CI/CD
- [ ] Otimizações de Performance
- [ ] Security Audit Final
- [ ] Deploy para Staging

---

## 📚 Documentação Adicional

- **API_DOCUMENTATION.md** - Endpoints e exemplos
- **DEPLOYMENT.md** - Guia de deployment
- **TROUBLESHOOTING.md** - Problemas comuns
- **CONTRIBUTING.md** - Guia para contribuidores
