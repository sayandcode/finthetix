import { useRouteLoaderData } from '@remix-run/react';
import { ROUTE_PATH as ROOT_ROUTE_PATH, loader as rootLoader } from '~/root';

/**
 * This function will only throw an error if used in a route which is not
 * matched by the root route.
 * @returns The data returned in root loader
 */
export default function useRootLoaderData() {
  const rootLoaderData = useRouteLoaderData<typeof rootLoader>(ROOT_ROUTE_PATH);
  if (!rootLoaderData)
    throw new Error(
      `${ROOT_ROUTE_PATH} loader not available in parent of this component`,
    );

  return rootLoaderData;
}
