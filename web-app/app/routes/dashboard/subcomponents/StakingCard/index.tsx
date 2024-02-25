import { Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '~/components/ui/card';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/utils/stringifyBigIntsInObj';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';
import StakeBtn from './subcomponents/StakeBtn';
import UnstakeBtn from './subcomponents/UnstakeBtn';
import { FinthetixMetadata } from '~/redux/services/metamask';

const MAX_DIGITS_TO_DISPLAY_IN_AMT_STR = 4;

export default function StakingCard(
  { userInfo, finthetixMetadata }:
  {
    userInfo: StringifyBigIntsInObj<FinthetixUserData> | undefined
    finthetixMetadata: FinthetixMetadata | undefined
  }) {
  const stakedAmt = useMemo(() => {
    if (!(userInfo && finthetixMetadata)) return null;

    return {
      value: userInfo.stakedAmtVal,
      decimals: finthetixMetadata.stakingToken.decimals,
    };
  }, [userInfo, finthetixMetadata]);

  const readableStakedAmtStr = useMemo(() => {
    if (!stakedAmt) return null;

    return getReadableERC20TokenCount(
      stakedAmt, MAX_DIGITS_TO_DISPLAY_IN_AMT_STR,
    );
  }, [stakedAmt]);

  const stakingTokenBal = useMemo(() => {
    if (!(userInfo && finthetixMetadata)) return null;

    return {
      value: userInfo.stakingTokenBalVal,
      decimals: finthetixMetadata.stakingToken.decimals,
    };
  }, [userInfo, finthetixMetadata]);

  return (
    <Card className="w-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Staked</CardTitle>
        <CardDescription>
          The number of tokens you have currently staked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="font-bold text-5xl mr-2">
          {readableStakedAmtStr
          || <Loader2Icon className="mx-10 w-10 h-10 inline-block animate-spin" />}
        </span>
        <span>FST</span>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <StakeBtn stakingTokenBal={stakingTokenBal} />
        <UnstakeBtn amtCurrentlyStaked={stakedAmt} />
      </CardFooter>
    </Card>
  );
}
