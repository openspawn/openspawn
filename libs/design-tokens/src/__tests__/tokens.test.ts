import { describe, it, expect } from "vitest";
import {
  lightColors,
  deepOceanColors,
  coralReefColors,
  arcticIceColors,
  bioluminescentColors,
  midnightAbyssColors,
  bbColors,
  bbSemanticColors,
  openspawnThemes,
} from "../tokens/colors.js";
import { fontFamilies, fontSizes, fontWeights } from "../tokens/typography.js";
import { spacing, radii, shadows } from "../tokens/spacing.js";
import { durations, easings } from "../tokens/animation.js";

const HSL_PATTERN = /^\d{1,3}\s+[\d.]+%?\s+[\d.]+%?$/;
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function assertHSL(colors: Record<string, string>, label: string) {
  for (const [key, value] of Object.entries(colors)) {
    expect(value, `${label}.${key} should be HSL`).toMatch(HSL_PATTERN);
  }
}

describe("@openspawn/design-tokens", () => {
  describe("semantic color themes", () => {
    const themes = {
      light: lightColors,
      deepOcean: deepOceanColors,
      coralReef: coralReefColors,
      arcticIce: arcticIceColors,
      bioluminescent: bioluminescentColors,
      midnightAbyss: midnightAbyssColors,
      bb: bbSemanticColors,
    };

    for (const [name, colors] of Object.entries(themes)) {
      it(`${name} has valid HSL values`, () =>
        assertHSL(colors as unknown as Record<string, string>, name));

      it(`${name} has all required keys`, () => {
        const required = [
          "background",
          "foreground",
          "primary",
          "secondary",
          "muted",
          "accent",
          "destructive",
          "success",
          "warning",
          "border",
          "ring",
        ];
        for (const key of required) {
          expect(colors).toHaveProperty(key);
        }
      });
    }
  });

  describe("openspawnThemes registry", () => {
    it("has 6 themes", () => {
      expect(Object.keys(openspawnThemes)).toHaveLength(6);
    });

    it("includes :root", () => {
      expect(openspawnThemes).toHaveProperty(":root");
    });
  });

  describe("BB color palettes", () => {
    it("sandy has hex values", () => {
      expect(bbColors.sandy[400]).toMatch(HEX_PATTERN);
      expect(bbColors.sandy.DEFAULT).toBe("#F4C542");
    });

    it("ocean has abyss", () => {
      expect(bbColors.ocean.abyss).toMatch(HEX_PATTERN);
    });

    it("character accents are hex", () => {
      for (const v of Object.values(bbColors.character)) {
        expect(v).toMatch(HEX_PATTERN);
      }
    });
  });

  describe("typography", () => {
    it("font families are non-empty strings", () => {
      for (const v of Object.values(fontFamilies)) {
        expect(v.length).toBeGreaterThan(0);
      }
    });

    it("font sizes are valid CSS", () => {
      for (const v of Object.values(fontSizes)) {
        expect(v).toMatch(/^[\d.]+rem$|^clamp\(/);
      }
    });

    it("font weights are numbers", () => {
      for (const v of Object.values(fontWeights)) {
        expect(typeof v).toBe("number");
      }
    });
  });

  describe("spacing", () => {
    it("all values are valid CSS", () => {
      for (const v of Object.values(spacing)) {
        expect(v).toMatch(/^[\d.]+rem$|^clamp\(/);
      }
    });
  });

  describe("radii", () => {
    it("pill is 9999px", () => {
      expect(radii.pill).toBe("9999px");
    });
  });

  describe("animation", () => {
    it("durations end with ms or s", () => {
      for (const v of Object.values(durations)) {
        expect(v).toMatch(/^\d+m?s$/);
      }
    });

    it("easings are valid", () => {
      for (const v of Object.values(easings)) {
        expect(v).toMatch(/^cubic-bezier|^ease/);
      }
    });
  });
});
