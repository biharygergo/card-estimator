import { openSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { Article } from '../app/landing/blog/types';
import * as path from 'path';

export function getArticles(): Article[] {
  return readdirSync(path.join(__dirname, 'data'))
    .map((fileName) => {
      const FRONT_MATTER_REGEX = /---\n([\S\s]*)\n---\n([\S\s]*)/gm;
      try {
        const fileContent = readFileSync(
          path.join(__dirname, 'data', fileName),
          'utf-8'
        ).toString();

        const matches = FRONT_MATTER_REGEX.exec(fileContent);
        const meta = matches[1];
        const content = matches[2];

        const metaContent: Omit<Article, 'content'> = meta
          .split('\n')
          .map((line) => ({
            fieldName: line.split(':')[0],
            content: line.split(':').slice(1).join(':').trim(),
          }))
          .reduce((acc, curr) => {
            const fieldContent = curr.content.trim();
            if (curr.fieldName === 'tags') {
              return { ...acc, [curr.fieldName]: fieldContent.split(', ') };
            }
            if (curr.fieldName === 'faqs') {
              const faqs = JSON.parse(fieldContent);
              return { ...acc, [curr.fieldName]: faqs };
            }

            return { ...acc, [curr.fieldName]: fieldContent };
          }, {}) as Omit<Article, 'content'>;

        return { ...metaContent, content };
      } catch (e) {
        console.error(e);
        return undefined;
      }
    })
    .filter((article) => !!article);
}

function generateArticlesToAssets() {
  const articles = getArticles();
  const assetsArticlesPath = path.join(__dirname, '..', 'assets', 'articles');

  /** Generate index file */
  const indexFilePath = path.join(assetsArticlesPath, 'index.json');
  openSync(indexFilePath, 'w');
  writeFileSync(indexFilePath, JSON.stringify(articles));

  articles.forEach((article) => {
    const articlePath = path.join(assetsArticlesPath, `${article.slug}.json`);
    openSync(articlePath, 'w');
    writeFileSync(articlePath, JSON.stringify(article));
  });
}

generateArticlesToAssets();
