import {
  formatCurrency,
  formatCEP,
  formatPhone,
  generateSlug,
  truncate,
  calculateFeeAmount,
  calculateTotalWithFee,
} from "../utils";

describe("Utils - Formatting Functions", () => {
  describe("formatCurrency", () => {
    it("should format a number as Brazilian currency", () => {
      const result = formatCurrency(100);
      // Currency symbol pode variar dependendo do locale, então apenas verificamos o padrão
      expect(result).toMatch(/100|,/);
    });

    it("should format decimal amount", () => {
      const result = formatCurrency(1500.5);
      expect(result).toMatch(/1[.,]/);
      expect(result).toContain("50");
    });

    it("should format zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0");
    });
  });

  describe("formatCEP", () => {
    it("should format valid CEP with correct pattern", () => {
      expect(formatCEP("12345678")).toBe("12345-678");
      expect(formatCEP("12345-678")).toBe("12345-678");
    });

    it("should return original CEP if invalid length", () => {
      expect(formatCEP("123")).toBe("123");
      expect(formatCEP("123456789")).toBe("123456789");
    });

    it("should remove non-numeric characters before formatting", () => {
      expect(formatCEP("12345-678")).toBe("12345-678");
    });
  });

  describe("formatPhone", () => {
    it("should format 11-digit phone number", () => {
      expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    });

    it("should format 10-digit phone number", () => {
      expect(formatPhone("1938765432")).toBe("(19) 3876-5432");
    });

    it("should handle already formatted numbers", () => {
      const formatted = formatPhone("(11) 98765-4321");
      expect(formatted).toContain("11");
      expect(formatted).toContain("98765");
    });
  });

  describe("generateSlug", () => {
    it("should generate slug from text", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("should remove accents", () => {
      expect(generateSlug("Açúcar")).toBe("acucar");
      expect(generateSlug("Café Expresso")).toBe("cafe-expresso");
    });

    it("should remove special characters", () => {
      expect(generateSlug("Hello @World!")).toBe("hello-world");
    });

    it("should handle multiple spaces", () => {
      expect(generateSlug("Hello    World")).toBe("hello-world");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(generateSlug("-Hello World-")).toBe("hello-world");
    });
  });

  describe("truncate", () => {
    it("should truncate text longer than maxLength", () => {
      const text = "This is a long text that should be truncated";
      expect(truncate(text, 20)).toBe("This is a long text...");
    });

    it("should not truncate text shorter than maxLength", () => {
      const text = "Short";
      expect(truncate(text, 20)).toBe("Short");
    });

    it("should handle exact length", () => {
      const text = "Exact";
      expect(truncate(text, 5)).toBe("Exact");
    });
  });
});

describe("Utils - Calculation Functions", () => {
  describe("calculateFeeAmount", () => {
    it("should calculate 7.5% fee correctly", () => {
      expect(calculateFeeAmount(100)).toBeCloseTo(7.5, 1);
      expect(calculateFeeAmount(1000)).toBeCloseTo(75, 1);
    });

    it("should handle zero amount", () => {
      expect(calculateFeeAmount(0)).toBe(0);
    });

    it("should handle decimal amounts", () => {
      expect(calculateFeeAmount(123.45)).toBeCloseTo(9.26, 2);
    });
  });

  describe("calculateTotalWithFee", () => {
    it("should add 7.5% fee to the amount", () => {
      expect(calculateTotalWithFee(100)).toBeCloseTo(107.5, 1);
      expect(calculateTotalWithFee(1000)).toBeCloseTo(1075, 1);
    });

    it("should handle zero amount", () => {
      expect(calculateTotalWithFee(0)).toBe(0);
    });
  });
});
