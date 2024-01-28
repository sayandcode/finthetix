import { useCallback, useEffect, useMemo, useState } from 'react';

const ACTIVE_ADDRESS_LS_KEY = 'active-address';

const activeAddressStorage = {
  get: () => localStorage.getItem(ACTIVE_ADDRESS_LS_KEY),
  set: (val: string | null) => {
    if (!val) localStorage.removeItem(ACTIVE_ADDRESS_LS_KEY);
    else localStorage.setItem(ACTIVE_ADDRESS_LS_KEY, val);
  },
};

export function useActiveAddress() {
  const [isLoading, setIsLoading] = useState(true);
  const [_activeAddress, _setActiveAddress] = useState<string | null>(null);
  const setActiveAddress = useCallback((newAddr: typeof _activeAddress) => {
    _setActiveAddress(newAddr);
    activeAddressStorage.set(newAddr);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const newAddr = activeAddressStorage.get();
    setActiveAddress(newAddr);
    setIsLoading(false);
  }, [setActiveAddress]);

  const returnVal = useMemo(() => ({
    get: () => _activeAddress, isLoading, set: setActiveAddress,
  }), [_activeAddress, isLoading, setActiveAddress]);

  return returnVal;
}
