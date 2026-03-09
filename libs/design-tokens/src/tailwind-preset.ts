/**
 * Tailwind CSS preset that consumes design tokens.
 *
 * Usage in tailwind.config.js:
 *   const { openspawnPreset } = require("@openspawn/design-tokens/tailwind-preset");
 *   module.exports = { presets: [openspawnPreset], ... }
 */

import { bbColors } from "./tokens/colors.js";
import { fontFamilies } from "./tokens/typography.js";

export const openspawnPreset = {
  theme: {
    extend: {
      fontFamily: {
        display: [fontFamilies.display],
        body: [fontFamilies.body],
        mono: [fontFamilies.mono],
      },
      colors: {
        "bb-sandy": bbColors.sandy,
        "bb-ocean": bbColors.ocean,
        "bb-coral": bbColors.coral,
        "bb-kelp": bbColors.kelp,
        "bb-krabby": bbColors.character.krabby,
        "bb-pineapple": bbColors.character.pineapple,
        "bb-bubble": bbColors.ocean[50],
        "bb-squid": bbColors.character.squid,
        "bb-pearl": bbColors.character.pearl,
        "bb-dutchman": bbColors.character.dutchman,
        "bb-ocean-abyss": bbColors.ocean.abyss,
        "bb-status": {
          idle: bbColors.ocean[400],
          working: bbColors.sandy[400],
          busy: bbColors.coral[400],
          overwhelmed: bbColors.coral[500],
        },
      },
      screens: {
        landscape: {
          raw: "(orientation: landscape) and (max-height: 500px)",
        },
        portrait: { raw: "(orientation: portrait)" },
      },
    },
  },
} as const;
