import type { ReactNode } from 'react';

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface shadow-[var(--sova-shadow-sm)]">
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="text-lg font-semibold text-fg">{title}</h2>}
          {action}
        </header>
      )}
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  );
}
