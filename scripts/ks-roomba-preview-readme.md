# Roomba account preview

`GET /api/xui-sync` is a protected, read-only account check. It uses the
`user_info` command documented in the supplied XUI ONE 1.5.5 reseller guide.
An authenticated read-only response is still needed to verify the connection
and response shape on Roomba's installation. Mock checks do not prove connectivity.

Server-only configuration:

- `ROOMBA_API_URL`: `https://cdn.rooomba.tv/WDXTMHmN/`
- `ROOMBA_API_KEY`: the provider key, entered privately in server settings.
- `ROOMBA_PREVIEW_SECRET`: the backend bearer secret used to authorize this route.

The HTTPS hostname comes from Joseph's reply to Roomba ticket #163403. The
access code `WDXTMHmN`, including its uppercase `X`, comes from the reseller
panel's API URL tooltip. That tooltip currently advertises
`http://limited-names.com:80/WDXTMHmN/`; combining its path with the support-
supplied HTTPS hostname is a candidate configuration, not verified API access.
Unauthenticated checks returned HTTP 403 from the HTTPS candidate. This does
not establish whether an authenticated request will succeed.

The connector accepts only the exact HTTPS destination above. Legacy HTTP
addresses remain blocked even if `ROOMBA_ALLOW_INSECURE_HTTP` is still set.
That legacy variable is no longer used and can be removed from Preview later.

Never use a `VITE_` prefix for these secrets. Certificate verification stays
enabled. This route does not create customer lines, debit credits, write
to the database, or integrate with payment fulfillment. Requests cannot change
its target or action. Redirects are blocked, response size and request duration
are bounded, and provider response bodies and errors are never logged.

Call it only from a trusted backend with `Authorization: Bearer <ROOMBA_PREVIEW_SECRET>`.
Do not put either secret in a browser URL, screenshot, support ticket, or chat.
Use Preview configuration for initial testing; no production promotion is needed.
Changing a Vercel environment variable does not update an existing deployment.
After deploying the reviewed connector update to Preview, use the existing
backend bearer secret to make one authorized `GET /api/xui-sync` request.
Success requires HTTP 200 with `status: "connected"` and sanitized account data;
HTTP 403 or a saved environment variable alone does not prove a connection.

Run the mock checks with `node scripts/test-ks-roomba-preview.mjs`.
