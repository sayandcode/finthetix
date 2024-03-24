import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import MetamaskHandler from '~/redux/services/lib/Metamask';
import stringifyBigIntsInObj, { WithStringifiedBigints } from '~/lib/utils/stringifyBigIntsInObj';
import { setIsUserLoading, type ActiveAddress, setActiveAddress } from '../features/user/slice';
import { toast } from '~/components/ui/use-toast';
import FinthetixStakingContractHandler, { FinthetixStatus, FinthetixUserData, HistoricalRewardAmtData, HistoricalStakedAmtData, TxnHash } from '~/contracts/FinthetixStakingContract';
import { UI_ERRORS } from '~/lib/ui-errors';
import { getIsEndpointError, makeErrorableQueryFn } from './lib/utils';
import UnderlineLink from '~/components/ui/underline-link';
import { getBrowserEnv } from '~/components/root/BrowserEnv';

const FALLBACK_ERROR_DESCRIPTION = 'Something went wrong when interacting with the Blockchain';

const COOLING_DOWN_INTERNAL_ERROR = 'Cooling down';
const COOLING_DOWN_USER_ERROR = 'The staking contract is cooling down, please try again later';

export type FinthetixLogDataQueryResult = {
  stakedAmt: WithStringifiedBigints<HistoricalStakedAmtData>
  rewardAmt: WithStringifiedBigints<HistoricalRewardAmtData>
};

