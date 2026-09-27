import { AlertCircle } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The AlexOS form field.
 *
 * One field contract for the whole product: label, optional/required marker,
 * control, helper text, and validation message — each attached to the control
 * with the correct ARIA wiring so screen readers announce errors with the
 * field rather than in isolation.
 *
 * The audit found five different field gaps (space-y-1.5, space-y-2, mixed
 * within a single form, and none at all), two different cancel-button
 * variants, and zero fields with a required indicator. This fixes all three.
 */
export function AlexOSFormField({
  label,
  htmlFor,
  required = false,
  optionalLabel = "Optional",
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: ReactNode;
  error?: string | null;
  /** Receives the ids to wire onto the control. */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("alexos-field", className)}>
      <label htmlFor={id} className="alexos-label">
        {label}
        {required ? (
          <span className="alexos-required" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="alexos-label-optional">{optionalLabel}</span>
        )}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} className="alexos-error" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={hintId} className="alexos-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Groups related fields so complex forms read as sections, not a wall of inputs. */
export function AlexOSFormSection({
  title,
  description,
  columns = 2,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  columns?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("alexos-form-section", className)}>
      {title ? <legend className="alexos-form-section-title">{title}</legend> : null}
      {description ? <p className="alexos-hint -mt-1">{description}</p> : null}
      <div
        className={cn(
          "grid gap-4",
          columns === 1 && "grid-cols-1",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
}

/**
 * Save / cancel pair with a fixed hierarchy: exactly one filled primary action
 * on the right, cancel always secondary. Used at the foot of every dialog and
 * editing form so the exit path is never ambiguous.
 */
export function AlexOSFormActions({
  submitLabel = "Save",
  pending = false,
  onCancel,
  cancelLabel = "Cancel",
  extra,
}: {
  submitLabel?: string;
  pending?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="alexos-focusable inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {cancelLabel}
        </button>
      ) : null}
      {extra}
      <button
        type="submit"
        disabled={pending}
        className="alexos-focusable inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </div>
  );
}
