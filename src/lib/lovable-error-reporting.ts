type ErrorReportingOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type RuntimeErrorPayload = {
  message: string;
  stack?: string;
  filename?: string;
};

declare global {
  interface Window {
    __reportRuntimeError?: (payload: RuntimeErrorPayload) => void;
  }
}

/** Reports runtime errors without depending on Lovable's editor/runtime. */
export function reportRuntimeError(
  error: unknown,
  context: Record<string, unknown> = {},
  _options: ErrorReportingOptions = {},
) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const payload: RuntimeErrorPayload = {
    message: Object.keys(context).length
      ? `${message} | ${JSON.stringify(context)}`
      : message,
    stack: error instanceof Error ? error.stack : undefined,
    filename: window.location.pathname,
  };

  window.__reportRuntimeError?.(payload);

  if (!window.__reportRuntimeError) {
    console.error("[AlexOS runtime error]", payload);
  }
}

/** @deprecated Use reportRuntimeError instead. */
export const reportLovableError = reportRuntimeError;
