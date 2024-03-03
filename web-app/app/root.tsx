import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  json,
  useRouteError,
} from '@remix-run/react';
import tailwindCss from './tailwind.css';
import cairoFontStylesheet from '@fontsource-variable/cairo/wght.css';
import { Toaster } from './components/ui/toaster';
import Navbar from './components/root/Navbar';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './redux/store';
import ReduxInitializer from './redux/Initializer';
import { getChainInfo, getDappInfo } from './lib/loaders';
import AutoLogin from './components/root/AutoLogin';
import { ReadonlyFinthetixStakingContractHandler } from './contracts/FinthetixStakingContract';
import stringifyBigIntsInObj from './lib/utils/stringifyBigIntsInObj';

export const ROUTE_PATH = 'root';

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  { rel: 'stylesheet', href: tailwindCss },
  { rel: 'stylesheet', href: cairoFontStylesheet },
];

export const loader = async () => {
  const chainInfo = getChainInfo();
  const dappInfo = getDappInfo();

  const fscReadonlyHandler
    = new ReadonlyFinthetixStakingContractHandler(
      chainInfo.rpcUrls[0], dappInfo,
    );
  const finthetixMetadata
    = stringifyBigIntsInObj(await fscReadonlyHandler.getMetadata());
  return json({ chainInfo, dappInfo, finthetixMetadata });
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Toaster />
        <ReduxProvider store={store}>
          <ReduxInitializer store={store} />
          <AutoLogin />
          <Navbar />
          <Outlet />
        </ReduxProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let validatedError: { status: number, data: string } = { status: 500, data: 'Internal Error' };
  if (isRouteErrorResponse(error)) validatedError = error;
  else {
    // This may be converted to a client-side logging solution
    console.error(error);
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="h-screen flex flex-col justify-center items-center text-center gap-y-2">
          <h1 className="text-3xl font-semibold">
            Oops! Something went wrong (
            {validatedError.status }
            )
          </h1>
          <p>{validatedError.data}</p>
        </div>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
