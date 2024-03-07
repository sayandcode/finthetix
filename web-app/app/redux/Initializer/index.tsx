import { useEffect } from 'react';
import { rememberPlaybook as userRememberPlaybook, persistPlaybook as userPersistPlaybook } from '~/redux/features/user/slice';
import { StoreType } from '~/redux/store';
import ReduxPersister from '~/redux/persister';

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

  return null;
}
