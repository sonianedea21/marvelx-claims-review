import type { ComponentProps } from 'react';
import { cx } from './cx';

const CONTROL =
  'w-full rounded-md border border-line-input bg-surface px-3 text-base text-ink placeholder:text-ink-subtle ' +
  'hover:border-ink focus-visible:focus-ring aria-invalid:border-danger disabled:bg-sunken disabled:text-ink-subtle';

/** Native input. Use type="date" / "time" / "number" / "text" to match the value. */
export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cx(CONTROL, 'min-h-11', className)} {...rest} />;
}

export function TextArea({ className, rows = 4, ...rest }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cx(CONTROL, 'py-2.5 leading-normal', className)} {...rest} />;
}
