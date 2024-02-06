import { useEffect } from 'react';
import { rememberPlaybook as userRememberPlaybook, persistPlaybook as userPersistPlaybook } from '~/redux/features/user/slice';
import { StoreType } from '~/redux/store';
import ReduxPersister from '~/redux/persister';

export default function ReduxPersisterInitializer(
  { store }: { store: StoreType },
) {
  useEffect(() => {
    const persister = new ReduxPersister(store);

    // setup store subscription
    const persistPlaybooksArr = [userPersistPlaybook];
    persister.persist(persistPlaybooksArr);

    // read from persisted store
    const rememberPlaybooksArr = [userRememberPlaybook];
    persister.remember(rememberPlaybooksArr);
  }, [store]);
  return null;
}
