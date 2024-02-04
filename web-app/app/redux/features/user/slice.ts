import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '~/redux/store';

export type Address = string;

export type UserState = {
  activeAddress: Address | null
  isLoading: boolean
};

const initialState: UserState = {
  activeAddress: null,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setActiveAddress:
      (state, action: PayloadAction<UserState['activeAddress']>) => {
        state.activeAddress = action.payload;
      },

    setIsUserLoading: (state, action: PayloadAction<UserState['isLoading']>) => {
      state.isLoading = action.payload;
    },
  },
});

/* Actions */
export const { setActiveAddress, setIsUserLoading } = authSlice.actions;

/* Selectors */
export const selectActiveAddress
  = (state: RootState) => state.auth.activeAddress;
export const selectIsUserLoading
  = (state: RootState) => state.auth.isLoading;

/* Reducer */
const authReducer = authSlice.reducer;
export default authReducer;
