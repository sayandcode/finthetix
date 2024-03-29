import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export default function InsufficientTokenBalAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="w-4 h-4" />
      <AlertTitle>Insufficient Token Balance</AlertTitle>
      <AlertDescription>
        You don&apos;t seem to have any FST tokens.
        Get free sample tokens on your dashboard page
      </AlertDescription>
    </Alert>

  );
}
