import { Loader2Icon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import { useWithdrawRewardsFromFinthetixMutation } from '~/redux/services/metamask';

const MAX_DIGITS_TO_DISPLAY_IN_AMT_STR = 4;

export default function RewardsCard(
  { userInfo, isInfoFetching }:
  {
    userInfo?: StringifyBigIntsInObj<FinthetixUserData>
    isInfoFetching: boolean
  }) {
  const { dappInfo } = useRootLoaderData();

  const [sendWithdrawRequest, { isLoading: isWithdrawalInProgress }]
    = useWithdrawRewardsFromFinthetixMutation();

  const withdrawReward = useCallback(
    async () => sendWithdrawRequest(dappInfo),
    [dappInfo, sendWithdrawRequest]);

  const readableRewardAmtStr = useMemo(() => {
    if (!userInfo) return null;
    return getReadableERC20TokenCount(
      userInfo.rewardAmt, MAX_DIGITS_TO_DISPLAY_IN_AMT_STR,
    );
  }, [userInfo]);

  const isWithdrawalDisabled = readableRewardAmtStr === '0' || isWithdrawalInProgress;

  return (
    <Card className="w-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Rewards</CardTitle>
        <CardDescription>
          The number of reward tokens you have accrued, and can withdraw
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="font-bold text-5xl mr-2">
          {isInfoFetching || !readableRewardAmtStr
            ? <Loader2Icon className="mx-10 w-10 h-10 inline-block animate-spin" />
            : readableRewardAmtStr}
        </span>
        <span>FRT</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          onClick={withdrawReward}
          disabled={isWithdrawalDisabled}
        >
          {isWithdrawalInProgress
            ? <Loader2Icon className="animate-spin" />
            : 'Withdraw'}
        </Button>
      </CardFooter>
    </Card>
  );
}
