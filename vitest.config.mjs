import { fileURLToPath } from "node:url";
export default {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "cloudflare:workers": fileURLToPath(
        new URL("./src/test/cloudflare-workers.ts", import.meta.url),
      ),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
};
