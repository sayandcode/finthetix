import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/user/slice';
import { metamaskApi } from './services/metamask';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [metamaskApi.reducerPath]: metamaskApi.reducer,
  },
  middleware:
    getDefaultMiddleWare =>
      getDefaultMiddleWare().concat(metamaskApi.middleware),

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
