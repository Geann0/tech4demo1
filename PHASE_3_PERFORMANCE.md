# ⚡ PHASE 3 PART 2 - PERFORMANCE OPTIMIZATION

**Data:** 28 de Novembro de 2025  
**Status:** 🚀 INICIANDO  
**Objetivo:** Otimizar Performance (Database + Frontend)

---

## 📊 PERFORMANCE AUDIT

### Lighthouse Baseline (Target)

```
Performance:        75-85/100
Accessibility:      90-100/100
Best Practices:     90-100/100
SEO:               90-100/100

Core Web Vitals Target:
├─ LCP (Largest Contentful Paint): < 2.5s
├─ FID (First Input Delay): < 100ms
└─ CLS (Cumulative Layout Shift): < 0.1
```

---

## 🎯 OPTIMIZATION AREAS

### 1️⃣ DATABASE OPTIMIZATION

#### Current Status

```
Database: Supabase PostgreSQL
├─ Tables: 10+ tables
├─ Queries: Not fully optimized
├─ Indexes: Minimal
└─ N+1 Problem: Potential issues
```

#### Actions Needed

```
[ ] Add Indexes on Frequently Queried Columns
    ├─ profiles.auth_id (user lookup)
    ├─ orders.user_id (user orders)
    ├─ products.category_id (product filtering)
    ├─ products.created_at (sorting)
    └─ orders.status (status filtering)

[ ] Optimize Query Patterns
    ├─ Batch load related data
    ├─ Use select() to limit columns
    ├─ Add pagination on list endpoints
    └─ Cache expensive queries

[ ] Review RLS Policies
    ├─ Ensure indexes are used
    ├─ Check for sequential scans
    └─ Optimize policy conditions

[ ] Monitor Query Performance
    ├─ Check slow query log
    ├─ Monitor query execution time
    └─ Identify N+1 patterns
```

#### SQL Migration (indexes)

```sql
-- Add indexes for common queries
CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_status ON products(status);

-- Composite indexes for common filters
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_products_category_status ON products(category_id, status);

-- Full-text search index (for search optimization)
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('portuguese', name || ' ' || description));
```

---

### 2️⃣ FRONTEND PERFORMANCE

#### Image Optimization

```typescript
// Current: Using standard <img> tags
// Optimized: Using next/image component

import Image from 'next/image';

// Before:
<img src="/products/image.jpg" alt="Product" />

// After:
<Image
  src="/products/image.jpg"
  alt="Product"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/..." // For LCP improvement
  loading="lazy"
  quality={75}
/>
```

**Benefits:**

- Automatic responsive images
- Lazy loading by default
- Format optimization (WebP)
- Quality optimization
- Layout shift prevention

---

#### Code Splitting & Lazy Loading

```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

// Lazy load heavy components
const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  { loading: () => <div>Loading...</div> }
);

// Lazy load below-the-fold sections
const RelatedProducts = dynamic(
  () => import('@/components/products/RelatedProducts'),
  { loading: () => <div>Loading...</div> }
);
```

**Routes to implement:**

```
[ ] Admin pages (heavy components)
[ ] Product detail (related products, reviews)
[ ] Cart page (checkout form)
[ ] Order tracking (map, timeline)
[ ] Partner dashboard (analytics, charts)
```

---

#### Font Optimization

```typescript
// next.config.js
import { withFonts } from 'next-fonts';

module.exports = withFonts({
  // Font preloading
  fonts: [
    {
      family: 'Roboto',
      weights: [400, 500, 700],
      styles: ['normal', 'italic'],
      display: 'swap', // Prevent FOIT
    },
  ],
});

// Or use system fonts in CSS
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}
```

**Actions:**

```
[ ] Preload critical fonts
[ ] Use font-display: swap
[ ] Minimize font variants
[ ] Use system fonts where possible
```

---

#### CSS Optimization

```typescript
// next.config.js
module.exports = {
  swcMinify: true,
  compress: true,

  // Critical CSS extraction
  experimental: {
    optimizeCss: true,
  },

  // CSS modules for scoping
  cssModules: true,
};
```

**Actions:**

```
[ ] Extract critical CSS
[ ] Minify CSS
[ ] Remove unused CSS
[ ] Use CSS modules for scoping
[ ] Defer non-critical CSS
```

---

### 3️⃣ CACHING STRATEGY

#### Browser Caching

```javascript
// next.config.js
export default {
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=120",
          },
        ],
      },
    ];
  },
};
```

---

#### Server-Side Caching (Supabase)

