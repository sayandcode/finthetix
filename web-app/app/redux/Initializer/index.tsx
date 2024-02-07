import { useEffect } from 'react';
import { rememberPlaybook as userRememberPlaybook, persistPlaybook as userPersistPlaybook, selectActiveAddress } from '~/redux/features/user/slice';
import { StoreType } from '~/redux/store';
import ReduxPersister from '~/redux/persister';
import { useLazyGetActiveMetamaskAddressQuery } from '../services/metamask';
import { useAppSelector } from '../hooks';

export default function ReduxInitializer(
  { store }: { store: StoreType },
) {
  // setup redux persistence
  useEffect(() => {
    const persister = new ReduxPersister(store);

    // subscribe to store changes
    const persistPlaybooksArr = [userPersistPlaybook];
    persister.persist(persistPlaybooksArr);

    // read from persisted store
    const rememberPlaybooksArr = [userRememberPlaybook];
    persister.remember(rememberPlaybooksArr);
  }, [store]);

  // setup auto-login with metamask
  const [getActiveMetamaskAddress] = useLazyGetActiveMetamaskAddressQuery();
  const activeAddress = useAppSelector(selectActiveAddress);
  useEffect(() => {
    // only runs if we automatically logged in from local storage
    // doesn't login if local storage says no active address
    if (activeAddress) getActiveMetamaskAddress();
  }, [activeAddress, getActiveMetamaskAddress]);
  return null;
}
