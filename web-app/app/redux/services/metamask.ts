import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { ChainInfo, DappInfo } from '~/lib/types';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler from '~/contracts/FinthetixStakingContract';
import { tryItAsync } from '~/lib/utils';
import { UI_ERRORS } from '~/lib/ui-errors';
import { getIsEndpointError, getIsInternalError } from './lib/utils';

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
          const userErrorMsg = mapInternalErrToUserFriendlyErrMsg(trial.err, 'requestMetamaskAddress');
          return { error: userErrorMsg };
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
      // invalidatesTags: ['User'],
    }),

    getActiveMetamaskAddress: builder.query<ActiveAddress, void>({
      queryFn: async () => {
        const trial = await tryItAsync(() => {
          const metamaskHandler = new MetamaskHandler();
          return metamaskHandler.getActiveAddress();
        });
        if (!trial.success) {
          const userErrorMsg = mapInternalErrToUserFriendlyErrMsg(trial.err, 'getActiveMetamaskAddress');
          return { error: userErrorMsg };
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
              const userErrorMsg = mapInternalErrToUserFriendlyErrMsg(trial.err, 'getFinthetixUserInfo');
              return { error: userErrorMsg };
            }

            return { data: trial.data };
          },

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
            const userErrorMsg = mapInternalErrToUserFriendlyErrMsg(trial.err, 'requestSampleTokens');
            return { error: userErrorMsg };
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

function mapInternalErrToUserFriendlyErrMsg(
  internalErr: unknown,
  endpoint: keyof typeof metamaskApi.endpoints,
): string {
  console.error(internalErr); // this can be converted to logger later
  const isInternalError = getIsInternalError(internalErr);
  if (!isInternalError) return FALLBACK_ERROR_DESCRIPTION;

  const errMsg = internalErr.message;

  // default error paths
  if (errMsg.startsWith('Metamask not installed'))
    return 'Install Metamask browser extension and try again';

  // endpoint specific error paths
  switch (endpoint) {
    case 'requestMetamaskAddress':
      if (errMsg.match(/reason="rejected".*eth_requestAccounts/))
        return 'Please accept the connect wallet request in metamask';
      else if (errMsg.match(/reason="rejected".*wallet_addEthereumChain/))
        return 'Please accept the request to add the correct chain';
      else if (errMsg.match(/reason="rejected".*wallet_switchEthereumChain/))
        return 'Please accept the request to switch to the correct chain';
      else
        return FALLBACK_ERROR_DESCRIPTION;

    // as of now the following request has no expected error paths other
    // than default paths which are handled above
    case 'getActiveMetamaskAddress': return FALLBACK_ERROR_DESCRIPTION;

    // as of now the following request has no expected error paths other
    // than default paths which are handled above
    case 'getFinthetixUserInfo': return FALLBACK_ERROR_DESCRIPTION;

    case 'requestSampleTokens':
      if (errMsg.match(/user rejected action.*/))
        return 'Please accept the transaction to receive sample tokens';
      else
        return FALLBACK_ERROR_DESCRIPTION;

    default: return FALLBACK_ERROR_DESCRIPTION;
  }
}

export const {
  useRequestMetamaskAddressMutation,
  useLazyGetActiveMetamaskAddressQuery,
  useGetFinthetixUserInfoQuery,
  useRequestSampleTokensMutation,
} = metamaskApi;
