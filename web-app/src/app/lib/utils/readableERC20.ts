import { StringifiedTokenCount } from '../types';

const NO_OF_DIGITS_TRUNCATED_BY_COMPACT_NOTATION
  = 12; // Upto 1 Trillion or 1e12

export default function getReadableERC20TokenCount(
  tokenCount: StringifiedTokenCount,
  maxAllowedDigits: number,
): string {
  if (tokenCount.value === '0') return '0';

  // there is only fraction part
  const isTokenCountFractional = tokenCount.value.length <= tokenCount.decimals;
  if (isTokenCountFractional) {
    const minTokenStrLengthForReadableCompactNotation
      = tokenCount.decimals - maxAllowedDigits;
    const isCompactNotationReadable
      = tokenCount.value.length > minTokenStrLengthForReadableCompactNotation;

    const decimalizedTokenCount = Number(`0.${tokenCount.value.padStart(tokenCount.decimals, '0')}`);
    return Intl
      .NumberFormat('en-US',
        isCompactNotationReadable
          ? { maximumFractionDigits: maxAllowedDigits, notation: 'compact' }
          : { maximumFractionDigits: 2, notation: 'scientific' })
      .format(decimalizedTokenCount);
  }

  // there is fraction and whole part
  const wholeNoStr = tokenCount.value.slice(0, -tokenCount.decimals);
  const fractionStr = tokenCount.value.slice(-tokenCount.decimals);

  const maxAllowedDigitsConsideringTruncationByCompactNotation
    = NO_OF_DIGITS_TRUNCATED_BY_COMPACT_NOTATION + maxAllowedDigits;
  const isWholeNoTooBig
    = wholeNoStr.length
    > maxAllowedDigitsConsideringTruncationByCompactNotation;

  const notation = isWholeNoTooBig ? 'scientific' : 'compact';
  const decimalizedTokenCount = isWholeNoTooBig
    ? BigInt(wholeNoStr)
    : Number(`${wholeNoStr}.${fractionStr}`);

  return Intl
    .NumberFormat('en-US', { maximumFractionDigits: 2, notation })
    .format(decimalizedTokenCount);
}
