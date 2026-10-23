# Separate title previews from sample playback

Every movie/series detail page previously assigned the same Mux test stream to its title, gated it on website sign-in and offered Watch Now. An unused `getStreamUrl` helper also substituted that sample on development mode, missing configuration, failed requests or missing response data; its real-request branch used an undocumented route and a browser API key.

The shared versioned `catalog-preview.ts` source now supplies all eight example cards and details. Existing title IDs, artwork, categories and years are retained. The homepage section and details explicitly identify catalog previews and direct customers to their supplied streaming player for current availability. Unsupported ratings/episode totals and inert list/like/share controls are removed. Detail lookup validates both the exact numeric ID and content type synchronously, so an invalid next route cannot retain a previous title.

No title record contains a stream URL. Website sign-in is not presented as entitlement to a movie or series. Existing streaming setup and subscription links remain available; actual provider browsing/playback still requires a separately documented and authorized integration. This repair does not implement that service or certify every promotional/metadata claim elsewhere on the website.

`/player-demo` is a separate public sample page. It names Big Buck Bunny and labels it Sample Video Only before and during playback, with Blender Foundation/CC BY 3.0 and Mux credit. The player mounts only after Open Sample Player; Close removes it. The source is fixed and accepts no URL, account or title override. Website playback preferences still apply. The embedded player mode preserves mobile document scrolling and the close/navigation controls; existing immersive behavior remains the default for other callers.

The unused `getStreamUrl` export and its sample/browser-key branch are removed from the API module. No current app consumer referenced that helper. No replacement provider endpoint, client secret, fallback stream or automatic retry is introduced. Existing Vercel configuration is not read or edited.

Run:

```
node scripts/test-ks-website-playback.mjs
node scripts/test-ks-playback-preferences.mjs
npm run check
```

Five new offline groups compile/render actual catalog, list/detail/sample components and API exports. They cover all eight browse destinations, strict/mismatched/missing IDs, immediate route changes, no title-associated media, opt-in sample open/close/credit, removal of the stream fallback and internal links against actual App route declarations. Auth/connected access and fetch are blocked. The existing six settings/player groups additionally check that embedded mode preserves document scrolling in the mobile branch. CI runs both suites after a fresh install.

Source/Preview only. No real Auth, provider, database, entitlement, email, payment, credential, media request, execution flag, Edge deployment, approved artwork/APK or production promotion is changed. Native ONN/phone playback and a new signed-in browser/device run are not certified by these fixtures.

Sample references reviewed: [Mux's test-stream index](https://test-streams.mux.dev/) and [Big Buck Bunny's attribution/license information](https://peach.blender.org/about/). The film is deliberately used as a credited player sample, never as a substitute for a catalog title.
