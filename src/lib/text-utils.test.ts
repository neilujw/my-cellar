import { describe, it, expect } from "vitest";

import {
  normalizeAccents,
  accentInsensitiveIncludes,
  accentInsensitiveEquals,
} from "./text-utils";

describe("normalizeAccents", () => {
  it("should strip accents from common characters", () => {
    expect(normalizeAccents("Château")).toBe("Chateau");
    expect(normalizeAccents("España")).toBe("Espana");
    expect(normalizeAccents("Côtes du Rhône")).toBe("Cotes du Rhone");
  });

  it("should return the same string when no accents are present", () => {
    expect(normalizeAccents("Bordeaux")).toBe("Bordeaux");
    expect(normalizeAccents("abc123")).toBe("abc123");
  });

  it("should handle empty string", () => {
    expect(normalizeAccents("")).toBe("");
  });

  it("should handle mixed accented and non-accented characters", () => {
    expect(normalizeAccents("Grüner Veltliner")).toBe("Gruner Veltliner");
    expect(normalizeAccents("São Paulo")).toBe("Sao Paulo");
  });
});

describe("accentInsensitiveIncludes", () => {
  it("should match accented haystack with plain needle", () => {
    expect(accentInsensitiveIncludes("Château Margaux", "chateau")).toBe(true);
  });

  it("should match plain haystack with accented needle", () => {
    expect(accentInsensitiveIncludes("Chateau Margaux", "Château")).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(accentInsensitiveIncludes("CHÂTEAU", "château")).toBe(true);
    expect(accentInsensitiveIncludes("château", "CHATEAU")).toBe(true);
  });

  it("should return false when no match exists", () => {
    expect(accentInsensitiveIncludes("Château Margaux", "Petrus")).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(accentInsensitiveIncludes("", "")).toBe(true);
    expect(accentInsensitiveIncludes("test", "")).toBe(true);
    expect(accentInsensitiveIncludes("", "test")).toBe(false);
  });

  it("should match substring anywhere in the haystack", () => {
    expect(accentInsensitiveIncludes("Grand Cru Classé", "classe")).toBe(true);
  });
});

describe("accentInsensitiveEquals", () => {
  it("should match equal strings with different accents", () => {
    expect(accentInsensitiveEquals("España", "Espana")).toBe(true);
    expect(accentInsensitiveEquals("Château", "Chateau")).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(accentInsensitiveEquals("FRANCE", "france")).toBe(true);
    expect(accentInsensitiveEquals("España", "espana")).toBe(true);
  });

  it("should return false for different strings", () => {
    expect(accentInsensitiveEquals("France", "Italy")).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(accentInsensitiveEquals("", "")).toBe(true);
    expect(accentInsensitiveEquals("test", "")).toBe(false);
  });
});
