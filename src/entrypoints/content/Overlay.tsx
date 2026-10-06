import { t } from '../../core/i18n/t';
import { Button } from '../../ui/primitives/Button';

export type OverlayState =
  | { kind: 'idle' }
  | { kind: 'result'; title: string; body: string; busy: boolean }
  | { kind: 'progress'; title: string; done: number; total: number }
  | { kind: 'toast'; message: string }
  | { kind: 'error'; message: string };

/**
 * The single floating surface the content script draws. One component, one
 * state machine — no stacking of independent popovers over the host page.
 */
export function Overlay({ state, onClose }: { state: OverlayState; onClose: () => void }) {
  if (state.kind === 'idle') return null;

  return (
    <div
      className="fixed right-4 bottom-4 w-[360px] max-w-[calc(100vw-2rem)]"
      style={{ zIndex: 'var(--kn-z-popover)' }}
      role="dialog"
      aria-live="polite"
      aria-label={t('extName')}
    >
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--kn-shadow-lg)]">
        <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <span className="truncate text-sm font-semibold text-fg">{titleOf(state)}</span>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label={t('close')}>
            ✕
          </Button>
        </header>

        <div className="max-h-[50vh] overflow-auto px-3 py-2.5 text-base leading-[var(--kn-leading-prose)] text-fg">
          {state.kind === 'result' && (
            <>
              <p className="whitespace-pre-wrap">{state.body}</p>
              {state.busy && <Caret />}
            </>
          )}
          {state.kind === 'progress' && <Progress done={state.done} total={state.total} />}
          {state.kind === 'toast' && <p>{state.message}</p>}
          {state.kind === 'error' && <p className="text-danger">{state.message}</p>}
        </div>

        {state.kind === 'result' && !state.busy && (
          <footer className="flex justify-end gap-1.5 border-t border-line px-3 py-2">
            <Button size="sm" onClick={() => void navigator.clipboard.writeText(state.body)}>
              {t('copy')}
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}

function titleOf(state: Exclude<OverlayState, { kind: 'idle' }>): string {
  return 'title' in state ? state.title : t('extName');
}

function Caret() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-primary align-text-bottom" />
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-[var(--kn-duration-base)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted">{percent}%</p>
    </div>
  );
}
