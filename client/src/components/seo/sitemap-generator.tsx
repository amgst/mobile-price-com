// This would be used for generating XML sitemaps dynamically
// For now, we'll create the structure that can be used server-side

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function generateSitemapEntries(mobiles: any[], brands: any[]): SitemapEntry[] {
  const baseUrl = 'https://mobile-price.com';
  const entries: SitemapEntry[] = [];
  
  // Home page
  entries.push({
    loc: baseUrl,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 1.0
  });
  
  // Brand pages
  brands.forEach(brand => {
    entries.push({
      loc: `${baseUrl}/${brand.slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8
    });
  });
  
  // Mobile detail pages
  mobiles.forEach(mobile => {
    entries.push({
      loc: `${baseUrl}/${mobile.brand.toLowerCase()}/${mobile.slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.9
    });
  });
  
  // Static pages
  const staticPages = [
    { path: '/brands', priority: 0.7 },
    { path: '/search', priority: 0.6 },
    { path: '/compare', priority: 0.6 }
  ];
  
  staticPages.forEach(page => {
    entries.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: page.priority
    });
  });
  
  return entries;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
}