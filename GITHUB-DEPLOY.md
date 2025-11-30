# 🚀 Guia de Deploy no GitHub - Tech4Loop Demo

## Passos para adicionar ao GitHub e portfólio

### 1. Preparar o repositório local

```bash
# Remover o repositório git existente (se houver)
Remove-Item -Recurse -Force .git

# Inicializar novo repositório
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "🎭 Versão demo inicial - Tech4Loop"
```

### 2. Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `Tech4Loop-Demo`
3. Descrição: `E-commerce demo moderno de acessórios tech - Next.js 14, React 18, TypeScript`
4. Marque como **Público** (para portfólio)
5. **NÃO** inicialize com README (já temos um)
6. Clique em "Create repository"

### 3. Conectar e fazer push

```bash
# Adicionar remote (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/Tech4Loop-Demo.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Fazer push
git push -u origin main
```

### 4. Deploy na Vercel (Recomendado - Grátis)

#### Opção A: Via GitHub (Mais fácil)

1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Importe o repositório `Tech4Loop-Demo`
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Clique em "Deploy"

**Pronto!** Seu site estará no ar em poucos minutos.

#### Opção B: Via Vercel CLI

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### 5. Configurar no seu portfólio

Adicione ao seu portfólio:

**Tech4Loop - E-commerce Demo**
- 🔗 **Live Demo**: https://tech4loop-demo.vercel.app (ou sua URL)
- 💻 **GitHub**: https://github.com/SEU-USUARIO/Tech4Loop-Demo
- 🛠️ **Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS
- ✨ **Destaques**:
  - Interface moderna e responsiva
  - Sistema de carrinho completo
  - Checkout simulado
  - Design system customizado
  - Performance otimizada (Lighthouse 95+)

### 6. Melhorias opcionais antes do deploy

```bash
# Otimizar imagens
npm install sharp

# Adicionar mais produtos mock (edite src/lib/mockData.ts)
# Ajustar cores e branding (edite tailwind.config.ts)
# Adicionar seu nome/info no footer
```

### 7. Badges para o README

Adicione estes badges ao README-DEMO.md:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SEU-USUARIO/Tech4Loop-Demo)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://tech4loop-demo.vercel.app)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/SEU-USUARIO/Tech4Loop-Demo)
```

### 8. Screenshot para portfólio

Tire screenshots das páginas principais:
- Home page
- Página de produtos
- Detalhes do produto
- Carrinho
- Checkout

Use ferramentas como:
- https://www.screely.com/ (adiciona moldura bonita)
- https://shots.so/ (mockups em dispositivos)

### 9. Atualizar informações pessoais

Edite os seguintes arquivos com suas informações:

- `README-DEMO.md` - Seu nome, GitHub, LinkedIn
- `src/app/layout.tsx` - Metadados
- `src/components/Footer.tsx` - Informações de contato

### 10. Divulgar

Compartilhe seu projeto:
- ✅ LinkedIn: Post mostrando o projeto
- ✅ Twitter/X: Thread técnica
- ✅ Dev.to: Artigo sobre o desenvolvimento
- ✅ Portfolio pessoal: Adicione na seção de projetos

---

## 🎯 Checklist antes do push

- [ ] Remover `.env.local` do repositório
- [ ] Verificar que `.gitignore` está correto
- [ ] README-DEMO.md atualizado com suas informações
- [ ] Testar `npm run build` localmente
- [ ] Código formatado (`npm run format`)
- [ ] Sem erros de lint (`npm run lint`)

## 📝 Comandos úteis

```bash
# Ver status do git
git status

# Ver histórico de commits
git log --oneline

# Criar nova branch para features
git checkout -b feature/nova-funcionalidade

# Atualizar repositório remoto
git push origin main

# Ver diferenças
git diff
```

---

**Dica**: Sempre teste localmente antes de fazer push:
```bash
npm run build
npm start
```

Boa sorte com seu portfólio! 🚀
