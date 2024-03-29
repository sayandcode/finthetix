import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import { ServerBuild } from '@remix-run/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as build from '../build/index';
import getCacheConfig from '~/lib/loaders/cacheConfig';
import getServerEnv from '~/lib/env';

const typedBuild = build as unknown as ServerBuild;

export default function makeApp(): express.Express {
  const app = express();

  app.get('/favicon.ico', (req, res) => {
    const { serverMaxAge, staleWhileRevalidate } = getCacheConfig();
    res.setHeader('Cache-Control', `s-maxage=${serverMaxAge}; stale-while-revalidate=${staleWhileRevalidate}`);
    res.redirect('/static/favicon.ico');
  });

  // Only host the static paths when running locally
  // This route will be routed to s3 by cloudfront on production
  // This also prevents errors in `import.meta.url` in lambda
  const { IS_RUNNING_LOCALLY } = getServerEnv();
  if (IS_RUNNING_LOCALLY) {
    const __filename
      // Our production bundler (esbuild) and local production server
      // bundler(tsx), both allow modern imports.
      // @ts-expect-error Case is handled by bundler
      = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    app.use('/static', express.static(path.join(__dirname, '../public')));
  }

  app.all(
    '*',
    createRequestHandler({
      build: typedBuild,

      // return anything you want here to be available as `context` in your
      // loaders and actions. This is where you can bridge the gap between Remix
      // and your server
      getLoadContext(/* req, res */) {
        return {};
      },
    }),
  );

  return app;
}
