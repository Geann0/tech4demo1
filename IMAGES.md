# 🖼️ Guia de Imagens - Tech4Loop Demo

## ✅ Configuração de Imagens Aplicada

O `next.config.js` foi configurado para aceitar imagens do Unsplash.

### Domínios Permitidos:

- ✅ `images.unsplash.com` - Para produtos demo
- ✅ `plphgrlkszglrawjgtvn.supabase.co` - Supabase (não usado em demo)
- ✅ `ovnmvbyjvpbsfacywgig.supabase.co` - Supabase (não usado em demo)

## 🎨 Produtos Mock Usam Unsplash

Todas as imagens dos produtos em `src/lib/mockData.ts` vêm do Unsplash:

- Gratuitas e de domínio público para demonstração
- Alta qualidade
- Otimizadas pelo Next.js Image

## 🔄 Se Imagens Não Carregarem

### Problema: Imagens lentas ou não aparecem

**Causas possíveis:**

1. Conexão lenta com Unsplash
2. Bloqueio de firewall/proxy
3. Unsplash fora do ar (raro)

**Soluções:**

#### Opção 1: Aguardar (Recomendado)

```
As imagens do Unsplash podem demorar alguns segundos na primeira vez.
Aguarde e recarregue a página (F5).
```

#### Opção 2: Usar Imagens Locais

1. Baixe imagens de tecnologia
2. Coloque em `public/images/`
3. Edite `src/lib/mockData.ts`:

```typescript
// Antes:
image_urls: ["https://images.unsplash.com/photo-xxx"];

// Depois:
image_urls: ["/images/produto-1.jpg"];
```

#### Opção 3: Desabilitar Otimização (Não recomendado)

Em `next.config.js`, adicione:

```javascript
images: {
  unoptimized: true, // Desabilita otimização
  remotePatterns: [...],
}
```

## 📸 Adicionar Novas Imagens

### Do Unsplash:

```typescript
// Em src/lib/mockData.ts
{
  image_urls: ["https://images.unsplash.com/photo-ID?w=800&h=800&fit=crop"];
}
```

### Locais:

1. Coloque em `public/images/`
2. Use caminho relativo: `/images/nome.jpg`

### De outro CDN:

1. Adicione o domínio em `next.config.js`:

```javascript
{
  protocol: "https",
  hostname: "seu-cdn.com",
  pathname: "/**",
}
```

## 🚨 Erros Comuns

### "hostname is not configured"

**Solução**: Adicione o domínio em `next.config.js` (já feito para Unsplash)

### Imagens aparecem quebradas

**Solução**:

- Verifique se a URL está correta
- Teste a URL diretamente no navegador
- Verifique se o domínio está em `next.config.js`

### Imagens muito lentas

**Solução**: Use imagens locais ou otimize os tamanhos das URLs do Unsplash

## 💡 Dicas de Performance

1. **Use parâmetros do Unsplash**:

   ```
   ?w=800&h=800&fit=crop&q=80
   ```

   - `w` = largura
   - `h` = altura
   - `fit=crop` = recorta para caber
   - `q` = qualidade (1-100)

2. **Next.js Image otimiza automaticamente**:
   - Lazy loading
   - Redimensionamento responsivo
   - WebP quando suportado
   - Blur placeholder

3. **Para produção**:
   - Use imagens locais em `public/`
   - Ou use CDN próprio (Cloudinary, ImgIX, etc.)

## 📋 Checklist de Imagens

Para deploy em produção:

- [ ] Todas as imagens carregam corretamente
- [ ] Imagens têm alt text descritivo
- [ ] URLs do Unsplash têm parâmetros de otimização
- [ ] Domínios estão configurados em `next.config.js`
- [ ] Consider usar imagens locais para melhor performance
- [ ] Imagens são responsivas (funcionam em mobile)

## 🔧 Troubleshooting Rápido

```bash
# Limpar cache do Next.js
Remove-Item -Recurse -Force .next

# Reiniciar servidor
npm run dev

# Testar URL de imagem diretamente
# Abra no navegador: https://images.unsplash.com/photo-xxx
```

## 🎯 Para Produção

**Importante**: Para um site em produção real:

1. **Use imagens próprias** ou licenciadas
2. **Otimize tamanhos** (compressão, formatos modernos)
3. **Use CDN** para melhor performance global
4. **Adicione alt text** para acessibilidade e SEO
5. **Teste em diferentes dispositivos** e conexões

---

**Status Atual**: ✅ Configurado e funcionando com Unsplash
**Servidor**: http://localhost:3003
