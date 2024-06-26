import { Loader2Icon } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '~/components/ui/button';
import cn from '~/lib/utils/shadcn';
import { selectActiveAddress, selectIsUserLoading, setActiveAddress } from '~/redux/features/user/slice';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { useRequestMetamaskAddressMutation } from '~/redux/services/metamask';
import useStickyNavbar from './lib/useStickyNavbar';
import GithubIcon from '~/lib/assets/GithubIcon';
import { FINTHETIX_GITHUB_URL } from '~/lib/constants';
import { Link, useLocation } from '@remix-run/react';

const OVERLAP_THRESHOLD_FOR_STICKY_NAVBAR = 1;

export default function Navbar() {
  const activeAddress = useAppSelector(selectActiveAddress);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const dispatch = useAppDispatch();
  const [requestMetamaskAddress] = useRequestMetamaskAddressMutation();
  const { isNavStuck, dummyRef }
    = useStickyNavbar(OVERLAP_THRESHOLD_FOR_STICKY_NAVBAR);

  const handleClick = useCallback(() => {
    if (activeAddress) dispatch(setActiveAddress(null));
    else requestMetamaskAddress();
  }, [activeAddress, dispatch, requestMetamaskAddress]);

  const { pathname } = useLocation();
  const isOnDashboardPage = pathname === '/dashboard';

  return (
    <>
      <div ref={dummyRef} className="h-16 w-full absolute" />
      <nav
        className={
          cn(
            'h-16 flex items-center px-4 py-0 gap-x-4 backdrop-blur-sm sticky top-0 z-10 animate-[box-shadow] duration-200',
            isNavStuck && 'shadow-sm shadow-primary-foreground/90')
        }
      >
        {isOnDashboardPage
          ? <div className="mr-auto font-bold text-2xl cursor-default">Finthetix</div>
          : (
            <Link
              to={activeAddress ? '/dashboard' : '/'}
              prefetch="intent"
              className="mr-auto font-bold text-2xl"
            >
              Finthetix
            </Link>
            )}
        <a target="_blank" href={FINTHETIX_GITHUB_URL} rel="noreferrer">
          <GithubIcon />
        </a>
        <Button onClick={handleClick} className="min-w-16 hover:bg-destructive group">

          {isUserLoading
            ? <Loader2Icon className="animate-spin" />
            : activeAddress
              ? (
                <span className="inline-flex relative justify-center">
                  <span className="w-16 sm:w-max truncate opacity-100 group-hover:opacity-0">{activeAddress}</span>
                  <span className="opacity-0 group-hover:opacity-100 absolute text-white">Logout</span>
                </span>
                )
              : (
                <span>
                  Connect
                  {' '}
                  <span className="hidden sm:inline">Wallet</span>
                </span>
                )}
        </Button>
      </nav>
    </>
  );
}
