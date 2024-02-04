import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { MetamaskInteractionError, getActiveMetamaskAddress, requestMetamaskAddress } from '~/redux/services/lib/Metamask';
import { ChainInfo } from '~/lib/types';
import { setIsUserLoading, type Address, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import { z } from 'zod';

type RequestMetamaskAddressEndpointError = { error: MetamaskInteractionError };

const metamaskErrorSchema:
z.ZodType<RequestMetamaskAddressEndpointError> = z.object({
  error: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const fallbackToastDetails = {
  title: 'Error connecting to Metamask',
  description: 'Something went wrong when connecting to Metamask',
} satisfies MetamaskInteractionError;

export function getIsErrorFromRequestMetamaskAddressEndpoint(err: unknown):
  err is RequestMetamaskAddressEndpointError {
  return metamaskErrorSchema.safeParse(err).success;
}

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  // tagTypes: ['User'],
  endpoints: builder => ({
    requestMetamaskAddress: builder.mutation<Address, ChainInfo>({
      queryFn: async (chainInfo) => {
        const metamaskAddressRequest = await requestMetamaskAddress(chainInfo);
        if (!metamaskAddressRequest.success) {
          return {
            error: metamaskAddressRequest.err,
          } satisfies RequestMetamaskAddressEndpointError;
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
          const isMetamaskInteractionError
            = getIsErrorFromRequestMetamaskAddressEndpoint(err);
          toast({
            variant: 'destructive',
            ...(isMetamaskInteractionError ? err.error : fallbackToastDetails),
          });
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
          const isMetamaskInteractionError
            = getIsErrorFromRequestMetamaskAddressEndpoint(err);
          toast({
            variant: 'destructive',
            ...(isMetamaskInteractionError ? err.error : fallbackToastDetails),
          });
          dispatch(setActiveAddress(null));
        }
        dispatch(setIsUserLoading(false));
      },
      // invalidatesTags: ['User'],
    }),
  }),
});

export const { useRequestMetamaskAddressMutation } = metamaskApi;
