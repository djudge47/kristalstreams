# Account-scoped website playback preferences

Settings previously used the ownerless `client_settings` key, treated ignored profile-sync errors as success and exposed unused playback/language controls. The notification card used a second global key and could claim enabled delivery after a null subscription. Those controls did not configure the streaming app.

Website video quality/autoplay now use a validated, versioned local record under `ks:playback:v1:<Auth user UUID>`. The hook resolves the current non-anonymous account through Auth before reading or saving. It never imports ownerless legacy keys into a current account, deletes those old keys, or updates a profile. Existing notification preferences in the database are retained. Preferences are explicitly browser-only, without a cloud-sync claim.

Auth changes immediately clear the active account and preferences, then schedule a fresh check outside the Auth callback. Generations cancel stale reads/saves and cleanup unsubscribes. A save rechecks the exact account, blocks duplicates and handles unavailable storage or malformed values as errors. A zero-write failure cannot report saved. Account-tagged form drafts and success messages prevent a previous account's choices from flashing after a switch. Storage/custom events reload only the currently active account's key, including other tabs and same-tab consumers.

The actual website player consumes saved autoplay and preferred quality. Autoplay pauses while account preferences are being checked, on errors or when disabled. HLS picks the requested rendition or the closest lower available height, falling back to the lowest available if necessary; Automatic/native playback stays browser-controlled. Reinitialization destroys its old HLS instance and stale manifest callbacks cannot restart playback. Manual player controls remain available. These preferences do not change an Android/ONN app or prove real provider playback; website demonstration content is a separate audit finding.

The unused language selector is replaced with an honest English-only explanation and player-language guidance. The notification card distinguishes actual browser permission from unavailable automatic website push delivery. It requests no permission, subscription or test notification and no longer claims account/support/event alerts are enabled. The older unused notification helper and Edge function are preserved, not deployed or invoked by this repair. A verified delivery pipeline remains future work.

Run:

```
node scripts/test-ks-playback-preferences.mjs
npm run check
```

Six offline groups exercise the actual storage/quality helpers, Auth-aware hook, Settings form, notification card and player with fictional Auth/media/browser services. They verify strict validation, no legacy-key adoption, two-account separation, duplicate and stale-save rejection, storage failures, mismatched fresh owners, cross-tab and same-tab events, corrupt-value recovery, truthful success/failure, first-render draft isolation, unsupported/granted/denied permission states, actual autoplay/quality consumption and stale HLS callback cleanup. CI includes the suite after a fresh install.

No real profile/customer data, credential, notification permission/subscription, media stream, email, payment, provider line, execution flag, Auth setting, Edge function or production promotion is changed by this source/Preview repair. Browser/account checks and native device playback are not certified by offline fixtures alone.
