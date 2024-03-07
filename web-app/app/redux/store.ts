import { configureStore } from '@reduxjs/toolkit';
import userReducer, { userSlice } from './features/user/slice';
import { metamaskApi } from './services/metamask';

export const store = configureStore({
  reducer: {
    [userSlice.reducerPath]: userReducer,
    [metamaskApi.reducerPath]: metamaskApi.reducer,
  },
  middleware:
    getDefaultMiddleWare =>
      getDefaultMiddleWare().concat(metamaskApi.middleware),

});

export type StoreType = typeof store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
