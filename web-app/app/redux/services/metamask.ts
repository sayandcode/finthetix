import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { ChainInfo, DappInfo } from '~/lib/types';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';
import { UI_ERRORS } from '~/lib/ui-errors';
import { getIsEndpointError, makeErrorableQueryFn } from './lib/utils';

const FALLBACK_ERROR_DESCRIPTION = 'Something went wrong when interacting with the Blockchain';

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['User'],
  endpoints: builder => ({
    requestMetamaskAddress:
      builder.mutation<NonNullable<ActiveAddress>, ChainInfo>({
        queryFn:
          makeErrorableQueryFn(
            async (chainInfo) => {
              const metamaskHandler = new MetamaskHandler();
              return metamaskHandler.requestAddress(chainInfo);
            },
            (internalErr) => {
              // default error paths
              if (internalErr.startsWith('Metamask not installed'))
                return 'Install Metamask browser extension and try again';

              // endpoint specific errors
              else if (internalErr.match(
                /reason="rejected".*eth_requestAccounts/,
              ))
                return 'Please accept the connect wallet request in metamask';
              else if (internalErr.match(
                /reason="rejected".*wallet_addEthereumChain/,
              ))
                return 'Please accept the request to add the correct chain';
              else if (internalErr.match(
                /reason="rejected".*wallet_switchEthereumChain/,
              ))
                return 'Please accept the request to switch to the correct chain';
              else
                return FALLBACK_ERROR_DESCRIPTION;
            },
            FALLBACK_ERROR_DESCRIPTION,
          ),

        onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
          dispatch(setIsUserLoading(true));
          try {
            const { data: newAddress } = await queryFulfilled;
            dispatch(setActiveAddress(newAddress));
            toast({
              variant: 'success',
              title: 'Logged in successfully',
              description: `Welcome ${newAddress}!`,
            });
          }
          catch (err) {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
            = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR1,
              description: errDescription
              ,
            });
            dispatch(setActiveAddress(null));
          }
          dispatch(setIsUserLoading(false));
        },
        invalidatesTags: ['User'],
      }),

    refreshActiveMetamaskAddress: builder.mutation<ActiveAddress, void>({
      queryFn:
        makeErrorableQueryFn(
          async () => {
            const metamaskHandler = new MetamaskHandler();
            return metamaskHandler.getActiveAddress();
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';
            // as of now the following request has no expected error paths
            // other than default paths which are handled above
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        dispatch(setIsUserLoading(true));
        try {
          const { data: newAddress } = await queryFulfilled;
          dispatch(setActiveAddress(newAddress));
          toast({
            variant: 'success',
            title: 'Logged in successfully',
            description: `Welcome ${newAddress}!`,
          });
        }
        catch (err) {
          const isEndpointError = getIsEndpointError(err);
          const errDescription
            = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
          toast({
            variant: 'destructive',
            title: UI_ERRORS.ERR2,
            description: errDescription,
          });
          dispatch(setActiveAddress(null));
        }
        dispatch(setIsUserLoading(false));
      },
      invalidatesTags: ['User'],
    }),

    getFinthetixUserInfo:
      builder.query<
      Record<keyof Awaited<ReturnType<FinthetixStakingContractHandler['getUserData']>>, string>,
        DappInfo>({
          queryFn:
            makeErrorableQueryFn(
              async (dappInfo) => {
                const metamaskHandler = new MetamaskHandler();
                const fscHandler = new FinthetixStakingContractHandler(
                  metamaskHandler.provider, dappInfo,
                );
                return fscHandler.getUserData();
              },
              (internalErr) => {
                // default error paths
                if (internalErr.startsWith('Metamask not installed'))
                  return 'Install Metamask browser extension and try again';
                // as of now the following request has no expected error paths
                // other than default paths which are handled above
                else return FALLBACK_ERROR_DESCRIPTION;
              },
              FALLBACK_ERROR_DESCRIPTION,
            ),

          onQueryStarted: (_, { queryFulfilled }) => {
            queryFulfilled.catch((err) => {
              const isEndpointError = getIsEndpointError(err);
              const errDescription
                = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
              toast({
                variant: 'destructive',
                title: UI_ERRORS.ERR3,
                description: errDescription,
              });
            });
          },
          providesTags: ['User'],
        }),

    requestSampleTokens:
      builder.mutation<void, DappInfo>({
        queryFn:
          makeErrorableQueryFn(
            async (dappInfo) => {
              const metamaskHandler = new MetamaskHandler();
              const fscHandler
                = new FinthetixStakingContractHandler(
                  metamaskHandler.provider, dappInfo,
                );
              return fscHandler.requestSampleTokens();
            },
            (internalErr) => {
              // default error paths
              if (internalErr.startsWith('Metamask not installed'))
                return 'Install Metamask browser extension and try again';

              // endpoint specific error paths
              else if (internalErr.match(/user rejected action.*/))
                return 'Please accept the transaction to receive sample tokens';
              else return FALLBACK_ERROR_DESCRIPTION;
            },
            FALLBACK_ERROR_DESCRIPTION,
          ),

        onQueryStarted: (_, { queryFulfilled }) => {
          queryFulfilled.then(() => {
            toast({
              variant: 'success',
              title: 'Request successful',
              description: 'FST tokens have been added to your address',
            });
          }).catch((err) => {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
                = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR4,
              description: errDescription,
            });
          });
        },
      }),
  }),
});

export const {
  useRequestMetamaskAddressMutation,
  useRefreshActiveMetamaskAddressMutation,
  useLazyGetFinthetixUserInfoQuery,
  useRequestSampleTokensMutation,
} = metamaskApi;
