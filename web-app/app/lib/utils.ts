import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrialResult } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function tryItAsync<ResultType = unknown, Err = unknown>(
  fn: () => Promise<ResultType>,
): Promise<TrialResult<ResultType, Err>> {
  try {
    const data = await fn();
    return { success: true, data };
  }
  catch (err) {
    return { success: false, err: err as Err };
  }
}

/**
 * The number of decimals in the whole number string, before scientific
 * notation is easier to read
 */
const NOTATION_SWITCH_THRESHOLD = 18;

export function getReadableERC20TokenCount(
  tokenCount: bigint,
  noOfDecimals: number,
): string {
  if (tokenCount === 0n) return '0';

  const tokenCountStr = tokenCount.toString();

  // there is only fraction part
  const isTokenCountFractional
    = tokenCountStr.length <= noOfDecimals;
  if (isTokenCountFractional) {
    const decimalizedTokenCount
      = Number(`0.${tokenCountStr.padStart(noOfDecimals, '0')}`);
    return Intl
      .NumberFormat('en-US', { maximumFractionDigits: 2, notation: 'scientific' })
      .format(decimalizedTokenCount);
  }

  // there is fraction and whole part
  const wholeNoStr = tokenCountStr.slice(0, -noOfDecimals);
  const fractionStr = tokenCountStr.slice(-noOfDecimals);

  const isWholeNoTooBig = wholeNoStr.length > NOTATION_SWITCH_THRESHOLD;
  const notation = isWholeNoTooBig ? 'scientific' : 'compact';
  const decimalizedTokenCount = isWholeNoTooBig
    ? BigInt(wholeNoStr)
    : Number(`${wholeNoStr}.${fractionStr}`);

  return Intl
    .NumberFormat('en-US', { maximumFractionDigits: 2, notation })
    .format(decimalizedTokenCount);
}
