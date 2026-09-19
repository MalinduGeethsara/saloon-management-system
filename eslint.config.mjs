import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling, not app code (CommonJS test rigs, load scripts, one-off seeds)
    "qa/**",
    "selenium-tests/**",
    "load-testing/**",
    "scripts/**",
    "prisma/*.js",
    "deploy/**",
  ]),
  // Style-level findings that were already all over the codebase (hundreds of `any`s, some React-compiler
  // hints): shown as warnings so the CI lint step fails only on real problems, not on old style debt.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
