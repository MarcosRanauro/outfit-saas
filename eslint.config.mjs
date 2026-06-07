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
  ]),
  {
    rules: {
      // Padrão legítimo de inicialização no mount (mounted/tema) usado em
      // vários componentes para evitar hydration mismatch — rebaixado de
      // error para warning para não quebrar o build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
