const MILLISECONDS_IN_A_SECOND = 1000;
const MILLISECONDS_IN_A_MINUTE = 60000;
const MILLISECONDS_IN_AN_HOUR = 3600000;

const SECONDS_IN_A_MINUTE = 60;
const MINUTES_IN_AN_HOUR = 60;

const DIGITS_IN_TIME = 2;

export default function formatTimeToCooldown(timeToCooldownMs: number): string {
  if (timeToCooldownMs < 0)
    throw new Error('Time to cooldown represents a duration and hence cannot be negative');
  const secsVal
    = (Math.floor(timeToCooldownMs / MILLISECONDS_IN_A_SECOND)
    % SECONDS_IN_A_MINUTE);
  const secsStr = secsVal.toString().padStart(DIGITS_IN_TIME, '0');

  const minsVal = (Math.floor(timeToCooldownMs / MILLISECONDS_IN_A_MINUTE)
    % MINUTES_IN_AN_HOUR);
  const minsStr = minsVal.toString().padStart(DIGITS_IN_TIME, '0');

  const hoursVal = Math.floor(timeToCooldownMs / MILLISECONDS_IN_AN_HOUR);
  const hoursStr = hoursVal.toString().padStart(2, '0');

  let result = `${secsStr} seconds`;
  if (minsVal) result = `${minsStr} mins ${result}`;
  if (hoursVal) result = `${hoursStr} hours ${result}`;

  return result;
}
