/**
 * The number of decimals in the whole number string, before scientific
 * notation is easier to read
 */
const NOTATION_SWITCH_THRESHOLD = 18;

export default function getReadableERC20TokenCount(
  tokenCountStr: string,
  noOfDecimals: number,
  notationForFractionalNumber: 'scientific' | 'compact' = 'scientific',
): string {
  if (tokenCountStr === '0') return '0';

  // there is only fraction part
  const isTokenCountFractional = tokenCountStr.length <= noOfDecimals;
  if (isTokenCountFractional) {
    const decimalizedTokenCount = Number(`0.${tokenCountStr.padStart(noOfDecimals, '0')}`);
    return Intl
      .NumberFormat('en-US', { maximumSignificantDigits: 2, notation: notationForFractionalNumber })
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
