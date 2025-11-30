# Tech4Loop - Versão DEMO 🎭

[![Demo Version](https://img.shields.io/badge/version-demo-yellow)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

> **⚠️ ATENÇÃO**: Esta é uma **versão demonstrativa** do projeto Tech4Loop. Nenhum pagamento real é processado e os produtos são fictícios. Ideal para portfólio e demonstrações.

## 📸 Sobre o Projeto

Tech4Loop é uma plataforma de e-commerce moderna focada em acessórios de tecnologia, desenvolvida com Next.js 14, React 18 e TypeScript. Esta versão demo apresenta todas as funcionalidades visuais e de interface sem necessidade de configurar APIs externas.

### ✨ Funcionalidades (Versão Demo)

- ✅ **Catálogo de Produtos** - 8 produtos fictícios pré-carregados
- ✅ **Página de Detalhes** - Visualização completa de produtos
- ✅ **Sistema de Carrinho** - Adicionar/remover itens
- ✅ **Checkout Simulado** - Formulário completo sem processamento real
- ✅ **Design Responsivo** - Otimizado para mobile, tablet e desktop
- ✅ **Dark Mode** - Interface moderna com tema escuro
- ✅ **Animações Suaves** - Transições e efeitos visuais
- ✅ **SEO Otimizado** - Meta tags e estrutura semântica

### 🚫 Funcionalidades Desabilitadas (Versão Demo)

- ❌ Integração com gateway de pagamento (Stripe/MercadoPago)
- ❌ Banco de dados (Supabase)
- ❌ Sistema de autenticação real
- ❌ Envio de emails
- ❌ Emissão de notas fiscais
- ❌ Integração com transportadoras

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/Tech4Loop-Demo.git
cd Tech4Loop-Demo
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o ambiente (OBRIGATÓRIO)**

```bash
# Windows PowerShell
Copy-Item .env.demo .env.local

# Linux/Mac
cp .env.demo .env.local
```

> ⚠️ **IMPORTANTE**: O arquivo `.env.local` é necessário para evitar erros. Ele contém valores mock que não fazem conexões reais.

4. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

5. **Acesse no navegador**

```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas e rotas (Next.js App Router)
│   ├── page.tsx           # Página inicial
│   ├── produtos/          # Listagem de produtos
│   ├── checkout/          # Processo de checkout
│   └── ...
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários e helpers
│   └── mockData.ts       # Dados fictícios (produtos demo)
├── types/                 # Definições TypeScript
└── styles/               # Estilos globais
```

## 🎨 Tecnologias Utilizadas

### Frontend

- **Next.js 14** - Framework React com SSR e App Router
- **React 18** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Lucide React** - Ícones modernos

### Ferramentas de Desenvolvimento

- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Jest** - Testes unitários
- **Testing Library** - Testes de componentes

## 🎯 Casos de Uso

Esta versão demo é perfeita para:

- 📊 **Portfólio de Desenvolvedores** - Demonstrar habilidades em Next.js e React
- 🎓 **Estudos e Aprendizado** - Base para aprender desenvolvimento web moderno
- 🧪 **Testes de Interface** - Validar designs e fluxos de usuário
- 💼 **Apresentações** - Mostrar funcionalidades sem infraestrutura complexa

## 🔄 Versão Completa

Para rodar a versão completa com todas as integrações:

1. Configure o Supabase (banco de dados)
2. Adicione credenciais do MercadoPago
3. Configure o Resend para envio de emails
4. Consulte o arquivo `.env.example` para todas as variáveis

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa o linter
npm run format       # Formata o código
npm test             # Executa testes
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto é uma **versão demonstrativa** para fins educacionais e de portfólio.

**Veja `LICENSE-DEMO.md` para detalhes completos sobre uso e restrições.**

### Resumo da Licença:

- ✅ **Permitido**: Uso em portfólio, estudos, projetos pessoais
- ❌ **Não Permitido**: Revenda, uso comercial direto sem modificações
- ⚠️ **Aviso**: Não inclui licenças de APIs de terceiros (você deve obter as suas próprias)

Para uso comercial, você deve configurar suas próprias credenciais e estar em conformidade com todas as leis aplicáveis.

## 👤 Autor

**Seu Nome**

- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [seu-perfil](https://linkedin.com/in/seu-perfil)

## 🙏 Agradecimentos

- Design inspirado em lojas modernas de tecnologia
- Imagens de produtos via Unsplash
- Comunidade Next.js e React

---

**⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!**

## 📞 Suporte

Para dúvidas ou sugestões:

- Abra uma [issue no GitHub](https://github.com/seu-usuario/Tech4Loop-Demo/issues)
- Entre em contato via email: seu-email@exemplo.com

---

**Feito com ❤️ e Next.js**
