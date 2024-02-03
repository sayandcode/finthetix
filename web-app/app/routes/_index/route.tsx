import { type MetaFunction } from '@remix-run/node';
import { useContext, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { AuthContext } from '~/lib/react-context/AuthContext';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export default function Route() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const hasActiveAddress = !auth.isLoading && !!auth.user;
  useEffect(() => {
    if (hasActiveAddress) navigate('/dashboard');
  }, [hasActiveAddress, navigate]);

  // if user is available, a redirect is pending, so disable the btn
  const isBtnDisabled = auth.isLoading || hasActiveAddress;
  return (
    <div>
      <section className="flex flex-col gap-y-2 items-center justify-center h-screen text-center">
        <h1 className="text-5xl sm:text-6xl font-bold">Finthetix</h1>
        <p className="text-xl">Earn rewards by staking tokens</p>
        <Button onClick={auth.login} disabled={isBtnDisabled}>
          {isBtnDisabled
            ? <Loader2Icon className="animate-spin" />
            : 'Connect Wallet'}
        </Button>
      </section>
    </div>
  );
}
