import { useEffect } from 'react';
import { selectIsUserLoggedIn, setActiveChainId } from '~/redux/features/user/slice';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import MetamaskHandler from '~/redux/services/lib/Metamask';

/**
 * Fetches the initial Id and sets it to global state
 */
export default function useSyncInitialChainId() {
  const dispatch = useAppDispatch();
  const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);

  useEffect(() => {
    (async () => {
      // don't fetch the initial chainId until user is logged in
      if (!isUserLoggedIn) return;

      const metamask = new MetamaskHandler();
      const newActiveChainId = await metamask.getActiveChainId();

      dispatch(setActiveChainId(newActiveChainId));
    })();
  }, [dispatch, isUserLoggedIn]);
}
