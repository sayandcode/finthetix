import { cssBundleHref } from '@remix-run/css-bundle';
import type { ErrorResponse, LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import tailwindCss from './tailwind.css';
import cairoFontStylesheet from '@fontsource-variable/cairo/wght.css';
import { Toaster } from './components/ui/toaster';
import { PARSED_PROCESS_ENV } from './lib/env';
import { AuthContextProvider } from './lib/react-context/AuthContext';
import { ChainInfo } from './lib/types';
import Navbar from './components/root/Navbar';

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  { rel: 'stylesheet', href: tailwindCss },
  { rel: 'stylesheet', href: cairoFontStylesheet },
];

export const loader = async () => {
  const chainInfo: ChainInfo = PARSED_PROCESS_ENV.NODE_ENV === 'development'
    ? {
        iconUrls: [],
        nativeCurrency: {
          name: 'xANV',
          symbol: 'xANV',
          decimals: 18,
        },
        rpcUrls: [
          'http://localhost:8545',
        ],
        chainId: `0x${(31337).toString(16)}`,
        chainName: 'Anvil',

      } as const
    : {} as ChainInfo;

  return json({ chainInfo });
};

export default function App() {
  const { chainInfo } = useLoaderData<typeof loader>();
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
        <AuthContextProvider chainInfo={chainInfo}>
          <Navbar />
          <Outlet />
        </AuthContextProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as ErrorResponse;
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
            {error.status }
            )
          </h1>
          <p>{error.data}</p>
        </div>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
