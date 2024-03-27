import { useEffect } from 'react';
import { ChainInfo } from '~/lib/loaders/chainInfo/schema';
import { setActiveChainId } from '~/redux/features/user/slice';
import { useAppDispatch } from '~/redux/hooks';
import MetamaskHandler from '~/redux/services/lib/Metamask';

/**
 * Fetches the initial Id and sets it to global state
 */
export default function useSyncInitialChainId(
  chainIdForFinthetixDapp: ChainInfo['chainId'],
  dispatch: ReturnType<typeof useAppDispatch>,
) {
  useEffect(() => {
    (async () => {
      const metamask = new MetamaskHandler();
      const newActiveChainId = await metamask.getActiveChainId();

      dispatch(setActiveChainId(newActiveChainId));
    })();
  }, [dispatch, chainIdForFinthetixDapp]);
}
