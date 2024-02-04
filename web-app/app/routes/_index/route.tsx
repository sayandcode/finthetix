import { type MetaFunction } from '@remix-run/node';
import { useCallback, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { useAppSelector } from '~/redux/hooks';
import { selectActiveAddress, selectIsUserLoading } from '~/redux/features/user/slice';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { useRequestMetamaskAddressMutation } from '~/redux/services/metamask';

export const meta: MetaFunction = () => {
  return [
    { title: 'Finthetix' },
    { name: 'description', content: 'Earn rewards by staking with Finthetix' },
  ];
};

export default function Route() {
  const { chainInfo } = useRootLoaderData();
  const navigate = useNavigate();
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const hasActiveAddress = !isUserLoading && !!activeAddress;
  const [requestMetamaskAddress] = useRequestMetamaskAddressMutation();

  useEffect(() => {
    if (hasActiveAddress) navigate('/dashboard');
  }, [hasActiveAddress, navigate]);

  const handleClick = useCallback(() => {
    requestMetamaskAddress(chainInfo);
  }, [requestMetamaskAddress, chainInfo]);

  // if active address is available, a redirect is pending, so disable the btn
  const isBtnDisabled = isUserLoading || hasActiveAddress;
  return (
    <div>
      <section className="flex flex-col gap-y-2 items-center justify-center h-screen text-center">
        <h1 className="text-5xl sm:text-6xl font-bold">Finthetix</h1>
        <p className="text-xl">Earn rewards by staking tokens</p>
        <Button onClick={handleClick} disabled={isBtnDisabled}>
          {isBtnDisabled
            ? <Loader2Icon className="animate-spin" />
            : 'Connect Wallet'}
        </Button>
      </section>
    </div>
  );
}
