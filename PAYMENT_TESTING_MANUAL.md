# 📊 RELATÓRIO DE TESTE DE PAGAMENTO

**Data:** 29 de Novembro de 2025  
**Objetivo:** Diagnosticar problema: "Não é possível continuar o pagamento com este cartão"

---

## 🔍 PASSO 1: VERIFICAR SE O SERVIDOR ESTÁ RODANDO

Abra um terminal PowerShell e execute:

```powershell
# Verificar se a porta 3000 está aberta
Test-NetConnection localhost -Port 3000
```

**Esperado:**

```
TcpTestSucceeded : True
```

---

## 📝 PASSO 2: VERIFICAR LOGS DO SERVIDOR

1. No terminal onde rodou `npm run dev`, procure por estas mensagens de **SUCESSO**:

```
✓ Ready in X.Xs
GET /checkout 200
POST /checkout 200
✅ Validação de total OK
✅ Estoque OK
🔢 Código do pedido gerado: ORD-202511-XXXXX
✅ Mercado Pago preference created
```

2. Se aparecer algum **ERRO** (linhas começando com ❌), anote-o

---

## 🌐 PASSO 3: ABRIR PÁGINA DE CHECKOUT

1. Abra navegador (Chrome, Firefox, Edge)
2. Vá para: **http://localhost:3000/checkout**
3. Você deve ver um formulário com campos:
   - Nome Completo
   - Email
   - Telefone
   - CEP
   - Endereço
   - Cidade
   - Estado

---

## 📋 PASSO 4: PREENCHER DADOS

Copie e cole EXATAMENTE:

```
Nome:       João da Silva
Email:      teste@teste.com
Telefone:   11999999999
CEP:        01310100
Endereço:   Avenida Paulista 1000
Cidade:     São Paulo
Estado:     SP
```

---

## 💳 PASSO 5: SELECIONAR MÉTODO DE PAGAMENTO

Marque: **☑️ 💳 Cartão de Crédito**

---

## 🎯 PASSO 6: CLICAR NO BOTÃO

Clique em: **"💳 Continuar para Pagamento com Cartão"**

**Esperado no console do servidor:**

```
✅ Validação de total OK
🔍 Verificando estoque
✅ Intercomunicador Y10: Estoque OK
📦 Criando pedido
🔢 Código do pedido gerado: ORD-202511-XXXXX
✅ Order created: [uuid]
📝 Criando 1 item(s) do pedido
✅ Created 1 order items successfully
💳 Preparando itens para Mercado Pago
✅ Itens Mercado Pago
✅ Mercado Pago preference created
```

---

## 🔴 PASSO 7: ABRIR CONSOLE DO NAVEGADOR

Pressione: **F12** (ou Ctrl+Shift+I)

Vá para aba: **Console**

Procure por erros vermelhos. Se houver, anote:

- Mensagem exata de erro
- Arquivo/linha onde ocorre
- Stack trace completo

---

## 💳 PASSO 8: PREENCHER FORMULÁRIO MERCADO PAGO

**QUANDO** a página do Mercado Pago carregar, você verá um formulário com:

- Número do Cartão
- Validade (Mês/Ano)
- Código de Segurança
- Nome do Titular

Preencha **EXATAMENTE**:

```
Número do Cartão:    4111111111111111 (SEM ESPAÇOS)
Validade (Mês):      11
Validade (Ano):      25 (ou 2025)
Código de Segurança: 123
Nome do Titular:     APRO
```

---

## ⏸️ PASSO 9: VERIFICAR SE APARECE ERRO

Quando você preenche os dados e clica em "Continuar" ou "Pagar", há 3 cenários possíveis:

### **Cenário A: ✅ SUCESSO**

```
Página redireciona para: http://localhost:3000/compra-sucesso
Mensagem exibida: "Pagamento Aprovado"
```

### **Cenário B: ❌ ERRO "Cartão Recusado"**

```
Mensagem: "Não é possível continuar o pagamento com este cartão"
Ou: "Cartão recusado pelo banco"
```

### **Cenário C: ❌ ERRO DE CARREGAMENTO**

```
Página branca
Ou: "Erro ao carregar página de pagamento"
```

---

## 🐛 PASSO 10: CAPTURAR INFORMAÇÕES DE DEBUG

Se você receber ERRO, captura estas informações:

### **1. Screenshot da Mensagem de Erro**

Salve uma imagem exata da mensagem

### **2. Console (F12)**

Clique direito no console → Select All → Copy

### **3. Network Tab (F12)**

1. Clique em aba "Network"
2. Recarregue a página (F5)
3. Procure por uma requisição chamada "checkout" ou "preferences"
4. Clique nela
5. Vá para aba "Response"
6. Copie a resposta JSON inteira

### **4. URL Atual**

Copie a URL completa da barra de endereços

---

## 📋 CHECKLIST FINAL

Antes de reportar qualquer erro, verifique:

- [ ] Servidor rodando: `npm run dev` (console mostra "Ready")
- [ ] Página abrindo: http://localhost:3000/checkout
- [ ] Dados preenchidos corretamente
- [ ] Método "Cartão de Crédito" selecionado
- [ ] Botão clicável (não desabilitado)
- [ ] Página do Mercado Pago carregando (aguarde 2-3 segundos)
- [ ] Cartão preenchido SEM espaços: `4111111111111111`
- [ ] Validade futura: `11/25` ou `12/25`
- [ ] CVV com 3 dígitos: `123`
- [ ] Titular preenchido: `APRO`

---

## 🚨 POSSÍVEIS RAZÕES DO ERRO

| Razão              | Solução                                      |
| ------------------ | -------------------------------------------- |
| Cartão com espaços | Remova espaços: `4111111111111111`           |
| Validade expirada  | Use `11/25` ou `12/25`                       |
| CVV ausente        | Digite `123`                                 |
| Titular vazio      | Digite `APRO`                                |
| HTTPS bloqueado    | Deve ser `http://localhost:3000` (não https) |
| Cache do navegador | Limpe: Ctrl+Shift+Delete                     |
| Modo incógnito     | Tente modo normal                            |
| Outra aba pagando  | Feche outras abas                            |

---

## ✅ TESTE RÁPIDO (3 MINUTOS)

Se quiser fazer teste mínimo:

1. Abra http://localhost:3000/checkout
2. Preencha com dados ficticios rápidos
3. Clique no botão
4. Quando surgir página do Mercado Pago:
   - Cartão: `4111111111111111`
   - Validade: `11/25`
   - CVV: `123`
   - Titular: `APRO`
5. Clique "Pagar"
6. Observe resultado (sucesso ou erro)

**Tempo total:** ~3 minutos

---

## 📞 INFORMAÇÕES PARA ANÁLISE

Se o problema persiste, faça um novo teste e colete:

1. **Screenshot da mensagem de erro**
2. **Output completo do Console (F12 → Console)**
3. **JSON da resposta Network** (F12 → Network → checkout → Response)
4. **URL exato quando erro ocorre**
5. **Navegador e versão** (exemplo: Chrome 131.0.6778.86)
6. **Sistema operacional** (Windows 11, etc)

---

**Status:** Pronto para teste  
**Próximo passo:** Execute o PASSO 1 acima e reporte os resultados
