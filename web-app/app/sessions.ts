import { createCookieSessionStorage } from '@remix-run/node';

const cookieSecretsStr = process.env.COOKIE_SECRET;
if (!cookieSecretsStr) throw new Error('Please set cookie secret in the environment variables');
const cookieSecrets = cookieSecretsStr.split(',');

type AuthSessionData = {
  activeAddress: string
};

export const authSession = createCookieSessionStorage<AuthSessionData>({
  cookie: {
    name: 'auth',
    secrets: cookieSecrets,
    httpOnly: true,
    secure: true,
  },
});
