# Infomaniak AI Tools — what we know

Last verified: **2026-09-13**. Everything in "Verified" has a source. Everything in
"Open questions" must be tested against a real account before code depends on it.

## Verified

### Endpoint

```
Base   https://api.infomaniak.com/2/ai/{product_id}/openai/v1
POST   /chat/completions      OpenAI-compatible
GET    /models                OpenAI-compatible
```

The `/1/ai/{product_id}/openai/...` routes are marked deprecated on the developer
portal; we use `/2/...` only.

### Authentication

`Authorization: Bearer <token>`.

The token is a personal API token created in the Infomaniak Manager
(profile → API tokens) with the **`ai-tools`** scope. Tokens are unlimited by
default, can be given an expiry at creation, and are auto-deactivated after a year
of non-use. The token value is shown once.

### Product id

One AI Tools product per organisation; the id appears in the Manager under
`manager.infomaniak.com/v3/ng/products/cloud/ai-tools`. It is part of the URL path,
so a wrong id surfaces as 404, not 401.

### Billing

Pay-as-you-go against the account's AI credits: input and output tokens counted
separately, transcription and image generation billed per minute/generation. New
accounts get 1M free credits. Users can set a spending cap in the Manager — worth
telling them about in onboarding, because our extension can burn credits on a long
page translation.

### Service claims relevant to our positioning

Hosted in Switzerland; Infomaniak states queries are neither recorded nor used to
train models; GDPR/FADP. Capabilities advertised on the product page: LLM chat,
embeddings/semantic search, function calling, Whisper-based transcription, and
image generation (described as being rolled out).

## Open questions

| #   | Question                                                                        | Why it matters                        | How to answer                                                                  |
| --- | ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Exact model ids on a real product                                               | Model picker, tier defaults           | `GET /models` with a real token; paste the output here                         |
| 2   | Does `login.infomaniak.com/authorize` accept PKCE (S256) for a public client?   | Whether OAuth can replace token entry | Register an app in the Manager, try the flow with `identity.launchWebAuthFlow` |
| 3   | Can an OAuth token carry the `ai-tools` scope?                                  | Same                                  | Call `/models` with the resulting token                                        |
| 4   | Is an extension redirect URI (`https://<id>.chromiumapp.org/`) accepted?        | Same                                  | Try registering it                                                             |
| 5   | Can `product_id` be read from the account after login?                          | Removes a manual step                 | Explore `/1/products` / account endpoints with a real token                    |
| 6   | Are `/audio/transcriptions` and `/images/generations` exposed on the same base? | Roadmap items M6/M7                   | Probe with a real token                                                        |
| 7   | Rate limits and max context per model                                           | Batch sizes in page translation       | Observe headers on 429                                                         |

OAuth endpoints, for whoever tackles #2–#4 (taken from Infomaniak's own OAuth
libraries and the Socialite provider, not from official docs):

```
authorize  https://login.infomaniak.com/authorize
token      https://login.infomaniak.com/token
userinfo   https://login.infomaniak.com/oauth2/userinfo
apps       https://manager.infomaniak.com/v3/ng/profile/user/applications/list
```

## Sources

- Infomaniak Developer Portal — routes `POST /2/ai/{product_id}/openai/v1/chat/completions`, `GET /2/ai/{product_id}/openai/v1/models`: <https://developer.infomaniak.com/docs/api>
- Getting started with AI Services: <https://www.infomaniak.com/en/support/faq/2845/getting-started-guide-ai-services-sovereign-ai-services>
- AI Service product page (capabilities, billing, sovereignty): <https://www.infomaniak.com/en/hosting/ai-services>
- API tokens (creation, scope, validity): <https://www.infomaniak.com/en/support/faq/2582/add-and-manage-infomaniak-api-tokens>
- OAuth2/OIDC applications: <https://www.infomaniak.com/en/support/faq/2567/add-and-manage-infomaniak-api-applications>
- Base URL and `ai-tools` scope in practice: <https://janikvonrotz.ch/2026/04/01/setup-opencode-with-infomaniak-ai-tools/>
- OAuth endpoint URLs: <https://github.com/SocialiteProviders/Infomaniak>, <https://github.com/Infomaniak/android-login>
