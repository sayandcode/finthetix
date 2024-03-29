import { useEffect } from 'react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { useAppSelector } from '~/redux/hooks';
import { selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useSyncActiveChainIdMutation } from '~/redux/services/metamask';

export default function useAutoSwitchActiveChainId() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const [syncActiveChainId] = useSyncActiveChainIdMutation();

  useEffect(() => {
    // don't set up the chain change handler until user is logged in
    if (!isUserLoggedIn) return;

    const handleChainSwitched = () => {
      syncActiveChainId();
    };

    const metamask = new MetamaskHandler();
    metamask.ethereum.on('chainChanged', handleChainSwitched);

    return () => {
      metamask.ethereum.off('chainChanged', handleChainSwitched);
    };
  }, [isUserLoggedIn, syncActiveChainId]);
}
