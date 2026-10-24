# Temporary general-support chat regression checks

Run `node scripts/test-ks-general-chat.mjs` from the repository root. The Application quality workflow runs this suite and the related help-content suite.

The six groups compile the actual chat helper, Supabase wrapper and React page. The installed Functions SDK uses a fictional fetch transport; Auth identities and replies are fixtures. Database operations and transcript-storage access fail the test. No AI service, customer record, credential, email or payment is touched.

Coverage:

- Input/reply bounds, a ten-message role-allowlisted context, explicit captured Authorization headers (including public requests), initial Auth gating and owner mismatch rejection.
- Malformed/HTTP failures, a deterministic twenty-second local timeout, no automatic retries, and late-result discard.
- Duplicate submission coalescing, accessible input labels, escaped plain-text replies and busy state.
- Clear Chat, sign-out, account changes and stale requests/finally blocks while a newer request is pending.
- Failed exchanges excluded from subsequent context; forty visible messages and an internally scrolling transcript.
- Unmount cleanup and cancellation while a session check is pending.

This is a temporary on-page conversation, not a saved archive. The client does not insert into `chat_messages` or persist transcripts. Clearing the display or timing out cannot cancel or delete an already submitted remote request: the installed SDK does not forward AbortSignal to Functions invocation. These tests therefore assert local discard, not server cancellation.

The related `node scripts/test-ks-help-content.mjs` renders the history, AI-help and FAQ pages, verifies their support links against actual routes and prevents the old saved-history/training/diagnostic claims from returning.

The deployed AI service was inspected read-only for its `{message}` contract; it was not invoked, modified or deployed. These offline tests do not certify upstream retention, model accuracy, availability, quotas or abuse protection. A retained private transcript feature needs a separate reviewed storage, access and retention design.
