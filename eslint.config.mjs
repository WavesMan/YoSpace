import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/backend-core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/Blog/*"],
              message: "后台页面禁止直接依赖博客前台组件，请改用后台独立组件。",
            },
            {
              group: ["@/app/blog/*", "@/app/tag/*", "@/app/category/*"],
              message: "后台页面禁止依赖前台路由模块，请保持前后台边界隔离。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/Blog/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/backend-core/*"],
              message: "博客前台组件禁止依赖后台页面模块，请通过服务层共享逻辑。",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
