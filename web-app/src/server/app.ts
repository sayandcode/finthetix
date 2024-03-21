import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from 'build/index';
import { ServerBuild } from '@remix-run/node';

const typedBuild = build as unknown as ServerBuild;

export default function makeApp(): express.Express {
  const app = express();

  app.get('/favicon.ico', (req, res) => {
    res.redirect('/static/favicon.ico');
  });

  // The /static/* routing is configured on Cloudfront.
  // This saves us from having to use `assetStoreBaseUrl` as an env
  // variable on the lambda running express
  // app.use('/static/*', (req, res) => {
  //   const params = req.originalUrl.slice('/static/'.length);
  //   res.redirect(`${assetStoreBaseUrl}/${params}`)
  // });

  app.use(
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
