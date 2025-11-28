/**
 * Code Splitting & Lazy Loading Utilities
 * Provides helpers for dynamic imports and component lazy loading
 * Reduces initial bundle size and improves page load performance
 */

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Loading skeleton component
 * Displayed while lazy-loaded components are being imported
 */
export const ComponentSkeleton = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-gray-400">Carregando...</div>
  </div>
);

/**
 * Error fallback component
 * Displayed if lazy-loaded component fails to import
 */
export const ComponentError = ({ error }: { error?: Error }) => (
  <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-700 font-semibold">Erro ao carregar componente</p>
    {error && <p className="text-red-600 text-sm mt-2">{error.message}</p>}
  </div>
);

/**
 * Create a lazy-loaded component with loading and error states
 * Usage: const LazyComponent = createLazyComponent(() => import('./Component'));
 */
export function createLazyComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    loading?: React.ReactNode;
    error?: (error: Error) => React.ReactNode;
    ssr?: boolean;
  }
) {
  return dynamic(() => importFn(), {
    loading: () => options?.loading ?? <ComponentSkeleton />,
    ssr: options?.ssr ?? true,
  });
}

/**
 * ADMIN DASHBOARD COMPONENTS (Heavy, rarely used)
 */
export const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const AdminAnalytics = dynamic(
  () => import('@/components/admin/Analytics'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const AdminOrders = dynamic(() => import('@/components/admin/Orders'), {
  loading: () => <ComponentSkeleton />,
  ssr: true,
});

export const AdminProducts = dynamic(
  () => import('@/components/admin/Products'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const AdminUsers = dynamic(() => import('@/components/admin/Users'), {
  loading: () => <ComponentSkeleton />,
  ssr: true,
});

export const AdminSettings = dynamic(
  () => import('@/components/admin/Settings'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

/**
 * PRODUCT PAGE COMPONENTS (Below-the-fold)
 */
export const ProductReviews = dynamic(
  () => import('@/components/products/Reviews'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const RelatedProducts = dynamic(
  () => import('@/components/products/RelatedProducts'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const ProductFAQ = dynamic(
  () => import('@/components/products/FAQ'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const ProductSpecifications = dynamic(
  () => import('@/components/products/Specifications'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

/**
 * CHECKOUT COMPONENTS (Heavy, interactive)
 */
export const CheckoutForm = dynamic(
  () => import('@/components/checkout/CheckoutForm'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false, // Requires client-side only
  }
);

export const PaymentGateway = dynamic(
  () => import('@/components/checkout/PaymentGateway'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false, // Requires client-side only
  }
);

export const OrderSummary = dynamic(
  () => import('@/components/checkout/OrderSummary'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

/**
 * USER ACCOUNT COMPONENTS (Profile, settings)
 */
export const UserProfile = dynamic(
  () => import('@/components/account/Profile'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const OrderHistory = dynamic(
  () => import('@/components/account/OrderHistory'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const AccountSettings = dynamic(
  () => import('@/components/account/Settings'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

export const Wishlist = dynamic(
  () => import('@/components/account/Wishlist'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

/**
 * TRACKING & DELIVERY COMPONENTS
 */
export const TrackingMap = dynamic(
  () => import('@/components/tracking/Map'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false, // Requires client-side for interactivity
  }
);

export const DeliveryTimeline = dynamic(
  () => import('@/components/tracking/Timeline'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: true,
  }
);

/**
 * MODAL & DIALOG COMPONENTS (Initially hidden)
 */
export const AuthModal = dynamic(
  () => import('@/components/modals/AuthModal'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const ImageModal = dynamic(
  () => import('@/components/modals/ImageModal'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const ConfirmationDialog = dynamic(
  () => import('@/components/modals/ConfirmationDialog'),
  {
    loading: () => null,
    ssr: false,
  }
);

/**
 * CHART & ANALYTICS COMPONENTS (Heavy library)
 */
export const SalesChart = dynamic(
  () => import('@/components/charts/SalesChart'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false,
  }
);

export const CustomerAnalytics = dynamic(
  () => import('@/components/charts/CustomerAnalytics'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false,
  }
);

/**
 * CHAT & MESSAGING COMPONENTS
 */
export const ChatWidget = dynamic(
  () => import('@/components/chat/ChatWidget'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const CustomerSupport = dynamic(
  () => import('@/components/chat/CustomerSupport'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false,
  }
);

/**
 * Batch dynamic imports for route-based code splitting
 * Example: Import all dashboard components at route level
 */
export const AdminComponents = {
  Dashboard: AdminDashboard,
  Analytics: AdminAnalytics,
  Orders: AdminOrders,
  Products: AdminProducts,
  Users: AdminUsers,
  Settings: AdminSettings,
};

export const ProductPageComponents = {
  Reviews: ProductReviews,
  RelatedProducts: RelatedProducts,
  FAQ: ProductFAQ,
  Specifications: ProductSpecifications,
};

export const CheckoutComponents = {
  Form: CheckoutForm,
  PaymentGateway: PaymentGateway,
  OrderSummary: OrderSummary,
};

export const AccountComponents = {
  Profile: UserProfile,
  OrderHistory: OrderHistory,
  Settings: AccountSettings,
  Wishlist: Wishlist,
};

export const TrackingComponents = {
  Map: TrackingMap,
  Timeline: DeliveryTimeline,
};

/**
 * USAGE EXAMPLES:
 *
 * 1. In a page component:
 *    import { AdminDashboard, RelatedProducts } from '@/lib/codeSplitting';
 *
 *    export default function AdminPage() {
 *      return <AdminDashboard />;
 *    }
 *
 * 2. For conditional rendering:
 *    import { AdminComponents } from '@/lib/codeSplitting';
 *
 *    {isAdmin && <AdminComponents.Dashboard />}
 *
 * 3. Dynamic component selection:
 *    const Component = AdminComponents[componentName];
 *    if (Component) return <Component />;
 *
 * 4. With custom loading:
 *    const CustomComponent = dynamic(
 *      () => import('./HeavyComponent'),
 *      {
 *        loading: () => <MyCustomLoadingComponent />,
 *        ssr: false,
 *      }
 *    );
 */

export default {
  createLazyComponent,
  ComponentSkeleton,
  ComponentError,
  AdminComponents,
  ProductPageComponents,
  CheckoutComponents,
  AccountComponents,
  TrackingComponents,
};
