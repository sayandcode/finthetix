import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { authSession } from '~/sessions';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const activeAddress = formData.get('activeAddress')?.toString();
  if (!activeAddress) {
    throw json({ err: 'Active address should be included in body form data' }, 400);
  }
  // set the cookie
  const session = await authSession.getSession(request.headers.get('Cookie'));
  session.set('activeAddress', activeAddress);

  // redirect to /dashboard
  return redirect('/dashboard', {
    status: 302,
    headers: {
      'Set-Cookie': await authSession.commitSession(session),
    },
  });
};
