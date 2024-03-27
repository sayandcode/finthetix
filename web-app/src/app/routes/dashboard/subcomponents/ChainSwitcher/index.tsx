import { useAppSelector } from '~/redux/hooks';
import { selectActiveChainId } from '~/redux/features/user/slice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import UnderlineLink from '~/components/ui/underline-link';
import useSyncInitialChainId from './lib/useSyncInitialChainId';
import useAutoSwitchActiveChainId from './lib/useAutoSwitchActiveChainId';
import useSwitchToCorrectChain from './lib/useSwitchToCorrectChain';

export default function ChainSwitcher() {
  // loader data
  const rootLoaderData = useRootLoaderData();
  const chainIdForFinthetixDapp = rootLoaderData.chainInfo.chainId;

  // redux related
  const activeChainId = useAppSelector(selectActiveChainId);

  useSyncInitialChainId();
  useAutoSwitchActiveChainId();
  const { switchToCorrectChain, isSwitchingChain } = useSwitchToCorrectChain();

  const isDialogOpen
    // Don't open when chainId is loading, to prevent hydration issues
    = activeChainId !== null
    && activeChainId !== chainIdForFinthetixDapp;

  return (
    <Dialog open={isDialogOpen}>
      <DialogContent hideCloseBtn>
        <DialogHeader>
          <DialogTitle>Wrong Chain</DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline sm:gap-x-1 justify-center my-2">
            <div>Current Chain ID:</div>
            {
              activeChainId === null
                ? <Loader2Icon className="animate-spin" />
                : <div className="font-bold text-4xl text-gray-600">{parseInt(activeChainId, 16)}</div>
            }
          </div>
        </div>
        <div className="h-[1px] w-4/5 mx-auto bg-gray-300" />
        <div className="flex flex-col items-center gap-y-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-x-4 sm:items-center">
          <Button onClick={switchToCorrectChain} className="order-1 sm:order-3">
            {isSwitchingChain
              ? <Loader2Icon className="animate-spin" />
              : 'Switch to Correct Chain'}
          </Button>
          <div className="font-bold order-2">OR</div>
          <div className="text-center order-3 sm:order-1 text-sm">
            Manually switch to a chain with ID
            {' '}
            {parseInt(chainIdForFinthetixDapp, 16)}
            <UnderlineLink className="text-xs whitespace-nowrap" href="https://metaschool.so/articles/how-to-change-add-new-network-metamask-wallet/">(How?)</UnderlineLink>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
