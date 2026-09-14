import type { ReactNode } from 'react';
import { cx } from '../cx';

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<CalloutTone, string> = {
  info: 'bg-primary-soft text-fg border-[color:var(--pl-primary-soft-border)]',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
};

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('rounded-md border px-3 py-2.5 text-base', tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cx(title && 'mt-1', 'text-muted')}>{children}</div>}
    </div>
  );
}
