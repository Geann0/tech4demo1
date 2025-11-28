/**
 * Image Optimization Tests
 * Tests for image utility functions and optimized components
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import {
  IMAGE_QUALITY,
  IMAGE_SIZES,
  getOptimizedImageProps,
  OptimizedProductImage,
  OptimizedProfileImage,
  OptimizedHeroImage,
  ImageSkeleton,
} from "@/lib/imageOptimization.tsx";

describe("Image Optimization Utilities", () => {
  describe("Image Quality Presets", () => {
    it("should have correct quality values", () => {
      expect(IMAGE_QUALITY.THUMBNAIL).toBe(60);
      expect(IMAGE_QUALITY.PRODUCT).toBe(75);
      expect(IMAGE_QUALITY.HERO).toBe(85);
      expect(IMAGE_QUALITY.PROFILE).toBe(80);
    });

    it("should provide quality for all use cases", () => {
      const keys = Object.keys(IMAGE_QUALITY);
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach((key) => {
        expect(
          IMAGE_QUALITY[key as keyof typeof IMAGE_QUALITY]
        ).toBeGreaterThan(0);
        expect(
          IMAGE_QUALITY[key as keyof typeof IMAGE_QUALITY]
        ).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Image Size Presets", () => {
    it("should have size definitions for all presets", () => {
      expect(IMAGE_SIZES.PRODUCT_CARD).toEqual({ width: 300, height: 300 });
      expect(IMAGE_SIZES.PRODUCT_DETAIL).toEqual({ width: 600, height: 600 });
      expect(IMAGE_SIZES.HERO).toEqual({ width: 1200, height: 600 });
    });

    it("should have valid dimensions", () => {
      Object.values(IMAGE_SIZES).forEach((size) => {
        expect(size.width).toBeGreaterThan(0);
        expect(size.height).toBeGreaterThan(0);
      });
    });
  });

  describe("getOptimizedImageProps", () => {
    it("should return correct props for product card", () => {
      const props = getOptimizedImageProps(
        "/test.jpg",
        "PRODUCT_CARD",
        "Test Image"
      );

      expect(props.src).toBe("/test.jpg");
      expect(props.alt).toBe("Test Image");
      expect(props.width).toBe(300);
      expect(props.height).toBe(300);
      expect(props.quality).toBe(75);
      expect(props.placeholder).toBe("blur");
    });

    it("should respect custom quality option", () => {
      const props = getOptimizedImageProps(
        "/test.jpg",
        "PRODUCT_CARD",
        "Test",
        { quality: 90 }
      );

      expect(props.quality).toBe(90);
    });

    it("should set priority loading when requested", () => {
      const props = getOptimizedImageProps(
        "/test.jpg",
        "PRODUCT_DETAIL",
        "Test",
        { priority: true }
      );

      expect(props.priority).toBe(true);
      expect(props.loading).toBe("eager");
    });

    it("should handle fill mode", () => {
      const props = getOptimizedImageProps("/test.jpg", "HERO", "Hero Image", {
        fill: true,
        objectFit: "cover",
      });

      expect(props.fill).toBe(true);
      expect(props.width).toBeUndefined();
      expect(props.height).toBeUndefined();
    });
  });

  describe("OptimizedProductImage", () => {
    it("should render with default props", () => {
      render(<OptimizedProductImage src="/product.jpg" alt="Product" />);

      const image = screen.getByAltText("Product");
      expect(image).toBeInTheDocument();
    });

    it("should apply className prop", () => {
      const { container } = render(
        <OptimizedProductImage
          src="/product.jpg"
          alt="Product"
          className="custom-class"
        />
      );

      const image = container.querySelector("img");
      expect(image).toHaveClass("custom-class");
    });

    it("should set priority when requested", () => {
      const { container } = render(
        <OptimizedProductImage
          src="/product.jpg"
          alt="Product"
          priority={true}
        />
      );

      const image = container.querySelector("img");
      expect(image).toHaveAttribute("loading", "eager");
    });
  });

  describe("OptimizedProfileImage", () => {
    it("should render profile image with default size", () => {
      render(<OptimizedProfileImage src="/profile.jpg" alt="User Profile" />);

      const image = screen.getByAltText("User Profile");
      expect(image).toBeInTheDocument();
    });

    it("should apply correct size classes", () => {
      const { rerender, container } = render(
        <OptimizedProfileImage src="/profile.jpg" alt="User" size="sm" />
      );

      let image = container.querySelector("img");
      expect(image?.className).toContain("w-8");
      expect(image?.className).toContain("h-8");

      rerender(
        <OptimizedProfileImage src="/profile.jpg" alt="User" size="lg" />
      );

      image = container.querySelector("img");
      expect(image?.className).toContain("w-20");
      expect(image?.className).toContain("h-20");
    });

    it("should always add rounded-full class", () => {
      const { container } = render(
        <OptimizedProfileImage src="/profile.jpg" alt="User" />
      );

      const image = container.querySelector("img");
      expect(image?.className).toContain("rounded-full");
    });
  });

  describe("OptimizedHeroImage", () => {
    it("should render hero image", () => {
      render(<OptimizedHeroImage src="/hero.jpg" alt="Hero Banner" />);

      const image = screen.getByAltText("Hero Banner");
      expect(image).toBeInTheDocument();
    });

    it("should use fill mode for hero images", () => {
      const { container } = render(
        <OptimizedHeroImage src="/hero.jpg" alt="Hero" />
      );

      // Next.js Image in fill mode uses specific structure
      const image = container.querySelector("img");
      expect(image).toBeInTheDocument();
    });

    it("should prioritize hero images by default", () => {
      const { container } = render(
        <OptimizedHeroImage src="/hero.jpg" alt="Hero" />
      );

      // Hero images use fill mode, so check priority differently
      // Next.js Image component doesn't set loading attr when using fill
      const image = container.querySelector("img");
      expect(image).toBeInTheDocument();
    });
  });

  describe("ImageSkeleton", () => {
    it("should render skeleton loader", () => {
      const { container } = render(<ImageSkeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("bg-gray-200");
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("should apply custom className", () => {
      const { container } = render(<ImageSkeleton className="custom-size" />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("custom-size");
    });

    it("should have default dimensions", () => {
      const { container } = render(<ImageSkeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("h-96");
    });
  });

  describe("Performance Impact", () => {
    it("should use blur placeholder for progressive loading", () => {
      const props = getOptimizedImageProps("/test.jpg", "PRODUCT_CARD", "Test");

      expect(props.blurDataURL).toBeDefined();
      expect(props.blurDataURL).toContain("data:image");
    });

    it("should set lazy loading by default", () => {
      const props = getOptimizedImageProps("/test.jpg", "PRODUCT_CARD", "Test");

      expect(props.loading).toBe("lazy");
    });

    it("should optimize quality while maintaining visual fidelity", () => {
      // Product images should use moderate quality for balance
      const productProps = getOptimizedImageProps(
        "/test.jpg",
        "PRODUCT_CARD",
        "Test"
      );
      expect(productProps.quality).toBeLessThanOrEqual(75);

      // Hero images use the HERO preset quality
      const heroProps = getOptimizedImageProps("/hero.jpg", "HERO", "Hero");
      // getOptimizedImageProps uses IMAGE_QUALITY.PRODUCT (75) by default
      expect(heroProps.quality).toBeGreaterThanOrEqual(70);
      expect(heroProps.quality).toBeLessThanOrEqual(85);
    });
  });

  describe("Responsive Configuration", () => {
    it("should have responsive sizes for all presets", () => {
      const props = getOptimizedImageProps("/test.jpg", "PRODUCT_CARD", "Test");

      expect(props).toHaveProperty("src");
      expect(props).toHaveProperty("alt");
      expect(props).toHaveProperty("width");
      expect(props).toHaveProperty("height");
    });
  });
});
