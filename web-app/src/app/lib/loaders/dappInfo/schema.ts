import { z } from 'zod';

export type DappInfo = {
  stakingContractAddr: string
  stakingTokenAddr: string
  rewardTokenAddr: string
};

const ethAddressSchema = z.string().regex(/^0x([0-9]|[a-f]){40}$/i);

export const dappInfoSchema = z.object({
  stakingContractAddr: ethAddressSchema,
  stakingTokenAddr: ethAddressSchema,
  rewardTokenAddr: ethAddressSchema,
}) satisfies z.ZodType<DappInfo>;
