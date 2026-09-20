import { browser } from '#imports';
import { useEffect, useState } from 'react';
import { send } from '../../core/messaging/client';
import { t } from '../../core/i18n/t';
import type { AuthStatus } from '../../core/auth/provider';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { useTheme } from '../../ui/useTheme';

/**
 * The popup is a launcher, not a workspace. It answers three questions in one
 * glance — am I connected, what can I do here, where are the settings — and
 * hands everything heavier to the side panel.
 */
export function App() {
  useTheme();
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    void send({ type: 'auth/status' }).then((res) => {
      if (res.ok && res.type === 'auth/status') setStatus(res.status);
    });
  }, []);

  const connected = status?.connected ?? false;

  async function withActiveTab(action: (tabId: number) => Promise<unknown>) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await action(tab.id);
    window.close();
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('extName')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => browser.runtime.openOptionsPage()}
          aria-label={t('openSettings')}
        >
          {t('settings')}
        </Button>
      </header>

      {!connected && (
        <Callout tone="warning" title={t('notConnectedTitle')}>
          <p>{t('notConnectedBody')}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            {t('connectAccount')}
          </Button>
        </Callout>
      )}

      <div className="flex flex-col gap-1.5">
        <Button
          variant="primary"
          disabled={!connected}
          onClick={() => withActiveTab((tabId) => send({ type: 'sidepanel/open', tabId }))}
        >
          {t('actionOpenPanel')}
        </Button>
        <Button
          disabled={!connected}
          onClick={() =>
            withActiveTab((tabId) =>
              browser.tabs.sendMessage(tabId, { type: 'overlay/translatePage' }),
            )
          }
        >
          {t('actionTranslatePage')}
        </Button>
        <Button
          disabled={!connected}
          onClick={() =>
            withActiveTab((tabId) =>
              browser.tabs.sendMessage(tabId, { type: 'overlay/translateSelection' }),
            )
          }
        >
          {t('actionTranslateSelection')}
        </Button>
      </div>

      <p className="text-sm text-subtle">{t('poweredBy')}</p>
    </div>
  );
}
