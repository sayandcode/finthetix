import { PayloadAction } from '@reduxjs/toolkit';
import { RootState, StoreType } from './store';

type PersistKey = string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataToPersist = any;
type ActionGeneratorFn
  = (persistedData: DataToPersist) => PayloadAction<unknown>;

export type PersistPlaybookFn
  = (state: RootState) => [PersistKey, DataToPersist];
export type RememberPlaybookFn = () => [PersistKey, ActionGeneratorFn];

export default class ReduxPersister {
  static readonly ROOT_KEY = 'reduxStore';

  constructor(private readonly store: StoreType) {}

  persist(persistPlaybookArr: Array<PersistPlaybookFn>) {
    this.store.subscribe(() => {
      const state = this.store.getState();
      persistPlaybookArr.forEach((playbook) => {
        const [persistKey, dataToPersist] = playbook(state);
        localStorage.setItem(
          `${ReduxPersister.ROOT_KEY}/${persistKey}`,
          JSON.stringify(dataToPersist),
        );
      });
    });
  }

  remember(rememberPlaybookArr: Array<RememberPlaybookFn>) {
    rememberPlaybookArr.forEach((playbook) => {
      const [persistKey, actionGenerator] = playbook();
      const stringifiedPersistedData
          = localStorage.getItem(`${ReduxPersister.ROOT_KEY}/${persistKey}`);
      if (!stringifiedPersistedData) return;

      const persistedData = JSON.parse(stringifiedPersistedData);
      const action = actionGenerator(persistedData);
      this.store.dispatch(action);
    });
  }
}
