import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    ignores: [".astro/**", "src/env.d.ts"],
  },
];
