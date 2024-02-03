import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '~/components/ui/use-toast';
import { ChainInfo } from '../../types';
import { getActiveMetamaskAddress, requestMetamaskAddress } from './lib/Metamask';
import activeAddressStorage from './lib/activeAddressStorage';

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
