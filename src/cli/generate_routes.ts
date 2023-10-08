import { routes } from '../../static_routes';
import { getArticles } from './generate_metadata';
import * as path from 'path';
import { openSync, writeFileSync } from 'fs';

function generateRoutes() {
  const articles = getArticles();
  const staticRoutes = routes;

  const allRoutes = [
    ...staticRoutes,
    ...articles.map((article) => `/knowledge-base/${article.slug}`),
  ].join('\n');

  const routesTxtPath = path.join(__dirname, '..', '..', 'routes.txt');
  openSync(routesTxtPath, 'w');
  writeFileSync(routesTxtPath, allRoutes);
}

generateRoutes();
