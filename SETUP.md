# 🔧 Setup Completo - Tech4Loop Demo

## ⚡ Setup Rápido (Recomendado)

### Passo 1: Clonar e Instalar

```powershell
# Clone o repositório
git clone https://github.com/seu-usuario/Tech4Loop-Demo.git
cd Tech4Loop-Demo

# Instale as dependências
npm install
```

### Passo 2: Configurar Ambiente (OBRIGATÓRIO)

```powershell
# Windows PowerShell
Copy-Item .env.demo .env.local

# Verificar se foi criado
Get-Content .env.local
```

> ⚠️ **IMPORTANTE**: Sem o arquivo `.env.local`, você verá erro sobre Supabase.

### Passo 3: Iniciar

```powershell
npm run dev
```

Acesse: http://localhost:3000

---

## 🐛 Soluções para Erros Comuns

### ❌ Erro: "NEXT_PUBLIC_SUPABASE_URL ... are required!"

**Causa**: Arquivo `.env.local` não existe ou está vazio.

**Solução**:

```powershell
# Certifique-se que o arquivo foi copiado
Copy-Item .env.demo .env.local -Force

# Reinicie o servidor
# Pressione Ctrl+C no terminal e rode novamente:
npm run dev
```

### ❌ Erro: "Module not found" ou dependências faltando

**Solução**:

```powershell
# Reinstale as dependências
Remove-Item -Recurse -Force node_modules
npm install
```

### ❌ Erro: Build falha ou erros de TypeScript

**Solução**:

```powershell
# Limpe o cache do Next.js
Remove-Item -Recurse -Force .next

# Reconstrua
npm run build
```

### ❌ Erro: Porta 3000 já está em uso

**Solução**:

```powershell
# Use outra porta
npm run dev -- -p 3001

# Ou mate o processo na porta 3000
netstat -ano | findstr :3000
# Anote o PID e:
taskkill /PID [número] /F
```

### ❌ Imagens não carregam

**Causa**: Imagens do Unsplash podem estar bloqueadas ou lentas.

**Solução**: As imagens são externas (Unsplash). Se estiverem lentas, aguarde o carregamento. Para produção, use imagens locais.

---

## 📋 Checklist de Verificação

Antes de rodar o projeto, verifique:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Dependências instaladas (`node_modules` existe)
- [ ] Arquivo `.env.local` existe (copiar de `.env.demo`)
- [ ] Porta 3000 está livre
- [ ] Sem erros no terminal após `npm run dev`

---

## 🔍 Verificar se está funcionando

### 1. Homepage

- [ ] Acessar http://localhost:3000
- [ ] Ver banner amarelo "VERSÃO DEMO"
- [ ] Ver 3 produtos em destaque
- [ ] Produtos têm imagens, preços e botões

### 2. Página de Produtos

- [ ] Acessar http://localhost:3000/produtos
- [ ] Ver lista de 8 produtos
- [ ] Filtros funcionam (ordenar por preço)
- [ ] Clicar em produto abre detalhes

### 3. Carrinho

- [ ] Adicionar produto ao carrinho
- [ ] Ver badge com quantidade no ícone do carrinho
- [ ] Abrir carrinho (clicar no ícone)
- [ ] Ver produto adicionado
- [ ] Aumentar/diminuir quantidade
- [ ] Remover produto

### 4. Checkout

- [ ] Com produto no carrinho, clicar "Finalizar Compra"
- [ ] Ver formulário de checkout
- [ ] Ver banner "VERSÃO DEMO"
- [ ] Preencher formulário (dados fictícios OK)
- [ ] CEP auto-completa endereço
- [ ] Clicar "Continuar para Pagamento"
- [ ] Ver mensagem de sucesso simulada

---

## 🎨 Personalização

### Mudar Cores

Edite `tailwind.config.ts`:

```typescript
colors: {
  'neon-blue': '#00D9FF',      // Azul neon
  'electric-purple': '#B24BF3', // Roxo elétrico
  // Mude para suas cores preferidas
}
```

### Adicionar Mais Produtos

Edite `src/lib/mockData.ts`:

```typescript
export const mockProducts = [
  // Adicione mais produtos aqui
  {
    id: "demo-9",
    name: "Seu Produto",
    slug: "seu-produto",
    // ...
  },
];
```

### Atualizar Footer

Edite `src/components/Footer.tsx` com suas informações.

---

## 🚀 Próximo Passo: Deploy

Tudo funcionando localmente?

👉 Veja `GITHUB-DEPLOY.md` para instruções de deploy na Vercel (grátis).

---

## 💡 Dicas

1. **Use o DevTools**: Abra F12 no navegador para ver console e erros
2. **Hot Reload**: Ao salvar arquivos, a página recarrega automaticamente
3. **Limpe o cache**: Se algo não atualizar, use Ctrl+Shift+R
4. **Teste no Mobile**: Use F12 → Toggle Device Toolbar

---

## 📞 Ainda com problemas?

1. Verifique se seguiu TODOS os passos
2. Leia as mensagens de erro no terminal
3. Verifique se `.env.local` existe e tem conteúdo
4. Tente limpar tudo e recomeçar:

```powershell
Remove-Item -Recurse -Force node_modules, .next, .env.local
Copy-Item .env.demo .env.local
npm install
npm run dev
```

Se o erro persistir, abra uma issue no GitHub com:

- Mensagem de erro completa
- Versão do Node.js (`node --version`)
- Sistema operacional
- O que você já tentou
