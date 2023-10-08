import { openSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { Article } from '../types';
import * as path from 'path';


function getArticles(): Article[] {
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
          .map((line) => line.split(':'))
          .map((splitLine) => ({
            fieldName: splitLine[0],
            content: splitLine[1],
          }))
          .reduce(
            (acc, curr) => ({ ...acc, [curr.fieldName]: curr.content.trim() }),
            {}
          ) as Omit<Article, 'content'>;

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
  const assetsArticlesPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'assets',
    'articles'
  );

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
