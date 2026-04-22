/**
 * Tracks the location/context of where a form is being edited
 * Used to maintain user's position when editing drafted forms
 */

export interface FormContext {
  page: string; // e.g., "dashboard", "requests", "form-detail"
  timestamp: number;
  userAction: string; // e.g., "save_draft", "edit_draft"
  additionalInfo?: Record<string, any>;
}

/**
 * Get the current form context
 */
export const getFormContext = (page: string, userAction: string = "save_draft"): FormContext => {
  return {
    page,
    timestamp: Date.now(),
    userAction,
  };
};

/**
 * Store form context in session storage for retrieval
 */
export const storeFormContext = (requestId: number, context: FormContext) => {
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `form_context_${requestId}`,
        JSON.stringify(context)
      );
    }
  } catch (e) {
    console.error("Failed to store form context:", e);
  }
};

/**
 * Retrieve stored form context
 */
export const getStoredFormContext = (requestId: number): FormContext | null => {
  try {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`form_context_${requestId}`);
      return stored ? JSON.parse(stored) : null;
    }
  } catch (e) {
    console.error("Failed to retrieve form context:", e);
  }
  return null;
};

/**
 * Clear stored form context
 */
export const clearFormContext = (requestId: number) => {
  try {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`form_context_${requestId}`);
    }
  } catch (e) {
    console.error("Failed to clear form context:", e);
  }
};

/**
 * Navigate back to the page where form was being edited
 */
export const navigateToFormContext = (requestId: number) => {
  const context = getStoredFormContext(requestId);
  if (context) {
    clearFormContext(requestId);
    // Return the page to navigate to
    switch (context.page) {
      case "dashboard":
        return "/";
      case "requests":
        return "/requests";
      case "form-detail":
        return `/requests/${requestId}`;
      default:
        return "/requests";
    }
  }
  return "/requests";
};
