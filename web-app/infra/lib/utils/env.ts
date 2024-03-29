import { envSchema as appEnvSchema } from '../../../src/app/lib/env/schema';
import { z } from 'zod';

const {
  NODE_ENV, // NODE_ENV is always 'production' when deploying
  ...appEnvSchemaPassedAsInfraEnv
} = appEnvSchema.shape;

const envSchema = z.object({
  ...appEnvSchemaPassedAsInfraEnv,

  // custom domain env variables
  /**
   * The custom domain where your app is to be accessible.
   * After deployment, you create this as a CNAME record pointing
   * to the obtained cloudfront domain name, on your DNS
   */
  APP_CUSTOM_DOMAIN_NAME: z.string().trim().min(1),

  /**
   * The ARN for your custom domain SSL certificate.
   * You need to manually provision this in N.Virginia AWS zone,
   * do the required validation on the DNS side,
   * and then provide the ARN here.
   */
  APP_CUSTOM_DOMAIN_CERT_ARN: z.string().startsWith('arn:aws:acm:us-east-1:'),
});

const parsedEnv = envSchema.parse(process.env);

export default parsedEnv;
