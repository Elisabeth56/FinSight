import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    include: ["tests/**/*.test.ts"],
    // the Neon Auth SDK imports "next/headers" without an extension, which only Vite's resolver accepts
    server: { deps: { inline: ["@neondatabase/auth"] } },
  },
});
