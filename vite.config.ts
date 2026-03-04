import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "src"),
        },
    },
    root: ".",
    publicDir: "public",
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            overlay: false,
        },
    },
});
