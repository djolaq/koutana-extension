import { t, tDynamic } from '../../core/i18n/t';

import { useEffect, useState } from 'react';
import { MANAGER_LINKS } from '../../core/ai/endpoints';
import type { ModelInfo } from '../../core/ai/types';
import { send } from '../../core/messaging/client';

import {
  LOCALE_NAMES,
  TRANSLATION_TARGETS,
  UI_LOCALES,
  languageName,
} from '../../core/i18n/languages';
import type { Settings } from '../../core/settings/schema';
import { Button } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { Card } from '../../ui/primitives/Card';
import { SelectField, TextField } from '../../ui/primitives/Field';
import { useTheme } from '../../ui/useTheme';

export function App() {
  useTheme();
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [token, setToken] = useState('');
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [status, current] = await Promise.all([
        send({ type: 'auth/status' }),
        send({ type: 'settings/get' }),
      ]);
      if (status.ok && status.type === 'auth/status') setConnected(status.status.connected);
      if (current.ok && current.type === 'settings') setSettings(current.settings);
    })();
  }, []);

  useEffect(() => {
    if (!connected) return;
    void send({ type: 'models/list' }).then((res) => {
      if (res.ok && res.type === 'models/list') setModels(res.models);
    });
  }, [connected]);

  async function connect() {
    setBusy(true);
    setError(null);
    const res = await send({ type: 'auth/connectToken', apiToken: token, productId });
    setBusy(false);
    if (res.ok) {
      setConnected(true);
      setToken('');
    } else {
      setError(tDynamic(`error_${res.code}`, 'error_unknown'));
    }
  }

  async function patch(part: Partial<Settings>) {
    const res = await send({ type: 'settings/patch', patch: part });
    if (res.ok && res.type === 'settings') setSettings(res.settings);
  }

  if (!settings) return null;

  const uiLang = settings.uiLanguage === 'auto' ? 'en' : settings.uiLanguage;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <h1 className="text-xl font-semibold">{t('settingsTitle')}</h1>

      <Card title={t('accountSection')}>
        {connected ? (
          <>
            <Callout tone="success" title={t('connectedTitle')}>
              {t('connectedBody')}
            </Callout>
            <div>
              <Button
                variant="danger"
                onClick={async () => {
                  await send({ type: 'auth/disconnect' });
                  setConnected(false);
                }}
              >
                {t('disconnect')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-base text-muted">
              <li>
                <a
                  className="text-primary underline"
                  href={MANAGER_LINKS.aiTools}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('stepOpenAiTools')}
                </a>
              </li>
              <li>
                <a
                  className="text-primary underline"
                  href={MANAGER_LINKS.apiTokens}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('stepCreateToken')}
                </a>
              </li>
              <li>{t('stepPaste')}</li>
            </ol>
            <TextField
              label={t('fieldProductId')}
              hint={t('fieldProductIdHint')}
              value={productId}
              inputMode="numeric"
              onChange={(e) => setProductId(e.target.value)}
            />
            <TextField
              label={t('fieldToken')}
              hint={t('fieldTokenHint')}
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            {error && <Callout tone="danger">{error}</Callout>}
            <div>
              <Button
                variant="primary"
                loading={busy}
                disabled={!token || !productId}
                onClick={connect}
              >
                {t('connectAndVerify')}
              </Button>
            </div>
            <p className="text-sm text-subtle">{t('storageWarning')}</p>
          </>
        )}
      </Card>

      <Card title={t('modelsSection')}>
        {models.length === 0 ? (
          <Callout tone="info">{t('modelsEmpty')}</Callout>
        ) : (
          (['quick', 'standard', 'deep'] as const).map((tier) => (
            <SelectField
              key={tier}
              label={t(`tier_${tier}`)}
              hint={t(`tier_${tier}_hint`)}
              value={settings.models[tier]}
              onChange={(e) =>
                void patch({ models: { ...settings.models, [tier]: e.target.value } })
              }
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </SelectField>
          ))
        )}
      </Card>

      <Card title={t('languageSection')}>
        <SelectField
          label={t('fieldUiLanguage')}
          value={settings.uiLanguage}
          onChange={(e) => void patch({ uiLanguage: e.target.value })}
        >
          <option value="auto">{t('followBrowser')}</option>
          {UI_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_NAMES[locale]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('fieldTargetLanguage')}
          value={settings.targetLanguage}
          onChange={(e) => void patch({ targetLanguage: e.target.value })}
        >
          <option value="auto">{t('followBrowser')}</option>
          {TRANSLATION_TARGETS.map((tag) => (
            <option key={tag} value={tag}>
              {languageName(tag, uiLang)}
            </option>
          ))}
        </SelectField>
      </Card>

      <Card title={t('behaviourSection')}>
        <SelectField
          label={t('fieldTheme')}
          value={settings.theme}
          onChange={(e) => void patch({ theme: e.target.value as Settings['theme'] })}
        >
          <option value="system">{t('themeSystem')}</option>
          <option value="light">{t('themeLight')}</option>
          <option value="dark">{t('themeDark')}</option>
        </SelectField>
        <label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={settings.writingAssistantEnabled}
            onChange={(e) => void patch({ writingAssistantEnabled: e.target.checked })}
          />
          {t('fieldWritingAssistant')}
        </label>
      </Card>
    </main>
  );
}
