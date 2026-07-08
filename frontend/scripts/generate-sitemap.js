import fs from 'fs';
import path from 'path';

// Define the absolute base URL
const BASE_URL = 'https://vidnexa.space';

// Compile all 49 platform-specific, blog, help, and legal URLs
const staticRoutes = [
  // Downloader Tools
  '/',
  '/youtube-video-downloader',
  '/instagram-reel-downloader',
  '/facebook-video-downloader',
  '/twitter-video-downloader',
  '/tiktok-video-downloader',
  '/pinterest-video-downloader',
  '/reddit-video-downloader',
  '/linkedin-video-downloader',
  '/snapchat-video-downloader',
  '/threads-video-downloader',
  '/vimeo-video-downloader',
  '/dailymotion-video-downloader',

  // Index Support Pages
  '/about',
  '/contact',
  '/api-documentation',
  '/faq',
  '/login',
  '/dashboard',

  // Legal Policies
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/dmca-policy',
  '/copyright-policy',
  '/disclaimer',

  // Blog Feed Index
  '/blog',
  
  // Blog posts (14 articles)
  '/blog/how-to-download-instagram-reels',
  '/blog/how-to-save-facebook-videos',
  '/blog/best-online-video-downloader',
  '/blog/download-hd-videos-online',
  '/blog/video-downloader-safety-guide',
  '/blog/how-video-downloaders-work',
  '/blog/download-videos-on-android',
  '/blog/download-videos-on-iphone',
  '/blog/download-videos-on-windows',
  '/blog/download-videos-on-mac',
  '/blog/instagram-tips',
  '/blog/tiktok-tips',
  '/blog/facebook-tips',
  '/blog/youtube-tips',

  // Help Center Index
  '/help',

  // Help guides (11 guides)
  '/help/how-to-download-youtube-videos',
  '/help/how-to-download-instagram-reels',
  '/help/how-to-download-facebook-videos',
  '/help/how-to-download-tiktok-videos',
  '/help/how-to-download-twitter-videos',
  '/help/how-to-download-pinterest-videos',
  '/help/how-to-download-reddit-videos',
  '/help/supported-platforms',
  '/help/video-quality-guide',
  '/help/troubleshooting',
  '/help/common-errors'
];

function generateSitemap() {
  const dateStr = new Date().toISOString().split('T')[0];

  const xmlUrls = staticRoutes.map(route => {
    const priority = route === '/' ? '1.0' : route.startsWith('/blog/') || route.startsWith('/help/') ? '0.8' : '0.9';
    const changefreq = route.startsWith('/blog/') || route.startsWith('/help/') ? 'weekly' : 'monthly';
    
    return `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

  const outDir = path.join(process.cwd(), 'dist');
  
  // Ensure dist exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Write sitemap.xml
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log('✓ sitemap.xml generated in dist/');

  // 2. Write robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt, 'utf8');
  console.log('✓ robots.txt generated in dist/');
}

generateSitemap();
