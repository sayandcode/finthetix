import { useEffect } from 'react';
import { selectIsUserLoggedIn } from '~/redux/features/user/slice';
import { useAppSelector } from '~/redux/hooks';
import { useSyncActiveChainIdMutation } from '~/redux/services/metamask';

/**
 * Fetches the initial Id and sets it to global state
 */
export default function useSyncInitialChainId() {
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
  const [syncActiveChainId] = useSyncActiveChainIdMutation();

  useEffect(() => {
    (async () => {
      // don't fetch the initial chainId until user is logged in
      if (!isUserLoggedIn) return;

      syncActiveChainId();
    })();
  }, [isUserLoggedIn, syncActiveChainId]);
}
