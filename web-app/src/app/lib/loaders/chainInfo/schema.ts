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
