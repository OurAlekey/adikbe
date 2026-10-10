import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Cambia "site" por tu dominio real cuando lo tengas (ej. https://adikbe.org).
// Mientras tanto puedes dejar el subdominio gratuito de Vercel, ej:
// https://adikbe.vercel.app
export default defineConfig({
  site: 'https://adikbe.vercel.app',
  integrations: [sitemap()],
});
