import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { blogSlugs } from './scripts/routes';

/**
 * - Injeta no HTML a verificação do Google Search Console, o JSON-LD (SEO local) e a URL do site.
 * - Gera sitemap.xml e robots.txt automaticamente no build (com a URL do seu domínio).
 */
function seoPlugin(env: Record<string, string>): Plugin {
  const siteUrl = (env.VITE_SITE_URL || 'https://www.maravaleska.com.br').replace(/\/$/, '');
  const gsc = env.VITE_GSC_VERIFICATION || '';
  return {
    name: 'valeska-seo',
    transformIndexHtml(html) {
      const gscTag = gsc ? `<meta name="google-site-verification" content="${gsc}" />` : '';
      return html.replaceAll('%GSC_TAG%', gscTag).replaceAll('%SITE_URL%', siteUrl);
    },
    generateBundle() {
      const pages = ['', '/sobre', '/servicos', '/agendar', '/blog', '/faq', '/contato', ...blogSlugs.map((s) => `/blog/${s}`)];
      const today = new Date().toISOString().slice(0, 10);
      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        pages.map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod><priority>${p === '' ? '1.0' : '0.8'}</priority></url>`).join('\n') +
        `\n</urlset>\n`;
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /minha-conta\nDisallow: /agenda/\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), seoPlugin(env)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { port: 5173, strictPort: true },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
  };
});
