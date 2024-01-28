import { createCookieSessionStorage } from '@remix-run/node';
import { PARSED_PROCESS_ENV } from './lib/env';

type AuthSessionData = {
  activeAddress: string
};

export const authSession = createCookieSessionStorage<AuthSessionData>({
  cookie: {
    name: 'auth',
    secrets: PARSED_PROCESS_ENV.COOKIE_SECRETS,
    httpOnly: true,
    secure: true,
  },
});
