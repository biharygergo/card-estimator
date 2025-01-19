import { Glob } from 'glob';
import * as fs from 'fs';

export class SitemapGenerator {
  private readonly SITEMAP_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  private readonly SITEMAP_FOOTER = `
</urlset>`;

  private readonly baseUrl: string;
  private readonly srcDirectory: string;

  private sitemapContent = '';

  constructor(srcDirectory: string = "dist/estimator/browser", baseUrl: string = "https://planningpoker.live") {
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
    new Glob(
      this.srcDirectory + '/**/index.html',
      (err: Error, res: string[]) => this.filesCallback(err, res)
    );
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
    fs.writeFile(
      this.srcDirectory + 'sitemap.xml',
      this.SITEMAP_HEADER + this.sitemapContent + this.SITEMAP_FOOTER,
      (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.log(err.message);
          return;
        }

        console.log(
          `sitemap.xml successfully created in '${this.srcDirectory}'`
        );
      }
    );
  }

  private filesCallback(err: Error, files: string[]): void {
    if (err) {
      console.log('Error', err);
      return;
    }

    files.sort((a, b) => {
      return a.length - b.length || a.localeCompare(b);
    });

    files
      .filter((route) => {
        const content = fs.readFileSync(route, 'utf-8');
        return !content.includes('<meta name="robots" content="noindex">');
      })
      .forEach((route) => this.addToSitemap(route));

    this.writeSitemapToFile();
  }
}

new SitemapGenerator().process();