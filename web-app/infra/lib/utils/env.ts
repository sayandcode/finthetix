import { envSchema as appEnvSchema } from '../../../src/app/lib/env';
import { z } from 'zod';

const envSchema = z.object({
  ...appEnvSchema.shape,
});

const parsedEnv = envSchema.parse(process.env);

export default parsedEnv;
