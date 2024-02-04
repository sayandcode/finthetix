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
import { PARSED_PROCESS_ENV } from './lib/env';
import { ChainInfo, DappInfo } from './lib/types';
import Navbar from './components/root/Navbar';
import { LOCAL_CHAIN_INFO } from './lib/constants';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './redux/store';

export const ROUTE_PATH = 'root';

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  { rel: 'stylesheet', href: tailwindCss },
  { rel: 'stylesheet', href: cairoFontStylesheet },
];

export const loader = async () => {
  const chainInfo: ChainInfo = PARSED_PROCESS_ENV.NODE_ENV === 'development' ? LOCAL_CHAIN_INFO : {};
  const dappInfo: DappInfo = {
    stakingContractAddr: PARSED_PROCESS_ENV.STAKING_CONTRACT_ADDRESS,
    stakingTokenAddr: PARSED_PROCESS_ENV.STAKING_TOKEN_ADDRESS,
    rewardTokenAddr: PARSED_PROCESS_ENV.REWARD_TOKEN_ADDRESS,
  };
  return json({ chainInfo, dappInfo });
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
