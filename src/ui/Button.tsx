import type { ComponentProps } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  icon?: IconName;
  loading?: boolean;
};

const VARIANT = {
  primary: 'bg-ink text-ink-inverse hover:bg-ink-muted active:bg-ink',
  secondary: 'bg-surface text-ink border border-line-input hover:border-ink hover:bg-paper active:bg-sunken',
  ghost: 'text-ink hover:bg-sunken active:bg-line',
};

const SIZE = {
  // 44px hit targets on touch screens; sm is lighter with a mouse, where dense lists need it.
  md: 'min-h-11 px-5 text-sm gap-2',
  sm: 'min-h-9 pointer-coarse:min-h-11 px-3 text-sm gap-1.5',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center rounded-full py-1.5 text-center font-medium',
        'transition-colors duration-150 ease-standard focus-visible:focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon && <Icon name={icon} size="sm" />}
      {children}
    </button>
  );
}
