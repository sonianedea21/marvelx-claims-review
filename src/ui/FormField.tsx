import type { ReactNode } from 'react';
import { cx } from './cx';

type FormFieldProps = {
  /** id of the control inside, so the label points at it. */
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

/**
 * Label + control + hint + error. The control should set
 * aria-describedby={`${htmlFor}-hint ${htmlFor}-error`} and aria-invalid when there is an error.
 */
export function FormField({ htmlFor, label, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
