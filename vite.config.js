import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The app is served from https://fodya4.github.io/REPO-NAME/, not the domain root,
  // so built file paths must start with this folder name.
  base: "/A2---Low-fidelity-Prototype-Unnamed-for-now/",
});
