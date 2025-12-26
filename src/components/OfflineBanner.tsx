import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MESSAGES } from '@/lib/constants/messages';

interface OfflineBannerProps {
  isOnline: boolean;
}

const OfflineBanner = ({ isOnline }: OfflineBannerProps) => {
  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="flex items-start gap-3">
      <WifiOff className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <AlertTitle>{MESSAGES.OFFLINE.TITLE}</AlertTitle>
        <AlertDescription className="text-sm">
          {MESSAGES.OFFLINE.BANNER_DESCRIPTION}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineBanner;

