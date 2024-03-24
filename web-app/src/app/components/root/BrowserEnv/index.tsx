import { z } from 'zod';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { ChainInfo, chainInfoSchema } from '~/lib/loaders/chainInfo/schema';
import { DappInfo, dappInfoSchema } from '~/lib/loaders/dappInfo/schema';

type EnvVars = {
  chainInfo: ChainInfo
  dappInfo: DappInfo
};

const envVarsSchema = z.object({
  chainInfo: chainInfoSchema,
  dappInfo: dappInfoSchema,
}) satisfies z.ZodType<EnvVars>;

const ENV_VAR_KEY_ON_WINDOW_OBJ = 'ENV';

export default function BrowserEnv() {
  const { chainInfo, dappInfo } = useRootLoaderData();

  const envVars: EnvVars = {
    chainInfo, dappInfo,
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `window.${ENV_VAR_KEY_ON_WINDOW_OBJ} = ${JSON.stringify(envVars)}`,
      }}
    />
  );
}

export function getBrowserEnv(): EnvVars {
  if (typeof window === 'undefined') {
    throw new Error('Cannot access browser env on server');
  }

  if (!(ENV_VAR_KEY_ON_WINDOW_OBJ in window)) {
    throw new Error(
      `The environment variable 
      "${ENV_VAR_KEY_ON_WINDOW_OBJ}"
       has not been set correctly on "window"`,
    );
  }

  return envVarsSchema.parse(window.ENV);
}
