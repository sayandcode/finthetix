import { useEffect } from 'react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import { selectIsUserLoggedIn, setActiveChainId } from '~/redux/features/user/slice';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';

export default function useAutoSwitchActiveChainId() {
  const { chainInfo } = useRootLoaderData();
  const chainIdForFinthetixDapp = chainInfo.chainId;

  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);

  useEffect(() => {
    // don't set up the chain change handler until user is logged in
    if (!isUserLoggedIn) return;

    const metamask = new MetamaskHandler();
    const handleChainSwitched = (newChainId: string) => {
      dispatch(setActiveChainId(newChainId));
    };
    metamask.ethereum.on('chainChanged', handleChainSwitched);
    return () => {
      metamask.ethereum.off('chainChanged', handleChainSwitched);
    };
  }, [isUserLoggedIn, chainIdForFinthetixDapp, dispatch]);
}
