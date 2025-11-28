import {
  isCityInCoverage,
  isStateInCoverage,
  normalizeCity,
  type CoverageArea,
} from "../geolocation";

describe("Geolocation - Coverage Validation", () => {
  describe("normalizeCity", () => {
    it("should normalize city names correctly", () => {
      expect(normalizeCity("são paulo")).toBe("SÃO PAULO");
      expect(normalizeCity("OURO PRETO DO OESTE")).toBe("OURO PRETO DO OESTE");
    });

    it("should trim whitespace", () => {
      expect(normalizeCity("  são paulo  ")).toBe("SÃO PAULO");
    });
  });

  describe("isCityInCoverage", () => {
    it("should return true for city in coverage list", () => {
      const coverage: CoverageArea = {
        type: "city",
        cities: ["SÃO PAULO", "RIO DE JANEIRO"],
      };
      expect(isCityInCoverage("são paulo", coverage)).toBe(true);
    });

    it("should return false for city not in coverage", () => {
      const coverage: CoverageArea = {
        type: "city",
        cities: ["SÃO PAULO"],
      };
      expect(isCityInCoverage("SALVADOR", coverage)).toBe(false);
    });

    it("should be case-insensitive", () => {
      const coverage: CoverageArea = {
        type: "city",
        cities: ["SÃO PAULO"],
      };
      expect(isCityInCoverage("SÃO PAULO", coverage)).toBe(true);
      expect(isCityInCoverage("são paulo", coverage)).toBe(true);
    });
  });

  describe("isStateInCoverage", () => {
    it("should return true for state in coverage", () => {
      const coverage: CoverageArea = {
        type: "state",
        states: ["SP", "RJ"],
      };
      expect(isStateInCoverage("SP", coverage)).toBe(true);
    });

    it("should return false for state not in coverage", () => {
      const coverage: CoverageArea = {
        type: "state",
        states: ["SP"],
      };
      expect(isStateInCoverage("BA", coverage)).toBe(false);
    });

    it("should be case-insensitive", () => {
      const coverage: CoverageArea = {
        type: "state",
        states: ["SP", "RJ"],
      };
      expect(isStateInCoverage("sp", coverage)).toBe(true);
      expect(isStateInCoverage("Sp", coverage)).toBe(true);
    });
  });
});
