import { z } from 'zod';

export type BlockExplorerInfo = {
  txUrl: string
  addressUrl: string
};

const urlSchema = z.string().url().endsWith('/');

export const blockExplorerInfoSchema = z.object({
  txUrl: urlSchema,
  addressUrl: urlSchema,
}) satisfies z.ZodType<BlockExplorerInfo>;
