import { AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import formatTimeToCooldown from './lib/formatTimeToCooldown';
import UnderlineLink from '~/components/ui/underline-link';
import { memo } from 'react';

export default memo(function CooldownBanner(
  { timeLeftToCooldownMs }: { timeLeftToCooldownMs: number },
) {
  if (timeLeftToCooldownMs < 0) return null;

  const formattedTimeToCooldown = formatTimeToCooldown(timeLeftToCooldownMs);

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangleIcon />
      <AlertTitle>Warning: Cooling down</AlertTitle>
      <AlertDescription>
        The contract is currently
        <UnderlineLink href="https://github.com/sayandcode/finthetix?tab=readme-ov-file#one-last-thing">
          cooling down
        </UnderlineLink>
        and thus not accepting any
        interactions for the next
        {' '}
        {formattedTimeToCooldown}
      </AlertDescription>
    </Alert>
  );
});