```typescript
// src/lib/cache.ts
import { cache } from "react";

// Deduplicate identical requests
export const getCachedProducts = cache(async (id: string) => {
  return supabase.from("products").select("*").eq("id", id).single();
});

// Multiple calls to getCachedProducts(id) will only execute once
const product1 = await getCachedProducts("123");
const product2 = await getCachedProducts("123"); // Uses cache
```

---

### 4️⃣ BUNDLE SIZE OPTIMIZATION

#### Current Analysis

```bash
# Analyze bundle size
npx next build
# > Page Size: /page.js - X.XX MB
```

#### Optimization Techniques

```typescript
// 1. Tree shaking
import { specific } from 'lodash-es'; // ✅ Good
import _ from 'lodash'; // ❌ Avoids

// 2. Dynamic imports
const Chart = dynamic(() => import('chart.js'), { ssr: false });

// 3. Remove unused packages
npm list
npm audit

// 4. Use lighter alternatives
// Instead of moment.js:
import dayjs from 'dayjs';

// Instead of lodash:
import { pick } from 'lodash-es';
```

---

## 📈 PERFORMANCE CHECKLIST

### Database

```
[ ] Analyze slow query log
[ ] Create indexes on common filter columns
[ ] Add composite indexes for common queries
[ ] Optimize RLS policies
[ ] Implement query pagination
[ ] Add connection pooling
[ ] Set up query monitoring
[ ] Cache expensive queries
```

### Frontend

```
[ ] Use next/image for all product images
[ ] Lazy load below-the-fold components
[ ] Implement code splitting
[ ] Optimize fonts (preload, swap, minimize)
[ ] Extract critical CSS
[ ] Minimize JavaScript bundles
[ ] Defer non-critical JavaScript
[ ] Implement Progressive Enhancement
```

### Caching

```
[ ] Browser caching headers
[ ] Server-side caching strategy
[ ] API response caching
[ ] Image caching (long-lived)
[ ] Static assets caching
```

### Monitoring

```
[ ] Setup Lighthouse CI
[ ] Monitor Core Web Vitals
[ ] Track bundle size
[ ] Monitor query performance
[ ] Setup performance alerts
```

---

## 🎯 QUICK WINS (Implement First)

### 1. Add Database Indexes (1-2 hours)

```sql
-- Most critical indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**Expected Improvement:** Query times 10-100x faster

---

### 2. Use next/image (2-3 hours)

```typescript
// Replace all product images with next/image
// - Automatic responsive sizing
// - WebP format when supported
// - Lazy loading
// - Quality optimization

Expected Improvement:
- LCP improved by 30-40%
- Image payload reduced by 50-60%
```

---

### 3. Font Optimization (1 hour)

```css
/* Use system fonts as fallback */
body {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

/* Preload critical fonts */
@font-face {
  font-family: "Custom";
  src: url("/fonts/custom.woff2") format("woff2");
  font-display: swap;
}
```

**Expected Improvement:** FID improved by 20-30%

---

### 4. Code Splitting (2-3 hours)

```typescript
// Lazy load admin components
const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  { loading: () => <Skeleton /> }
);

Expected Improvement:
- Initial bundle reduced by 20-30%
- First paint improved by 15-25%
```

---

## 📊 PERFORMANCE METRICS

### Before Optimization

```
Estimated:
Performance: 65/100
LCP: 3.5s
FID: 150ms
CLS: 0.15
Bundle: ~500KB
```

### After Optimization (Target)

```
Target:
Performance: 80-90/100
LCP: 2.0s
FID: 80ms
CLS: 0.05
Bundle: ~250KB
```

### Expected Results

```
✅ 33% faster page load
✅ 25% smaller bundle
✅ 50% improvement in LCP
✅ 50% improvement in FID
```

---

## 🚀 IMPLEMENTATION TIMELINE

### Today/Tomorrow (4-6 hours)

```
[ ] Database index creation
[ ] next/image implementation
[ ] Font optimization
[ ] Basic code splitting
```

### Next 2-3 Days (8-10 hours)

```
[ ] Complete code splitting
[ ] Bundle size analysis
[ ] CSS optimization
[ ] Caching strategy setup
```

### This Week (4-6 hours)

```
[ ] Lighthouse testing
[ ] Core Web Vitals monitoring
[ ] Performance monitoring setup
[ ] Documentation
```

---

## 📚 REFERENCES

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/performance)

---

## ✅ NEXT STEPS

1. **Create database indexes** (Highest impact)
2. **Implement next/image** (Quick win)
3. **Optimize fonts** (Quick win)
4. **Code splitting** (Medium effort, good impact)
5. **Monitor metrics** (Ongoing)

---

**Status:** 🚀 PHASE 3 PART 2 READY TO START  
**Estimated Duration:** 1-2 weeks  
**Expected Improvement:** 25-35% performance boost
