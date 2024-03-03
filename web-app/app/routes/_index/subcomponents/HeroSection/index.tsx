import { useNavigate } from '@remix-run/react';
import { Loader2Icon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { selectIsUserLoading, selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useRequestMetamaskAddressMutation } from '~/redux/services/metamask';

export default function HeroSection() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const login = useLogin();

  useNavigateToDashboardOnLogin(isUserLoggedIn);

  // if active address is available, a redirect is pending, so disable the btn
  const isBtnDisabled = isUserLoading || isUserLoggedIn;

  return (
    <section className="flex flex-col gap-y-2 items-center justify-center h-screen text-center">
      <h1 className="text-5xl sm:text-6xl font-bold">Finthetix</h1>
      <p className="text-xl">Earn rewards by staking tokens</p>
      <Button onClick={login} disabled={isBtnDisabled}>
        {isBtnDisabled
          ? <Loader2Icon className="animate-spin" />
          : 'Connect Wallet'}
      </Button>
    </section>
  );
}

function useLogin() {
  const { chainInfo } = useRootLoaderData();
  const [requestMetamaskAddress] = useRequestMetamaskAddressMutation();

  const login = useCallback(() => {
    requestMetamaskAddress(chainInfo);
  }, [requestMetamaskAddress, chainInfo]);

  return login;
}

function useNavigateToDashboardOnLogin(isUserLoggedIn: boolean) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isUserLoggedIn) navigate('/dashboard');
  }, [isUserLoggedIn, navigate]);
}
