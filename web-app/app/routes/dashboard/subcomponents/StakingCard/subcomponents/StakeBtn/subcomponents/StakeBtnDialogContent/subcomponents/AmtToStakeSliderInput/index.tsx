import { useCallback, useId, useMemo } from 'react';
import { Slider } from '~/components/ui/slider';
import { StringifiedTokenCount } from '~/lib/types';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';

const MAX_PERCENTAGE_TO_STAKE = 100;
const MIN_PERCENTAGE_TO_STAKE = 1;

export default function AmtToStakeSliderInput({
  amtToStake,
  percentageToStake,
  setPercentageToStake,
  disabled,
}: {

  amtToStake: StringifiedTokenCount
  percentageToStake: number
  setPercentageToStake: (newPercentageToStake: number) => void
  disabled: boolean
}) {
  const readableStakedAmtElId = useId();

  const handlePercentageSliderChange = useCallback(([val]: number[]) => {
    if (!val) throw new Error('Slider value is undefined');
    setPercentageToStake(val);
  }, [setPercentageToStake]);

  const readableAmtToStakeStr = useMemo(() =>
    getReadableERC20TokenCount(amtToStake.value, amtToStake.decimals, 'compact')
  , [amtToStake]);

  return (
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
        disabled={disabled}
        aria-label="Percentage of FST token balance to stake"
        aria-describedby={`${readableStakedAmtElId}`}
      />
    </div>
  );
}
