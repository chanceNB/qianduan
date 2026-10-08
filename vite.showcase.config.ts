import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Explicit constants override inherited shell/.env settings for this artifact only.
export default defineConfig({
  plugins: [
    react(),
    {
      name: "showcase-static-hosting",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "_redirects",
          source: "/* /index.html 200\n",
        });
        this.emitFile({
          type: "asset",
          fileName: "vercel.json",
          source: JSON.stringify(
            { rewrites: [{ source: "/(.*)", destination: "/index.html" }] },
            null,
            2,
          ),
        });
      },
    },
  ],
  define: {
    "import.meta.env.VITE_API_MODE": JSON.stringify("mock"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify("/mock-api/v1"),
    "import.meta.env.VITE_MOCK_SCENARIO": JSON.stringify("demo_happy_path"),
  },
  build: { outDir: "dist-showcase" },
});
