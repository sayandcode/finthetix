import { useCallback, useId, useState } from 'react';
import { Slider } from '~/components/ui/slider';
import { StringifiedTokenCount } from '~/lib/types';
import getPercentageOfTokenCount from '~/lib/utils/getPercentageOfTokenCount';
import getReadableERC20TokenCount from '~/lib/utils/readableERC20';

const MAX_PERCENT_IN_SLIDER = 100;
const MIN_PERCENT_IN_SLIDER = 1;

const MAX_DIGITS_TO_DISPLAY_FOR_AMT_STR = 18;

export default function TokenAmtSliderInput(
  { maxAmt, onAmtChange: handleAmtChange, disabled, tokenSymbol }:
  {
    maxAmt: StringifiedTokenCount
    onAmtChange: (amt: StringifiedTokenCount) => void
    disabled: boolean
    tokenSymbol: string
  },
) {
  const readableAmtElId = useId();

  const [readableAmtStr, setReadableAmtStr]
    = useState<string>(
      () =>
        getReadableERC20TokenCount(maxAmt, MAX_DIGITS_TO_DISPLAY_FOR_AMT_STR),
    );

  const handleSliderChange = useCallback(
    ([newPercVal]: number[]) => {
      if (!newPercVal) throw new Error('Slider value is undefined');
      const fractionalAmt = getPercentageOfTokenCount(maxAmt, newPercVal);
      handleAmtChange(fractionalAmt);

      const newReadableAmtStr
        = getReadableERC20TokenCount(
          fractionalAmt, MAX_DIGITS_TO_DISPLAY_FOR_AMT_STR,
        );
      setReadableAmtStr(newReadableAmtStr);
    }, [maxAmt, handleAmtChange]);

  return (
    <div>
      <label
        id={readableAmtElId}
        className="flex justify-center items-baseline gap-x-2 mb-4"
        aria-description="The number of additional FST tokens you wish to stake"
      >
        <div className="text-4xl font-semibold">{readableAmtStr}</div>
        <div>{tokenSymbol}</div>
      </label>
      <Slider
        onValueChange={handleSliderChange}
        min={MIN_PERCENT_IN_SLIDER}
        max={MAX_PERCENT_IN_SLIDER}
        defaultValue={[MAX_PERCENT_IN_SLIDER]}
        disabled={disabled}
        aria-label={`Percentage of ${tokenSymbol} tokens`}
        aria-describedby={`${readableAmtElId}`}
      />
    </div>
  );
}
