import { MESSAGES } from '@/lib/constants/messages';

type ToastFunction = (props: {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}) => void;

/**
 * Checks if the user is offline and shows an appropriate toast if so.
 * Returns true if offline, false otherwise.
 */
export const checkOfflineAndNotify = (
  isOnline: boolean,
  toast: ToastFunction,
  customMessage?: { title: string; description: string }
): boolean => {
  if (!isOnline) {
    toast({
      title: customMessage?.title || MESSAGES.OFFLINE.TITLE,
      description: customMessage?.description || MESSAGES.OFFLINE.DESCRIPTION,
      variant: "destructive",
    });
    return true;
  }
  return false;
};

