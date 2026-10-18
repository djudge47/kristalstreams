# Roomba account preview through Fixie

`GET /api/xui-sync` checks only the documented `user_info` action. It never
creates client lines, debits reseller credits, writes to the database, or
changes payment fulfillment. It is disabled in the Vercel Production environment.

## Server-only Preview settings

- `ROOMBA_API_URL`: `https://cdn.rooomba.tv/WDXTMHmN/` (uppercase `X`).
- `ROOMBA_API_KEY`: enter the provider key privately.
- `ROOMBA_PREVIEW_SECRET`: the existing bearer secret protecting this test.
- `FIXIE_URL`: the private URL added by the Fixie Vercel integration. It must
  be available to Preview, including this branch if branch overrides exist.

Never use a `VITE_` prefix for these secrets. Do not paste them into chat,
screenshots, support tickets, URLs in a browser, or source control.

## Transport and scope

The route uses a per-handler Undici `ProxyAgent`, not a global proxy setting.
Only this account check uses Fixie; Stripe, Supabase, email, and streaming are
not routed through it. Missing or invalid Fixie configuration stops the request;
there is no direct-network fallback.

Fixie-generated HTTP port 80 URLs are converted internally to the documented
HTTPS proxy endpoint on port 443, with the same proxy hostname and credentials.
Both proxy TLS and the Roomba HTTPS tunnel require valid certificates. Neither
proxy credentials nor the API key is sent in plain text. Redirects are blocked.
Roomba responses are streamed through the pinned `stream-json` 3.7.0 parser,
with absolute limits of 64 MiB, 64 nesting levels, eight million tokens and 15 seconds.
The full JSON must validate, including its trailing data. Only status/error flags
and three account scalars (each at most 256 characters) are retained; permission
lists, provider API keys and arbitrary large strings/keys are not assembled.
JSON is parsed regardless of a legacy `text/html` media type. Only the three
sanitized account fields are returned. A JSON opening alone never means success.
Provider bodies and raw transport errors are never logged or returned.

References:
- https://usefixie.com/documentation/http-and-https-requests
- https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md

## Rollout

1. Confirm the free Tricycle HTTP/HTTPS proxy is active and `FIXIE_URL` is
   present in Vercel Preview configuration.
2. Have Roomba approve **both** addresses shown in that Fixie application's
   dashboard. The submitted pair was `52.87.82.133` and `52.5.155.132`.
   Roomba's approval of Vercel static IPs alone does not approve this Fixie pair.
3. Deploy this branch to **Preview**, keeping deployment protection enabled.
   Setting an environment variable does not update an existing deployment.
4. After Roomba confirms the whitelist, make one authorized request using the
   existing backend bearer secret. Do not create a new payment or client line.
5. Success requires HTTP 200, `status: "connected"`, `transport: "fixie"`, and
   recognizable sanitized account data. A passing mock test, HTTP 403, installed
   integration, or saved setting alone is not proof of a working connection.

Runtime: Vercel Node.js 24 (Undici 8.12.2 requires Node.js >=22.19.0).
Run `npm ci` and `node scripts/test-ks-roomba-preview.mjs` on that runtime.
These 27 checks use synthetic credentials and make no network requests. They
include a streamed response over 12 MiB, malformed trailing JSON, nesting and byte
limits, oversize scalar rejection, split UTF-8, and prototype-key handling.

Authorized failures include a fixed `stage` and allowlisted `reason` to distinguish
transport errors from non-JSON or oversized responses. A received HTTP status is
included when available. A fixed response media-type label and bounded HTML
prefix detection distinguish web pages from oversized JSON without exposing text.
Raw errors, response bodies and credential values remain
excluded; diagnostics do not add requests or change transport verification.
Body failures also include the fixed opening-format classification and bytes read.
JSON-prefix labels describe only the opening bytes, not a validated JSON document.

## Private admin connection panel

Open `/admin/roomba` in this protected Preview deployment and sign in with the
existing Kristal Streams administrator account. The sidebar includes **Roomba
Connection**. Select **Check connection** to retrieve the status, credit balance,
reseller username and account ID. Nothing is fetched automatically on page load.

`GET /api/ks-roomba-account` validates the session token with Supabase Auth on
every request. It requires the existing administrator's verified email, rejects
anonymous accounts, and ignores browser-supplied roles, email and query parameters.
It uses the existing Supabase URL/anon configuration; no service-role access or
schema change is needed. The private Preview bearer remains on the server.

The API reuses a successful result for up to 60 seconds per warm function instance
and shares concurrent checks. Failed attempts have a brief per-instance cooldown.
The UI displays the original check time and removes account details on failure.
Responses use private/no-store cache headers. This endpoint is disabled outside
Vercel Preview and supports no customer creation, renewal or payment operation.

Run `node scripts/test-ks-roomba-admin.mjs` for ten offline authorization/cache
checks in addition to the 27 connector checks. The website production build and
API bundle check also pass. No real sign-in, provider read or account write is
performed by these checks; verify the signed-in panel in Preview before rollout.

## Customer setup drafts

`/admin/setup` is a draft-only preparation page, also linked from the admin
sidebar and the Roomba connection panel. It starts with a manual **Load packages**
action. `GET /api/ks-roomba-packages` applies the same server-verified admin,
Preview-only, proxy, cache and cooldown requirements as the account endpoint.
Its server-selected provider action is the documented read-only `packages` GET;
the existing `/api/xui-sync` continues to select only `user_info`.

The streaming reader retains only documented package fields. IDs, durations,
credit costs, connection allowances and bouquet IDs come from the provider.
Incomplete/unsupported package details block preparation rather than using
example IDs, guessed prices or inferred durations. Duplicate package IDs and
malformed/truncated JSON fail validation. Package records and bouquet lists have
explicit count/length limits. Provider credentials and unrelated fields are dropped.

The form validates a proposed username/password and selected connection count,
then builds a local request draft using only the documented creation fields:
`trial`, `username`, `password`, `package`, `package_duration`, `max_connections`,
`bouquets_selected[]`, and `reseller_notes`. Month durations remain months.
The review explicitly states **Not sent**; there is no creation endpoint, send
button, payment change, credit debit, database write or credential persistence.
Customer credentials remain in React memory and clear when the page is reloaded.

Run `node scripts/test-ks-roomba-setup.mjs` for ten additional offline checks.
The live package read and browser draft review still require verification in
Preview; no customer line may be created as part of that verification.

## Rollback

Restore the prior reviewed Preview deployment to undo this code update. Its
account check uses the old direct transport and is not covered by the Fixie
whitelist. Production is not promoted or changed by this rollout. Disabling or
removing Fixie requires reviewing any configuration owned by its integration.
