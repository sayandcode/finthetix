import { useCallback, useId, useMemo } from 'react';
import { Slider } from '~/components/ui/slider';
import { StringifiedTokenCount } from '~/lib/types';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';

const MAX_PERCENTAGE_TO_UNSTAKE = 100;
const MIN_PERCENTAGE_TO_UNSTAKE = 1;

export default function AmtToUnstakeSliderInput({
  amtToUnstake,
  percentageToUnstake,
  setPercentageToUnstake,
  disabled,
}: {

  amtToUnstake: StringifiedTokenCount
  percentageToUnstake: number
  setPercentageToUnstake: (newPercentageToUnstake: number) => void
  disabled: boolean
}) {
  const readableAmtElId = useId();

  const handlePercentageSliderChange = useCallback(([val]: number[]) => {
    if (!val) throw new Error('Slider value is undefined');
    setPercentageToUnstake(val);
  }, [setPercentageToUnstake]);

  const readableAmtStr = useMemo(() =>
    getReadableERC20TokenCount(amtToUnstake.value, amtToUnstake.decimals, 'compact')
  , [amtToUnstake]);

  return (
    <div>
      <label
        id={readableAmtElId}
        className="flex justify-center items-baseline gap-x-2 mb-4"
        aria-description="The number of additional FST tokens you wish to stake"
      >
        <div className="text-4xl font-semibold">{readableAmtStr}</div>
        <div>FST</div>
      </label>
      <Slider
        onValueChange={handlePercentageSliderChange}
        min={MIN_PERCENTAGE_TO_UNSTAKE}
        max={MAX_PERCENTAGE_TO_UNSTAKE}
        value={[percentageToUnstake]}
        disabled={disabled}
        aria-label="Percentage of FST token balance to unstake"
        aria-describedby={`${readableAmtElId}`}
      />
    </div>
  );
}
