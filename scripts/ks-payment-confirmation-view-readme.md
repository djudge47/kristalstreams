# Payment and dashboard status wording

The existing Preview queue already distinguishes an owner-bound verified `setup_complete` result from `awaiting_activation`. Its SQL checks the receipt, purchaser and saved completion/login/attempt before reporting completion. The old payment-success screen ignored that result and told every sandbox purchaser that no streaming activation had occurred, including the separately approved completed provider test.

`_shared/ks-payment-confirmation-view.js` now maps the authenticated confirmation response to explicit payment, pending, review and verified-setup copy. It validates booleans, session mode, optional receipt reference and the agreement between completed status and the provider-completion flag. Payment alone, a website-plan activation, malformed fields or one completion flag cannot produce the setup-confirmed message. The supported provider completion contract remains Preview-only; a future live provider-ready contract must be integrated and tested separately. This is presentation validation, not an authorization capability or a substitute for the API's owner/proof checks.

`PaymentSuccess.tsx` uses the mapper and offers a dashboard action for the confirmed states. A review state distinguishes saved payment from setup needing support and reminds the customer not to pay again. The existing authenticated confirmation request, cancellation/unmount guards, retry action and 1.2-second live website-plan dashboard redirect remain. It introduces no new checkout, provider operation, email or API endpoint.

The pending dashboard section now says setup has not been **confirmed in the account**, rather than claiming that no provider activation could have happened. An uncertain or not-yet-completed local setup can have already reached the provider; the UI must not deny that possibility. Completed rows still leave the existing pending-only list, and the separate owner-only encrypted-login handoff retains its current behavior.

“Streaming setup confirmed” describes the saved verified setup, not playback testing or current external provider health. The sandbox payment did not charge a card; the separately approved provider creation can still have consumed its approved reseller credit. No additional credit approval or spend is implied by the wording.

## Validation and scope

**22 checks passed:** 15 new presentation/queue integration cases and 7 existing owner setup cases. Tests cover pending/completed/replayed results, legacy sandbox/live responses, website-only activation, manual review, mode/reference mismatches, malformed/contradictory flags, output sanitization, the existing server queue adapter and foreign purchaser rejection. All identities, payments and backend responses are fictional. No real payment, email, account or credit changed.

The full Vite build and targeted lint also passed. The repository's old TypeScript ESLint plugin needs explicit `no-unused-expressions` options with the installed ESLint version; the two TSX files were linted with those options and JS files separately, without disabling that rule or changing dependencies. Existing build notices about chunk sizes and the Browserslist database are unchanged.

This update changes presentation in the draft branch only. It does not wire the newer receipt-only recorder or pending-alert proposal into checkout/webhooks, enable the installed empty database foundation, seed a policy, change production or generalize automatic provider activation. Completion-aware handling for those newer unrouted modules remains part of their coordinated rollout. No deployment or browser session was used to perform a real checkout during validation.
