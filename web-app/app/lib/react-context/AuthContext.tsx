import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '~/components/ui/use-toast';
import { UI_ERRORS } from '../ui-errors';
import { BrowserProvider } from 'ethers';
import { tryItAsync } from '../utils';
import { ChainInfo, TrialResult } from '../types';

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
    setIsLoading(true);
    const metamaskAddressRequest = await requestMetamaskAddress(chainInfo);
    if (!metamaskAddressRequest.success) {
      const { err } = metamaskAddressRequest;
      toast({ variant: 'destructive', title: err.title, description: err.description });
      setIsLoading(false);
      return;
    }

    // store the login data in state
    const newUser = metamaskAddressRequest.data;
    activeAddressStorage.set(newUser);
    setUser(newUser);
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
      // no need to auto-login if user has explicitly logged out
      if (!storedUser) return;

      const trialOfgetActiveMetamaskAddress = await getActiveMetamaskAddress();
      if (!trialOfgetActiveMetamaskAddress.success) {
        const { err } = trialOfgetActiveMetamaskAddress;
        toast({ variant: 'destructive', title: err.title, description: err.description });
        return;
      }

      const activeUser = trialOfgetActiveMetamaskAddress.data;
      setUser(activeUser);
      activeAddressStorage.set(activeUser);
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

type ActiveMetamaskAddress = string | null;
type MetamaskInteractionError = { title: string, description: string };

async function requestMetamaskAddress(chainInfo: ChainInfo):
Promise<
    TrialResult<ActiveMetamaskAddress, MetamaskInteractionError>
  > {
  if (!window.ethereum) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
      },
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  const addChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_addEthereumChain', [
    chainInfo,
  ]));
  if (!addChainsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR2,
        description: 'Something went wrong when adding the chain',
      },
    };
  }

  const switchChainsTrialResult = await tryItAsync<null>(() => provider.send('wallet_switchEthereumChain', [
    { chainId: chainInfo.chainId },
  ]));
  if (!switchChainsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR4,
        description: 'Something went wrong when switching to the required chain',
      },
    };
  }

  const requestAccTrialResult = await tryItAsync<string[]>(() => provider.send('eth_requestAccounts', []));
  if (!requestAccTrialResult.success || !requestAccTrialResult.data[0]) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
      },
    };
  }

  const newActiveAddress = requestAccTrialResult.data[0];
  return { success: true, data: newActiveAddress };
}

/**
 * This function is different from {@link requestMetamaskAddress} in that it
 * only returns the addresses if the current site is already connected.
 * It does not attempt to connect the current site to Metamask, like
 * {@link requestMetamaskAddress} does
 */
async function getActiveMetamaskAddress():
Promise<TrialResult<ActiveMetamaskAddress, MetamaskInteractionError>> {
  if (!window.ethereum) {
    return {
      success: false,
      err: {

        title: UI_ERRORS.ERR1,
        description: 'Please install Metamask browser extension',
      },
    };
  }

  const provider = new BrowserProvider(window.ethereum);
  const fetchAccountsTrialResult = await tryItAsync<string[]>(() => provider.send('eth_accounts', []));
  if (!fetchAccountsTrialResult.success) {
    return {
      success: false,
      err: {
        title: UI_ERRORS.ERR3,
        description: 'Something went wrong when fetching the accounts',
      },
    };
  }

  const newUser = fetchAccountsTrialResult.data[0] || null;
  return { success: true, data: newUser };
}
