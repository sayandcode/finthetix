import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import { ServerBuild } from '@remix-run/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as build from '../build/index';

const __filename
  // Our production bundler (esbuild) and local production server bundler(tsx)
  // both allow modern imports.
  // @ts-expect-error Case is handled by bundler
  = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typedBuild = build as unknown as ServerBuild;

export default function makeApp(): express.Express {
  const app = express();

  app.get('/favicon.ico', (req, res) => {
    res.redirect('/static/favicon.ico');
  });

  app.use('/static', express.static(path.join(__dirname, '../public')));

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
