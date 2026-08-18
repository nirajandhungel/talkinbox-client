import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    // ─── Dev server proxy ──────────────────────────────────────────────────────
    // In development, /api/* is forwarded to the NestJS backend.
    // In production, Nginx handles the routing (/ → frontend, /api → backend).
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                // Uncomment if backend uses self-signed SSL in dev:
                // secure: false,
            },
        },
    },

    // ─── Build ─────────────────────────────────────────────────────────────────
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom", "react-router-dom"],
                    charts: ["recharts"],
                    query: ["@tanstack/react-query"],
                    motion: ["framer-motion"],
                },
            },
        },
    },
});
