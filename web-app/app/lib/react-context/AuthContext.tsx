import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '~/components/ui/use-toast';
import { UI_ERRORS } from '../ui-errors';
import { BrowserProvider } from 'ethers';
import { tryItAsync } from '../utils';
import { ChainInfo } from '../types';

const ACTIVE_ADDRESS_LOCAL_STORAGE_KEY = 'active-address';

type UserType = string | null;

type AuthContextType = {
  login: () => Promise<void>
  logout: () => void
  user: UserType
  isLoading: boolean
};

const defaultVal: AuthContextType = {
  login: () => {
    throw new Error('This AuthContext Consumer is not nested inside a Provider');
  },
  logout: () => {
    throw new Error('This AuthContext Consumer is not nested inside a Provider');
  },
  user: null,
  isLoading: false,
};

const activeAddressStorage = {
  get: () => localStorage.getItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY),
  set: (val: string | null) => {
    if (!val) localStorage.removeItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY, val);
  },
};

export const AuthContext = createContext<AuthContextType>(defaultVal);

export function AuthContextProvider(
  { chainInfo, children }: { chainInfo: ChainInfo, children: React.ReactNode },
) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<AuthContextType['isLoading']>(true);
  const [user, setUser] = useState<UserType>(null);

  /**
   * Attempts to login the user by authenticating via metamask. It will handle
   * errors by showing an appropriate toast message.
   *
   * This function is a mutation type function (query vs mutation), and hence
   * doesn't return any value. If you want to obtain the logged in user, use
   * the dedicated `user` object from `AuthContext`
   * @returns A promise indicating the completion of the login
   */
  const login: AuthContextType['login'] = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const provider = new BrowserProvider(window.ethereum);
    const addChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_addEthereumChain', [
      chainInfo,
    ]));
    if (!addChainsTrialResult.success) {
      toast({
        title: UI_ERRORS.ERR2,
        description: 'Something went wrong when adding the chain',
        variant: 'destructive',
      });
      return;
    }

    const requestAccTrialResult = await tryItAsync<string[]>(() => provider.send('eth_requestAccounts', []));
    if (!requestAccTrialResult.success || !requestAccTrialResult.data[0]) {
      toast({
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
        variant: 'destructive',
      });
      return;
    }

    // store the login data in state
    const newActiveAddress = requestAccTrialResult.data[0];
    activeAddressStorage.set(newActiveAddress);
    setUser(newActiveAddress);
    setIsLoading(false);
  }, [chainInfo, toast]);

  const logout = useCallback(() => {
    setIsLoading(true);
    setUser(null);
    activeAddressStorage.set(null);
    setIsLoading(false);
  }, []);

  /* Attempt Auto-Login from LocalStorage */
  useEffect(() => {
    (async () => {
      // set from storage
      setIsLoading(true);
      const storedUser = activeAddressStorage.get();
      setUser(storedUser);
      setIsLoading(false);

      // attempt to validate again with metamask
      if (!window.ethereum) {
        toast({
          title: UI_ERRORS.ERR1,
          description: 'Please install Metamask browser extension',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const fetchAccountsTrialResult = await tryItAsync<string[]>(() => provider.send('eth_accounts', []));
      if (!fetchAccountsTrialResult.success) {
        toast({
          title: UI_ERRORS.ERR3,
          description: 'Something went wrong when fetching the accounts',
          variant: 'destructive',
        });
        return;
      }

      const newActiveAddress = fetchAccountsTrialResult.data[0] || null;
      setUser(newActiveAddress);
      activeAddressStorage.set(newActiveAddress);
      setIsLoading(false);
    })();
  }, [logout, toast]);

  const contextVal = useMemo(
    () => ({ login, logout, user, isLoading })
    , [login, logout, user, isLoading]);
  return (
    <AuthContext.Provider value={contextVal}>
      {children}
    </AuthContext.Provider>
  );
}
