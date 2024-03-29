import { z } from 'zod';
import { envSchema } from '~/lib/env/schema';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { BlockExplorerInfo, blockExplorerInfoSchema } from '~/lib/loaders/blockExplorerInfo/schema';
import { ChainInfo, chainInfoSchema } from '~/lib/loaders/chainInfo/schema';
import { DappInfo, dappInfoSchema } from '~/lib/loaders/dappInfo/schema';

type EnvVars = {
  chainInfo: ChainInfo
  dappInfo: DappInfo
  blockExplorerInfo: BlockExplorerInfo
  rpcQueryMaxBlockCount: z.infer<typeof envSchema['shape']['RPC_QUERY_MAX_BLOCK_COUNT']>
};

const browserEnvVarsSchema = z.object({
  chainInfo: chainInfoSchema,
  dappInfo: dappInfoSchema,
  blockExplorerInfo: blockExplorerInfoSchema,
  rpcQueryMaxBlockCount: envSchema.shape.RPC_QUERY_MAX_BLOCK_COUNT,
}) satisfies z.ZodType<EnvVars>;

const ENV_VAR_KEY_ON_WINDOW_OBJ = 'ENV';

export default function BrowserEnv() {
  const {
    chainInfo,
    dappInfo,
    blockExplorerInfo,
    rpcQueryMaxBlockCount,
  } = useRootLoaderData();

  const envVars: EnvVars = {
    chainInfo,
    dappInfo,
    blockExplorerInfo,
    rpcQueryMaxBlockCount,
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

  return browserEnvVarsSchema.parse(window.ENV);
}
