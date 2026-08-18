import { globSync } from 'glob';
import * as fs from 'fs';

export class SitemapGenerator {
  private readonly SITEMAP_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  private readonly SITEMAP_FOOTER = `
</urlset>`;

  private readonly baseUrl: string;
  private readonly srcDirectory: string;

  private sitemapContent = '';

  constructor(
    srcDirectory: string = 'dist/estimator/browser',
    baseUrl: string = 'https://planningpoker.live'
  ) {
    this.baseUrl = SitemapGenerator.withTrailingSlash(baseUrl);
    this.srcDirectory = SitemapGenerator.withTrailingSlash(srcDirectory);
  }

  private static withTrailingSlash(text: string) {
    if (!text.endsWith('/')) {
      return text + '/';
    }
    return text;
  }

  process(): void {
    const files = globSync(this.srcDirectory + '**/index.html');

    if (!files.length) {
      throw new Error(
        `No index.html files found in '${this.srcDirectory}'. Run the build before generating the sitemap.`
      );
    }

    files.sort((a, b) => {
      return a.length - b.length || a.localeCompare(b);
    });

    files
      .filter(route => {
        const content = fs.readFileSync(route, 'utf-8');
        return !content.includes('<meta name="robots" content="noindex">');
      })
      .forEach(route => this.addToSitemap(route));

    this.writeSitemapToFile();
  }

  private addToSitemap(file: string): void {
    let url = file.replace(this.srcDirectory, this.baseUrl);
    url = url.replace('/index.html', '');
    this.sitemapContent += `
    <url>
        <loc>${url}</loc>
    </url>`;
  }

  private writeSitemapToFile(): void {
    const target = this.srcDirectory + 'sitemap.xml';
    fs.writeFileSync(
      target,
      this.SITEMAP_HEADER + this.sitemapContent + this.SITEMAP_FOOTER
    );
    console.log(`sitemap.xml successfully created in '${this.srcDirectory}'`);
  }
}

try {
  new SitemapGenerator().process();
} catch (error) {
  console.error(
    'Failed to generate sitemap.xml:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}
