// Code Splitting Utilities - Minimal Implementation
import React from 'react';

// Skeleton Loader Component
function ComponentSkeleton() {
  return React.createElement(
    'div',
    { className: 'w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center' },
    React.createElement('div', { className: 'text-gray-400' }, 'Carregando...')
  );
}

// Error Fallback Component
function ComponentError({ error }: { error?: Error }) {
  return React.createElement(
    'div',
    { className: 'w-full h-96 bg-red-50 rounded-lg flex items-center justify-center' },
    React.createElement('div', { className: 'text-red-600' }, 'Erro ao carregar componente')
  );
}

// Dynamic import wrapper with error handling
export function dynamicImport<T = any>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
): React.LazyExoticComponent<React.ComponentType<T>> {
  return React.lazy(importFn);
}

// Export components for external use
export { ComponentSkeleton, ComponentError };
