import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import { ChainInfo, DappInfo } from '~/lib/types';
import stringifyBigIntsInObj, { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler, { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
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
        queryFn: makeErrorableQueryFn(
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
              description: errDescription,
            });
            dispatch(setActiveAddress(null));
          }
          dispatch(setIsUserLoading(false));
        },
        invalidatesTags: ['User'],
      }),

    refreshActiveMetamaskAddress: builder.mutation<ActiveAddress, void>({
      queryFn: makeErrorableQueryFn(
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
          if (newAddress)
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
      builder.query<StringifyBigIntsInObj<FinthetixUserData>, DappInfo>({
        queryFn: makeErrorableQueryFn(
          async (dappInfo) => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler = await FinthetixStakingContractHandler.make(
              metamaskHandler.provider, dappInfo,
            );
            const userData = await fscHandler.getUserData();
            return stringifyBigIntsInObj(userData);
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
        queryFn: makeErrorableQueryFn(
          async (dappInfo) => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler = await FinthetixStakingContractHandler.make(
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

        invalidatesTags: ['User'],
      }),

    stakeWithFinthetix:
      builder.mutation<
        void,
        { amtToStakeStr: string, dappInfo: DappInfo }
      >({
        queryFn: makeErrorableQueryFn(
          async ({ amtToStakeStr, dappInfo }) => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler = await FinthetixStakingContractHandler.make(
              metamaskHandler.provider, dappInfo,
            );
            const amtToStake = BigInt(amtToStakeStr);
            await fscHandler.stake(amtToStake);
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';

            // endpoint specific errors
            else if (internalErr.match(/reason="rejected"/))
              return 'Please accept the approval and staking transactions';
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

        onQueryStarted: async (_, { queryFulfilled }) => {
          try {
            await queryFulfilled;
            toast({
              variant: 'success',
              title: 'Staked successfully',
            });
          }
          catch (err) {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
              = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR5,
              description: errDescription,
            });
          }
        },

        invalidatesTags: ['User'],

      }),

    unstakeWithFinthetix:
      builder.mutation<void, { amtToUnstakeStr: string, dappInfo: DappInfo }>({
        queryFn: makeErrorableQueryFn(
          async ({ amtToUnstakeStr, dappInfo }) => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler = await FinthetixStakingContractHandler.make(
              metamaskHandler.provider, dappInfo,
            );
            const amtToStake = BigInt(amtToUnstakeStr);
            await fscHandler.unstake(amtToStake);
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';

            // endpoint specific errors
            else if (internalErr.match(/reason="rejected"/))
              return 'Please accept the unstaking transactions';
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

        onQueryStarted: async (_, { queryFulfilled }) => {
          try {
            await queryFulfilled;
            toast({
              variant: 'success',
              title: 'Unstaked successfully',
            });
          }
          catch (err) {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
              = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR6,
              description: errDescription,
            });
          }
        },

        invalidatesTags: ['User'],
      }),

    withdrawRewardsFromFinthetix:
      builder.mutation<void, DappInfo>({
        queryFn: makeErrorableQueryFn(
          async (dappInfo) => {
            const metamaskHandler = new MetamaskHandler();
            const fscHandler = await FinthetixStakingContractHandler.make(
              metamaskHandler.provider, dappInfo,
            );
            await fscHandler.withdrawReward();
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';

            // endpoint specific errors
            else if (internalErr.match(/reason="rejected"/))
              return 'Please accept the reward withdrawal transaction';
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

        onQueryStarted: async (_, { queryFulfilled }) => {
          try {
            await queryFulfilled;
            toast({
              variant: 'success',
              title: 'Withdrawal successful',
            });
          }
          catch (err) {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
              = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR7,
              description: errDescription,
            });
          }
        },

        invalidatesTags: ['User'],
      }),

    getFinthetixLogData:
      builder.query<
        StringifyBigIntsInObj<
          Awaited<
            ReturnType<
              FinthetixStakingContractHandler['getHistoricalStakedAmt']
        >>>,
         DappInfo
      >({
        queryFn: makeErrorableQueryFn(async (dappInfo) => {
          const metamaskHandler = new MetamaskHandler();
          const fscHandler = await FinthetixStakingContractHandler.make(
            metamaskHandler.provider, dappInfo,
          );
          const logs = await fscHandler.getHistoricalStakedAmt();
          return logs.map(stringifyBigIntsInObj);
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

        providesTags: ['User'],
      }),
  }),
});

export const {
  useRequestMetamaskAddressMutation,
  useRefreshActiveMetamaskAddressMutation,
  useLazyGetFinthetixUserInfoQuery,
  useRequestSampleTokensMutation,
  useStakeWithFinthetixMutation,
  useUnstakeWithFinthetixMutation,
  useWithdrawRewardsFromFinthetixMutation,
  useLazyGetFinthetixLogDataQuery,
} = metamaskApi;
