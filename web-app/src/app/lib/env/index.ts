import { envSchema } from './schema';

export default function getServerEnv() {
  const parseResult = envSchema.safeParse(process.env);
  if (!parseResult.success) {
    console.error(parseResult.error);
    throw new Error('Env variables not parsed as expected');
  }

  return parseResult.data;
}
