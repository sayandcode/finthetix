import { selectActiveAddress, selectIsUserFromLocalStorage, setActiveAddress, setIsUserLoading } from '~/redux/features/user/slice';
import { useEffect } from 'react';
import { useRefreshActiveMetamaskAddressMutation } from '~/redux/services/metamask';
import { useAppDispatch, useAppSelector } from '~/redux/hooks';
import MetamaskHandler from '~/redux/services/lib/Metamask';

export default function AutoLogin() {
  useRefreshAddressWhenAutoLoggedIn();
  useAutoAccountSwitch();

  return null;
}

/** Setup auto-login with metamask */
function useRefreshAddressWhenAutoLoggedIn() {
  const [refreshActiveMetamaskAddress]
    = useRefreshActiveMetamaskAddressMutation();

  const isUserFromLocalStorage = useAppSelector(selectIsUserFromLocalStorage);
  const activeAddress = useAppSelector(selectActiveAddress);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // only runs if we automatically logged in from local storage
    if (!isUserFromLocalStorage) return;

    if (activeAddress) refreshActiveMetamaskAddress();
    else dispatch(setIsUserLoading(false));
  },
  [
    refreshActiveMetamaskAddress,
    dispatch,
    isUserFromLocalStorage,
    activeAddress,
  ]);
}

/** Change account automatically when user changes on metamask */
function useAutoAccountSwitch() {
  const [refreshActiveMetamaskAddress]
    = useRefreshActiveMetamaskAddressMutation();

  const dispatch = useAppDispatch();
  useEffect(() => {
    const metamask = new MetamaskHandler();
    const refreshAddress = (lastActiveAddresses: string[]) => {
      const newAddress = lastActiveAddresses[0];
      if (newAddress) refreshActiveMetamaskAddress();
      else dispatch(setActiveAddress(null));
    };
    metamask.ethereum.on('accountsChanged', refreshAddress);

    return () => {
      metamask.ethereum.off('accountsChanged', refreshAddress);
    };
  }, [dispatch, refreshActiveMetamaskAddress]);
}
