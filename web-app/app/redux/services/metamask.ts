import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { MetamaskInteractionError, getActiveMetamaskAddress, requestMetamaskAddress, requestSampleTokens, tryGetFinthetixUserInfo } from '~/redux/services/lib/Metamask';
import { ChainInfo, DappInfo } from '~/lib/types';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import { z } from 'zod';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';

type MetamaskInteractionEndpointError = { error: MetamaskInteractionError };

const metamaskInteractionEndpointErrorSchema:
z.ZodType<MetamaskInteractionEndpointError> = z.object({
  error: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const fallbackToastDetails = {
  title: 'Error connecting to Metamask',
  description: 'Something went wrong when connecting to Metamask',
} satisfies MetamaskInteractionError;

export function getIsMetamaskInterationEndpointError(err: unknown):
  err is MetamaskInteractionEndpointError {
  return metamaskInteractionEndpointErrorSchema.safeParse(err).success;
}

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  // tagTypes: ['User'],
  endpoints: builder => ({
    requestMetamaskAddress: builder.mutation<ActiveAddress, ChainInfo>({
      queryFn: async (chainInfo) => {
        const metamaskAddressRequest = await requestMetamaskAddress(chainInfo);
        if (!metamaskAddressRequest.success) {
          return {
            error: metamaskAddressRequest.err,
          } satisfies MetamaskInteractionEndpointError;
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
            = getIsMetamaskInterationEndpointError(err);
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

    getActiveMetamaskAddress: builder.query<ActiveAddress, void>({
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
            = getIsMetamaskInterationEndpointError(err);
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

    getFinthetixUserInfo:
      builder.query<
      Record<keyof Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>, string>,
        DappInfo>({
          queryFn: async (dappInfo) => {
            const getFinthetixUserInfoTrial
            = await tryGetFinthetixUserInfo(dappInfo);
            if (!getFinthetixUserInfoTrial.success) {
              return { error: getFinthetixUserInfoTrial.err };
            }

            const userInfo = getFinthetixUserInfoTrial.data;
            return { data: userInfo };
          },

          onQueryStarted: (_, { queryFulfilled }) => {
            queryFulfilled.catch((err) => {
              if (getIsMetamaskInterationEndpointError(err)) {
                toast({ variant: 'destructive', ...err });
              }
            });
          },
        }),

    requestSampleTokens:
      builder.mutation<void, DappInfo>({
        queryFn: async (dappInfo) => {
          const sampleTokensRequest = await requestSampleTokens(dappInfo);
          if (!sampleTokensRequest.success) {
            return {
              error: sampleTokensRequest.err,
            } satisfies MetamaskInteractionEndpointError;
          }

          return { data: undefined };
        },
      }),
  }),
});

export const {
  useRequestMetamaskAddressMutation,
  useLazyGetActiveMetamaskAddressQuery,
  useGetFinthetixUserInfoQuery,
  useRequestSampleTokensMutation,
} = metamaskApi;
