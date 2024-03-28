import { envSchema as appEnvSchema } from '../../../src/app/lib/env/schema';
import { z } from 'zod';

const {
  NODE_ENV, // NODE_ENV is always 'production' when deploying
  ...appEnvSchemaPassedAsInfraEnv
} = appEnvSchema.shape;

const envSchema = z.object({
  ...appEnvSchemaPassedAsInfraEnv,

  // custom domain env variables
  APP_CUSTOM_DOMAIN_NAME: z.string().trim().min(1),
  APP_CUSTOM_DOMAIN_CERT_ARN: z.string().trim().min(1),
});

const parsedEnv = envSchema.parse(process.env);

export default parsedEnv;
