import { browser } from '#imports';
import { useEffect, useRef, useState } from 'react';
import { stream, type StreamHandle } from '../../core/messaging/client';
import { t, tDynamic } from '../../core/i18n/t';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { useTheme } from '../../ui/useTheme';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

export function App() {
  useTheme();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [usePage, setUsePage] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<StreamHandle | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [turns]);
  useEffect(() => () => handleRef.current?.cancel(), []);

  async function ask() {
    const question = input.trim();
    if (!question || busy) return;

    setInput('');
    setError(null);
    setBusy(true);
    const history: Turn[] = [...turns, { role: 'user', content: question }];
    setTurns([...history, { role: 'assistant', content: '' }]);

    const page = usePage ? await readActivePage() : undefined;

    handleRef.current = stream(
      { kind: 'chat', history, pageText: page?.text, title: page?.title, url: page?.url },
      (event) => {
        if (event.kind === 'delta') {
          setTurns((previous) => {
            const next = [...previous];
            next[next.length - 1] = {
              role: 'assistant',
              content: next[next.length - 1].content + event.text,
            };
            return next;
          });
        }
        if (event.kind === 'error') {
          setError(tDynamic(`error_${event.code}`, 'error_unknown'));
          setBusy(false);
        }
        if (event.kind === 'done') setBusy(false);
      },
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line px-3 py-2">
        <h1 className="text-base font-semibold">{t('extName')}</h1>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={usePage} onChange={(e) => setUsePage(e.target.checked)} />
          {t('usePageContext')}
        </label>
      </header>

      <div className="flex-1 overflow-auto px-3 py-3">
        {turns.length === 0 && (
          <Callout tone="info" title={t('panelEmptyTitle')}>
            {t('panelEmptyBody')}
          </Callout>
        )}
        <ul className="flex flex-col gap-3">
          {turns.map((turn, index) => (
            <li
              key={index}
              className={
                turn.role === 'user'
                  ? 'self-end max-w-[90%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-md text-on-primary'
                  : 'max-w-full rounded-lg border border-line bg-surface px-3 py-2 text-md whitespace-pre-wrap leading-[var(--kn-leading-prose)]'
              }
            >
              {turn.content}
            </li>
          ))}
        </ul>
        {error && (
          <div className="mt-3">
            <Callout tone="danger">{error}</Callout>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-1.5 border-t border-line bg-surface p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <textarea
          className="min-h-[var(--kn-control-height)] max-h-40 flex-1 resize-none rounded-md border border-line bg-surface px-2.5 py-1.5 text-md text-fg placeholder:text-subtle"
          rows={1}
          value={input}
          placeholder={t('askPlaceholder')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        {busy ? (
          <Button variant="secondary" onClick={() => handleRef.current?.cancel()}>
            {t('stop')}
          </Button>
        ) : (
          <Button variant="primary" type="submit" disabled={!input.trim()}>
            {t('send')}
          </Button>
        )}
      </form>
    </div>
  );
}

async function readActivePage(): Promise<{ title: string; url: string; text: string } | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return undefined;
  try {
    return (await browser.tabs.sendMessage(tab.id, { type: 'page/extract' })) as {
      title: string;
      url: string;
      text: string;
    };
  } catch {
    return undefined; // no content script on this page (store pages, PDFs, …)
  }
}