export const metamaskApi = createApi({
  reducerPath: 'metamaskApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['User', 'FinthetixStatus'],
  endpoints: builder => ({
    requestMetamaskAddress:
      builder.mutation<NonNullable<ActiveAddress>, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const metamaskHandler = new MetamaskHandler();
            const { chainInfo } = getBrowserEnv();
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

    fetchFinthetixUserInfo:
      builder.query<WithStringifiedBigints<FinthetixUserData>, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const fscHandler = await FinthetixStakingContractHandler.make();
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
      builder.mutation<TxnHash, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const fscHandler = await FinthetixStakingContractHandler.make();
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
          const { blockExplorerInfo } = getBrowserEnv();
          queryFulfilled.then(({ data: txnHash }) => {
            toast({
              variant: 'success',
              title: 'Sample tokens granted',
              description: (
                <UnderlineLink href={`${blockExplorerInfo.txUrl}${txnHash}`}>
                  View on block explorer
                </UnderlineLink>
              ),
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
        TxnHash,
        { amtToStakeStr: string }
      >({
        queryFn: makeErrorableQueryFn(
          async ({ amtToStakeStr }) => {
            const fscHandler = await FinthetixStakingContractHandler.make();

            const isCoolingDown = await fscHandler.getIsContractCoolingDown();
            if (isCoolingDown) throw new Error(COOLING_DOWN_INTERNAL_ERROR);

            const amtToStake = BigInt(amtToStakeStr);
            const txnHash = await fscHandler.stake(amtToStake);
            return txnHash;
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';

            // endpoint specific errors
            else if (internalErr.match(/reason="rejected"/))
              return 'Please accept the approval and staking transactions';
            else if (internalErr.match(COOLING_DOWN_INTERNAL_ERROR))
              return COOLING_DOWN_USER_ERROR;
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

        onQueryStarted: async (_, { queryFulfilled }) => {
          const { blockExplorerInfo } = getBrowserEnv();
          try {
            const { data: txnHash } = await queryFulfilled;
            toast({
              variant: 'success',
              title: 'Staked successfully',
              description: (
                <UnderlineLink href={`${blockExplorerInfo.txUrl}${txnHash}`}>
                  View on block explorer
                </UnderlineLink>
              ),
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

        invalidatesTags: ['User', 'FinthetixStatus'],

      }),

    unstakeWithFinthetix:
      builder.mutation<
        TxnHash,
        { amtToUnstakeStr: string }>({
          queryFn: makeErrorableQueryFn(
            async ({ amtToUnstakeStr }) => {
              const fscHandler = await FinthetixStakingContractHandler.make();

              const isCoolingDown = await fscHandler.getIsContractCoolingDown();
              if (isCoolingDown) throw new Error(COOLING_DOWN_INTERNAL_ERROR);

              const amtToStake = BigInt(amtToUnstakeStr);
              const txnHash = await fscHandler.unstake(amtToStake);
              return txnHash;
            },
            (internalErr) => {
              // default error paths
              if (internalErr.startsWith('Metamask not installed'))
                return 'Install Metamask browser extension and try again';

              // endpoint specific errors
              else if (internalErr.match(/reason="rejected"/))
                return 'Please accept the unstaking transactions';
              else if (internalErr.match(COOLING_DOWN_INTERNAL_ERROR))
                return COOLING_DOWN_USER_ERROR;
              else return FALLBACK_ERROR_DESCRIPTION;
            },
            FALLBACK_ERROR_DESCRIPTION,
          ),

          onQueryStarted: async (_, { queryFulfilled }) => {
            const { blockExplorerInfo } = getBrowserEnv();
            try {
              const { data: txnHash } = await queryFulfilled;
              toast({
                variant: 'success',
                title: 'Unstaked successfully',
                description: (
                  <UnderlineLink href={`${blockExplorerInfo.txUrl}${txnHash}`}>
                    View on block explorer
                  </UnderlineLink>
                ),
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

          invalidatesTags: ['User', 'FinthetixStatus'],
        }),

    withdrawRewardsFromFinthetix:
      builder.mutation<TxnHash, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const fscHandler = await FinthetixStakingContractHandler.make();

            const isCoolingDown = await fscHandler.getIsContractCoolingDown();
            if (isCoolingDown) throw new Error(COOLING_DOWN_INTERNAL_ERROR);

            const txnHash = await fscHandler.withdrawReward();
            return txnHash;
          },
          (internalErr) => {
            // default error paths
            if (internalErr.startsWith('Metamask not installed'))
              return 'Install Metamask browser extension and try again';

            // endpoint specific errors
            else if (internalErr.match(/reason="rejected"/))
              return 'Please accept the reward withdrawal transaction';
            else if (internalErr.match(COOLING_DOWN_INTERNAL_ERROR))
              return COOLING_DOWN_USER_ERROR;
            else return FALLBACK_ERROR_DESCRIPTION;
          },
          FALLBACK_ERROR_DESCRIPTION,
        ),

        onQueryStarted: async (_, { queryFulfilled }) => {
          const { blockExplorerInfo } = getBrowserEnv();
          try {
            const { data: txnHash } = await queryFulfilled;
            toast({
              variant: 'success',
              title: 'Withdrawal successful',
              description: (
                <UnderlineLink href={`${blockExplorerInfo.txUrl}${txnHash}`}>
                  View on block explorer
                </UnderlineLink>
              ),
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

        invalidatesTags: ['User', 'FinthetixStatus'],
      }),

    fetchFinthetixLogData:
      builder.query<FinthetixLogDataQueryResult, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const fscHandler = await FinthetixStakingContractHandler.make();

            const historicalStakedAmtPromise
              = fscHandler.getHistoricalStakedAmt();
            const historicalRewardAmtPromise
              = fscHandler.getHistoricalRewardAmt();
            const [historicalStakedAmt, historicalRewardAmt]
              = await Promise.all(
                [historicalStakedAmtPromise, historicalRewardAmtPromise],
              );

            return {
              stakedAmt: historicalStakedAmt.map(stringifyBigIntsInObj),
              rewardAmt: historicalRewardAmt.map(stringifyBigIntsInObj),
            };
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

    finthetixStatus:
      builder.query<FinthetixStatus, void>({
        queryFn: makeErrorableQueryFn(
          async () => {
            const fscHandler = await FinthetixStakingContractHandler.make();
            return fscHandler.getStatus();
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

        onQueryStarted: async (_, { queryFulfilled }) => {
          try {
            await queryFulfilled;
          }
          catch (err) {
            const isEndpointError = getIsEndpointError(err);
            const errDescription
              = isEndpointError ? err.error : FALLBACK_ERROR_DESCRIPTION;
            toast({
              variant: 'destructive',
              title: UI_ERRORS.ERR8,
              description: errDescription,
            });
          }
        },

        providesTags: ['FinthetixStatus'],
      }),
  }),
});

export const {
  useRequestMetamaskAddressMutation,
  useRefreshActiveMetamaskAddressMutation,
  useLazyFetchFinthetixUserInfoQuery,
  useRequestSampleTokensMutation,
  useStakeWithFinthetixMutation,
  useUnstakeWithFinthetixMutation,
  useWithdrawRewardsFromFinthetixMutation,
  useLazyFetchFinthetixLogDataQuery,
  useFinthetixStatusQuery,
} = metamaskApi;
