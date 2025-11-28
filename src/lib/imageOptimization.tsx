/**
 * Image Optimization Utility
 * Provides Next.js Image component configuration and helpers
 * for optimized product, profile, and UI images
 */

import Image from 'next/image';
import React from 'react';

/**
 * Image quality presets for different use cases
 */
export const IMAGE_QUALITY = {
  THUMBNAIL: 60,    // Small product thumbnails
  PRODUCT: 75,      // Product detail pages
  HERO: 85,         // Hero banners
  PROFILE: 80,      // Profile pictures
  BACKGROUND: 70,   // Background images
  ICON: 50,         // Icon images
} as const;

/**
 * Image size presets for responsive loading
 */
export const IMAGE_SIZES = {
  THUMBNAIL: {
    width: 200,
    height: 200,
  },
  PRODUCT_CARD: {
    width: 300,
    height: 300,
  },
  PRODUCT_DETAIL: {
    width: 600,
    height: 600,
  },
  HERO: {
    width: 1200,
    height: 600,
  },
  PROFILE: {
    width: 150,
    height: 150,
  },
  BACKGROUND: {
    width: 1920,
    height: 1080,
  },
} as const;

/**
 * Responsive sizes for srcSet generation
 * Format: "size (condition), size (condition), ..."
 */
export const RESPONSIVE_SIZES = {
  PRODUCT_CARD:
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw',
  PRODUCT_DETAIL: '(max-width: 768px) 100vw, (max-width: 1440px) 80vw, 60vw',
  HERO: '100vw',
  PROFILE: '(max-width: 768px) 100px, 150px',
} as const;

/**
 * Blur data URL placeholder (minimal grey pixel)
 * Used for progressive image loading
 */
export const BLUR_PLACEHOLDER =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

/**
 * Get optimized image props for a given use case
 */
export function getOptimizedImageProps(
  src: string,
  preset: keyof typeof IMAGE_SIZES,
  alt: string,
  options?: {
    quality?: number;
    priority?: boolean;
    fill?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill';
  }
) {
  const sizes = IMAGE_SIZES[preset];
  const quality = options?.quality ?? IMAGE_QUALITY.PRODUCT;

  return {
    src,
    alt,
    width: options?.fill ? undefined : sizes.width,
    height: options?.fill ? undefined : sizes.height,
    quality,
    priority: options?.priority ?? false,
    placeholder: 'blur' as const,
    blurDataURL: BLUR_PLACEHOLDER,
    loading: options?.priority ? 'eager' : ('lazy' as const),
    ...(options?.fill && {
      fill: true,
      objectFit: options?.objectFit ?? 'cover',
    }),
  };
}

/**
 * Optimized Product Image Component
 * Automatically handles responsive sizing and lazy loading
 */
export const OptimizedProductImage = React.forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt: string;
    priority?: boolean;
    preset?: keyof typeof IMAGE_SIZES;
    fill?: boolean;
    className?: string;
  }
>(
  (
    {
      src,
      alt,
      priority = false,
      preset = 'PRODUCT_CARD',
      fill = false,
      className,
    },
    ref
  ) => (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      {...getOptimizedImageProps(src, preset, alt, {
        quality: IMAGE_QUALITY.PRODUCT,
        priority,
        fill,
        objectFit: 'cover',
      })}
      className={className}
    />
  )
);

OptimizedProductImage.displayName = 'OptimizedProductImage';

/**
 * Optimized Hero Image Component
 * For large banner/hero images
 */
export const OptimizedHeroImage = React.forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt: string;
    priority?: boolean;
    className?: string;
  }
>(({ src, alt, priority = true, className }, ref) => (
  <Image
    ref={ref}
    src={src}
    alt={alt}
    fill
    priority={priority}
    quality={IMAGE_QUALITY.HERO}
    className={className}
    sizes={RESPONSIVE_SIZES.HERO}
    placeholder="blur"
    blurDataURL={BLUR_PLACEHOLDER}
    objectFit="cover"
  />
));

OptimizedHeroImage.displayName = 'OptimizedHeroImage';

/**
 * Optimized Profile Image Component
 * For user avatars and profile pictures
 */
export const OptimizedProfileImage = React.forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
>(({ src, alt, size = 'md', className }, ref) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      width={IMAGE_SIZES.PROFILE.width}
      height={IMAGE_SIZES.PROFILE.height}
      quality={IMAGE_QUALITY.PROFILE}
      priority={false}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
      className={`rounded-full ${sizeMap[size]} ${className || ''}`}
    />
  );
});

OptimizedProfileImage.displayName = 'OptimizedProfileImage';

/**
 * Image loading component for fallback UI
 */
export const ImageSkeleton = ({ className }: { className?: string }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded-lg ${className || 'w-full h-96'}`}
  />
);

/**
 * Batch load images with intersection observer
 * Useful for grids with many images
 */
export function useLazyImage(src: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isLoaded };
}

/**
 * Preload critical images
 * Call this for hero/above-fold images
 */
export function preloadImage(src: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Get image srcset for responsive loading
 */
export function getImageSrcSet(
  baseUrl: string,
  sizes: number[] = [640, 1024, 1440, 1920]
) {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
}

export default {
  IMAGE_QUALITY,
  IMAGE_SIZES,
  RESPONSIVE_SIZES,
  BLUR_PLACEHOLDER,
  getOptimizedImageProps,
  OptimizedProductImage,
  OptimizedHeroImage,
  OptimizedProfileImage,
  ImageSkeleton,
  useLazyImage,
  preloadImage,
  getImageSrcSet,
};
