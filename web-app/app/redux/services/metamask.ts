import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { ChainInfo, DappInfo } from '~/lib/types';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';
import { tryItAsync } from '~/lib/utils';
import { UI_ERRORS } from '~/lib/ui-errors';
import { getIsEndpointError } from './lib/utils';

const FALLBACK_ERROR_DESCRIPTION = 'Something went wrong when interacting with the Blockchain';

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  // tagTypes: ['User'],
  endpoints: builder => ({
    requestMetamaskAddress: builder.mutation<ActiveAddress, ChainInfo>({
      queryFn: async (chainInfo) => {
        const trial = await tryItAsync(() => {
          const metamaskHandler = new MetamaskHandler();
          return metamaskHandler.requestAddress(chainInfo);
        });
        if (!trial.success) {
          return { error: trial.err };
        }

        return { data: trial.data };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setIsUserLoading(true));
        try {
          const { data: newAddress } = await queryFulfilled;
          dispatch(setActiveAddress(newAddress));
        }
        catch (err) {
          const isEndpointError
            = getIsEndpointError(err);
          toast({
            variant: 'destructive',
            title: UI_ERRORS.ERR1,
            description:
              isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION
            ,
          });
          dispatch(setActiveAddress(null));
        }
        dispatch(setIsUserLoading(false));
      },
      // invalidatesTags: ['User'],
    }),

    getActiveMetamaskAddress: builder.query<ActiveAddress, void>({
      queryFn: async () => {
        const trial = await tryItAsync(() => {
          const metamaskHandler = new MetamaskHandler();
          return metamaskHandler.getActiveAddress();
        });
        if (!trial.success) return { error: trial.err };

        return { data: trial.data };
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setIsUserLoading(true));
        try {
          const { data: newAddress } = await queryFulfilled;
          dispatch(setActiveAddress(newAddress));
        }
        catch (err) {
          const isEndpointError
            = getIsEndpointError(err);
          toast({
            variant: 'destructive',
            title: UI_ERRORS.ERR2,
            description:
              isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION,
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
            const trial = await tryItAsync(() => {
              const metamaskHandler = new MetamaskHandler();
              const fscHandler
                = new FinthetixStakingContractHandler(
                  metamaskHandler.provider, dappInfo,
                );
              return fscHandler.getUserData();
            });
            if (!trial.success) {
              return { error: trial.err };
            }

            return { data: trial.data };
          },

          onQueryStarted: (_, { queryFulfilled }) => {
            queryFulfilled.catch((err) => {
              toast({
                variant: 'destructive',
                title: UI_ERRORS.ERR3,
                description:
                  getIsEndpointError(err)
                    ? err.error
                    : FALLBACK_ERROR_DESCRIPTION,
              });
            });
          },
        }),

    requestSampleTokens:
      builder.mutation<void, DappInfo>({
        queryFn: async (dappInfo) => {
          const trial = await tryItAsync(() => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler
                = new FinthetixStakingContractHandler(
                  metamaskHandler.provider, dappInfo,
                );
            return fscHandler.requestSampleTokens();
          });
          if (!trial.success) {
            return { error: trial.err };
          }

          return { data: trial.data };
        },

        onQueryStarted: (_, { queryFulfilled }) => {
          queryFulfilled.then(() => {
            toast({
              variant: 'default',
              title: 'Request successful',
              description: 'FST tokens have been added to your address',
            });
          }).catch((err) => {
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR4,
              description:
                  getIsEndpointError(err)
                    ? err.error
                    : FALLBACK_ERROR_DESCRIPTION,
            });
          });
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
