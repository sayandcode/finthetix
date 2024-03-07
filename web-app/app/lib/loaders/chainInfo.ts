import { LOCAL_CHAIN_INFO } from '../constants';
import { PARSED_PROCESS_ENV } from '../env';
import { z } from 'zod';

export type ChainInfo = {
  iconUrls: string[]
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: [string, ...string[]]
  chainId: string
  chainName: string
};

export const chainInfoSchema = z.object({
  iconUrls: z.array(z.string()),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
  }),
  rpcUrls: z.array(z.string()).nonempty(),
  chainId: z.string(),
  chainName: z.string(),
}) satisfies z.ZodType<ChainInfo>;

export function getChainInfo(): ChainInfo {
  return PARSED_PROCESS_ENV.NODE_ENV === 'development'
    ? LOCAL_CHAIN_INFO
    : PARSED_PROCESS_ENV.PRODUCTION_CHAIN_INFO;
}
