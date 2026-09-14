import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction. Keeps the label for screen readers. */
  loading?: boolean;
  iconOnly?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap ' +
  'transition-colors duration-[var(--pl-duration-fast)] ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-fg border border-line hover:bg-hover',
  ghost: 'bg-transparent text-muted hover:bg-hover hover:text-fg',
  danger: 'bg-danger-soft text-danger border border-transparent hover:border-danger',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-[var(--pl-control-height-sm)] px-2 text-xs rounded-sm',
  md: 'h-[var(--pl-control-height)] px-3 text-base rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, iconOnly, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        base,
        variants[variant],
        sizes[size],
        iconOnly && 'aspect-square px-0',
        className,
      )}
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
