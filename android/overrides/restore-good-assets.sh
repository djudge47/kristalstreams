#!/usr/bin/env bash
set -u

RES="android/player/app/src/main/res"
PARTS="android/full-source-parts"
WORK="/tmp/kristal-full-source"
ARCHIVE="/tmp/kristal-full-source.tar.gz"

mkdir -p "$RES/drawable-nodpi"
rm -rf "$WORK" "$ARCHIVE"
mkdir -p "$WORK"

if [ ! -d "$PARTS" ]; then
  echo "Full-source package is not present; continuing with canonical R4 resources."
  exit 0
fi

COUNT="$(find "$PARTS" -maxdepth 1 -name 'part-*.txt' -type f | wc -l)"
echo "Full-source parts found: $COUNT"
if [ "$COUNT" -eq 0 ]; then
  exit 0
fi

# Some historical full-source parts use a mixed chunk format. Never let an
# archive-decoding problem block a build; only restore from it after both gzip
# and tar validation pass.
if ! (cat "$PARTS"/part-*.txt | tr -d '\r\n\t ' | base64 --decode > "$ARCHIVE" 2>/dev/null); then
  echo "Full-source parts are not one raw Base64 stream; skipping archive restore safely."
  rm -f "$ARCHIVE"
  exit 0
fi
if ! gzip -t "$ARCHIVE" 2>/dev/null; then
  echo "Full-source package is not a valid gzip archive; continuing safely."
  exit 0
fi
if ! tar -xzf "$ARCHIVE" -C "$WORK" 2>/dev/null; then
  echo "Full-source gzip is not a tar archive; continuing safely."
  exit 0
fi

echo "Full-source archive extracted. Files: $(find "$WORK" -type f | wc -l)"

remove_resource() {
  local name="$1"
  find "$RES" -type f \( -name "$name.xml" -o -name "$name.png" -o -name "$name.jpg" -o -name "$name.jpeg" -o -name "$name.webp" \) -delete || true
}
find_asset() {
  local pattern="$1"
  find "$WORK" -type f -iname "$pattern" | head -n 1
}
restore_image() {
  local source_pattern="$1" target_name="$2" ext="$3" src
  src="$(find_asset "$source_pattern")"
  [ -n "$src" ] || return 1
  remove_resource "$target_name"
  cp "$src" "$RES/drawable-nodpi/$target_name.$ext"
  echo "Restored original asset: $target_name <- ${src#$WORK/}"
}
restore_first() {
  local target="$1" ext="$2"; shift 2
  local p
  for p in "$@"; do restore_image "$p" "$target" "$ext" && return 0; done
  return 1
}

restore_first official_live_tv png 'live_tv.png' || true
restore_first official_live_tv_focused png 'live_tv_focused.png' 'live_tv.png' || true
restore_first official_movies png 'movies.png' || true
restore_first official_movies_focused png 'moies_focused.png' 'movies_focused.png' 'movies.png' || true
restore_first official_series png 'series.png' || true
restore_first official_series_focused png 'series_focused.png' 'series.png' || true
restore_first official_dashboard_bg jpg 'dashboard_background.jpg' 'dashboard_background.jpeg' || true
restore_first ks_monogram png 'launcher_logo.png' 'ks_monogram.png' || true

echo "Original-asset restoration pass complete."
exit 0
