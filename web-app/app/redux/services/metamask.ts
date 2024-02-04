import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { getActiveMetamaskAddress, requestMetamaskAddress } from '~/redux/services/lib/Metamask';
import { ChainInfo } from '~/lib/types';
import { setIsUserLoading, type Address, setActiveAddress } from '../features/user/slice';

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  // tagTypes: ['User'],
  endpoints: builder => ({
    requestMetamaskAddress: builder.mutation<Address, ChainInfo>({
      queryFn: async (chainInfo) => {
        const metamaskAddressRequest = await requestMetamaskAddress(chainInfo);
        if (!metamaskAddressRequest.success) {
          return { error: metamaskAddressRequest.err };
        }

        const newAddress = metamaskAddressRequest.data;
        return { data: newAddress };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setIsUserLoading(true));
        try {
          const { data: newAddress } = await queryFulfilled;
          dispatch(setActiveAddress(newAddress));
        }
        catch (err) {
          console.log('Failed', err);
          dispatch(setActiveAddress(null));
        }
        dispatch(setIsUserLoading(false));
      },
      // invalidatesTags: ['User'],
    }),

    getActiveMetamaskAddress: builder.query<Address, void>({
      queryFn: async () => {
        const trialOfgetActiveMetamaskAddress
          = await getActiveMetamaskAddress();
        if (!trialOfgetActiveMetamaskAddress.success) {
          return { error: trialOfgetActiveMetamaskAddress.err };
        }

        const newActiveMetamaskAddress = trialOfgetActiveMetamaskAddress.data;
        return { data: newActiveMetamaskAddress };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setIsUserLoading(true));
        try {
          const { data: newAddress } = await queryFulfilled;
          dispatch(setActiveAddress(newAddress));
        }
        catch (err) {
          console.log('Failed', err);
          dispatch(setActiveAddress(null));
        }
        dispatch(setIsUserLoading(false));
      },
      // invalidatesTags: ['User'],
    }),
  }),
});

export const { useRequestMetamaskAddressMutation } = metamaskApi;
