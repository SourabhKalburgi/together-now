import { MESSAGES } from '@/lib/constants/messages';

/**
 * Determines if an error is a network-related error.
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for common network error patterns
  const networkErrorPatterns = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'offline',
    'failed to fetch',
    'networkerror',
  ];

  const errorMessage = error.message?.toLowerCase() || error.toString().toLowerCase();
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
};

/**
 * Extracts a user-friendly error message from an error object.
 * Falls back to generic error messages if the error is not recognized.
 */
export const getErrorMessage = (error: any, fallbackKey: keyof typeof MESSAGES.ERRORS = 'GENERIC'): string => {
  if (!error) return MESSAGES.ERRORS[fallbackKey].DESCRIPTION;
  
  if (isNetworkError(error)) {
    return MESSAGES.ERRORS.NETWORK.DESCRIPTION;
  }
  
  return error.message || MESSAGES.ERRORS[fallbackKey].DESCRIPTION;
};

/**
 * Gets the error title for a given error type.
 */
export const getErrorTitle = (errorKey: keyof typeof MESSAGES.ERRORS): string => {
  return MESSAGES.ERRORS[errorKey].TITLE;
};

