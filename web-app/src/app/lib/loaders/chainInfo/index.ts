import { LOCAL_CHAIN_INFO } from '~/lib/constants';
import getParsedEnv from '../../env';
import { ChainInfo } from './schema';

export function getChainInfo(): ChainInfo {
  const env = getParsedEnv();
  return env.NODE_ENV === 'development'
    ? LOCAL_CHAIN_INFO
    : env.PRODUCTION_CHAIN_INFO;
}
