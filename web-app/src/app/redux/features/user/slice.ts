import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PersistPlaybookFn, RememberPlaybookFn } from '~/redux/persister';
import { RootState } from '~/redux/store';

const SLICE_NAME = 'user';
const SLICE_LOCALSTORAGE_KEY = SLICE_NAME;

export type ActiveAddress = string | null;

export type UserState = {
  isFromLocalStorage: boolean
  activeAddress: ActiveAddress
  isLoading: boolean
  activeChainId: string | null // null indicates that it's still loading
};

const initialState: UserState = {
  isFromLocalStorage: false,
  activeAddress: null,
  isLoading: true,
  activeChainId: null,
};

export const userSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setActiveAddress:
      (state, action: PayloadAction<UserState['activeAddress']>) => {
        state.activeAddress = action.payload;
        // user only sets to local storage when remembering
        state.isFromLocalStorage = false;
      },

    setIsUserLoading: (state, action: PayloadAction<UserState['isLoading']>) => {
      state.isLoading = action.payload;
    },

    setActiveChainId: (state, action: PayloadAction<NonNullable<UserState['activeChainId']>>) => {
      state.activeChainId = action.payload;
    },

    remember: (state, action: PayloadAction<DataToPersist>) => {
      const activeAddress = action.payload?.activeAddress;
      state.activeAddress = activeAddress || null;
      state.isFromLocalStorage = true;
    },
  },
});

/* Actions */
export const { setActiveAddress, setIsUserLoading, setActiveChainId }
  = userSlice.actions;

/* Persister */
type DataToPersist = { activeAddress: UserState['activeAddress'] } | null;

export const persistPlaybook: PersistPlaybookFn = (state: RootState) => {
  const dataToPersist: DataToPersist
    = { activeAddress: state.user.activeAddress };
  return [SLICE_LOCALSTORAGE_KEY, dataToPersist];
};

export const rememberPlaybook: RememberPlaybookFn = () => {
  const actionGenerator = (persistedDataInternal: DataToPersist) => {
    return userSlice.actions.remember(persistedDataInternal);
  };
  return [SLICE_LOCALSTORAGE_KEY, actionGenerator];
};

/* Selectors */
export const selectActiveAddress
  = (state: RootState) => state.user.activeAddress;
export const selectIsUserLoading
  = (state: RootState) => state.user.isLoading;
export const selectIsUserLoggedIn
  = ({ user }: RootState) =>
    !user.isLoading && !user.isFromLocalStorage && !!user.activeAddress;
export const selectIsUserFromLocalStorage
  = ({ user }: RootState) => user.isFromLocalStorage;
export const selectActiveChainId
  = ({ user }: RootState) => user.activeChainId;

/* Reducer */
const userReducer = userSlice.reducer;
export default userReducer;
