# Roomba account preview

`GET /api/xui-sync` is a protected, read-only account check. It uses the
`user_info` command from Donald's original connector. That command and the
response shape still need verification against Roomba's current documentation
or an authenticated read-only response. Mock checks do not prove connectivity.

Server-only configuration:

- `ROOMBA_API_URL`: `http://live.roomba.tv:80/WDxTMHmN/`
- `ROOMBA_API_KEY`: the provider key, entered privately in server settings.
- `CRON_SECRET`: the backend bearer secret used to authorize this route.
- `ROOMBA_ALLOW_INSECURE_HTTP`: exactly `true` to permit a credential-bearing
  request to this HTTP endpoint. Leave unset to keep provider calls disabled.

Never use a `VITE_` prefix for these secrets. HTTP sends the provider key
unencrypted. This route does not create customer lines, debit credits, write
to the database, or integrate with payment fulfillment. Requests cannot change
its target or action. Redirects are blocked, response size and request duration
are bounded, and provider response bodies and errors are never logged.

Call it only from a trusted backend with `Authorization: Bearer <CRON_SECRET>`.
Do not put either secret in a browser URL, screenshot, support ticket, or chat.
Use Preview configuration for initial testing; no production promotion is needed.

Run the mock checks with `node scripts/test-ks-roomba-preview.mjs`.
