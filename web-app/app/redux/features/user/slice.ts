import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PersistPlaybookFn, RememberPlaybookFn } from '~/redux/persister';
import { RootState } from '~/redux/store';

const SLICE_NAME = 'user';
const SLICE_LOCALSTORAGE_KEY = SLICE_NAME;

export type ActiveAddress = string | null;

export type UserState = {
  activeAddress: ActiveAddress
  isLoading: boolean
};

const initialState: UserState = {
  activeAddress: null,
  isLoading: true,
};

export const userSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setActiveAddress:
      (state, action: PayloadAction<UserState['activeAddress']>) => {
        state.activeAddress = action.payload;
      },

    setIsUserLoading: (state, action: PayloadAction<UserState['isLoading']>) => {
      state.isLoading = action.payload;
    },
    remember: (state, action: PayloadAction<DataToPersist>) => {
      const activeAddress = action.payload?.activeAddress;
      state.activeAddress = activeAddress || null;
      // if active address exists, we still need to validate it via metamask.
      // Till then, our user is still loading
      state.isLoading = activeAddress ? true : false;
    },
  },
});

/* Actions */
export const { setActiveAddress, setIsUserLoading } = userSlice.actions;

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

/* Reducer */
const userReducer = userSlice.reducer;
export default userReducer;
