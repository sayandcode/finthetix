import { Loader2Icon } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { FinthetixUserData } from '~/contracts/FinthetixStakingContract';
import { StringifyBigIntsInObj } from '~/lib/types';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Slider } from '~/components/ui/slider';
import { getReadableERC20TokenCount } from '~/lib/utils';
import { useStakeWithFinthetixMutation } from '~/redux/services/metamask';
import useRootLoaderData from '~/lib/hooks/useRootLoaderData';
import InsufficientTokenBalAlert from './subcomponents/InsufficientTokensAlert';

const MAX_PERCENTAGE_TO_STAKE = 100;
const MIN_PERCENTAGE_TO_STAKE = 1;

export default function StakeDialog(
  { userInfo, onClose: closeDialog }:
  {
    userInfo: StringifyBigIntsInObj<FinthetixUserData>
    onClose: () => void
  }) {
  const [percentageToStake, setPercentageToStake]
    = useState(MAX_PERCENTAGE_TO_STAKE);
  const handlePercentageSliderChange = useCallback(([val]: number[]) => {
    if (!val) throw new Error('Slider value is undefined');
    setPercentageToStake(val);
  }, []);

  const amtToStakeStr = useMemo(() => {
    const totalBal = BigInt(userInfo.stakingTokenBal.value);
    const _amtToStake = (totalBal * BigInt(percentageToStake)) / 100n;
    return _amtToStake.toString();
  }, [userInfo.stakingTokenBal.value, percentageToStake]);

  const readableAmtToStakeStr = useMemo(() => {
    return getReadableERC20TokenCount(amtToStakeStr, userInfo.stakingTokenBal.decimals, 'compact');
  }, [amtToStakeStr, userInfo.stakingTokenBal.decimals]);

  const [
    stakeWithFinthetix,
    { isLoading: isStakingInProcess },
  ] = useStakeWithFinthetixMutation();
  const { dappInfo } = useRootLoaderData();
  const confirmStaking = useCallback(async () => {
    const stakingTrial = await stakeWithFinthetix({ amtToStakeStr, dappInfo });
    const isStakingSuccessful = 'data' in stakingTrial;
    if (isStakingSuccessful) closeDialog();
  }, [amtToStakeStr, closeDialog, dappInfo, stakeWithFinthetix]);

  const isTokenBalInsufficient = userInfo.stakingTokenBal.value === '0';
  const isStakingBlocked = isTokenBalInsufficient || isStakingInProcess;

  const readableStakedAmtElId = useId();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Stake</DialogTitle>
        <DialogDescription>
          Earn more rewards by staking more FST tokens
        </DialogDescription>
      </DialogHeader>
      {isTokenBalInsufficient ? <InsufficientTokenBalAlert /> : null}
      <div>
        <label
          id={readableStakedAmtElId}
          className="flex justify-center items-baseline gap-x-2 mb-4"
          aria-description="The number of additional FST tokens you wish to stake"
        >
          <div className="text-4xl font-semibold">{readableAmtToStakeStr}</div>
          <div>FST</div>
        </label>
        <Slider
          onValueChange={handlePercentageSliderChange}
          min={MIN_PERCENTAGE_TO_STAKE}
          max={MAX_PERCENTAGE_TO_STAKE}
          value={[percentageToStake]}
          disabled={isStakingBlocked}
          aria-label="Percentage of FST token balance to stake"
          aria-describedby={`${readableStakedAmtElId}`}
        />
      </div>
      <DialogFooter className="gap-y-2">
        <Button onClick={confirmStaking} disabled={isStakingBlocked}>
          {isStakingInProcess ? <Loader2Icon className="animate-spin" /> : 'Confirm' }
        </Button>
        <Button variant="outline" onClick={closeDialog} disabled={isStakingBlocked}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
