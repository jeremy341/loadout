import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The copy of Pixl's internal dashboard (reviewer-dash/ and the review routes) is kept as Pixl wrote it. LOADOUT's newer React Compiler
  // rules and the unescaped-quote rule flag patterns that work, so they are off for the copy only; every other file keeps them.
  // The adjustment pass can turn them back on file by file (see reviewer-dash/ADJUSTMENTS.md).
  {
    files: ["reviewer-dash/**", "app/\\(reviewer\\)/reviewer/review/**", "app/\\(reviewer\\)/reviewer/page.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // P3 content group: the copied Content routes (same reason as above).
  {
    files: [
      "app/\\(reviewer\\)/reviewer/shop/**",
      "app/\\(reviewer\\)/reviewer/shop-detail/**",
      "app/\\(reviewer\\)/reviewer/ideas/**",
      "app/\\(reviewer\\)/reviewer/events/**",
      "app/\\(reviewer\\)/reviewer/forms/**",
      "app/\\(reviewer\\)/reviewer/show-n-tell/**",
      "app/\\(reviewer\\)/reviewer/community-goals/**",
      "app/\\(reviewer\\)/reviewer/referrals/**",
    ],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // P4 operations and fulfilment group: the copied Fulfilment, Tickets, Operations, Budget, Settings, Stats and Removed routes (same reason as above).
  {
    files: [
      "app/\(reviewer\)/reviewer/fulfillment/**",
      "app/\(reviewer\)/reviewer/tickets/**",
      "app/\(reviewer\)/reviewer/operations/**",
      "app/\(reviewer\)/reviewer/budget/**",
      "app/\(reviewer\)/reviewer/settings/**",
      "app/\(reviewer\)/reviewer/stats/**",
      "app/\(reviewer\)/reviewer/removed/**",
    ],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
