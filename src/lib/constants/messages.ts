/**
 * Centralized user-facing messages for the application.
 * All messages should be defined here to ensure consistency and maintainability.
 */

export const MESSAGES = {
  OFFLINE: {
    TITLE: "You're offline",
    DESCRIPTION: "Please check your internet connection and try again.",
    BANNER_DESCRIPTION: "Reconnect to refresh dining requests or join a table.",
    JOIN_DESCRIPTION: "Reconnect to join a dining request.",
    LEAVE_DESCRIPTION: "Reconnect to update your participation.",
  },
  ERRORS: {
    LOADING_REQUESTS: {
      TITLE: "Error loading requests",
      DESCRIPTION: "Failed to load dining requests. Please try again.",
    },
    LOADING_HISTORY: {
      TITLE: "Error loading history",
      DESCRIPTION: "Failed to load your dining history. Please try again.",
    },
    CREATING_REQUEST: {
      TITLE: "Error creating request",
      DESCRIPTION: "Failed to create dining request. Please try again.",
    },
    JOINING_REQUEST: {
      TITLE: "Couldn't join",
      DESCRIPTION: "Failed to join dining request. Please try again.",
    },
    LEAVING_REQUEST: {
      TITLE: "Couldn't leave",
      DESCRIPTION: "Failed to leave dining request. Please try again.",
    },
    NETWORK: {
      TITLE: "Network error",
      DESCRIPTION: "Unable to connect to the server. Please check your connection.",
    },
    GENERIC: {
      TITLE: "Something went wrong",
      DESCRIPTION: "An unexpected error occurred. Please try again.",
    },
  },
  SUCCESS: {
    REQUEST_CREATED: {
      TITLE: "Request created!",
      DESCRIPTION: "Your dining request has been posted.",
    },
    JOINED_REQUEST: {
      TITLE: "Joined!",
      DESCRIPTION: "You've successfully joined this dining request.",
    },
    LEFT_REQUEST: {
      TITLE: "Left request",
      DESCRIPTION: "You've left this dining request.",
    },
  },
} as const;

