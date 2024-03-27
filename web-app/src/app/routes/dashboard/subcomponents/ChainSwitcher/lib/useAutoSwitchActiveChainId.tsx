import { useEffect } from 'react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { useAppDispatch } from '~/redux/hooks';
import { setActiveChainId } from '~/redux/features/user/slice';
import { ChainInfo } from '~/lib/loaders/chainInfo/schema';

export default function useAutoSwitchActiveChainId(
  chainIdForFinthetixDapp: ChainInfo['chainId'],
  dispatch: ReturnType<typeof useAppDispatch>,
) {
  useEffect(() => {
    const metamask = new MetamaskHandler();
    const handleChainSwitched = (newChainId: string) => {
      dispatch(setActiveChainId(newChainId));
    };
    metamask.ethereum.on('chainChanged', handleChainSwitched);
    return () => {
      metamask.ethereum.off('chainChanged', handleChainSwitched);
    };
  }, [chainIdForFinthetixDapp, dispatch]);
}
