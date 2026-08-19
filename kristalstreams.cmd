@echo off
setlocal EnableExtensions EnableDelayedExpansion
title KS Series Landscape Poster Lock 1682029

set "SOURCE=C:\KristalStreams168RC1R2\KristalStreams-1.6.8-RC1-R2-LEGACY-DEMO-FIX"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "WORK=C:\ksserieslandscapeposterlock-!STAMP!"
set "FINAL=%USERPROFILE%\Downloads\KS-SERIES-LANDSCAPE-POSTER-LOCK-1682029.apk"
set "LOG=%TEMP%\ks-series-landscape-poster-lock-1682029-build.txt"
set "JAVASAVE=%USERPROFILE%\.kristalstreams-java-home.txt"

echo.
echo ==========================================================
echo   KRISTAL STREAMS 1.6.8 RC1 R2 - SERIES LANDSCAPE POSTER LOCK
echo   FRESH APK: KS-SERIES-LANDSCAPE-POSTER-LOCK-1682029.apk
echo ==========================================================
echo.
echo Baseline: known-good R2
echo Lightens every regular Live TV channel-logo panel.
echo Removes black outside and inside the dashboard KS banner.
echo Hides Android status and navigation bars during playback.
echo Draws Live TV, Movies, and Series video edge-to-edge.
echo Removes the persistent channel name and NOW/NEXT banner.
echo Removes side bars without zoom-cropping the picture.
echo Restores player audio and makes Back exit playback reliably.
echo Automatically selects a supported audio track when one is available.
echo Adds software decoding for AC3, EAC3, DTS, and TrueHD audio.
echo Opens a complete Movie Details page before movie playback.
echo Loads poster, backdrop, description, cast, director, genre, rating, and runtime when supplied.
echo Adds movie search, provider/A-Z/newest/rating sorting, and a persistent My List.
echo Adds Resume, Play From Beginning, trailers, related movies, and TV-remote focus.
echo Adds selectable audio tracks and subtitles inside the fullscreen player.
echo Adds Series search, sorting, My Series, full show information, season tabs, and rich episode cards.
echo Adds episode Resume, Play From Beginning, Next Episode, remembered position, trailers, and related series.
echo Centers Continue, Next, and season text.
echo Enlarges the Continue and Next control panel and episode cards.
echo Allows two-line episode titles and descriptions.
echo Automatically fits long Series text inside every control and card.
echo Keeps every red Series Details button completely visible.
echo Adds extra bottom padding beneath the Choose-an-episode red button.
echo Restores the full Season box directly beneath the red button.
echo Moves Season 1 above the Continue and Next panel so it opens above the fold.
echo Shows episodes as smaller two-column portrait and three-column landscape cards.
echo Locks the mobile-landscape poster inside its left details pane after loading.
echo The working TV Guide and details panel are unchanged.
echo Original R2 remains untouched.
echo.

if not exist "%SOURCE%\gradlew.bat" (
    echo ERROR: Known-good R2 source was not found:
    echo   %SOURCE%
    echo.
    pause
    exit /b 1
)

echo [1/14] Creating a brand-new working copy...
mkdir "%WORK%" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Could not create:
    echo   %WORK%
    pause
    exit /b 1
)

robocopy "%SOURCE%" "%WORK%" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NFL /NDL /NP >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
    echo ERROR: Could not copy the known-good R2 source.
    pause
    exit /b %RC%
)

echo [2/14] Installing verified 1682020 baseline and complete Series upgrade...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt',(B 'MODELS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt',(B 'XTREAM')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt',(B 'GUIDE')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt',(B 'ADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt',(B 'UICONTEXT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt',(B 'IMMERSIVE')); [IO.File]::WriteAllBytes('%WORK%\app\build.gradle.kts',(B 'GRADLE')); [IO.File]::WriteAllBytes('%WORK%\REFERENCE-EPG-AUDIT.txt',(B 'AUDIT')); [IO.File]::WriteAllBytes('%WORK%\apply-ui-contrast.ps1',(B 'UIPATCH')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\LibraryActivity.kt',(B 'LIBRARY')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\MediaGridAdapter.kt',(B 'MEDIAADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\MovieDetailsActivity.kt',(B 'MOVIEDETAILS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_movie_details.xml',(B 'MOVIELAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout-land\activity_movie_details.xml',(B 'MOVIELAYOUTLAND')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\drawable\bg_movie_details_panel.xml',(B 'MOVIEPANEL')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\drawable\bg_movie_fact.xml',(B 'MOVIEFACT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\values\movie_styles.xml',(B 'MOVIESTYLES')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\MovieWatchlist.kt',(B 'WATCHLIST')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\MovieWatchlistActivity.kt',(B 'WATCHLISTACTIVITY')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\ContinueWatching.kt',(B 'CONTINUEWATCHING')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\PlayerActivity.kt',(B 'PLAYER')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_library.xml',(B 'LIBRARYLAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout-land\activity_library.xml',(B 'LIBRARYLAYOUTLAND')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_movie_watchlist.xml',(B 'WATCHLISTLAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout-land\activity_movie_watchlist.xml',(B 'WATCHLISTLAYOUTLAND')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_player.xml',(B 'PLAYERLAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt',(B 'SERIESDETAILS')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\EpisodeListAdapter.kt',(B 'EPISODEADAPTER')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\SeriesWatchlist.kt',(B 'SERIESWATCHLIST')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\SeriesWatchlistActivity.kt',(B 'SERIESWATCHLISTACTIVITY')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\java\com\kristalstreams\player\SeriesHistory.kt',(B 'SERIESHISTORY')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_series_details.xml',(B 'SERIESLAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout-land\activity_series_details.xml',(B 'SERIESLAYOUTLAND')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\row_episode_modern.xml',(B 'EPISODEROW')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\activity_series_watchlist.xml',(B 'SERIESWATCHLISTLAYOUT')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout-land\activity_series_watchlist.xml',(B 'SERIESWATCHLISTLAYOUTLAND'))"
if errorlevel 1 (
    echo ERROR: Could not install immersive playback files.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%WORK%\apply-ui-contrast.ps1" -ProjectRoot "%WORK%"
if errorlevel 1 (
    echo ERROR: Could not register the UI and fullscreen controllers.
    pause
    exit /b 1
)
del /q "%WORK%\apply-ui-contrast.ps1" >nul 2>&1

echo [3/14] Applying final Series Details layout measurements...
set "LAYOUTPS=%TEMP%\ks-series-layout-fix-1682022.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'LAYOUTPATCH'; $b=':::END '+'LAYOUTPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing layout patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing layout patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%LAYOUTPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Series layout correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%LAYOUTPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%LAYOUTPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Series layout correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [4/14] Constraining all Series text inside its box...
set "TEXTFITPS=%TEMP%\ks-series-text-fit-1682023.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'TEXTFITPATCH'; $b=':::END '+'TEXTFITPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing text-fit patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing text-fit patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%TEXTFITPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Series text-fit correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEXTFITPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%TEXTFITPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Series text-fit correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [5/14] Restoring full red-button visibility and bottom clearance...
set "BUTTONPS=%TEMP%\ks-series-button-clearance-1682024.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'BUTTONPATCH'; $b=':::END '+'BUTTONPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing button-clearance patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing button-clearance patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%BUTTONPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Series button-clearance correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%BUTTONPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%BUTTONPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Series button-clearance correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [6/14] Adding extra space beneath the red episode button...
set "PADDINGPS=%TEMP%\ks-series-button-padding-1682025.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'PADDINGPATCH'; $b=':::END '+'PADDINGPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing bottom-padding patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing bottom-padding patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%PADDINGPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the red-button bottom-padding correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PADDINGPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%PADDINGPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The red-button bottom-padding correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [7/14] Rebalancing the red-button panel and Season box...
set "REBALANCEPS=%TEMP%\ks-series-layout-rebalance-1682026.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'REBALANCEPATCH'; $b=':::END '+'REBALANCEPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing layout-rebalance patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing layout-rebalance patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%REBALANCEPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Series layout-rebalance correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%REBALANCEPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%REBALANCEPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Series layout-rebalance correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [8/14] Moving Season 1 above the fold...
set "ABOVEFOLDPS=%TEMP%\ks-series-season-above-fold-1682027.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'ABOVEFOLDPATCH'; $b=':::END '+'ABOVEFOLDPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing above-fold patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing above-fold patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%ABOVEFOLDPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the Season above-fold correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%ABOVEFOLDPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%ABOVEFOLDPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The Season above-fold correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [9/14] Installing the compact episode-card grid...
set "GRIDPS=%TEMP%\ks-series-compact-episodes-1682028.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; function B([string]$n){$a=':::BEGIN '+$n;$b=':::END '+$n;$s=$raw.IndexOf($a);if($s -lt 0){throw 'Missing '+$a};$s+=$a.Length;$e=$raw.IndexOf($b,$s);if($e -lt 0){throw 'Missing '+$b};$x=$raw.Substring($s,$e-$s)-replace '\s','';[Convert]::FromBase64String($x)}; [IO.File]::WriteAllBytes('%GRIDPS%',(B 'GRIDPATCH')); [IO.File]::WriteAllBytes('%WORK%\app\src\main\res\layout\row_episode_modern.xml',(B 'COMPACTEPISODEROW'))"
if errorlevel 1 (
    echo ERROR: Could not extract the compact episode-grid files.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%GRIDPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%GRIDPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The compact episode-grid correction could not be applied safely.
    pause
    exit /b %RC%
)
echo [10/14] Locking the landscape poster inside its details pane...
set "POSTERLOCKPS=%TEMP%\ks-series-landscape-poster-lock-1682029.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$raw=Get-Content -LiteralPath '%~f0' -Raw; $a=':::BEGIN '+'POSTERLOCKPATCH'; $b=':::END '+'POSTERLOCKPATCH'; $s=$raw.IndexOf($a); if($s -lt 0){throw 'Missing poster-lock patch'}; $s+=$a.Length; $e=$raw.IndexOf($b,$s); if($e -lt 0){throw 'Missing poster-lock patch end'}; $x=$raw.Substring($s,$e-$s)-replace '\s',''; [IO.File]::WriteAllBytes('%POSTERLOCKPS%',[Convert]::FromBase64String($x))"
if errorlevel 1 (
    echo ERROR: Could not extract the landscape poster-lock correction.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%POSTERLOCKPS%" -ProjectRoot "%WORK%"
set "RC=%ERRORLEVEL%"
del /q "%POSTERLOCKPS%" >nul 2>&1
if not "%RC%"=="0" (
    echo ERROR: The landscape poster-lock correction could not be applied safely.
    pause
    exit /b %RC%
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$p='%WORK%\app\build.gradle.kts'; $c=[IO.File]::ReadAllText($p); if(-not $c.Contains('versionCode = 1682021')){throw 'Expected 1682021 version code was not found'}; $c=$c.Replace('versionCode = 1682021','versionCode = 1682029').Replace('1.6.8-series-complete','1.6.8-series-landscape-poster-lock'); [IO.File]::WriteAllText($p,$c,[Text.UTF8Encoding]::new($false))"
if errorlevel 1 (
    echo ERROR: Could not set the new 1682029 application version.
    pause
    exit /b 1
)

echo [11/14] Verifying the protected landscape layout...
findstr /c:"epgChannelId" "%WORK%\app\src\main\java\com\kristalstreams\player\Models.kt" >nul
if errorlevel 1 (
    echo ERROR: Channel EPG ID verification failed.
    pause
    exit /b 1
)
findstr /c:"fun xmlTvGuide(" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: XMLTV parser verification failed.
    pause
    exit /b 1
)
findstr /c:"TimeZone.getDefault()" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: Device time-zone verification failed.
    pause
    exit /b 1
)
findstr /c:"XtreamClient.xmlTvGuide(" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Guide XMLTV wiring verification failed.
    pause
    exit /b 1
)
findstr /c:"XtreamClient.guideEpg(" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Stable per-channel fallback verification failed.
    pause
    exit /b 1
)
findstr /c:"NO GUIDE DATA" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Visible program-label verification failed.
    pause
    exit /b 1
)
findstr /c:"textAlignment = View.TEXT_ALIGNMENT_CENTER" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Centered half-hour label verification failed.
    pause
    exit /b 1
)
findstr /c:"textAlignment = View.TEXT_ALIGNMENT_VIEW_START" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Left-aligned long-card verification failed.
    pause
    exit /b 1
)
findstr /c:"Complete fixed-grid EPG renderer" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Fixed-grid renderer verification failed.
    pause
    exit /b 1
)
findstr /c:"fun programForSlot" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: One-program-per-cell verification failed.
    pause
    exit /b 1
)
findstr /c:"fun sameProgramme" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Duration-card merging verification failed.
    pause
    exit /b 1
)
findstr /c:"val compactCard = span <= 6" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Compact half-hour card verification failed.
    pause
    exit /b 1
)
findstr /c:"TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Automatic title sizing verification failed.
    pause
    exit /b 1
)
findstr /c:"maxLines = 6" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Six-line compact title verification failed.
    pause
    exit /b 1
)
findstr /c:"setPadding(2.dp, 1.dp, 2.dp, 1.dp)" "%WORK%\app\src\main\java\com\kristalstreams\player\EpgGuideAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Compact title padding verification failed.
    pause
    exit /b 1
)
findstr /c:"fun selectFirstCurrentProgram()" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Automatic current-program selection verification failed.
    pause
    exit /b 1
)
findstr /c:"fun refreshSelectedProgram()" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Live detail refresh verification failed.
    pause
    exit /b 1
)
findstr /c:"WATCH LIVE" "%WORK%\app\src\main\java\com\kristalstreams\player\GuideActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Program action verification failed.
    pause
    exit /b 1
)
findstr /c:"class UiContrastProvider" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Live TV logo controller verification failed.
    pause
    exit /b 1
)
findstr /c:"styleChannelLogo" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Light channel-logo background verification failed.
    pause
    exit /b 1
)
findstr /c:"makeHeaderArtworkTransparent" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Transparent navigation artwork verification failed.
    pause
    exit /b 1
)
findstr /c:"fun isDashboardScreen(" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Dashboard banner targeting verification failed.
    pause
    exit /b 1
)
findstr /c:"clearTopLeftContainers" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Header container transparency verification failed.
    pause
    exit /b 1
)
findstr /c:"fun clearViewBackground(" "%WORK%\app\src\main\java\com\kristalstreams\player\UiContrastProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Header background and tint clearing verification failed.
    pause
    exit /b 1
)
findstr /c:"UiContrastProvider" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: Live TV logo manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"class PlaybackImmersiveProvider" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Immersive playback controller verification failed.
    pause
    exit /b 1
)
findstr /c:"WindowInsets.Type.systemBars()" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Android system-bar hiding verification failed.
    pause
    exit /b 1
)
findstr /c:"WindowCompat.setDecorFitsSystemWindows(window, false)" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Edge-to-edge video verification failed.
    pause
    exit /b 1
)
findstr /c:"AspectRatioFrameLayout.RESIZE_MODE_FILL" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Stretch-to-fill video verification failed.
    pause
    exit /b 1
)
findstr /c:"fun removeChannelBanner(" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Player channel-banner removal verification failed.
    pause
    exit /b 1
)
findstr /c:"player.volume = 1f" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Player audio restoration verification failed.
    pause
    exit /b 1
)
findstr /c:"fun selectSupportedAudioTrack(" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Supported audio-track fallback verification failed.
    pause
    exit /b 1
)
findstr /c:"setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, false)" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Audio-track enablement verification failed.
    pause
    exit /b 1
)
findstr /c:"org.jellyfin.media3:media3-ffmpeg-decoder:1.5.0+1" "%WORK%\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: Software audio-decoder dependency verification failed.
    pause
    exit /b 1
)
findstr /c:"EXTENSION_RENDERER_MODE_PREFER" "%WORK%\app\src\main\java\com\kristalstreams\player\PlayerActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Software audio renderer activation verification failed.
    pause
    exit /b 1
)
findstr /c:"OnBackPressedCallback" "%WORK%\app\src\main\java\com\kristalstreams\player\PlaybackImmersiveProvider.kt" >nul
if errorlevel 1 (
    echo ERROR: Playback Back handling verification failed.
    pause
    exit /b 1
)
findstr /c:"PlaybackImmersiveProvider" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: Immersive playback manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"MovieDetailsActivity::class.java" "%WORK%\app\src\main\java\com\kristalstreams\player\LibraryActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Movie catalog details routing verification failed.
    pause
    exit /b 1
)
findstr /c:"fun movieDetails(" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: Provider movie-information verification failed.
    pause
    exit /b 1
)
findstr /c:"class MovieDetailsActivity" "%WORK%\app\src\main\java\com\kristalstreams\player\MovieDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Movie Details activity verification failed.
    pause
    exit /b 1
)
findstr /c:"PLAY MOVIE" "%WORK%\app\src\main\res\layout\activity_movie_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Portrait Movie Details layout verification failed.
    pause
    exit /b 1
)
findstr /c:"PLAY MOVIE" "%WORK%\app\src\main\res\layout-land\activity_movie_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Landscape Movie Details layout verification failed.
    pause
    exit /b 1
)
findstr /c:"MovieDetailsActivity" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: Movie Details manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"fun applyCurrentView()" "%WORK%\app\src\main\java\com\kristalstreams\player\LibraryActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Movie search and sorting verification failed.
    pause
    exit /b 1
)
findstr /c:"class MovieWatchlistActivity" "%WORK%\app\src\main\java\com\kristalstreams\player\MovieWatchlistActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: My List activity verification failed.
    pause
    exit /b 1
)
findstr /c:"MovieWatchlistActivity" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: My List manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"fun find(context: Context" "%WORK%\app\src\main\java\com\kristalstreams\player\ContinueWatching.kt" >nul
if errorlevel 1 (
    echo ERROR: Resume lookup verification failed.
    pause
    exit /b 1
)
findstr /c:"movieResumePanel" "%WORK%\app\src\main\res\layout\activity_movie_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Movie Resume controls verification failed.
    pause
    exit /b 1
)
findstr /c:"movieRelatedRow" "%WORK%\app\src\main\res\layout-land\activity_movie_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Related Movies verification failed.
    pause
    exit /b 1
)
findstr /c:"trailerUrl" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: Movie trailer verification failed.
    pause
    exit /b 1
)
findstr /c:"librarySearch" "%WORK%\app\src\main\res\layout\activity_library.xml" >nul
if errorlevel 1 (
    echo ERROR: Portrait Movies tools verification failed.
    pause
    exit /b 1
)
findstr /c:"libraryWatchlist" "%WORK%\app\src\main\res\layout-land\activity_library.xml" >nul
if errorlevel 1 (
    echo ERROR: Landscape Movies tools verification failed.
    pause
    exit /b 1
)
findstr /c:"TrackSelectionOverride" "%WORK%\app\src\main\java\com\kristalstreams\player\PlayerActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Player track-selection verification failed.
    pause
    exit /b 1
)
findstr /c:"ControllerVisibilityListener" "%WORK%\app\src\main\java\com\kristalstreams\player\PlayerActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Player control visibility verification failed.
    pause
    exit /b 1
)
findstr /c:"audioTrackButton" "%WORK%\app\src\main\res\layout\activity_player.xml" >nul
if errorlevel 1 (
    echo ERROR: Audio and subtitle button verification failed.
    pause
    exit /b 1
)
findstr /c:"fun seriesContent(" "%WORK%\app\src\main\java\com\kristalstreams\player\XtreamClient.kt" >nul
if errorlevel 1 (
    echo ERROR: Complete Series provider-data verification failed.
    pause
    exit /b 1
)
findstr /c:"class SeriesDetailsActivity" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Series Details activity verification failed.
    pause
    exit /b 1
)
findstr /c:"renderSeasons" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Season selector verification failed.
    pause
    exit /b 1
)
findstr /c:"Resume from" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Episode Resume verification failed.
    pause
    exit /b 1
)
findstr /c:"R.id.seriesNext" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Next Episode verification failed.
    pause
    exit /b 1
)
findstr /c:"class SeriesWatchlistActivity" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesWatchlistActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: My Series activity verification failed.
    pause
    exit /b 1
)
findstr /c:"SeriesWatchlistActivity" "%WORK%\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
    echo ERROR: My Series manifest registration failed.
    pause
    exit /b 1
)
findstr /c:"SeriesHistory" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Remembered Series position verification failed.
    pause
    exit /b 1
)
findstr /c:"episodeDescription" "%WORK%\app\src\main\res\layout\row_episode_modern.xml" >nul
if errorlevel 1 (
    echo ERROR: Rich episode-card verification failed.
    pause
    exit /b 1
)
findstr /c:"seriesSeasonBar" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Portrait Series layout verification failed.
    pause
    exit /b 1
)
findstr /c:"seriesRelatedRow" "%WORK%\app\src\main\res\layout-land\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Landscape related-Series verification failed.
    pause
    exit /b 1
)
findstr /c:"Search series" "%WORK%\app\src\main\java\com\kristalstreams\player\LibraryActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Series search verification failed.
    pause
    exit /b 1
)
findstr /c:"versionCode = 1682029" "%WORK%\app\build.gradle.kts" >nul
if errorlevel 1 (
    echo ERROR: New 1682029 application version verification failed.
    pause
    exit /b 1
)
findstr /c:"android:layout_height=\"110dp\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Rebalanced Continue panel verification failed.
    pause
    exit /b 1
)
findstr /c:"android:layout_height=\"166dp\"" "%WORK%\app\src\main\res\layout\row_episode_modern.xml" >nul
if errorlevel 1 (
    echo ERROR: Compact episode-card height verification failed.
    pause
    exit /b 1
)
findstr /c:"gravity = android.view.Gravity.CENTER" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Centered season-text verification failed.
    pause
    exit /b 1
)

findstr /c:"setAutoSizeTextTypeUniformWithConfiguration(holder.title" "%WORK%\app\src\main\java\com\kristalstreams\player\EpisodeListAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Episode-title automatic fitting verification failed.
    pause
    exit /b 1
)
findstr /c:"setAutoSizeTextTypeUniformWithConfiguration(button" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Continue and Next automatic fitting verification failed.
    pause
    exit /b 1
)
findstr /c:"android:layout_height=\"66dp\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Rebalanced Continue and Next row verification failed.
    pause
    exit /b 1
)
findstr /c:"android:paddingBottom=\"12dp\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Red-button bottom-clearance verification failed.
    pause
    exit /b 1
)
findstr /c:"android:layout_height=\"56dp\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Restored Season-box verification failed.
    pause
    exit /b 1
)
findstr /c:"LinearLayout.LayoutParams(140.dp, 46.dp).apply" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Restored Season-button verification failed.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$files=@('%WORK%\app\src\main\res\layout\activity_series_details.xml','%WORK%\app\src\main\res\layout-land\activity_series_details.xml'); foreach($p in $files){$x=[IO.File]::ReadAllText($p); if($x.IndexOf('seriesSeasonBar') -gt $x.IndexOf('seriesContinuePanel')){throw 'Season selector is still below the Continue panel in '+$p}}"
if errorlevel 1 (
    echo ERROR: Season 1 above-fold ordering verification failed.
    pause
    exit /b 1
)
findstr /c:"android:numColumns=\"2\"" "%WORK%\app\src\main\res\layout\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Portrait two-column episode-grid verification failed.
    pause
    exit /b 1
)
findstr /c:"android:numColumns=\"3\"" "%WORK%\app\src\main\res\layout-land\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Landscape three-column episode-grid verification failed.
    pause
    exit /b 1
)
findstr /c:"private lateinit var list: GridView" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Episode GridView controller verification failed.
    pause
    exit /b 1
)
findstr /c:"configureMediaGrid(list)" "%WORK%\app\src\main\java\com\kristalstreams\player\SeriesDetailsActivity.kt" >nul
if errorlevel 1 (
    echo ERROR: Episode grid navigation verification failed.
    pause
    exit /b 1
)
findstr /c:"fun configureMediaGrid" "%WORK%\app\src\main\java\com\kristalstreams\player\ListNavigation.kt" >nul
if errorlevel 1 (
    echo ERROR: Grid navigation helper verification failed.
    pause
    exit /b 1
)
findstr /c:"holder.title, 10, 13" "%WORK%\app\src\main\java\com\kristalstreams\player\EpisodeListAdapter.kt" >nul
if errorlevel 1 (
    echo ERROR: Compact episode-title sizing verification failed.
    pause
    exit /b 1
)
findstr /c:"android:layout_width=\"280dp\"" "%WORK%\app\src\main\res\layout-land\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Bounded landscape details-pane verification failed.
    pause
    exit /b 1
)
findstr /c:"android:maxWidth=\"180dp\"" "%WORK%\app\src\main\res\layout-land\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Bounded landscape poster verification failed.
    pause
    exit /b 1
)
findstr /c:"android:elevation=\"2dp\"" "%WORK%\app\src\main\res\layout-land\activity_series_details.xml" >nul
if errorlevel 1 (
    echo ERROR: Protected episode-pane layering verification failed.
    pause
    exit /b 1
)

echo [12/14] Preparing Windows Android build tools...
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_SDK%\platforms" (
    echo ERROR: Android SDK not found:
    echo   %ANDROID_SDK%
    pause
    exit /b 1
)
set "SDK_FORWARD=%ANDROID_SDK:\=/%"
> "%WORK%\local.properties" echo sdk.dir=%SDK_FORWARD%

set "JAVA_HOME="
if exist "%JAVASAVE%" (
    set /p JAVA_HOME=<"%JAVASAVE%"
    if exist "!JAVA_HOME!\bin\java.exe" goto JAVA_READY
    set "JAVA_HOME="
)
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
    goto JAVA_READY
)
if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
    goto JAVA_READY
)
for /d %%D in ("%ProgramFiles%\Android\Android Studio*") do (
    if not defined JAVA_HOME if exist "%%~fD\jbr\bin\java.exe" set "JAVA_HOME=%%~fD\jbr"
)
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto JAVA_READY

echo ERROR: Java could not be found automatically.
pause
exit /b 1

:JAVA_READY
> "%JAVASAVE%" echo %JAVA_HOME%
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo [13/14] Building corrected Series APK...
echo Gradle progress will appear below.
echo.

cd /d "%WORK%"
set "BUILDPS=%TEMP%\ks_series_complete_1682021_gradle_build.ps1"
> "%BUILDPS%" echo $ErrorActionPreference = 'Continue'
>>"%BUILDPS%" echo ^& '.\gradlew.bat' clean assembleDebug --rerun-tasks --console=plain --stacktrace 2^>^&1 ^| Tee-Object -FilePath '%LOG%'
>>"%BUILDPS%" echo $rc = $LASTEXITCODE
>>"%BUILDPS%" echo if ($null -eq $rc) { $rc = 1 }
>>"%BUILDPS%" echo exit $rc

powershell -NoProfile -ExecutionPolicy Bypass -File "%BUILDPS%"
set "RC=%ERRORLEVEL%"
del /q "%BUILDPS%" >nul 2>&1

if not "%RC%"=="0" (
    color 4F
    echo.
    echo ==========================================================
    echo   BUILD FAILED
    echo ==========================================================
    echo.
    echo Original R2 is untouched.
    echo Build log:
    echo   %LOG%
    echo.
    start "" notepad "%LOG%"
    pause
    exit /b %RC%
)

set "BUILT=%WORK%\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%BUILT%" (
    echo ERROR: Gradle finished but APK was not found.
    start "" notepad "%LOG%"
    pause
    exit /b 1
)

echo.
echo [14/14] Copying finished APK...
copy /Y "%BUILT%" "%FINAL%" >nul
if errorlevel 1 (
    echo ERROR: Could not copy APK to Downloads.
    pause
    exit /b 1
)

set "USBCOPY="
set "USBDRIVE="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "$d=Get-CimInstance Win32_LogicalDisk ^| Where-Object {$_.DriveType -eq 2 } ^| Select-Object -First 1 -ExpandProperty DeviceID; if($d){$d}"`) do set "USBDRIVE=%%D"

if defined USBDRIVE (
    set "USBCOPY=!USBDRIVE!\KS-SERIES-LANDSCAPE-POSTER-LOCK-1682029.apk"
    copy /Y "%BUILT%" "!USBCOPY!" >nul
)

color 2F
cls
echo.
echo ==========================================================
echo.
echo       KS SERIES LANDSCAPE POSTER-LOCK BUILD SUCCESSFUL
echo.
echo ==========================================================
echo.
echo APK:
echo   %FINAL%
echo.
if defined USBCOPY (
    echo USB APK:
    echo   !USBCOPY!
    echo.
)
echo Original known-good R2: UNTOUCHED
echo.
echo Install only KS-SERIES-LANDSCAPE-POSTER-LOCK-1682029.apk shown above.
echo All regular Live TV channel logos now use a light background.
echo All neutral black inside and behind the dashboard KS banner is transparent.
echo The approved TV Guide grid, timing, and details remain unchanged.
echo Movies include Search, Sort, My List, Resume, trailers, and related titles.
echo Movie Details remains the safe step before playback.
echo Audio and subtitle choices appear with the playback controls when tracks are available.
echo Series now includes Search, Sort, My Series, full details, season tabs, richer episode cards, Resume, and Next Episode.
echo Long titles and descriptions stay inside their cards and shrink only when needed.
echo Continue, Next, Season, Trailer, and My Series buttons have full vertical clearance.
echo The red episode button now has a dedicated 17dp bottom inset.
echo The last selected season and episode are remembered, and related shows are displayed when supplied.
echo PLAY MOVIE starts the verified fullscreen player with the same audio and Back behavior.
echo Live TV, Movies, and Series playback now hide both Android system bars.
echo Video fills the display without side bars or zoom-cropping.
echo Player audio is unmuted and hardware volume controls adjust media volume.
echo A supported alternate audio track is selected automatically when available.
echo AC3, EAC3, DTS, and TrueHD audio use the bundled software decoder when needed.
echo Phone gestures, Android Back, and TV remote Back exit playback.
echo The persistent channel name and NOW/NEXT banner is removed during playback.
echo.
explorer /select,"%FINAL%"
pause
exit /b 0

:::BEGIN MODELS
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgpkYXRhIGNsYXNzIFh0cmVhbUNyZWRl
bnRpYWxzKHZhbCBzZXJ2ZXI6IFN0cmluZywgdmFsIHVzZXJuYW1lOiBTdHJpbmcsIHZhbCBwYXNz
d29yZDogU3RyaW5nKQpkYXRhIGNsYXNzIExpdmVDYXRlZ29yeSh2YWwgaWQ6IFN0cmluZywgdmFs
IG5hbWU6IFN0cmluZykKZGF0YSBjbGFzcyBNZWRpYUNhdGVnb3J5KHZhbCBpZDogU3RyaW5nLCB2
YWwgbmFtZTogU3RyaW5nKQpkYXRhIGNsYXNzIExpdmVTdHJlYW0odmFsIGlkOiBJbnQsIHZhbCBu
YW1lOiBTdHJpbmcsIHZhbCBjYXRlZ29yeUlkOiBTdHJpbmcsIHZhbCBpY29uOiBTdHJpbmcsIHZh
bCBleHRlbnNpb246IFN0cmluZywgdmFsIGVwZ0NoYW5uZWxJZDogU3RyaW5nID0gIiIpCmRhdGEg
Y2xhc3MgTGlicmFyeUl0ZW0oCiAgICB2YWwgaWQ6IEludCwKICAgIHZhbCBuYW1lOiBTdHJpbmcs
CiAgICB2YWwga2luZDogU3RyaW5nLAogICAgdmFsIHBsYXlVcmw6IFN0cmluZz8gPSBudWxsLAog
ICAgdmFsIGltYWdlVXJsOiBTdHJpbmcgPSAiIiwKICAgIHZhbCBjYXRlZ29yeUlkOiBTdHJpbmcg
PSAiIiwKICAgIHZhbCB5ZWFyOiBTdHJpbmcgPSAiIiwKICAgIHZhbCByYXRpbmc6IFN0cmluZyA9
ICIiCikKZGF0YSBjbGFzcyBNb3ZpZURldGFpbHMoCiAgICB2YWwgaWQ6IEludCwKICAgIHZhbCBu
YW1lOiBTdHJpbmcsCiAgICB2YWwgcGxheVVybDogU3RyaW5nLAogICAgdmFsIHBvc3RlclVybDog
U3RyaW5nID0gIiIsCiAgICB2YWwgYmFja2Ryb3BVcmw6IFN0cmluZyA9ICIiLAogICAgdmFsIHll
YXI6IFN0cmluZyA9ICIiLAogICAgdmFsIHJhdGluZzogU3RyaW5nID0gIiIsCiAgICB2YWwgZHVy
YXRpb246IFN0cmluZyA9ICIiLAogICAgdmFsIGNlcnRpZmljYXRpb246IFN0cmluZyA9ICIiLAog
ICAgdmFsIGdlbnJlOiBTdHJpbmcgPSAiIiwKICAgIHZhbCBkZXNjcmlwdGlvbjogU3RyaW5nID0g
IiIsCiAgICB2YWwgY2FzdDogU3RyaW5nID0gIiIsCiAgICB2YWwgZGlyZWN0b3I6IFN0cmluZyA9
ICIiLAogICAgdmFsIGNvdW50cnk6IFN0cmluZyA9ICIiLAogICAgdmFsIHJlbGVhc2VEYXRlOiBT
dHJpbmcgPSAiIiwKICAgIHZhbCB0YWdsaW5lOiBTdHJpbmcgPSAiIiwKICAgIHZhbCBjYXRlZ29y
eUlkOiBTdHJpbmcgPSAiIiwKICAgIHZhbCB0cmFpbGVyVXJsOiBTdHJpbmcgPSAiIgopCmRhdGEg
Y2xhc3MgU2VyaWVzRGV0YWlscygKICAgIHZhbCBpZDogSW50LAogICAgdmFsIG5hbWU6IFN0cmlu
ZywKICAgIHZhbCBwb3N0ZXJVcmw6IFN0cmluZyA9ICIiLAogICAgdmFsIGJhY2tkcm9wVXJsOiBT
dHJpbmcgPSAiIiwKICAgIHZhbCB5ZWFyOiBTdHJpbmcgPSAiIiwKICAgIHZhbCByYXRpbmc6IFN0
cmluZyA9ICIiLAogICAgdmFsIGdlbnJlOiBTdHJpbmcgPSAiIiwKICAgIHZhbCBkZXNjcmlwdGlv
bjogU3RyaW5nID0gIiIsCiAgICB2YWwgY2FzdDogU3RyaW5nID0gIiIsCiAgICB2YWwgZGlyZWN0
b3I6IFN0cmluZyA9ICIiLAogICAgdmFsIHJlbGVhc2VEYXRlOiBTdHJpbmcgPSAiIiwKICAgIHZh
bCBsYXN0QWlyRGF0ZTogU3RyaW5nID0gIiIsCiAgICB2YWwgc3RhdHVzOiBTdHJpbmcgPSAiIiwK
ICAgIHZhbCBjYXRlZ29yeUlkOiBTdHJpbmcgPSAiIiwKICAgIHZhbCB0cmFpbGVyVXJsOiBTdHJp
bmcgPSAiIgopCmRhdGEgY2xhc3MgRXBpc29kZUl0ZW0oCiAgICB2YWwgaWQ6IEludCwKICAgIHZh
bCB0aXRsZTogU3RyaW5nLAogICAgdmFsIHNlYXNvbjogSW50LAogICAgdmFsIGVwaXNvZGU6IElu
dCwKICAgIHZhbCBleHRlbnNpb246IFN0cmluZywKICAgIHZhbCBwbGF5VXJsOiBTdHJpbmcsCiAg
ICB2YWwgaW1hZ2VVcmw6IFN0cmluZyA9ICIiLAogICAgdmFsIGRlc2NyaXB0aW9uOiBTdHJpbmcg
PSAiIiwKICAgIHZhbCBkdXJhdGlvbjogU3RyaW5nID0gIiIsCiAgICB2YWwgYWlyRGF0ZTogU3Ry
aW5nID0gIiIsCiAgICB2YWwgcmF0aW5nOiBTdHJpbmcgPSAiIgopCmRhdGEgY2xhc3MgU2VyaWVz
Q29udGVudCh2YWwgZGV0YWlsczogU2VyaWVzRGV0YWlscywgdmFsIGVwaXNvZGVzOiBMaXN0PEVw
aXNvZGVJdGVtPikKZGF0YSBjbGFzcyBFcGdJdGVtKAogICAgdmFsIHRpdGxlOiBTdHJpbmcsCiAg
ICB2YWwgZGVzY3JpcHRpb246IFN0cmluZywKICAgIHZhbCBzdGFydDogU3RyaW5nLAogICAgdmFs
IGVuZDogU3RyaW5nLAogICAgdmFsIHN0YXJ0VGltZXN0YW1wOiBMb25nPyA9IG51bGwsCiAgICB2
YWwgZW5kVGltZXN0YW1wOiBMb25nPyA9IG51bGwKKQpkYXRhIGNsYXNzIENvbnRpbnVlSXRlbSh2
YWwgbmFtZTogU3RyaW5nLCB2YWwgdXJsOiBTdHJpbmcsIHZhbCBwb3NpdGlvbk1zOiBMb25nLCB2
YWwgZHVyYXRpb25NczogTG9uZywgdmFsIGtpbmQ6IFN0cmluZywgdmFsIHVwZGF0ZWRBdDogTG9u
ZykK
:::END MODELS
:::BEGIN XTREAM
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC51dGlsLkJh
c2U2NAppbXBvcnQgYW5kcm9pZC51dGlsLlhtbAoKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQpp
bXBvcnQgb3JnLmpzb24uSlNPTk9iamVjdAppbXBvcnQgb3JnLnhtbHB1bGwudjEuWG1sUHVsbFBh
cnNlcgppbXBvcnQgamF2YS5pby5CdWZmZXJlZFJlYWRlcgppbXBvcnQgamF2YS5pby5JbnB1dFN0
cmVhbQppbXBvcnQgamF2YS5pby5JbnB1dFN0cmVhbVJlYWRlcgppbXBvcnQgamF2YS5uZXQuSHR0
cFVSTENvbm5lY3Rpb24KaW1wb3J0IGphdmEubmV0LlVSTAppbXBvcnQgamF2YS5uZXQuVVJMRW5j
b2RlcgppbXBvcnQgamF2YS50ZXh0LlNpbXBsZURhdGVGb3JtYXQKaW1wb3J0IGphdmEudXRpbC5M
b2NhbGUKaW1wb3J0IGphdmEudXRpbC5UaW1lWm9uZQoKb2JqZWN0IFh0cmVhbUNsaWVudCB7CiAg
ICBwcml2YXRlIGZ1biBiYXNlKHNlcnZlcjogU3RyaW5nKSA9IHNlcnZlci50cmltKCkudHJpbUVu
ZCgnLycpCiAgICBwcml2YXRlIGZ1biBlbmModjogU3RyaW5nKSA9IFVSTEVuY29kZXIuZW5jb2Rl
KHYsICJVVEYtOCIpCgogICAgcHJpdmF0ZSBmdW4gbWVkaWFVcmwoc2VydmVyOiBTdHJpbmcsIHJh
dzogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAg
ICAgaWYgKHZhbHVlLmlzQmxhbmsoKSkgcmV0dXJuICIiCiAgICAgICAgaWYgKHZhbHVlLnN0YXJ0
c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8fCB2YWx1ZS5zdGFydHNXaXRoKCJodHRwczovLyIsIHRy
dWUpKSByZXR1cm4gdmFsdWUKICAgICAgICB2YWwgc2NoZW1lID0gaWYgKGJhc2Uoc2VydmVyKS5z
dGFydHNXaXRoKCJodHRwczovLyIsIHRydWUpKSAiaHR0cHM6IiBlbHNlICJodHRwOiIKICAgICAg
ICBpZiAodmFsdWUuc3RhcnRzV2l0aCgiLy8iKSkgcmV0dXJuICIkc2NoZW1lJHZhbHVlIgogICAg
ICAgIHJldHVybiBpZiAodmFsdWUuc3RhcnRzV2l0aCgiLyIpKSAiJHtiYXNlKHNlcnZlcil9JHZh
bHVlIiBlbHNlICIke2Jhc2Uoc2VydmVyKX0vJHZhbHVlIgogICAgfQoKICAgIHByaXZhdGUgZnVu
IGdldCh1cmw6IFN0cmluZyk6IFN0cmluZyB7CiAgICAgICAgdmFsIGNvbm5lY3Rpb24gPSBVUkwo
dXJsKS5vcGVuQ29ubmVjdGlvbigpIGFzIEh0dHBVUkxDb25uZWN0aW9uCiAgICAgICAgY29ubmVj
dGlvbi5jb25uZWN0VGltZW91dCA9IDEyXzAwMAogICAgICAgIGNvbm5lY3Rpb24ucmVhZFRpbWVv
dXQgPSAyMF8wMDAKICAgICAgICBjb25uZWN0aW9uLnJlcXVlc3RNZXRob2QgPSAiR0VUIgogICAg
ICAgIGNvbm5lY3Rpb24uc2V0UmVxdWVzdFByb3BlcnR5KCJVc2VyLUFnZW50IiwgIktyaXN0YWxT
dHJlYW1zLzEuNi44IEFuZHJvaWQiKQogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAgICB2
YWwgY29kZSA9IGNvbm5lY3Rpb24ucmVzcG9uc2VDb2RlCiAgICAgICAgICAgIHZhbCBzdHJlYW0g
PSBpZiAoY29kZSBpbiAyMDAuLjI5OSkgY29ubmVjdGlvbi5pbnB1dFN0cmVhbSBlbHNlIGNvbm5l
Y3Rpb24uZXJyb3JTdHJlYW0KICAgICAgICAgICAgdmFsIGJvZHkgPSBzdHJlYW0/LmxldCB7IEJ1
ZmZlcmVkUmVhZGVyKElucHV0U3RyZWFtUmVhZGVyKGl0KSkudXNlIHsgcmVhZGVyIC0+IHJlYWRl
ci5yZWFkVGV4dCgpIH0gfS5vckVtcHR5KCkKICAgICAgICAgICAgaWYgKGNvZGUgIWluIDIwMC4u
Mjk5KSB7CiAgICAgICAgICAgICAgICB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oIlNlcnZl
ciByZXR1cm5lZCBIVFRQICRjb2RlIikKICAgICAgICAgICAgfQogICAgICAgICAgICBib2R5CiAg
ICAgICAgfSBmaW5hbGx5IHsKICAgICAgICAgICAgY29ubmVjdGlvbi5kaXNjb25uZWN0KCkKICAg
ICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gPFQ+IHdpdGhJbnB1dFN0cmVhbSh1cmw6IFN0
cmluZywgYmxvY2s6IChJbnB1dFN0cmVhbSkgLT4gVCk6IFQgewogICAgICAgIHZhbCBjb25uZWN0
aW9uID0gVVJMKHVybCkub3BlbkNvbm5lY3Rpb24oKSBhcyBIdHRwVVJMQ29ubmVjdGlvbgogICAg
ICAgIGNvbm5lY3Rpb24uY29ubmVjdFRpbWVvdXQgPSAxMl8wMDAKICAgICAgICBjb25uZWN0aW9u
LnJlYWRUaW1lb3V0ID0gMjVfMDAwCiAgICAgICAgY29ubmVjdGlvbi5yZXF1ZXN0TWV0aG9kID0g
IkdFVCIKICAgICAgICBjb25uZWN0aW9uLnNldFJlcXVlc3RQcm9wZXJ0eSgiVXNlci1BZ2VudCIs
ICJLcmlzdGFsU3RyZWFtcy8xLjYuOCBBbmRyb2lkIikKICAgICAgICByZXR1cm4gdHJ5IHsKICAg
ICAgICAgICAgdmFsIGNvZGUgPSBjb25uZWN0aW9uLnJlc3BvbnNlQ29kZQogICAgICAgICAgICBp
ZiAoY29kZSAhaW4gMjAwLi4yOTkpIHRocm93IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiU2VydmVy
IHJldHVybmVkIEhUVFAgJGNvZGUiKQogICAgICAgICAgICBjb25uZWN0aW9uLmlucHV0U3RyZWFt
LnVzZShibG9jaykKICAgICAgICB9IGZpbmFsbHkgewogICAgICAgICAgICBjb25uZWN0aW9uLmRp
c2Nvbm5lY3QoKQogICAgICAgIH0KICAgIH0KCiAgICBmdW4gYXV0aGVudGljYXRlKGM6IFh0cmVh
bUNyZWRlbnRpYWxzKTogU3RyaW5nIHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1vKGMp
KSByZXR1cm4gIkRFTU8iCiAgICAgICAgdmFsIGpzb24gPSBKU09OT2JqZWN0KGdldCgiJHtiYXNl
KGMuc2VydmVyKX0vcGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBh
c3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSIpKQogICAgICAgIHZhbCB1c2VyID0ganNvbi5vcHRK
U09OT2JqZWN0KCJ1c2VyX2luZm8iKSA/OiB0aHJvdyBJbGxlZ2FsU3RhdGVFeGNlcHRpb24oIk5v
IHVzZXJfaW5mbyByZXR1cm5lZCBieSBzZXJ2ZXIiKQogICAgICAgIHZhbCBhdXRoID0gdXNlci5v
cHRJbnQoImF1dGgiLCAwKQogICAgICAgIGlmIChhdXRoICE9IDEpIHRocm93IElsbGVnYWxTdGF0
ZUV4Y2VwdGlvbih1c2VyLm9wdFN0cmluZygibWVzc2FnZSIsICJMb2dpbiB3YXMgbm90IGF1dGhv
cml6ZWQiKSkKICAgICAgICB2YWwgc3RhdHVzID0gdXNlci5vcHRTdHJpbmcoInN0YXR1cyIsICJB
Y3RpdmUiKQogICAgICAgIGlmICghc3RhdHVzLmVxdWFscygiQWN0aXZlIiwgdHJ1ZSkpIHRocm93
IElsbGVnYWxTdGF0ZUV4Y2VwdGlvbigiQWNjb3VudCBzdGF0dXM6ICRzdGF0dXMiKQogICAgICAg
IHJldHVybiB1c2VyLm9wdFN0cmluZygiZXhwX2RhdGUiLCAiIikKICAgIH0KCiAgICBmdW4gbGl2
ZUNhdGVnb3JpZXMoYzogWHRyZWFtQ3JlZGVudGlhbHMpOiBMaXN0PExpdmVDYXRlZ29yeT4gewog
ICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHJldHVybiBEZW1vQ2F0YWxvZy5jYXRl
Z29yaWVzCiAgICAgICAgdmFsIGFyciA9IEpTT05BcnJheShnZXQoIiR7YmFzZShjLnNlcnZlcil9
L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2Vu
YyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdldF9saXZlX2NhdGVnb3JpZXMiKSkKICAgICAgICByZXR1
cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgYWRkKExpdmVDYXRlZ29yeSgiIiwgIkFsbCBDaGFu
bmVscyIpKQogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAg
ICAgICAgICAgICAgIHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAg
IGFkZChMaXZlQ2F0ZWdvcnkoby5vcHRTdHJpbmcoImNhdGVnb3J5X2lkIiksIG8ub3B0U3RyaW5n
KCJjYXRlZ29yeV9uYW1lIiwgIkNhdGVnb3J5IikpKQogICAgICAgICAgICB9CiAgICAgICAgfQog
ICAgfQoKICAgIGZ1biBsaXZlU3RyZWFtcyhjOiBYdHJlYW1DcmVkZW50aWFscywgY2F0ZWdvcnlJ
ZDogU3RyaW5nPyA9IG51bGwpOiBMaXN0PExpdmVTdHJlYW0+IHsKICAgICAgICBpZiAoRGVtb0Nh
dGFsb2cuaXNEZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cubGl2ZVN0cmVhbXMoY2F0ZWdvcnlJ
ZCkKICAgICAgICB2YWwgc3VmZml4ID0gaWYgKGNhdGVnb3J5SWQuaXNOdWxsT3JCbGFuaygpKSAi
IiBlbHNlICImY2F0ZWdvcnlfaWQ9JHtlbmMoY2F0ZWdvcnlJZCl9IgogICAgICAgIHZhbCBhcnIg
PSBKU09OQXJyYXkoZ2V0KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFt
ZT0ke2VuYyhjLnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1n
ZXRfbGl2ZV9zdHJlYW1zJHN1ZmZpeCIpKQogICAgICAgIHJldHVybiBidWlsZExpc3QgewogICAg
ICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAg
IHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIGFkZChMaXZlU3Ry
ZWFtKAogICAgICAgICAgICAgICAgICAgIG8ub3B0SW50KCJzdHJlYW1faWQiKSwKICAgICAgICAg
ICAgICAgICAgICBvLm9wdFN0cmluZygibmFtZSIsICJDaGFubmVsIiksCiAgICAgICAgICAgICAg
ICAgICAgby5vcHRTdHJpbmcoImNhdGVnb3J5X2lkIiksCiAgICAgICAgICAgICAgICAgICAgbWVk
aWFVcmwoYy5zZXJ2ZXIsIG8ub3B0U3RyaW5nKCJzdHJlYW1faWNvbiIpKSwKICAgICAgICAgICAg
ICAgICAgICBvLm9wdFN0cmluZygiY29udGFpbmVyX2V4dGVuc2lvbiIsICJ0cyIpLmlmQmxhbmsg
eyAidHMiIH0sCiAgICAgICAgICAgICAgICAgICAgby5vcHRTdHJpbmcoImVwZ19jaGFubmVsX2lk
IiwgIiIpLnRyaW0oKQogICAgICAgICAgICAgICAgKSkKICAgICAgICAgICAgfQogICAgICAgIH0K
ICAgIH0KCiAgICBmdW4gbW92aWVDYXRlZ29yaWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlz
dDxNZWRpYUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0
dXJuIERlbW9DYXRhbG9nLm1vdmllQ2F0ZWdvcmllcwogICAgICAgIHZhbCBhcnIgPSBKU09OQXJy
YXkoZ2V0KCIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2VuYyhj
LnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9JmFjdGlvbj1nZXRfdm9kX2Nh
dGVnb3JpZXMiKSkKICAgICAgICByZXR1cm4gYnVpbGRMaXN0IHsKICAgICAgICAgICAgYWRkKE1l
ZGlhQ2F0ZWdvcnkoIiIsICJBbGwgTW92aWVzIikpCiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVu
dGlsIGFyci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIuZ2V0SlNPTk9i
amVjdChpKQogICAgICAgICAgICAgICAgYWRkKE1lZGlhQ2F0ZWdvcnkoby5vcHRTdHJpbmcoImNh
dGVnb3J5X2lkIiksIG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9uYW1lIiwgIkNhdGVnb3J5IikpKQog
ICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIGZ1biBzZXJpZXNDYXRlZ29yaWVzKGM6
IFh0cmVhbUNyZWRlbnRpYWxzKTogTGlzdDxNZWRpYUNhdGVnb3J5PiB7CiAgICAgICAgaWYgKERl
bW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9nLnNlcmllc0NhdGVnb3JpZXMK
ICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KGdldCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVy
X2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFz
c3dvcmQpfSZhY3Rpb249Z2V0X3Nlcmllc19jYXRlZ29yaWVzIikpCiAgICAgICAgcmV0dXJuIGJ1
aWxkTGlzdCB7CiAgICAgICAgICAgIGFkZChNZWRpYUNhdGVnb3J5KCIiLCAiQWxsIFNlcmllcyIp
KQogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAg
ICAgICAgIHZhbCBvID0gYXJyLmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIGFkZChN
ZWRpYUNhdGVnb3J5KG8ub3B0U3RyaW5nKCJjYXRlZ29yeV9pZCIpLCBvLm9wdFN0cmluZygiY2F0
ZWdvcnlfbmFtZSIsICJDYXRlZ29yeSIpKSkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0K
CiAgICBmdW4gbW92aWVzKGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBjYXRlZ29yeUlkOiBTdHJpbmc/
ID0gbnVsbCk6IExpc3Q8TGlicmFyeUl0ZW0+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNE
ZW1vKGMpKSByZXR1cm4gRGVtb0NhdGFsb2cubW92aWVzKGNhdGVnb3J5SWQpCiAgICAgICAgdmFs
IHN1ZmZpeCA9IGlmIChjYXRlZ29yeUlkLmlzTnVsbE9yQmxhbmsoKSkgIiIgZWxzZSAiJmNhdGVn
b3J5X2lkPSR7ZW5jKGNhdGVnb3J5SWQpfSIKICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KGdl
dCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVyX2FwaS5waHA/dXNlcm5hbWU9JHtlbmMoYy51c2Vy
bmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSZhY3Rpb249Z2V0X3ZvZF9zdHJlYW1z
JHN1ZmZpeCIpKQogICAgICAgIHJldHVybiBidWlsZExpc3QgewogICAgICAgICAgICBmb3IgKGkg
aW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAgIHZhbCBvID0gYXJyLmdl
dEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgIHZhbCBpZCA9IG8ub3B0SW50KCJzdHJlYW1f
aWQiKQogICAgICAgICAgICAgICAgdmFsIGV4dCA9IG8ub3B0U3RyaW5nKCJjb250YWluZXJfZXh0
ZW5zaW9uIiwgIm1wNCIpLmlmQmxhbmsgeyAibXA0IiB9CiAgICAgICAgICAgICAgICB2YWwgdXJs
ID0gIiR7YmFzZShjLnNlcnZlcil9L21vdmllLyR7ZW5jKGMudXNlcm5hbWUpfS8ke2VuYyhjLnBh
c3N3b3JkKX0vJGlkLiRleHQiCiAgICAgICAgICAgICAgICB2YWwgeWVhciA9IG8ub3B0U3RyaW5n
KCJ5ZWFyIikuaWZCbGFuayB7CiAgICAgICAgICAgICAgICAgICAgby5vcHRTdHJpbmcoInJlbGVh
c2VEYXRlIikudHJpbSgpLnRha2UoNCkudGFrZUlmIHsgdmFsdWUgLT4gdmFsdWUuYWxsIHsgY2gg
LT4gY2guaXNEaWdpdCgpIH0gfSA/OiAiIgogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAg
ICAgdmFsIHJhdGluZyA9IG8ub3B0U3RyaW5nKCJyYXRpbmdfNWJhc2VkIikuaWZCbGFuayB7IG8u
b3B0U3RyaW5nKCJyYXRpbmciKSB9CiAgICAgICAgICAgICAgICBhZGQoTGlicmFyeUl0ZW0oCiAg
ICAgICAgICAgICAgICAgICAgaWQgPSBpZCwKICAgICAgICAgICAgICAgICAgICBuYW1lID0gby5v
cHRTdHJpbmcoIm5hbWUiLCAiTW92aWUiKSwKICAgICAgICAgICAgICAgICAgICBraW5kID0gIm1v
dmllIiwKICAgICAgICAgICAgICAgICAgICBwbGF5VXJsID0gdXJsLAogICAgICAgICAgICAgICAg
ICAgIGltYWdlVXJsID0gbWVkaWFVcmwoYy5zZXJ2ZXIsIG8ub3B0U3RyaW5nKCJzdHJlYW1faWNv
biIpKSwKICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gby5vcHRTdHJpbmcoImNhdGVn
b3J5X2lkIiksCiAgICAgICAgICAgICAgICAgICAgeWVhciA9IHllYXIsCiAgICAgICAgICAgICAg
ICAgICAgcmF0aW5nID0gY2xlYW5SYXRpbmcocmF0aW5nKQogICAgICAgICAgICAgICAgKSkKICAg
ICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICAvKiogTG9hZHMgdGhlIHByb3ZpZGVyJ3Mg
ZnVsbCBWT0QgaW5mb3JtYXRpb24gd2l0aG91dCBkZWxheWluZyB0aGUgbW92aWUgZ3JpZC4gKi8K
ICAgIGZ1biBtb3ZpZURldGFpbHMoYzogWHRyZWFtQ3JlZGVudGlhbHMsIG1vdmllSWQ6IEludCk6
IE1vdmllRGV0YWlscyB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgewogICAg
ICAgICAgICB2YWwgaXRlbSA9IERlbW9DYXRhbG9nLm1vdmllcy5maXJzdE9yTnVsbCB7IGl0Lmlk
ID09IG1vdmllSWQgfQogICAgICAgICAgICAgICAgPzogdGhyb3cgSWxsZWdhbFN0YXRlRXhjZXB0
aW9uKCJNb3ZpZSB3YXMgbm90IGZvdW5kIikKICAgICAgICAgICAgcmV0dXJuIE1vdmllRGV0YWls
cygKICAgICAgICAgICAgICAgIGlkID0gaXRlbS5pZCwKICAgICAgICAgICAgICAgIG5hbWUgPSBp
dGVtLm5hbWUsCiAgICAgICAgICAgICAgICBwbGF5VXJsID0gaXRlbS5wbGF5VXJsLm9yRW1wdHko
KSwKICAgICAgICAgICAgICAgIHBvc3RlclVybCA9IGl0ZW0uaW1hZ2VVcmwsCiAgICAgICAgICAg
ICAgICB5ZWFyID0gaXRlbS55ZWFyLAogICAgICAgICAgICAgICAgcmF0aW5nID0gaXRlbS5yYXRp
bmcsCiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9ICJGZWF0dXJlIHByZXNlbnRhdGlvbiIsCiAg
ICAgICAgICAgICAgICBnZW5yZSA9ICJLcmlzdGFsIFN0cmVhbXMgQ2luZW1hIiwKICAgICAgICAg
ICAgICAgIGRlc2NyaXB0aW9uID0gIkEgZmVhdHVyZWQgbW92aWUgcHJlc2VudGF0aW9uIGF2YWls
YWJsZSBpbiB0aGUgS3Jpc3RhbCBTdHJlYW1zIGRlbW8gY2F0YWxvZy4iLAogICAgICAgICAgICAg
ICAgY291bnRyeSA9ICJVbml0ZWQgU3RhdGVzIiwKICAgICAgICAgICAgICAgIGNhdGVnb3J5SWQg
PSBpdGVtLmNhdGVnb3J5SWQsCiAgICAgICAgICAgICAgICB0cmFpbGVyVXJsID0gImh0dHBzOi8v
d3d3LnlvdXR1YmUuY29tL3Jlc3VsdHM/c2VhcmNoX3F1ZXJ5PSR7ZW5jKGl0ZW0ubmFtZSArICIg
dHJhaWxlciIpfSIgCiAgICAgICAgICAgICkKICAgICAgICB9CgogICAgICAgIHZhbCByb290ID0g
SlNPTk9iamVjdChnZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1l
PSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdl
dF92b2RfaW5mbyZ2b2RfaWQ9JG1vdmllSWQiKSkKICAgICAgICB2YWwgaW5mbyA9IHJvb3Qub3B0
SlNPTk9iamVjdCgiaW5mbyIpID86IEpTT05PYmplY3QoKQogICAgICAgIHZhbCBtb3ZpZSA9IHJv
b3Qub3B0SlNPTk9iamVjdCgibW92aWVfZGF0YSIpID86IEpTT05PYmplY3QoKQoKICAgICAgICBm
dW4gcGljayh2YXJhcmcga2V5czogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICAgICAga2V5cy5m
b3JFYWNoIHsga2V5IC0+CiAgICAgICAgICAgICAgICBsaXN0T2YoaW5mbywgbW92aWUpLmZvckVh
Y2ggeyBzb3VyY2UgLT4KICAgICAgICAgICAgICAgICAgICB2YWwgdmFsdWUgPSBzb3VyY2Uub3B0
U3RyaW5nKGtleSwgIiIpLnRyaW0oKQogICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pc05v
dEJsYW5rKCkgJiYgIXZhbHVlLmVxdWFscygibnVsbCIsIHRydWUpKSByZXR1cm4gdmFsdWUKICAg
ICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgICAgICByZXR1cm4gIiIKICAgICAg
ICB9CgogICAgICAgIGZ1biBmaXJzdEJhY2tkcm9wKCk6IFN0cmluZyB7CiAgICAgICAgICAgIHZh
bCByYXcgPSBpbmZvLm9wdCgiYmFja2Ryb3BfcGF0aCIpCiAgICAgICAgICAgIHZhbCBjYW5kaWRh
dGUgPSB3aGVuIChyYXcpIHsKICAgICAgICAgICAgICAgIGlzIEpTT05BcnJheSAtPiByYXcub3B0
U3RyaW5nKDAsICIiKQogICAgICAgICAgICAgICAgaXMgU3RyaW5nIC0+IHsKICAgICAgICAgICAg
ICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgpCiAgICAgICAgICAgICAgICAgICAgaWYgKHZh
bHVlLnN0YXJ0c1dpdGgoIlsiKSkgewogICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyBKU09O
QXJyYXkodmFsdWUpLm9wdFN0cmluZygwLCAiIikgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IHZh
bHVlIH0KICAgICAgICAgICAgICAgICAgICB9IGVsc2UgdmFsdWUKICAgICAgICAgICAgICAgIH0K
ICAgICAgICAgICAgICAgIGVsc2UgLT4gIiIKICAgICAgICAgICAgfS5pZkJsYW5rIHsgcGljaygi
YmFja2Ryb3AiLCAiYmFja2Ryb3BfdXJsIikgfQogICAgICAgICAgICByZXR1cm4gbWVkaWFVcmwo
Yy5zZXJ2ZXIsIGNhbmRpZGF0ZSkKICAgICAgICB9CgogICAgICAgIHZhbCBzdHJlYW1JZCA9IG1v
dmllLm9wdEludCgic3RyZWFtX2lkIiwgbW92aWVJZCkudGFrZUlmIHsgaXQgPiAwIH0gPzogbW92
aWVJZAogICAgICAgIHZhbCBleHRlbnNpb24gPSBwaWNrKCJjb250YWluZXJfZXh0ZW5zaW9uIiku
aWZCbGFuayB7ICJtcDQiIH0KICAgICAgICB2YWwgZGlyZWN0ID0gcGljaygiZGlyZWN0X3NvdXJj
ZSIpLnRha2VJZiB7CiAgICAgICAgICAgIGl0LnN0YXJ0c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8
fCBpdC5zdGFydHNXaXRoKCJodHRwczovLyIsIHRydWUpCiAgICAgICAgfQogICAgICAgIHZhbCBw
bGF5VXJsID0gZGlyZWN0ID86ICIke2Jhc2UoYy5zZXJ2ZXIpfS9tb3ZpZS8ke2VuYyhjLnVzZXJu
YW1lKX0vJHtlbmMoYy5wYXNzd29yZCl9LyRzdHJlYW1JZC4kZXh0ZW5zaW9uIgogICAgICAgIHZh
bCByZWxlYXNlRGF0ZSA9IHBpY2soInJlbGVhc2VkYXRlIiwgInJlbGVhc2VEYXRlIiwgInJlbGVh
c2VfZGF0ZSIpCiAgICAgICAgdmFsIHJhd1llYXIgPSBwaWNrKCJ5ZWFyIikuaWZCbGFuayB7IHJl
bGVhc2VEYXRlLnRha2UoNCkgfQogICAgICAgIHZhbCB5ZWFyID0gcmF3WWVhci50YWtlSWYgeyBp
dC5sZW5ndGggPT0gNCAmJiBpdC5hbGwoQ2hhcjo6aXNEaWdpdCkgfS5vckVtcHR5KCkKICAgICAg
ICB2YWwgcmF3RHVyYXRpb24gPSBwaWNrKCJkdXJhdGlvbiIsICJlcGlzb2RlX3J1bl90aW1lIiwg
InJ1bnRpbWUiKQogICAgICAgIHZhbCBkdXJhdGlvbiA9IHJhd0R1cmF0aW9uLnRvSW50T3JOdWxs
KCk/LmxldCB7ICIkaXQgbWluIiB9ID86IHJhd0R1cmF0aW9uCiAgICAgICAgdmFsIGRlc2NyaXB0
aW9uID0gcGljaygiZGVzY3JpcHRpb24iLCAicGxvdCIpLnJlcGxhY2UoUmVnZXgoIlxccysiKSwg
IiAiKS50cmltKCkKICAgICAgICB2YWwgdHJhaWxlclZhbHVlID0gcGljaygieW91dHViZV90cmFp
bGVyIiwgInRyYWlsZXIiLCAidHJhaWxlcl91cmwiKQogICAgICAgIHZhbCB0cmFpbGVyVXJsID0g
d2hlbiB7CiAgICAgICAgICAgIHRyYWlsZXJWYWx1ZS5pc0JsYW5rKCkgLT4gIiIKICAgICAgICAg
ICAgdHJhaWxlclZhbHVlLnN0YXJ0c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8fCB0cmFpbGVyVmFs
dWUuc3RhcnRzV2l0aCgiaHR0cHM6Ly8iLCB0cnVlKSAtPiB0cmFpbGVyVmFsdWUKICAgICAgICAg
ICAgZWxzZSAtPiAiaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2VuYyh0cmFpbGVy
VmFsdWUpfSIKICAgICAgICB9CgogICAgICAgIHJldHVybiBNb3ZpZURldGFpbHMoCiAgICAgICAg
ICAgIGlkID0gc3RyZWFtSWQsCiAgICAgICAgICAgIG5hbWUgPSBwaWNrKCJuYW1lIiwgIm9fbmFt
ZSIsICJ0aXRsZSIpLmlmQmxhbmsgeyAiTW92aWUiIH0sCiAgICAgICAgICAgIHBsYXlVcmwgPSBw
bGF5VXJsLAogICAgICAgICAgICBwb3N0ZXJVcmwgPSBtZWRpYVVybChjLnNlcnZlciwgcGljaygi
Y292ZXJfYmlnIiwgIm1vdmllX2ltYWdlIiwgImNvdmVyIiwgInN0cmVhbV9pY29uIikpLAogICAg
ICAgICAgICBiYWNrZHJvcFVybCA9IGZpcnN0QmFja2Ryb3AoKSwKICAgICAgICAgICAgeWVhciA9
IHllYXIsCiAgICAgICAgICAgIHJhdGluZyA9IGNsZWFuUmF0aW5nKHBpY2soInJhdGluZ181YmFz
ZWQiLCAicmF0aW5nIikpLAogICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uLAogICAgICAg
ICAgICBjZXJ0aWZpY2F0aW9uID0gcGljaygibXBhYV9yYXRpbmciLCAiYWdlIiwgImNlcnRpZmlj
YXRpb24iKSwKICAgICAgICAgICAgZ2VucmUgPSBwaWNrKCJnZW5yZSIpLAogICAgICAgICAgICBk
ZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uLAogICAgICAgICAgICBjYXN0ID0gcGljaygiYWN0b3Jz
IiwgImNhc3QiKSwKICAgICAgICAgICAgZGlyZWN0b3IgPSBwaWNrKCJkaXJlY3RvciIpLAogICAg
ICAgICAgICBjb3VudHJ5ID0gcGljaygiY291bnRyeSIpLAogICAgICAgICAgICByZWxlYXNlRGF0
ZSA9IHJlbGVhc2VEYXRlLAogICAgICAgICAgICB0YWdsaW5lID0gcGljaygidGFnbGluZSIpLAog
ICAgICAgICAgICBjYXRlZ29yeUlkID0gcGljaygiY2F0ZWdvcnlfaWQiKSwKICAgICAgICAgICAg
dHJhaWxlclVybCA9IHRyYWlsZXJVcmwKICAgICAgICApCiAgICB9CgogICAgZnVuIHNlcmllcyhj
OiBYdHJlYW1DcmVkZW50aWFscywgY2F0ZWdvcnlJZDogU3RyaW5nPyA9IG51bGwpOiBMaXN0PExp
YnJhcnlJdGVtPiB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERl
bW9DYXRhbG9nLnNlcmllcyhjYXRlZ29yeUlkKQogICAgICAgIHZhbCBzdWZmaXggPSBpZiAoY2F0
ZWdvcnlJZC5pc051bGxPckJsYW5rKCkpICIiIGVsc2UgIiZjYXRlZ29yeV9pZD0ke2VuYyhjYXRl
Z29yeUlkKX0iCiAgICAgICAgdmFsIGFyciA9IEpTT05BcnJheShnZXQoIiR7YmFzZShjLnNlcnZl
cil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1lPSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0k
e2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdldF9zZXJpZXMkc3VmZml4IikpCiAgICAgICAgcmV0
dXJuIGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIGZvciAoaSBpbiAwIHVudGlsIGFyci5sZW5ndGgo
KSkgewogICAgICAgICAgICAgICAgdmFsIG8gPSBhcnIuZ2V0SlNPTk9iamVjdChpKQogICAgICAg
ICAgICAgICAgdmFsIHllYXIgPSBvLm9wdFN0cmluZygieWVhciIpLmlmQmxhbmsgewogICAgICAg
ICAgICAgICAgICAgIG8ub3B0U3RyaW5nKCJyZWxlYXNlRGF0ZSIpLnRyaW0oKS50YWtlKDQpLnRh
a2VJZiB7IHZhbHVlIC0+IHZhbHVlLmFsbCB7IGNoIC0+IGNoLmlzRGlnaXQoKSB9IH0gPzogIiIK
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHZhbCByYXRpbmcgPSBvLm9wdFN0cmlu
ZygicmF0aW5nXzViYXNlZCIpLmlmQmxhbmsgeyBvLm9wdFN0cmluZygicmF0aW5nIikgfQogICAg
ICAgICAgICAgICAgYWRkKExpYnJhcnlJdGVtKAogICAgICAgICAgICAgICAgICAgIGlkID0gby5v
cHRJbnQoInNlcmllc19pZCIpLAogICAgICAgICAgICAgICAgICAgIG5hbWUgPSBvLm9wdFN0cmlu
ZygibmFtZSIsICJTZXJpZXMiKSwKICAgICAgICAgICAgICAgICAgICBraW5kID0gInNlcmllcyIs
CiAgICAgICAgICAgICAgICAgICAgcGxheVVybCA9IG51bGwsCiAgICAgICAgICAgICAgICAgICAg
aW1hZ2VVcmwgPSBtZWRpYVVybChjLnNlcnZlciwgby5vcHRTdHJpbmcoImNvdmVyIikpLAogICAg
ICAgICAgICAgICAgICAgIGNhdGVnb3J5SWQgPSBvLm9wdFN0cmluZygiY2F0ZWdvcnlfaWQiKSwK
ICAgICAgICAgICAgICAgICAgICB5ZWFyID0geWVhciwKICAgICAgICAgICAgICAgICAgICByYXRp
bmcgPSBjbGVhblJhdGluZyhyYXRpbmcpCiAgICAgICAgICAgICAgICApKQogICAgICAgICAgICB9
CiAgICAgICAgfQogICAgfQoKICAgIC8qKiBMb2FkcyBjb21wbGV0ZSBzZXJpZXMgaW5mb3JtYXRp
b24gYW5kIGV2ZXJ5IGVwaXNvZGUgZnJvbSBvbmUgcHJvdmlkZXIgcmVxdWVzdC4gKi8KICAgIGZ1
biBzZXJpZXNDb250ZW50KGM6IFh0cmVhbUNyZWRlbnRpYWxzLCBzZXJpZXNJZDogSW50KTogU2Vy
aWVzQ29udGVudCB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgewogICAgICAg
ICAgICB2YWwgaXRlbSA9IERlbW9DYXRhbG9nLnNlcmllcy5maXJzdE9yTnVsbCB7IGl0LmlkID09
IHNlcmllc0lkIH0KICAgICAgICAgICAgICAgID86IHRocm93IElsbGVnYWxTdGF0ZUV4Y2VwdGlv
bigiU2VyaWVzIHdhcyBub3QgZm91bmQiKQogICAgICAgICAgICByZXR1cm4gU2VyaWVzQ29udGVu
dCgKICAgICAgICAgICAgICAgIGRldGFpbHMgPSBTZXJpZXNEZXRhaWxzKAogICAgICAgICAgICAg
ICAgICAgIGlkID0gaXRlbS5pZCwKICAgICAgICAgICAgICAgICAgICBuYW1lID0gaXRlbS5uYW1l
LAogICAgICAgICAgICAgICAgICAgIHllYXIgPSBpdGVtLnllYXIsCiAgICAgICAgICAgICAgICAg
ICAgcmF0aW5nID0gaXRlbS5yYXRpbmcsCiAgICAgICAgICAgICAgICAgICAgZ2VucmUgPSAiS3Jp
c3RhbCBTdHJlYW1zIE9yaWdpbmFsIiwKICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9
ICJBIGZlYXR1cmVkIHNlcmllcyBhdmFpbGFibGUgaW4gdGhlIEtyaXN0YWwgU3RyZWFtcyBkZW1v
IGNhdGFsb2cuIiwKICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAiUmV0dXJuaW5nIFNlcmll
cyIsCiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlJZCA9IGl0ZW0uY2F0ZWdvcnlJZCwKICAg
ICAgICAgICAgICAgICAgICB0cmFpbGVyVXJsID0gImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3Jl
c3VsdHM/c2VhcmNoX3F1ZXJ5PSR7ZW5jKGl0ZW0ubmFtZSArICIgdHJhaWxlciIpfSIgCiAgICAg
ICAgICAgICAgICApLAogICAgICAgICAgICAgICAgZXBpc29kZXMgPSBEZW1vQ2F0YWxvZy5lcGlz
b2RlcyhzZXJpZXNJZCkKICAgICAgICAgICAgKQogICAgICAgIH0KCiAgICAgICAgdmFsIHJvb3Qg
PSBKU09OT2JqZWN0KGdldCgiJHtiYXNlKGMuc2VydmVyKX0vcGxheWVyX2FwaS5waHA/dXNlcm5h
bWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSZhY3Rpb249
Z2V0X3Nlcmllc19pbmZvJnNlcmllc19pZD0kc2VyaWVzSWQiKSkKICAgICAgICB2YWwgaW5mbyA9
IHJvb3Qub3B0SlNPTk9iamVjdCgiaW5mbyIpID86IEpTT05PYmplY3QoKQoKICAgICAgICBmdW4g
cGljayh2YXJhcmcga2V5czogU3RyaW5nKTogU3RyaW5nIHsKICAgICAgICAgICAga2V5cy5mb3JF
YWNoIHsga2V5IC0+CiAgICAgICAgICAgICAgICB2YWwgdmFsdWUgPSBpbmZvLm9wdFN0cmluZyhr
ZXksICIiKS50cmltKCkKICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pc05vdEJsYW5rKCkgJiYg
IXZhbHVlLmVxdWFscygibnVsbCIsIHRydWUpKSByZXR1cm4gdmFsdWUKICAgICAgICAgICAgfQog
ICAgICAgICAgICByZXR1cm4gIiIKICAgICAgICB9CgogICAgICAgIGZ1biBmaXJzdEJhY2tkcm9w
KCk6IFN0cmluZyB7CiAgICAgICAgICAgIHZhbCByYXcgPSBpbmZvLm9wdCgiYmFja2Ryb3BfcGF0
aCIpCiAgICAgICAgICAgIHZhbCBjYW5kaWRhdGUgPSB3aGVuIChyYXcpIHsKICAgICAgICAgICAg
ICAgIGlzIEpTT05BcnJheSAtPiByYXcub3B0U3RyaW5nKDAsICIiKQogICAgICAgICAgICAgICAg
aXMgU3RyaW5nIC0+IHsKICAgICAgICAgICAgICAgICAgICB2YWwgdmFsdWUgPSByYXcudHJpbSgp
CiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoIlsiKSkgewogICAgICAg
ICAgICAgICAgICAgICAgICB0cnkgeyBKU09OQXJyYXkodmFsdWUpLm9wdFN0cmluZygwLCAiIikg
fSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IHZhbHVlIH0KICAgICAgICAgICAgICAgICAgICB9IGVs
c2UgdmFsdWUKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGVsc2UgLT4gIiIKICAg
ICAgICAgICAgfS5pZkJsYW5rIHsgcGljaygiYmFja2Ryb3AiLCAiYmFja2Ryb3BfdXJsIikgfQog
ICAgICAgICAgICByZXR1cm4gbWVkaWFVcmwoYy5zZXJ2ZXIsIGNhbmRpZGF0ZSkKICAgICAgICB9
CgogICAgICAgIHZhbCByZWxlYXNlRGF0ZSA9IHBpY2soInJlbGVhc2VEYXRlIiwgInJlbGVhc2Vk
YXRlIiwgInJlbGVhc2VfZGF0ZSIsICJmaXJzdF9haXJfZGF0ZSIpCiAgICAgICAgdmFsIHJhd1ll
YXIgPSBwaWNrKCJ5ZWFyIikuaWZCbGFuayB7IHJlbGVhc2VEYXRlLnRha2UoNCkgfQogICAgICAg
IHZhbCB5ZWFyID0gcmF3WWVhci50YWtlSWYgeyBpdC5sZW5ndGggPT0gNCAmJiBpdC5hbGwoQ2hh
cjo6aXNEaWdpdCkgfS5vckVtcHR5KCkKICAgICAgICB2YWwgdHJhaWxlclZhbHVlID0gcGljaygi
eW91dHViZV90cmFpbGVyIiwgInRyYWlsZXIiLCAidHJhaWxlcl91cmwiKQogICAgICAgIHZhbCB0
cmFpbGVyVXJsID0gd2hlbiB7CiAgICAgICAgICAgIHRyYWlsZXJWYWx1ZS5pc0JsYW5rKCkgLT4g
IiIKICAgICAgICAgICAgdHJhaWxlclZhbHVlLnN0YXJ0c1dpdGgoImh0dHA6Ly8iLCB0cnVlKSB8
fCB0cmFpbGVyVmFsdWUuc3RhcnRzV2l0aCgiaHR0cHM6Ly8iLCB0cnVlKSAtPiB0cmFpbGVyVmFs
dWUKICAgICAgICAgICAgZWxzZSAtPiAiaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0k
e2VuYyh0cmFpbGVyVmFsdWUpfSIKICAgICAgICB9CgogICAgICAgIHZhbCBkZXRhaWxzID0gU2Vy
aWVzRGV0YWlscygKICAgICAgICAgICAgaWQgPSBzZXJpZXNJZCwKICAgICAgICAgICAgbmFtZSA9
IHBpY2soIm5hbWUiLCAidGl0bGUiKS5pZkJsYW5rIHsgIlNlcmllcyIgfSwKICAgICAgICAgICAg
cG9zdGVyVXJsID0gbWVkaWFVcmwoYy5zZXJ2ZXIsIHBpY2soImNvdmVyIiwgImNvdmVyX2JpZyIs
ICJtb3ZpZV9pbWFnZSIpKSwKICAgICAgICAgICAgYmFja2Ryb3BVcmwgPSBmaXJzdEJhY2tkcm9w
KCksCiAgICAgICAgICAgIHllYXIgPSB5ZWFyLAogICAgICAgICAgICByYXRpbmcgPSBjbGVhblJh
dGluZyhwaWNrKCJyYXRpbmdfNWJhc2VkIiwgInJhdGluZyIpKSwKICAgICAgICAgICAgZ2VucmUg
PSBwaWNrKCJnZW5yZSIpLAogICAgICAgICAgICBkZXNjcmlwdGlvbiA9IHBpY2soInBsb3QiLCAi
ZGVzY3JpcHRpb24iKS5yZXBsYWNlKFJlZ2V4KCJcXHMrIiksICIgIikudHJpbSgpLAogICAgICAg
ICAgICBjYXN0ID0gcGljaygiY2FzdCIsICJhY3RvcnMiKSwKICAgICAgICAgICAgZGlyZWN0b3Ig
PSBwaWNrKCJkaXJlY3RvciIpLAogICAgICAgICAgICByZWxlYXNlRGF0ZSA9IHJlbGVhc2VEYXRl
LAogICAgICAgICAgICBsYXN0QWlyRGF0ZSA9IHBpY2soImxhc3RfYWlyX2RhdGUiKSwKICAgICAg
ICAgICAgc3RhdHVzID0gcGljaygic3RhdHVzIiksCiAgICAgICAgICAgIGNhdGVnb3J5SWQgPSBw
aWNrKCJjYXRlZ29yeV9pZCIpLAogICAgICAgICAgICB0cmFpbGVyVXJsID0gdHJhaWxlclVybAog
ICAgICAgICkKCiAgICAgICAgdmFsIGVwaXNvZGVzT2JqZWN0ID0gcm9vdC5vcHRKU09OT2JqZWN0
KCJlcGlzb2RlcyIpID86IEpTT05PYmplY3QoKQogICAgICAgIHZhbCByZXN1bHQgPSBtdXRhYmxl
TGlzdE9mPEVwaXNvZGVJdGVtPigpCiAgICAgICAgdmFsIHNlYXNvbktleXMgPSBlcGlzb2Rlc09i
amVjdC5rZXlzKCkKICAgICAgICB3aGlsZSAoc2Vhc29uS2V5cy5oYXNOZXh0KCkpIHsKICAgICAg
ICAgICAgdmFsIHNlYXNvbktleSA9IHNlYXNvbktleXMubmV4dCgpCiAgICAgICAgICAgIHZhbCBz
ZWFzb24gPSBzZWFzb25LZXkudG9JbnRPck51bGwoKSA/OiAwCiAgICAgICAgICAgIHZhbCBhcnJh
eSA9IGVwaXNvZGVzT2JqZWN0Lm9wdEpTT05BcnJheShzZWFzb25LZXkpID86IGNvbnRpbnVlCiAg
ICAgICAgICAgIGZvciAoaW5kZXggaW4gMCB1bnRpbCBhcnJheS5sZW5ndGgoKSkgewogICAgICAg
ICAgICAgICAgdmFsIGVwaXNvZGVPYmplY3QgPSBhcnJheS5vcHRKU09OT2JqZWN0KGluZGV4KSA/
OiBjb250aW51ZQogICAgICAgICAgICAgICAgdmFsIGVwaXNvZGVJbmZvID0gZXBpc29kZU9iamVj
dC5vcHRKU09OT2JqZWN0KCJpbmZvIikgPzogSlNPTk9iamVjdCgpCiAgICAgICAgICAgICAgICB2
YWwgaWQgPSBlcGlzb2RlT2JqZWN0Lm9wdEludCgiaWQiKQogICAgICAgICAgICAgICAgdmFsIGVw
aXNvZGVOdW1iZXIgPSBlcGlzb2RlT2JqZWN0Lm9wdEludCgiZXBpc29kZV9udW0iLCBpbmRleCAr
IDEpCiAgICAgICAgICAgICAgICB2YWwgZXh0ZW5zaW9uID0gZXBpc29kZU9iamVjdC5vcHRTdHJp
bmcoImNvbnRhaW5lcl9leHRlbnNpb24iLCAibXA0IikuaWZCbGFuayB7ICJtcDQiIH0KICAgICAg
ICAgICAgICAgIHZhbCB0aXRsZSA9IGVwaXNvZGVPYmplY3Qub3B0U3RyaW5nKCJ0aXRsZSIsICJF
cGlzb2RlICRlcGlzb2RlTnVtYmVyIikuaWZCbGFuayB7ICJFcGlzb2RlICRlcGlzb2RlTnVtYmVy
IiB9CiAgICAgICAgICAgICAgICB2YWwgcGxheVVybCA9ICIke2Jhc2UoYy5zZXJ2ZXIpfS9zZXJp
ZXMvJHtlbmMoYy51c2VybmFtZSl9LyR7ZW5jKGMucGFzc3dvcmQpfS8kaWQuJGV4dGVuc2lvbiIK
ICAgICAgICAgICAgICAgIHZhbCBkdXJhdGlvblJhdyA9IGVwaXNvZGVJbmZvLm9wdFN0cmluZygi
ZHVyYXRpb24iKS5pZkJsYW5rIHsgZXBpc29kZUluZm8ub3B0U3RyaW5nKCJydW50aW1lIikgfQog
ICAgICAgICAgICAgICAgdmFsIGR1cmF0aW9uID0gZHVyYXRpb25SYXcudG9JbnRPck51bGwoKT8u
bGV0IHsgIiRpdCBtaW4iIH0gPzogZHVyYXRpb25SYXcKICAgICAgICAgICAgICAgIHZhbCBpbWFn
ZSA9IGVwaXNvZGVJbmZvLm9wdFN0cmluZygibW92aWVfaW1hZ2UiKS5pZkJsYW5rIHsKICAgICAg
ICAgICAgICAgICAgICBlcGlzb2RlSW5mby5vcHRTdHJpbmcoImNvdmVyX2JpZyIpLmlmQmxhbmsg
eyBlcGlzb2RlSW5mby5vcHRTdHJpbmcoImNvdmVyIikgfQogICAgICAgICAgICAgICAgfQogICAg
ICAgICAgICAgICAgcmVzdWx0LmFkZChFcGlzb2RlSXRlbSgKICAgICAgICAgICAgICAgICAgICBp
ZCA9IGlkLAogICAgICAgICAgICAgICAgICAgIHRpdGxlID0gdGl0bGUsCiAgICAgICAgICAgICAg
ICAgICAgc2Vhc29uID0gc2Vhc29uLAogICAgICAgICAgICAgICAgICAgIGVwaXNvZGUgPSBlcGlz
b2RlTnVtYmVyLAogICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbiA9IGV4dGVuc2lvbiwKICAg
ICAgICAgICAgICAgICAgICBwbGF5VXJsID0gcGxheVVybCwKICAgICAgICAgICAgICAgICAgICBp
bWFnZVVybCA9IG1lZGlhVXJsKGMuc2VydmVyLCBpbWFnZSksCiAgICAgICAgICAgICAgICAgICAg
ZGVzY3JpcHRpb24gPSBlcGlzb2RlSW5mby5vcHRTdHJpbmcoInBsb3QiKS5pZkJsYW5rIHsgZXBp
c29kZUluZm8ub3B0U3RyaW5nKCJkZXNjcmlwdGlvbiIpIH0ucmVwbGFjZShSZWdleCgiXFxzKyIp
LCAiICIpLnRyaW0oKSwKICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uLAog
ICAgICAgICAgICAgICAgICAgIGFpckRhdGUgPSBlcGlzb2RlSW5mby5vcHRTdHJpbmcoInJlbGVh
c2VkYXRlIikuaWZCbGFuayB7IGVwaXNvZGVJbmZvLm9wdFN0cmluZygiYWlyX2RhdGUiKSB9LAog
ICAgICAgICAgICAgICAgICAgIHJhdGluZyA9IGNsZWFuUmF0aW5nKGVwaXNvZGVJbmZvLm9wdFN0
cmluZygicmF0aW5nXzViYXNlZCIpLmlmQmxhbmsgeyBlcGlzb2RlSW5mby5vcHRTdHJpbmcoInJh
dGluZyIpIH0pCiAgICAgICAgICAgICAgICApKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAg
ICAgIHJldHVybiBTZXJpZXNDb250ZW50KGRldGFpbHMsIHJlc3VsdC5zb3J0ZWRXaXRoKGNvbXBh
cmVCeTxFcGlzb2RlSXRlbT4geyBpdC5zZWFzb24gfS50aGVuQnkgeyBpdC5lcGlzb2RlIH0pKQog
ICAgfQoKICAgIGZ1biBzZXJpZXNFcGlzb2RlcyhjOiBYdHJlYW1DcmVkZW50aWFscywgc2VyaWVz
SWQ6IEludCk6IExpc3Q8RXBpc29kZUl0ZW0+ID0KICAgICAgICBzZXJpZXNDb250ZW50KGMsIHNl
cmllc0lkKS5lcGlzb2RlcwoKCiAgICAvKioKICAgICAqIEZ1bGwgZ3VpZGUgZnJvbSB0aGUgcHJv
dmlkZXIncyBYTUxUViBmZWVkLgogICAgICoKICAgICAqIFVzZXMgdGhlIGVwZ19jaGFubmVsX2lk
IHJldHVybmVkIHdpdGggbGl2ZSBzdHJlYW1zLiBUaGlzIGlzIGRlbGliZXJhdGVseQogICAgICog
aW5kZXBlbmRlbnQgb2Ygc2hvcnRFcGcoKS9nZXRfc2ltcGxlX2RhdGFfdGFibGUgc28gbWFsZm9y
bWVkIHBlci1jaGFubmVsCiAgICAgKiByZXNwb25zZXMgY2Fubm90IGNvbGxhcHNlIGEgZnVsbCBz
Y2hlZHVsZSBpbnRvIHRoZSBmaXJzdCBob3VyLgogICAgICovCiAgICBmdW4geG1sVHZHdWlkZSgK
ICAgICAgICBjOiBYdHJlYW1DcmVkZW50aWFscywKICAgICAgICBjaGFubmVsSWRzOiBTZXQ8U3Ry
aW5nPiwKICAgICAgICB3aW5kb3dTdGFydE1zOiBMb25nLAogICAgICAgIHdpbmRvd0VuZE1zOiBM
b25nCiAgICApOiBNYXA8U3RyaW5nLCBMaXN0PEVwZ0l0ZW0+PiB7CiAgICAgICAgaWYgKERlbW9D
YXRhbG9nLmlzRGVtbyhjKSB8fCBjaGFubmVsSWRzLmlzRW1wdHkoKSkgcmV0dXJuIGVtcHR5TWFw
KCkKCiAgICAgICAgdmFsIHdhbnRlZCA9IGNoYW5uZWxJZHMubWFwIHsgaXQudHJpbSgpLmxvd2Vy
Y2FzZShMb2NhbGUuVVMpIH0uZmlsdGVyIHsgaXQuaXNOb3RCbGFuaygpIH0udG9IYXNoU2V0KCkK
ICAgICAgICBpZiAod2FudGVkLmlzRW1wdHkoKSkgcmV0dXJuIGVtcHR5TWFwKCkKCiAgICAgICAg
dmFsIGxvd2VyU2Vjb25kcyA9ICh3aW5kb3dTdGFydE1zIC8gMTAwMEwpIC0gMiAqIDM2MDBMCiAg
ICAgICAgdmFsIHVwcGVyU2Vjb25kcyA9ICh3aW5kb3dFbmRNcyAvIDEwMDBMKSArIDIgKiAzNjAw
TAogICAgICAgIHZhbCByZXN1bHQgPSBIYXNoTWFwPFN0cmluZywgTXV0YWJsZUxpc3Q8RXBnSXRl
bT4+KCkKICAgICAgICAvLyBUaGUgcHJvdmlkZXIgbGFiZWxzIHRoZXNlIHZhbHVlcyBhcyBVVEMg
ZXZlbiB0aG91Z2ggdGhlIDE0LWRpZ2l0CiAgICAgICAgLy8gWE1MVFYgY2xvY2sgdmFsdWVzIGFy
ZSBhbHJlYWR5IGxvY2FsIHdhbGwtY2xvY2sgdGltZS4gS2VlcCB0aGUgRVBHLAogICAgICAgIC8v
IHRpbWVsaW5lIGxhYmVscyBhbmQgTk9XIG1hcmtlciBvbiB0aGUgQW5kcm9pZCBkZXZpY2UncyBv
bmUgY2xvY2suCiAgICAgICAgdmFsIGd1aWRlVGltZVpvbmUgPSBUaW1lWm9uZS5nZXREZWZhdWx0
KCkKCiAgICAgICAgdmFsIHVybCA9ICIke2Jhc2UoYy5zZXJ2ZXIpfS94bWx0di5waHA/dXNlcm5h
bWU9JHtlbmMoYy51c2VybmFtZSl9JnBhc3N3b3JkPSR7ZW5jKGMucGFzc3dvcmQpfSIKICAgICAg
ICB3aXRoSW5wdXRTdHJlYW0odXJsKSB7IGlucHV0IC0+CiAgICAgICAgICAgIHZhbCBwYXJzZXIg
PSBYbWwubmV3UHVsbFBhcnNlcigpCiAgICAgICAgICAgIHBhcnNlci5zZXRJbnB1dChJbnB1dFN0
cmVhbVJlYWRlcihpbnB1dCwgQ2hhcnNldHMuVVRGXzgpKQoKICAgICAgICAgICAgdmFyIGV2ZW50
ID0gcGFyc2VyLmV2ZW50VHlwZQogICAgICAgICAgICB3aGlsZSAoZXZlbnQgIT0gWG1sUHVsbFBh
cnNlci5FTkRfRE9DVU1FTlQpIHsKICAgICAgICAgICAgICAgIGlmIChldmVudCA9PSBYbWxQdWxs
UGFyc2VyLlNUQVJUX1RBRyAmJiBwYXJzZXIubmFtZS5lcXVhbHMoInByb2dyYW1tZSIsIHRydWUp
KSB7CiAgICAgICAgICAgICAgICAgICAgdmFsIGNoYW5uZWwgPSBwYXJzZXIuZ2V0QXR0cmlidXRl
VmFsdWUobnVsbCwgImNoYW5uZWwiKT8udHJpbSgpLm9yRW1wdHkoKQogICAgICAgICAgICAgICAg
ICAgIHZhbCBjaGFubmVsS2V5ID0gY2hhbm5lbC5sb3dlcmNhc2UoTG9jYWxlLlVTKQogICAgICAg
ICAgICAgICAgICAgIHZhbCBzdGFydFJhdyA9IHBhcnNlci5nZXRBdHRyaWJ1dGVWYWx1ZShudWxs
LCAic3RhcnQiKT8udHJpbSgpLm9yRW1wdHkoKQogICAgICAgICAgICAgICAgICAgIHZhbCBzdG9w
UmF3ID0gcGFyc2VyLmdldEF0dHJpYnV0ZVZhbHVlKG51bGwsICJzdG9wIik/LnRyaW0oKS5vckVt
cHR5KCkKICAgICAgICAgICAgICAgICAgICB2YWwgc3RhcnRTZWNvbmRzID0gcGFyc2VYbWxUdlNl
Y29uZHMoc3RhcnRSYXcsIGd1aWRlVGltZVpvbmUpCiAgICAgICAgICAgICAgICAgICAgdmFsIHN0
b3BTZWNvbmRzID0gcGFyc2VYbWxUdlNlY29uZHMoc3RvcFJhdywgZ3VpZGVUaW1lWm9uZSkKCiAg
ICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gIiIKICAgICAgICAgICAgICAgICAgICB2YXIg
ZGVzY3JpcHRpb24gPSAiIgoKICAgICAgICAgICAgICAgICAgICB2YXIgZGVwdGggPSBwYXJzZXIu
ZGVwdGgKICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXIgPSBwYXJzZXIubmV4dCgpCiAgICAg
ICAgICAgICAgICAgICAgd2hpbGUgKCEoaW5uZXIgPT0gWG1sUHVsbFBhcnNlci5FTkRfVEFHICYm
IHBhcnNlci5kZXB0aCA9PSBkZXB0aCAmJiBwYXJzZXIubmFtZS5lcXVhbHMoInByb2dyYW1tZSIs
IHRydWUpKSkgewogICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5uZXIgPT0gWG1sUHVsbFBh
cnNlci5TVEFSVF9UQUcpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gKHBhcnNl
ci5uYW1lLmxvd2VyY2FzZShMb2NhbGUuVVMpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgInRpdGxlIiAtPiB0aXRsZSA9IHBhcnNlci5uZXh0VGV4dCgpLnRyaW0oKQogICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICJkZXNjIiAtPiBkZXNjcmlwdGlvbiA9IHBhcnNlci5u
ZXh0VGV4dCgpLnRyaW0oKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAg
ICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyID0gcGFyc2VyLm5l
eHQoKQogICAgICAgICAgICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICAgICAgaWYgKAogICAg
ICAgICAgICAgICAgICAgICAgICBjaGFubmVsS2V5IGluIHdhbnRlZCAmJgogICAgICAgICAgICAg
ICAgICAgICAgICBzdGFydFNlY29uZHMgIT0gbnVsbCAmJgogICAgICAgICAgICAgICAgICAgICAg
ICBzdG9wU2Vjb25kcyAhPSBudWxsICYmCiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BTZWNv
bmRzID4gc3RhcnRTZWNvbmRzICYmCiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BTZWNvbmRz
ID49IGxvd2VyU2Vjb25kcyAmJgogICAgICAgICAgICAgICAgICAgICAgICBzdGFydFNlY29uZHMg
PD0gdXBwZXJTZWNvbmRzCiAgICAgICAgICAgICAgICAgICAgKSB7CiAgICAgICAgICAgICAgICAg
ICAgICAgIHJlc3VsdC5nZXRPclB1dChjaGFubmVsS2V5KSB7IG11dGFibGVMaXN0T2YoKSB9LmFk
ZCgKICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVwZ0l0ZW0oCiAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgdGl0bGUgPSB0aXRsZS5pZkJsYW5rIHsgIlByb2dyYW0iIH0sCiAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbiwKICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0UmF3LAogICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IHN0b3BSYXcsCiAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgc3RhcnRUaW1lc3RhbXAgPSBzdGFydFNlY29uZHMsCiAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgZW5kVGltZXN0YW1wID0gc3RvcFNlY29uZHMKICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICkKICAgICAgICAgICAgICAgICAgICAgICAgKQogICAgICAgICAgICAg
ICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGV2ZW50ID0gcGFyc2Vy
Lm5leHQoKQogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICByZXR1cm4gcmVzdWx0Lm1h
cFZhbHVlcyB7IChfLCBpdGVtcykgLT4KICAgICAgICAgICAgaXRlbXMKICAgICAgICAgICAgICAg
IC5kaXN0aW5jdEJ5IHsgIiR7aXQuc3RhcnRUaW1lc3RhbXB9fCR7aXQuZW5kVGltZXN0YW1wfXwk
e2l0LnRpdGxlfSIgfQogICAgICAgICAgICAgICAgLnNvcnRlZEJ5IHsgaXQuc3RhcnRUaW1lc3Rh
bXAgPzogTG9uZy5NQVhfVkFMVUUgfQogICAgICAgIH0KICAgIH0KCiAgICAvKioKICAgICAqIEtl
ZXAgYWxsIGd1aWRlIGNsb2NrcyBpbiB0aGUgQW5kcm9pZCBkZXZpY2UncyBsb2NhbCB0aW1lIHpv
bmUuCiAgICAgKgogICAgICogVGhpcyBwcm92aWRlciBhZHZlcnRpc2VzIFVUQyB3aGlsZSBzZW5k
aW5nIGxvY2FsIHdhbGwtY2xvY2sgdmFsdWVzLCBzbwogICAgICogdHJ1c3Rpbmcgc2VydmVyX2lu
Zm8udGltZXpvbmUgbW92ZXMgZXZlcnkgcHJvZ3JhbW1lIGJ5IGZvdXIgaG91cnMuIFJlYWQKICAg
ICAqIHRoZSBmaXJzdCAxNCBYTUxUViBkaWdpdHMgaW4gdGhlIHNhbWUgZGV2aWNlIHpvbmUgdXNl
ZCBieSB0aGUgZ3VpZGUncwogICAgICogdGltZSBsYWJlbHMgYW5kIE5PVyBtYXJrZXIuIFN0YW5k
YXJkcy1iYXNlZCBwYXJzaW5nIHJlbWFpbnMgYSBmYWxsYmFjay4KICAgICAqLwogICAgcHJpdmF0
ZSBmdW4gcGFyc2VYbWxUdlNlY29uZHMocmF3OiBTdHJpbmcsIGd1aWRlVGltZVpvbmU6IFRpbWVa
b25lKTogTG9uZz8gewogICAgICAgIHZhbCB2YWx1ZSA9IHJhdy50cmltKCkKICAgICAgICBpZiAo
dmFsdWUuaXNCbGFuaygpKSByZXR1cm4gbnVsbAoKICAgICAgICBpZiAodmFsdWUubGVuZ3RoID49
IDE0KSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgcGFyc2VyID0gU2lt
cGxlRGF0ZUZvcm1hdCgieXl5eU1NZGRISG1tc3MiLCBMb2NhbGUuVVMpLmFwcGx5IHsKICAgICAg
ICAgICAgICAgICAgICBpc0xlbmllbnQgPSBmYWxzZQogICAgICAgICAgICAgICAgICAgIHRpbWVa
b25lID0gZ3VpZGVUaW1lWm9uZQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgcmV0
dXJuIHBhcnNlci5wYXJzZSh2YWx1ZS5zdWJzdHJpbmcoMCwgMTQpKT8udGltZT8uZGl2KDEwMDBM
KQogICAgICAgICAgICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsKICAgICAgICAgICAgICAgIC8v
IEZhbGwgdGhyb3VnaCB0byBzdGFuZGFyZHMtYmFzZWQgWE1MVFYgcGFyc2luZy4KICAgICAgICAg
ICAgfQogICAgICAgIH0KCiAgICAgICAgdmFsIHBhdHRlcm5zID0gbGlzdE9mKAogICAgICAgICAg
ICAieXl5eU1NZGRISG1tc3MgWiIsCiAgICAgICAgICAgICJ5eXl5TU1kZEhIbW0gWiIsCiAgICAg
ICAgICAgICJ5eXl5TU1kZEhIbW1zcyIsCiAgICAgICAgICAgICJ5eXl5TU1kZEhIbW0iCiAgICAg
ICAgKQoKICAgICAgICBmb3IgKHBhdHRlcm4gaW4gcGF0dGVybnMpIHsKICAgICAgICAgICAgdHJ5
IHsKICAgICAgICAgICAgICAgIHZhbCBwYXJzZXIgPSBTaW1wbGVEYXRlRm9ybWF0KHBhdHRlcm4s
IExvY2FsZS5VUykuYXBwbHkgeyBpc0xlbmllbnQgPSBmYWxzZSB9CiAgICAgICAgICAgICAgICB2
YWwgcGFyc2VkID0gcGFyc2VyLnBhcnNlKHZhbHVlKSA/OiBjb250aW51ZQogICAgICAgICAgICAg
ICAgcmV0dXJuIHBhcnNlZC50aW1lIC8gMTAwMEwKICAgICAgICAgICAgfSBjYXRjaCAoXzogRXhj
ZXB0aW9uKSB7CiAgICAgICAgICAgICAgICAvLyBUcnkgbmV4dCBYTUxUViB0aW1lc3RhbXAgZm9y
bS4KICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gbnVsbAogICAgfQoKICAg
IGZ1biBzaG9ydEVwZyhjOiBYdHJlYW1DcmVkZW50aWFscywgc3RyZWFtSWQ6IEludCwgbGltaXQ6
IEludCA9IDIpOiBMaXN0PEVwZ0l0ZW0+IHsKICAgICAgICBpZiAoRGVtb0NhdGFsb2cuaXNEZW1v
KGMpKSByZXR1cm4gRGVtb0NhdGFsb2cuZXBnKHN0cmVhbUlkKQogICAgICAgIHZhbCByb290ID0g
SlNPTk9iamVjdChnZXQoIiR7YmFzZShjLnNlcnZlcil9L3BsYXllcl9hcGkucGhwP3VzZXJuYW1l
PSR7ZW5jKGMudXNlcm5hbWUpfSZwYXNzd29yZD0ke2VuYyhjLnBhc3N3b3JkKX0mYWN0aW9uPWdl
dF9zaG9ydF9lcGcmc3RyZWFtX2lkPSRzdHJlYW1JZCZsaW1pdD0kbGltaXQiKSkKICAgICAgICB2
YWwgYXJyID0gcm9vdC5vcHRKU09OQXJyYXkoImVwZ19saXN0aW5ncyIpID86IHJldHVybiBlbXB0
eUxpc3QoKQogICAgICAgIHJldHVybiBidWlsZExpc3QgewogICAgICAgICAgICBmb3IgKGkgaW4g
MCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsKICAgICAgICAgICAgICAgIHZhbCBvID0gYXJyLm9wdEpT
T05PYmplY3QoaSkgPzogY29udGludWUKICAgICAgICAgICAgICAgIHZhbCB0aXRsZSA9IGRlY29k
ZUVwZ1RleHQoby5vcHRTdHJpbmcoInRpdGxlIiwgIlByb2dyYW0iKSwgIlByb2dyYW0iKQogICAg
ICAgICAgICAgICAgdmFsIGRlc2NyaXB0aW9uID0gZGVjb2RlRXBnVGV4dChvLm9wdFN0cmluZygi
ZGVzY3JpcHRpb24iLCAiIiksICIiKQogICAgICAgICAgICAgICAgYWRkKEVwZ0l0ZW0oCiAgICAg
ICAgICAgICAgICAgICAgdGl0bGUgPSB0aXRsZSwKICAgICAgICAgICAgICAgICAgICBkZXNjcmlw
dGlvbiA9IGRlc2NyaXB0aW9uLAogICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gby5vcHRTdHJp
bmcoInN0YXJ0IiwgIiIpLAogICAgICAgICAgICAgICAgICAgIGVuZCA9IG8ub3B0U3RyaW5nKCJl
bmQiLCAiIiksCiAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lc3RhbXAgPSBlcGdUaW1lc3Rh
bXBTZWNvbmRzKG8sICJzdGFydF90aW1lc3RhbXAiLCAic3RhcnRfdHMiKSwKICAgICAgICAgICAg
ICAgICAgICBlbmRUaW1lc3RhbXAgPSBlcGdUaW1lc3RhbXBTZWNvbmRzKG8sICJzdG9wX3RpbWVz
dGFtcCIsICJlbmRfdGltZXN0YW1wIiwgImVuZF90cyIpCiAgICAgICAgICAgICAgICApKQogICAg
ICAgICAgICB9CiAgICAgICAgfQogICAgfQoKCiAgICAvKioKICAgICAqIEZ1bGwgVFYgR3VpZGUg
cmVxdWVzdCBwYXRoLgogICAgICoKICAgICAqIFRoaXMgaXMgaW50ZW50aW9uYWxseSBzZXBhcmF0
ZSBmcm9tIHNob3J0RXBnKCksIHNvIHRoZSBrbm93bi1nb29kCiAgICAgKiBMaXZlIFRWIE5vdy9O
ZXh0IGJlaGF2aW9yIGluIFIyIGlzIGxlZnQgdW5jaGFuZ2VkLgogICAgICovCiAgICBmdW4gZ3Vp
ZGVFcGcoYzogWHRyZWFtQ3JlZGVudGlhbHMsIHN0cmVhbUlkOiBJbnQsIGxpbWl0OiBJbnQgPSA5
Nik6IExpc3Q8RXBnSXRlbT4gewogICAgICAgIGlmIChEZW1vQ2F0YWxvZy5pc0RlbW8oYykpIHJl
dHVybiBEZW1vQ2F0YWxvZy5lcGcoc3RyZWFtSWQpCgogICAgICAgIHZhbCBzYWZlTGltaXQgPSBs
aW1pdC5jb2VyY2VJbig4LCAxOTIpCgogICAgICAgIHZhbCBwcmltYXJ5ID0gcnVuQ2F0Y2hpbmcg
ewogICAgICAgICAgICBmZXRjaEd1aWRlQWN0aW9uKGMsIHN0cmVhbUlkLCAiZ2V0X3NpbXBsZV9k
YXRhX3RhYmxlIiwgbnVsbCkKICAgICAgICB9LmdldE9yRGVmYXVsdChlbXB0eUxpc3QoKSkKCiAg
ICAgICAgaWYgKGhhc0Z1bGxHdWlkZURlcHRoKHByaW1hcnkpKSB7CiAgICAgICAgICAgIHJldHVy
biBub3JtYWxpemVHdWlkZUVwZyhwcmltYXJ5LCBzYWZlTGltaXQpCiAgICAgICAgfQoKICAgICAg
ICB2YWwgYWx0ZXJuYXRlID0gcnVuQ2F0Y2hpbmcgewogICAgICAgICAgICBmZXRjaEd1aWRlQWN0
aW9uKGMsIHN0cmVhbUlkLCAiZ2V0X3NpbXBsZV9kYXRlX3RhYmxlIiwgbnVsbCkKICAgICAgICB9
LmdldE9yRGVmYXVsdChlbXB0eUxpc3QoKSkKCiAgICAgICAgdmFsIGZ1bGxDb21iaW5lZCA9IG1l
cmdlR3VpZGVFcGcocHJpbWFyeSwgYWx0ZXJuYXRlKQogICAgICAgIGlmIChoYXNGdWxsR3VpZGVE
ZXB0aChmdWxsQ29tYmluZWQpKSB7CiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVHdWlkZUVw
ZyhmdWxsQ29tYmluZWQsIHNhZmVMaW1pdCkKICAgICAgICB9CgogICAgICAgIC8vIExhc3QgcmVz
b3J0IG9ubHkuIFNvbWUgcGFuZWxzIGhvbm9yIGEgbGFyZ2Ugc2hvcnQtRVBHIGxpbWl0LCB3aGls
ZQogICAgICAgIC8vIG90aGVycyBjYXAgdGhpcyBlbmRwb2ludCBhdCBOb3cvTmV4dC4gTWVyZ2Ug
d2hhdGV2ZXIgaXQgcmV0dXJucyB3aXRoCiAgICAgICAgLy8gdGhlIGZ1bGwtdGFibGUgcmVzdWx0
cyBpbnN0ZWFkIG9mIGRpc2NhcmRpbmcgZWl0aGVyIHNvdXJjZS4KICAgICAgICB2YWwgc2hvcnRG
YWxsYmFjayA9IHJ1bkNhdGNoaW5nIHsKICAgICAgICAgICAgZmV0Y2hHdWlkZUFjdGlvbihjLCBz
dHJlYW1JZCwgImdldF9zaG9ydF9lcGciLCBtYXhPZihzYWZlTGltaXQsIDk2KSkKICAgICAgICB9
LmdldE9yRGVmYXVsdChlbXB0eUxpc3QoKSkKCiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZUd1aWRl
RXBnKAogICAgICAgICAgICBtZXJnZUd1aWRlRXBnKGZ1bGxDb21iaW5lZCwgc2hvcnRGYWxsYmFj
ayksCiAgICAgICAgICAgIHNhZmVMaW1pdAogICAgICAgICkKICAgIH0KCiAgICBwcml2YXRlIGZ1
biBmZXRjaEd1aWRlQWN0aW9uKAogICAgICAgIGM6IFh0cmVhbUNyZWRlbnRpYWxzLAogICAgICAg
IHN0cmVhbUlkOiBJbnQsCiAgICAgICAgYWN0aW9uOiBTdHJpbmcsCiAgICAgICAgbGltaXQ6IElu
dD8KICAgICk6IExpc3Q8RXBnSXRlbT4gewogICAgICAgIHZhbCBsaW1pdFBhcnQgPSBsaW1pdD8u
bGV0IHsgIiZsaW1pdD0kaXQiIH0ub3JFbXB0eSgpCiAgICAgICAgdmFsIGJvZHkgPSBnZXQoCiAg
ICAgICAgICAgICIke2Jhc2UoYy5zZXJ2ZXIpfS9wbGF5ZXJfYXBpLnBocD91c2VybmFtZT0ke2Vu
YyhjLnVzZXJuYW1lKX0mcGFzc3dvcmQ9JHtlbmMoYy5wYXNzd29yZCl9IiArCiAgICAgICAgICAg
ICAgICAiJmFjdGlvbj0kYWN0aW9uJnN0cmVhbV9pZD0kc3RyZWFtSWQkbGltaXRQYXJ0IgogICAg
ICAgICkudHJpbSgpCgogICAgICAgIGlmIChib2R5LmlzQmxhbmsoKSkgcmV0dXJuIGVtcHR5TGlz
dCgpCgogICAgICAgIHZhbCBhcnIgPSBleHRyYWN0R3VpZGVBcnJheShib2R5KQogICAgICAgIGlm
IChhcnIubGVuZ3RoKCkgPT0gMCkgcmV0dXJuIGVtcHR5TGlzdCgpCgogICAgICAgIHJldHVybiBi
dWlsZExpc3QgewogICAgICAgICAgICBmb3IgKGkgaW4gMCB1bnRpbCBhcnIubGVuZ3RoKCkpIHsK
ICAgICAgICAgICAgICAgIHZhbCBvID0gYXJyLm9wdEpTT05PYmplY3QoaSkgPzogY29udGludWUK
CiAgICAgICAgICAgICAgICB2YWwgdGl0bGUgPSBkZWNvZGVFcGdUZXh0KAogICAgICAgICAgICAg
ICAgICAgIGZpcnN0R3VpZGVTdHJpbmcobywgInRpdGxlIiwgIm5hbWUiLCAicHJvZ3JhbSIsICJw
cm9ncmFtbWUiKQogICAgICAgICAgICAgICAgICAgICAgICAuaWZCbGFuayB7ICJQcm9ncmFtIiB9
LAogICAgICAgICAgICAgICAgICAgICJQcm9ncmFtIgogICAgICAgICAgICAgICAgKQogICAgICAg
ICAgICAgICAgdmFsIGRlc2NyaXB0aW9uID0gZGVjb2RlRXBnVGV4dCgKICAgICAgICAgICAgICAg
ICAgICBmaXJzdEd1aWRlU3RyaW5nKG8sICJkZXNjcmlwdGlvbiIsICJkZXNjIiwgInBsb3QiKSwK
ICAgICAgICAgICAgICAgICAgICAiIgogICAgICAgICAgICAgICAgKQoKICAgICAgICAgICAgICAg
IHZhbCBzdGFydFRleHQgPSBmaXJzdEd1aWRlU3RyaW5nKAogICAgICAgICAgICAgICAgICAgIG8s
CiAgICAgICAgICAgICAgICAgICAgInN0YXJ0IiwKICAgICAgICAgICAgICAgICAgICAic3RhcnRf
ZGF0ZSIsCiAgICAgICAgICAgICAgICAgICAgInN0YXJ0X2RhdGV0aW1lIiwKICAgICAgICAgICAg
ICAgICAgICAiYmVnaW4iLAogICAgICAgICAgICAgICAgICAgICJiZWdpbl90aW1lIgogICAgICAg
ICAgICAgICAgKQogICAgICAgICAgICAgICAgdmFsIGVuZFRleHQgPSBmaXJzdEd1aWRlU3RyaW5n
KAogICAgICAgICAgICAgICAgICAgIG8sCiAgICAgICAgICAgICAgICAgICAgImVuZCIsCiAgICAg
ICAgICAgICAgICAgICAgInN0b3AiLAogICAgICAgICAgICAgICAgICAgICJlbmRfZGF0ZSIsCiAg
ICAgICAgICAgICAgICAgICAgImVuZF9kYXRldGltZSIsCiAgICAgICAgICAgICAgICAgICAgInN0
b3BfZGF0ZSIsCiAgICAgICAgICAgICAgICAgICAgInN0b3BfZGF0ZXRpbWUiCiAgICAgICAgICAg
ICAgICApCgogICAgICAgICAgICAgICAgdmFsIHN0YXJ0VHMgPSBndWlkZVRpbWVzdGFtcFNlY29u
ZHMoCiAgICAgICAgICAgICAgICAgICAgbywKICAgICAgICAgICAgICAgICAgICAic3RhcnRfdGlt
ZXN0YW1wIiwKICAgICAgICAgICAgICAgICAgICAic3RhcnRfdHMiLAogICAgICAgICAgICAgICAg
ICAgICJzdGFydF91bml4IiwKICAgICAgICAgICAgICAgICAgICAic3RhcnRfZXBvY2giCiAgICAg
ICAgICAgICAgICApID86IHBhcnNlR3VpZGVEYXRlU2Vjb25kcyhzdGFydFRleHQpCgogICAgICAg
ICAgICAgICAgdmFsIGVuZFRzID0gZ3VpZGVUaW1lc3RhbXBTZWNvbmRzKAogICAgICAgICAgICAg
ICAgICAgIG8sCiAgICAgICAgICAgICAgICAgICAgInN0b3BfdGltZXN0YW1wIiwKICAgICAgICAg
ICAgICAgICAgICAiZW5kX3RpbWVzdGFtcCIsCiAgICAgICAgICAgICAgICAgICAgImVuZF90cyIs
CiAgICAgICAgICAgICAgICAgICAgInN0b3BfdHMiLAogICAgICAgICAgICAgICAgICAgICJlbmRf
dW5peCIsCiAgICAgICAgICAgICAgICAgICAgInN0b3BfdW5peCIsCiAgICAgICAgICAgICAgICAg
ICAgImVuZF9lcG9jaCIKICAgICAgICAgICAgICAgICkgPzogcGFyc2VHdWlkZURhdGVTZWNvbmRz
KGVuZFRleHQpCgogICAgICAgICAgICAgICAgYWRkKAogICAgICAgICAgICAgICAgICAgIEVwZ0l0
ZW0oCiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gdGl0bGUsCiAgICAgICAgICAgICAg
ICAgICAgICAgIGRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb24sCiAgICAgICAgICAgICAgICAgICAg
ICAgIHN0YXJ0ID0gc3RhcnRUZXh0LAogICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBlbmRU
ZXh0LAogICAgICAgICAgICAgICAgICAgICAgICBzdGFydFRpbWVzdGFtcCA9IHN0YXJ0VHMsCiAg
ICAgICAgICAgICAgICAgICAgICAgIGVuZFRpbWVzdGFtcCA9IGVuZFRzCiAgICAgICAgICAgICAg
ICAgICAgKQogICAgICAgICAgICAgICAgKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoK
ICAgIHByaXZhdGUgZnVuIGV4dHJhY3RHdWlkZUFycmF5KGJvZHk6IFN0cmluZyk6IEpTT05BcnJh
eSB7CiAgICAgICAgaWYgKGJvZHkuc3RhcnRzV2l0aCgiWyIpKSB7CiAgICAgICAgICAgIHJldHVy
biBydW5DYXRjaGluZyB7IEpTT05BcnJheShib2R5KSB9LmdldE9yRGVmYXVsdChKU09OQXJyYXko
KSkKICAgICAgICB9CgogICAgICAgIHZhbCByb290ID0gcnVuQ2F0Y2hpbmcgeyBKU09OT2JqZWN0
KGJvZHkpIH0uZ2V0T3JOdWxsKCkgPzogcmV0dXJuIEpTT05BcnJheSgpCgogICAgICAgIHJvb3Qu
b3B0SlNPTkFycmF5KCJlcGdfbGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJuIGl0IH0KICAgICAgICBy
b290Lm9wdEpTT05BcnJheSgibGlzdGluZ3MiKT8ubGV0IHsgcmV0dXJuIGl0IH0KICAgICAgICBy
b290Lm9wdEpTT05BcnJheSgiZXBnIik/LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgcm9vdC5v
cHRKU09OQXJyYXkoImRhdGEiKT8ubGV0IHsgcmV0dXJuIGl0IH0KCiAgICAgICAgdmFsIGRhdGEg
PSByb290Lm9wdEpTT05PYmplY3QoImRhdGEiKQogICAgICAgIGRhdGE/Lm9wdEpTT05BcnJheSgi
ZXBnX2xpc3RpbmdzIik/LmxldCB7IHJldHVybiBpdCB9CiAgICAgICAgZGF0YT8ub3B0SlNPTkFy
cmF5KCJsaXN0aW5ncyIpPy5sZXQgeyByZXR1cm4gaXQgfQogICAgICAgIGRhdGE/Lm9wdEpTT05B
cnJheSgiZXBnIik/LmxldCB7IHJldHVybiBpdCB9CgogICAgICAgIHZhbCByZXN1bHQgPSByb290
Lm9wdEpTT05PYmplY3QoInJlc3VsdCIpCiAgICAgICAgcmVzdWx0Py5vcHRKU09OQXJyYXkoImVw
Z19saXN0aW5ncyIpPy5sZXQgeyByZXR1cm4gaXQgfQogICAgICAgIHJlc3VsdD8ub3B0SlNPTkFy
cmF5KCJsaXN0aW5ncyIpPy5sZXQgeyByZXR1cm4gaXQgfQoKICAgICAgICByZXR1cm4gSlNPTkFy
cmF5KCkKICAgIH0KCiAgICBwcml2YXRlIGZ1biBmaXJzdEd1aWRlU3RyaW5nKG86IEpTT05PYmpl
Y3QsIHZhcmFyZyBrZXlzOiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIGZvciAoa2V5IGluIGtl
eXMpIHsKICAgICAgICAgICAgdmFsIHZhbHVlID0gby5vcHRTdHJpbmcoa2V5LCAiIikudHJpbSgp
CiAgICAgICAgICAgIGlmICh2YWx1ZS5pc05vdEJsYW5rKCkgJiYgIXZhbHVlLmVxdWFscygibnVs
bCIsIHRydWUpKSByZXR1cm4gdmFsdWUKICAgICAgICB9CiAgICAgICAgcmV0dXJuICIiCiAgICB9
CgogICAgcHJpdmF0ZSBmdW4gZ3VpZGVUaW1lc3RhbXBTZWNvbmRzKG86IEpTT05PYmplY3QsIHZh
cmFyZyBrZXlzOiBTdHJpbmcpOiBMb25nPyB7CiAgICAgICAgZm9yIChrZXkgaW4ga2V5cykgewog
ICAgICAgICAgICB2YWwgcmF3ID0gby5vcHQoa2V5KQogICAgICAgICAgICB2YWwgc2Vjb25kcyA9
IHdoZW4gKHJhdykgewogICAgICAgICAgICAgICAgaXMgTnVtYmVyIC0+IG5vcm1hbGl6ZUd1aWRl
RXBvY2gocmF3LnRvTG9uZygpKQogICAgICAgICAgICAgICAgaXMgU3RyaW5nIC0+IHBhcnNlR3Vp
ZGVEYXRlU2Vjb25kcyhyYXcpCiAgICAgICAgICAgICAgICBlbHNlIC0+IG51bGwKICAgICAgICAg
ICAgfQogICAgICAgICAgICBpZiAoc2Vjb25kcyAhPSBudWxsICYmIHNlY29uZHMgPiAwTCkgcmV0
dXJuIHNlY29uZHMKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG51bGwKICAgIH0KCiAgICBwcml2
YXRlIGZ1biBub3JtYWxpemVHdWlkZUVwb2NoKHZhbHVlOiBMb25nKTogTG9uZz8gewogICAgICAg
IGlmICh2YWx1ZSA8PSAwTCkgcmV0dXJuIG51bGwKICAgICAgICByZXR1cm4gaWYgKHZhbHVlID4g
MTAwXzAwMF8wMDBfMDAwTCkgdmFsdWUgLyAxMDAwTCBlbHNlIHZhbHVlCiAgICB9CgogICAgcHJp
dmF0ZSBmdW4gcGFyc2VHdWlkZURhdGVTZWNvbmRzKHJhdzogU3RyaW5nKTogTG9uZz8gewogICAg
ICAgIHZhbCB2YWx1ZSA9IHJhdy50cmltKCkKICAgICAgICBpZiAodmFsdWUuaXNCbGFuaygpIHx8
IHZhbHVlLmVxdWFscygibnVsbCIsIHRydWUpKSByZXR1cm4gbnVsbAoKICAgICAgICB2YWx1ZS50
b0xvbmdPck51bGwoKT8ubGV0IHsgcmV0dXJuIG5vcm1hbGl6ZUd1aWRlRXBvY2goaXQpIH0KCiAg
ICAgICAgdmFsIHBhdHRlcm5zID0gbGlzdE9mKAogICAgICAgICAgICAieXl5eS1NTS1kZCBISDpt
bTpzcyIsCiAgICAgICAgICAgICJ5eXl5LU1NLWRkIEhIOm1tIiwKICAgICAgICAgICAgInl5eXkt
TU0tZGQgSEg6bW06c3MgWiIsCiAgICAgICAgICAgICJ5eXl5LU1NLWRkJ1QnSEg6bW06c3NYWFgi
LAogICAgICAgICAgICAieXl5eS1NTS1kZCdUJ0hIOm1tOnNzLlNTU1hYWCIsCiAgICAgICAgICAg
ICJ5eXl5LU1NLWRkJ1QnSEg6bW06c3NYIiwKICAgICAgICAgICAgInl5eXlNTWRkSEhtbXNzIFoi
LAogICAgICAgICAgICAieXl5eU1NZGRISG1tc3MiCiAgICAgICAgKQoKICAgICAgICBmb3IgKHBh
dHRlcm4gaW4gcGF0dGVybnMpIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgICAgIHZh
bCBwYXJzZXIgPSBTaW1wbGVEYXRlRm9ybWF0KHBhdHRlcm4sIExvY2FsZS5VUykuYXBwbHkgewog
ICAgICAgICAgICAgICAgICAgIGlzTGVuaWVudCA9IGZhbHNlCiAgICAgICAgICAgICAgICB9CiAg
ICAgICAgICAgICAgICB2YWwgcGFyc2VkID0gcGFyc2VyLnBhcnNlKHZhbHVlKSA/OiBjb250aW51
ZQogICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZC50aW1lIC8gMTAwMEwKICAgICAgICAgICAg
fSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7CiAgICAgICAgICAgICAgICAvLyBUcnkgdGhlIG5leHQg
cHJvdmlkZXIgZGF0ZSBmb3JtYXQuCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0
dXJuIG51bGwKICAgIH0KCiAgICBwcml2YXRlIGZ1biBtZXJnZUd1aWRlRXBnKHZhcmFyZyBsaXN0
czogTGlzdDxFcGdJdGVtPik6IExpc3Q8RXBnSXRlbT4gewogICAgICAgIHJldHVybiBsaXN0cy5h
c1NlcXVlbmNlKCkKICAgICAgICAgICAgLmZsYXR0ZW4oKQogICAgICAgICAgICAuZGlzdGluY3RC
eSB7IGl0ZW0gLT4KICAgICAgICAgICAgICAgICIke2l0ZW0uc3RhcnRUaW1lc3RhbXAgPzogaXRl
bS5zdGFydH18JHtpdGVtLmVuZFRpbWVzdGFtcCA/OiBpdGVtLmVuZH18JHtpdGVtLnRpdGxlfSIK
ICAgICAgICAgICAgfQogICAgICAgICAgICAudG9MaXN0KCkKICAgIH0KCiAgICBwcml2YXRlIGZ1
biBub3JtYWxpemVHdWlkZUVwZyhpdGVtczogTGlzdDxFcGdJdGVtPiwgbGltaXQ6IEludCk6IExp
c3Q8RXBnSXRlbT4gewogICAgICAgIGlmIChpdGVtcy5pc0VtcHR5KCkpIHJldHVybiBlbXB0eUxp
c3QoKQoKICAgICAgICB2YWwgZGVkdXBlZCA9IG1lcmdlR3VpZGVFcGcoaXRlbXMpCiAgICAgICAg
dmFsIGhhc1RpbWVzdGFtcHMgPSBkZWR1cGVkLmFueSB7IGl0LnN0YXJ0VGltZXN0YW1wICE9IG51
bGwgfQoKICAgICAgICB2YWwgc29ydGVkID0gaWYgKGhhc1RpbWVzdGFtcHMpIHsKICAgICAgICAg
ICAgZGVkdXBlZC5zb3J0ZWRXaXRoKAogICAgICAgICAgICAgICAgY29tcGFyZUJ5PEVwZ0l0ZW0+
IHsgaXQuc3RhcnRUaW1lc3RhbXAgPzogTG9uZy5NQVhfVkFMVUUgfQogICAgICAgICAgICAgICAg
ICAgIC50aGVuQnkgeyBpdC5lbmRUaW1lc3RhbXAgPzogTG9uZy5NQVhfVkFMVUUgfQogICAgICAg
ICAgICApCiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgZGVkdXBlZAogICAgICAgIH0KCiAg
ICAgICAgdmFsIG5vdyA9IFN5c3RlbS5jdXJyZW50VGltZU1pbGxpcygpIC8gMTAwMEwKCiAgICAg
ICAgdmFsIGN1cnJlbnRJbmRleCA9IHNvcnRlZC5pbmRleE9mRmlyc3QgeyBpdGVtIC0+CiAgICAg
ICAgICAgIHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXAKICAgICAgICAgICAgdmFsIGVu
ZCA9IGl0ZW0uZW5kVGltZXN0YW1wCiAgICAgICAgICAgIHN0YXJ0ICE9IG51bGwgJiYgZW5kICE9
IG51bGwgJiYgbm93ID49IHN0YXJ0ICYmIG5vdyA8IGVuZAogICAgICAgIH0KICAgICAgICBpZiAo
Y3VycmVudEluZGV4ID49IDApIHsKICAgICAgICAgICAgcmV0dXJuIHNvcnRlZC5kcm9wKGN1cnJl
bnRJbmRleCkudGFrZShsaW1pdCkKICAgICAgICB9CgogICAgICAgIHZhbCB1cGNvbWluZ0luZGV4
ID0gc29ydGVkLmluZGV4T2ZGaXJzdCB7IGl0ZW0gLT4KICAgICAgICAgICAgdmFsIHN0YXJ0ID0g
aXRlbS5zdGFydFRpbWVzdGFtcAogICAgICAgICAgICBzdGFydCAhPSBudWxsICYmIHN0YXJ0ID49
IG5vdwogICAgICAgIH0KICAgICAgICBpZiAodXBjb21pbmdJbmRleCA+PSAwKSB7CiAgICAgICAg
ICAgIHJldHVybiBzb3J0ZWQuZHJvcCh1cGNvbWluZ0luZGV4KS50YWtlKGxpbWl0KQogICAgICAg
IH0KCiAgICAgICAgcmV0dXJuIHNvcnRlZC50YWtlTGFzdChsaW1pdCkKICAgIH0KCiAgICBwcml2
YXRlIGZ1biBoYXNGdWxsR3VpZGVEZXB0aChpdGVtczogTGlzdDxFcGdJdGVtPik6IEJvb2xlYW4g
ewogICAgICAgIGlmIChpdGVtcy5pc0VtcHR5KCkpIHJldHVybiBmYWxzZQoKICAgICAgICB2YWwg
bm93ID0gU3lzdGVtLmN1cnJlbnRUaW1lTWlsbGlzKCkgLyAxMDAwTAogICAgICAgIHZhbCByZWxl
dmFudCA9IGl0ZW1zLmZpbHRlciB7IGl0ZW0gLT4KICAgICAgICAgICAgdmFsIHN0YXJ0ID0gaXRl
bS5zdGFydFRpbWVzdGFtcAogICAgICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3RhbXAK
ICAgICAgICAgICAgc3RhcnQgIT0gbnVsbCAmJgogICAgICAgICAgICAgICAgZW5kICE9IG51bGwg
JiYKICAgICAgICAgICAgICAgIGVuZCA+PSBub3cgLSAyICogMzYwMEwgJiYKICAgICAgICAgICAg
ICAgIHN0YXJ0IDw9IG5vdyArIDEyICogMzYwMEwKICAgICAgICB9CgogICAgICAgIGlmIChyZWxl
dmFudC5pc05vdEVtcHR5KCkpIHsKICAgICAgICAgICAgdmFsIGVhcmxpZXN0ID0gcmVsZXZhbnQu
bWluT2YgeyBpdC5zdGFydFRpbWVzdGFtcCA/OiBMb25nLk1BWF9WQUxVRSB9CiAgICAgICAgICAg
IHZhbCBsYXRlc3QgPSByZWxldmFudC5tYXhPZiB7IGl0LmVuZFRpbWVzdGFtcCA/OiBMb25nLk1J
Tl9WQUxVRSB9CiAgICAgICAgICAgIGlmIChsYXRlc3QgPiBlYXJsaWVzdCAmJiBsYXRlc3QgLSBl
YXJsaWVzdCA+PSA0ICogMzYwMEwpIHJldHVybiB0cnVlCiAgICAgICAgfQoKICAgICAgICAvLyBJ
ZiB0aW1lc3RhbXBzIGFyZSB1bmF2YWlsYWJsZSBidXQgdGhlIHByb3ZpZGVyIHJldHVybmVkIGEg
c3Vic3RhbnRpYWwKICAgICAgICAvLyBzZXF1ZW5jZSBvZiBwcm9ncmFtcywgdHJlYXQgaXQgYXMg
YSBmdWxsIGd1aWRlIHJhdGhlciB0aGFuIGZvcmNpbmcKICAgICAgICAvLyBhbm90aGVyIGVuZHBv
aW50IHJlcXVlc3QuCiAgICAgICAgcmV0dXJuIGl0ZW1zLnNpemUgPj0gMTIKICAgIH0KCgoKICAg
IHByaXZhdGUgZnVuIGVwZ1RpbWVzdGFtcFNlY29uZHMobzogSlNPTk9iamVjdCwgdmFyYXJnIGtl
eXM6IFN0cmluZyk6IExvbmc/IHsKICAgICAgICBmb3IgKGtleSBpbiBrZXlzKSB7CiAgICAgICAg
ICAgIHZhbCByYXcgPSBvLm9wdChrZXkpCiAgICAgICAgICAgIHZhbCB2YWx1ZSA9IHdoZW4gKHJh
dykgewogICAgICAgICAgICAgICAgaXMgTnVtYmVyIC0+IHJhdy50b0xvbmcoKQogICAgICAgICAg
ICAgICAgaXMgU3RyaW5nIC0+IHJhdy50cmltKCkudG9Mb25nT3JOdWxsKCkKICAgICAgICAgICAg
ICAgIGVsc2UgLT4gbnVsbAogICAgICAgICAgICB9ID86IGNvbnRpbnVlCiAgICAgICAgICAgIGlm
ICh2YWx1ZSA8PSAwTCkgY29udGludWUKICAgICAgICAgICAgcmV0dXJuIGlmICh2YWx1ZSA+IDEw
MF8wMDBfMDAwXzAwMEwpIHZhbHVlIC8gMTAwMEwgZWxzZSB2YWx1ZQogICAgICAgIH0KICAgICAg
ICByZXR1cm4gbnVsbAogICAgfQoKICAgIHByaXZhdGUgZnVuIGRlY29kZUVwZ1RleHQocmF3OiBT
dHJpbmcsIGZhbGxiYWNrOiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCB2YWx1ZSA9IHJh
dy50cmltKCkKICAgICAgICBpZiAodmFsdWUuaXNCbGFuaygpKSByZXR1cm4gZmFsbGJhY2sKICAg
ICAgICAvLyBNYW55IFh0cmVhbSBwYW5lbHMgQmFzZTY0LWVuY29kZSB0aXRsZS9kZXNjcmlwdGlv
bi4gT25seSBhdHRlbXB0IGRlY29kZQogICAgICAgIC8vIHdoZW4gdGhlIHZhbHVlIGxvb2tzIGxp
a2UgQmFzZTY0IGFuZCB0aGUgZGVjb2RlZCByZXN1bHQgaXMgcmVhZGFibGUgdGV4dC4KICAgICAg
ICBpZiAodmFsdWUubGVuZ3RoIDwgOCB8fCB2YWx1ZS5sZW5ndGggJSA0ICE9IDAgfHwgIXZhbHVl
Lm1hdGNoZXMoUmVnZXgoIl5bQS1aYS16MC05Ky89XSskIikpKSByZXR1cm4gdmFsdWUKICAgICAg
ICByZXR1cm4gdHJ5IHsKICAgICAgICAgICAgdmFsIGRlY29kZWQgPSBTdHJpbmcoQmFzZTY0LmRl
Y29kZSh2YWx1ZSwgQmFzZTY0LkRFRkFVTFQpLCBDaGFyc2V0cy5VVEZfOCkudHJpbSgpCiAgICAg
ICAgICAgIHZhbCBwcmludGFibGUgPSBkZWNvZGVkLmlzTm90QmxhbmsoKSAmJiBkZWNvZGVkLmNv
dW50IHsgIWl0LmlzSVNPQ29udHJvbCgpIHx8IGl0ID09ICdcbicgfHwgaXQgPT0gJ1xyJyB8fCBp
dCA9PSAnXHQnIH0gPj0gZGVjb2RlZC5sZW5ndGggKiA5IC8gMTAKICAgICAgICAgICAgaWYgKHBy
aW50YWJsZSAmJiAhZGVjb2RlZC5jb250YWlucygnXHVGRkZEJykpIGRlY29kZWQgZWxzZSB2YWx1
ZQogICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAgICAgICAgICB2YWx1ZQogICAg
ICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBjbGVhblJhdGluZyhyYXc6IFN0cmluZyk6IFN0
cmluZyB7CiAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5p
c0JsYW5rKCkgfHwgdmFsdWUgPT0gIjAiIHx8IHZhbHVlID09ICIwLjAiKSByZXR1cm4gIiIKICAg
ICAgICB2YWwgbnVtYmVyID0gdmFsdWUudG9Eb3VibGVPck51bGwoKSA/OiByZXR1cm4gdmFsdWUu
dGFrZSg0KQogICAgICAgIHJldHVybiBpZiAobnVtYmVyID4gNS4wKSBTdHJpbmcuZm9ybWF0KExv
Y2FsZS5VUywgIiUuMWYiLCBudW1iZXIuY29lcmNlQXRNb3N0KDEwLjApKQogICAgICAgIGVsc2Ug
U3RyaW5nLmZvcm1hdChMb2NhbGUuVVMsICIlLjFmIiwgbnVtYmVyKQogICAgfQoKICAgIGZ1biBz
dHJlYW1VcmwoYzogWHRyZWFtQ3JlZGVudGlhbHMsIHN0cmVhbTogTGl2ZVN0cmVhbSk6IFN0cmlu
ZyB7CiAgICAgICAgaWYgKERlbW9DYXRhbG9nLmlzRGVtbyhjKSkgcmV0dXJuIERlbW9DYXRhbG9n
LnN0cmVhbVVybChzdHJlYW0pCiAgICAgICAgdmFsIGV4dCA9IGlmIChzdHJlYW0uZXh0ZW5zaW9u
LmlzQmxhbmsoKSkgInRzIiBlbHNlIHN0cmVhbS5leHRlbnNpb24KICAgICAgICByZXR1cm4gIiR7
YmFzZShjLnNlcnZlcil9L2xpdmUvJHtlbmMoYy51c2VybmFtZSl9LyR7ZW5jKGMucGFzc3dvcmQp
fS8ke3N0cmVhbS5pZH0uJGV4dCIKICAgIH0KfQo=
:::END XTREAM
:::BEGIN GUIDE
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5jb250ZW50LnJlcy5Db25maWd1cmF0aW9uCmltcG9ydCBh
bmRyb2lkLmdyYXBoaWNzLkNvbG9yCmltcG9ydCBhbmRyb2lkLm9zLkJ1bmRsZQppbXBvcnQgYW5k
cm9pZC5vcy5IYW5kbGVyCmltcG9ydCBhbmRyb2lkLm9zLkxvb3BlcgppbXBvcnQgYW5kcm9pZC52
aWV3LkdyYXZpdHkKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLndpZGdl
dC5CdXR0b24KaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkZyYW1lTGF5b3V0CmltcG9ydCBhbmRyb2lk
LndpZGdldC5Ib3Jpem9udGFsU2Nyb2xsVmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuTGlzdFZp
ZXcKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdl
dC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuVG9hc3QKaW1wb3J0IGFuZHJvaWR4LmFw
cGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0aXZpdHkKaW1wb3J0IGphdmEudGV4dC5TaW1wbGVEYXRl
Rm9ybWF0CmltcG9ydCBqYXZhLnV0aWwuRGF0ZQppbXBvcnQgamF2YS51dGlsLkxvY2FsZQppbXBv
cnQgamF2YS51dGlsLmNvbmN1cnJlbnQuQ29uY3VycmVudEhhc2hNYXAKaW1wb3J0IGphdmEudXRp
bC5jb25jdXJyZW50LkV4ZWN1dG9ycwoKY2xhc3MgR3VpZGVBY3Rpdml0eSA6IEFwcENvbXBhdEFj
dGl2aXR5KCkgewogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgY3JlZGVudGlhbHM6IFh0cmVhbUNy
ZWRlbnRpYWxzCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBsaXN0OiBMaXN0VmlldwogICAgcHJp
dmF0ZSBsYXRlaW5pdCB2YXIgcHJvZ3Jlc3M6IFByb2dyZXNzQmFyCiAgICBwcml2YXRlIGxhdGVp
bml0IHZhciBlbXB0eTogVGV4dFZpZXcKICAgIHByaXZhdGUgbGF0ZWluaXQgdmFyIHRpbWVTY3Jv
bGw6IEhvcml6b250YWxTY3JvbGxWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciB0aW1lQmFy
OiBGcmFtZUxheW91dAogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgZGV0YWlsVGl0bGU6IFRleHRW
aWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBkZXRhaWxNZXRhOiBUZXh0VmlldwogICAgcHJp
dmF0ZSBsYXRlaW5pdCB2YXIgZGV0YWlsRGVzY3JpcHRpb246IFRleHRWaWV3CiAgICBwcml2YXRl
IGxhdGVpbml0IHZhciBkZXRhaWxQcm9ncmVzczogUHJvZ3Jlc3NCYXIKICAgIHByaXZhdGUgbGF0
ZWluaXQgdmFyIGRldGFpbFByb2dyZXNzTGFiZWw6IFRleHRWaWV3CiAgICBwcml2YXRlIGxhdGVp
bml0IHZhciB3YXRjaEJ1dHRvbjogQnV0dG9uCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBndWlk
ZU5vd0J1dHRvbjogQnV0dG9uCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBndWlkZUNsb2NrOiBU
ZXh0VmlldwogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgZ3VpZGVEYXRlOiBUZXh0VmlldwogICAg
cHJpdmF0ZSBsYXRlaW5pdCB2YXIgZ3VpZGVDaGFubmVsQ291bnQ6IFRleHRWaWV3CgogICAgcHJp
dmF0ZSB2YWwgZXhlY3V0b3IgPSBFeGVjdXRvcnMubmV3U2luZ2xlVGhyZWFkRXhlY3V0b3IoKQog
ICAgcHJpdmF0ZSB2YWwgZXBnRXhlY3V0b3IgPSBFeGVjdXRvcnMubmV3Rml4ZWRUaHJlYWRQb29s
KDYpCiAgICBwcml2YXRlIHZhbCBndWlkZXMgPSBDb25jdXJyZW50SGFzaE1hcDxJbnQsIExpc3Q8
RXBnSXRlbT4+KCkKICAgIHByaXZhdGUgdmFsIHJlcXVlc3RlZCA9IENvbmN1cnJlbnRIYXNoTWFw
Lm5ld0tleVNldDxJbnQ+KCkKICAgIHByaXZhdGUgdmFsIHVpSGFuZGxlciA9IEhhbmRsZXIoTG9v
cGVyLmdldE1haW5Mb29wZXIoKSkKCiAgICBwcml2YXRlIHZhciBjaGFubmVsczogTGlzdDxMaXZl
U3RyZWFtPiA9IGVtcHR5TGlzdCgpCiAgICBwcml2YXRlIHZhciBhZGFwdGVyOiBFcGdHdWlkZUFk
YXB0ZXI/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgY2F0ZWdvcnlJZDogU3RyaW5nID0gIiIKICAg
IHByaXZhdGUgdmFyIGdlbmVyYXRpb24gPSAwCiAgICBwcml2YXRlIHZhciBzZWxlY3RlZENoYW5u
ZWw6IExpdmVTdHJlYW0/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgc2VsZWN0ZWRJdGVtOiBFcGdJ
dGVtPyA9IG51bGwKICAgIHByaXZhdGUgdmFyIHNlbGVjdGVkU3RhcnRNczogTG9uZyA9IDBMCiAg
ICBwcml2YXRlIHZhciBzZWxlY3RlZEVuZE1zOiBMb25nID0gMEwKICAgIHByaXZhdGUgdmFyIG5v
d01hcmtlcjogVmlldz8gPSBudWxsCiAgICBwcml2YXRlIHZhciBub3dMYWJlbDogVGV4dFZpZXc/
ID0gbnVsbAoKICAgIHByaXZhdGUgdmFsIHNsb3RNcyA9IDMwICogNjBfMDAwTAogICAgcHJpdmF0
ZSB2YWwgdGltZWxpbmVTdGFydE1zOiBMb25nIGJ5IGxhenkgewogICAgICAgIHZhbCBub3cgPSBT
eXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIC8vIEJlZ2luIGF0IHRoZSBjdXJyZW50
IGhhbGYtaG91ci4gVGhlIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGJlZ2FuCiAgICAgICAgLy8g
b25lIHNsb3QgZWFybGllciBhbmQgdGhlbiBzY3JvbGxlZCBldmVyeSByb3cgcGFzdCB0aGUgbGVm
dC1hbGlnbmVkCiAgICAgICAgLy8gdGl0bGUsIGxlYXZpbmcgYSB2aXNpYmxlIHByb2dyYW0gYm94
IHdpdGggaXRzIHRleHQgb2ZmLXNjcmVlbi4KICAgICAgICAobm93IC8gc2xvdE1zKSAqIHNsb3RN
cwogICAgfQogICAgcHJpdmF0ZSB2YWwgdGltZWxpbmVFbmRNczogTG9uZyBieSBsYXp5IHsgdGlt
ZWxpbmVTdGFydE1zICsgOCAqIDYwICogNjBfMDAwTCB9CiAgICBwcml2YXRlIHZhbCBwaXhlbHNQ
ZXJNaW51dGVEcCA9IDUKCiAgICBwcml2YXRlIHZhbCBjbG9ja1RpY2tlciA9IG9iamVjdCA6IFJ1
bm5hYmxlIHsKICAgICAgICBvdmVycmlkZSBmdW4gcnVuKCkgewogICAgICAgICAgICB1cGRhdGVI
ZWFkZXJDbG9jaygpCiAgICAgICAgICAgIHJlZnJlc2hTZWxlY3RlZFByb2dyYW0oKQogICAgICAg
ICAgICB1cGRhdGVOb3dQb3NpdGlvbihqdW1wID0gZmFsc2UpCiAgICAgICAgICAgIHVpSGFuZGxl
ci5wb3N0RGVsYXllZCh0aGlzLCAzMF8wMDBMKQogICAgICAgIH0KICAgIH0KCiAgICBvdmVycmlk
ZSBmdW4gb25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlOiBCdW5kbGU/KSB7CiAgICAgICAgc3Vw
ZXIub25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlKQogICAgICAgIHNldENvbnRlbnRWaWV3KFIu
bGF5b3V0LmFjdGl2aXR5X2d1aWRlKQoKICAgICAgICBjcmVkZW50aWFscyA9IFNlc3Npb24ubG9h
ZCh0aGlzKSA/OiBydW4gewogICAgICAgICAgICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzLCBM
b2dpbkFjdGl2aXR5OjpjbGFzcy5qYXZhKSkKICAgICAgICAgICAgZmluaXNoKCkKICAgICAgICAg
ICAgcmV0dXJuCiAgICAgICAgfQogICAgICAgIGNhdGVnb3J5SWQgPSBpbnRlbnQuZ2V0U3RyaW5n
RXh0cmEoImNhdGVnb3J5SWQiKSA/OiAiIgoKICAgICAgICBsaXN0ID0gZmluZFZpZXdCeUlkKFIu
aWQuZ3VpZGVMaXN0KQogICAgICAgIHByb2dyZXNzID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVQ
cm9ncmVzcykKICAgICAgICBlbXB0eSA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlRW1wdHkpCiAg
ICAgICAgdGltZVNjcm9sbCA9IGZpbmRWaWV3QnlJZChSLmlkLnRpbWVTY3JvbGwpCiAgICAgICAg
dGltZUJhciA9IGZpbmRWaWV3QnlJZChSLmlkLnRpbWVCYXIpCiAgICAgICAgZGV0YWlsVGl0bGUg
PSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbFRpdGxlKQogICAgICAgIGRldGFpbE1ldGEg
PSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbE1ldGEpCiAgICAgICAgZGV0YWlsRGVzY3Jp
cHRpb24gPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlkZURldGFpbERlc2NyaXB0aW9uKQogICAgICAg
IGRldGFpbFByb2dyZXNzID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVEZXRhaWxQcm9ncmVzcykK
ICAgICAgICBkZXRhaWxQcm9ncmVzc0xhYmVsID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVQcm9n
cmVzc0xhYmVsKQogICAgICAgIHdhdGNoQnV0dG9uID0gZmluZFZpZXdCeUlkKFIuaWQuZ3VpZGVX
YXRjaEJ1dHRvbikKICAgICAgICBndWlkZU5vd0J1dHRvbiA9IGZpbmRWaWV3QnlJZChSLmlkLmd1
aWRlTm93QnV0dG9uKQogICAgICAgIGd1aWRlQ2xvY2sgPSBmaW5kVmlld0J5SWQoUi5pZC5ndWlk
ZUNsb2NrKQogICAgICAgIGd1aWRlRGF0ZSA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlRGF0ZSkK
ICAgICAgICBndWlkZUNoYW5uZWxDb3VudCA9IGZpbmRWaWV3QnlJZChSLmlkLmd1aWRlQ2hhbm5l
bENvdW50KQoKICAgICAgICBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLmd1aWRlSG9tZUJ1dHRv
bikuc2V0T25DbGlja0xpc3RlbmVyIHsgZmluaXNoKCkgfQogICAgICAgIGd1aWRlTm93QnV0dG9u
LnNldE9uQ2xpY2tMaXN0ZW5lciB7IGp1bXBUb05vdygpIH0KCiAgICAgICAgd2F0Y2hCdXR0b24u
aXNFbmFibGVkID0gZmFsc2UKICAgICAgICB3YXRjaEJ1dHRvbi5hbHBoYSA9IDAuNTVmCiAgICAg
ICAgd2F0Y2hCdXR0b24uc2V0T25DbGlja0xpc3RlbmVyIHsgc2VsZWN0ZWRDaGFubmVsPy5sZXQg
eyBvcGVuQ2hhbm5lbChpdCkgfSB9CgogICAgICAgIGRldGFpbFRpdGxlLmFwcGx5IHsKICAgICAg
ICAgICAgdGV4dCA9ICJUViBHdWlkZSIKICAgICAgICAgICAgdGV4dFNpemUgPSAyMGYKICAgICAg
ICAgICAgbWF4TGluZXMgPSAyCiAgICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRy
b2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAgIHNldFRleHRDb2xvcihnZXRD
b2xvcihSLmNvbG9yLmtzX3doaXRlKSkKICAgICAgICB9CiAgICAgICAgZGV0YWlsTWV0YS5hcHBs
eSB7CiAgICAgICAgICAgIHRleHQgPSAiU0VMRUNUIEEgUFJPR1JBTSIKICAgICAgICAgICAgdGV4
dFNpemUgPSAxMmYKICAgICAgICAgICAgbWF4TGluZXMgPSAyCiAgICAgICAgICAgIHNldFR5cGVm
YWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQpCiAgICAgICAgICAg
IHNldFRleHRDb2xvcihnZXRDb2xvcihSLmNvbG9yLmtzX3JlZCkpCiAgICAgICAgfQogICAgICAg
IGRldGFpbERlc2NyaXB0aW9uLmFwcGx5IHsKICAgICAgICAgICAgdGV4dCA9ICJDaG9vc2UgYSBw
cm9ncmFtIGNhcmQgdG8gc2VlIGl0cyBjaGFubmVsLCBhaXJ0aW1lLCBkZXNjcmlwdGlvbiwgYW5k
IGxpdmUgcHJvZ3Jlc3MuIgogICAgICAgICAgICB0ZXh0U2l6ZSA9IDE0ZgogICAgICAgICAgICBt
YXhMaW5lcyA9IDMKICAgICAgICAgICAgc2V0TGluZVNwYWNpbmcoMi5kcC50b0Zsb2F0KCksIDFm
KQogICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoUi5jb2xvci5rc19tdXRlZCkpCiAg
ICAgICAgfQogICAgICAgIGRldGFpbFByb2dyZXNzTGFiZWwuYXBwbHkgewogICAgICAgICAgICB0
ZXh0U2l6ZSA9IDEyZgogICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoUi5jb2xvci5r
c19tdXRlZCkpCiAgICAgICAgfQogICAgICAgIGRldGFpbFByb2dyZXNzLnByb2dyZXNzID0gMAog
ICAgICAgIGRldGFpbFByb2dyZXNzTGFiZWwudGV4dCA9ICJQcm9ncmFtIGRldGFpbHMgd2lsbCBh
cHBlYXIgaGVyZSIKICAgICAgICB1cGRhdGVIZWFkZXJDbG9jaygpCiAgICAgICAgYnVpbGRUaW1l
QmFyKCkKICAgICAgICBsb2FkQ2hhbm5lbHMoKQogICAgfQoKICAgIG92ZXJyaWRlIGZ1biBvblJl
c3VtZSgpIHsKICAgICAgICBzdXBlci5vblJlc3VtZSgpCiAgICAgICAgdWlIYW5kbGVyLnJlbW92
ZUNhbGxiYWNrcyhjbG9ja1RpY2tlcikKICAgICAgICB1aUhhbmRsZXIucG9zdChjbG9ja1RpY2tl
cikKICAgIH0KCiAgICBvdmVycmlkZSBmdW4gb25QYXVzZSgpIHsKICAgICAgICB1aUhhbmRsZXIu
cmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2VyKQogICAgICAgIHN1cGVyLm9uUGF1c2UoKQogICAg
fQoKICAgIHByaXZhdGUgZnVuIGxvYWRDaGFubmVscygpIHsKICAgICAgICB2YWwgdGhpc0dlbmVy
YXRpb24gPSArK2dlbmVyYXRpb24KICAgICAgICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5W
SVNJQkxFCiAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgIGxpc3Qu
dmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgIGV4ZWN1dG9yLmV4ZWN1dGUgewogICAgICAg
ICAgICB0cnkgewogICAgICAgICAgICAgICAgdmFsIGxvYWRlZCA9IFh0cmVhbUNsaWVudC5saXZl
U3RyZWFtcyhjcmVkZW50aWFscywgY2F0ZWdvcnlJZCkKICAgICAgICAgICAgICAgIGlmICh0aGlz
R2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQoKICAgICAgICAgICAgICAg
IHZhbCB4bWxDaGFubmVsSWRzID0gbG9hZGVkCiAgICAgICAgICAgICAgICAgICAgLm1hcCB7IGl0
LmVwZ0NoYW5uZWxJZCB9CiAgICAgICAgICAgICAgICAgICAgLmZpbHRlciB7IGl0LmlzTm90Qmxh
bmsoKSB9CiAgICAgICAgICAgICAgICAgICAgLnRvU2V0KCkKCiAgICAgICAgICAgICAgICB2YWwg
eG1sR3VpZGUgPSBpZiAoeG1sQ2hhbm5lbElkcy5pc05vdEVtcHR5KCkpIHsKICAgICAgICAgICAg
ICAgICAgICBydW5DYXRjaGluZyB7CiAgICAgICAgICAgICAgICAgICAgICAgIFh0cmVhbUNsaWVu
dC54bWxUdkd1aWRlKAogICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMsCiAg
ICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxDaGFubmVsSWRzLAogICAgICAgICAgICAgICAg
ICAgICAgICAgICAgdGltZWxpbmVTdGFydE1zLAogICAgICAgICAgICAgICAgICAgICAgICAgICAg
dGltZWxpbmVFbmRNcwogICAgICAgICAgICAgICAgICAgICAgICApCiAgICAgICAgICAgICAgICAg
ICAgfS5nZXRPckRlZmF1bHQoZW1wdHlNYXAoKSkKICAgICAgICAgICAgICAgIH0gZWxzZSB7CiAg
ICAgICAgICAgICAgICAgICAgZW1wdHlNYXAoKQogICAgICAgICAgICAgICAgfQoKICAgICAgICAg
ICAgICAgIGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQog
ICAgICAgICAgICAgICAgY2hhbm5lbHMgPSBsb2FkZWQKCiAgICAgICAgICAgICAgICBndWlkZXMu
Y2xlYXIoKQogICAgICAgICAgICAgICAgcmVxdWVzdGVkLmNsZWFyKCkKICAgICAgICAgICAgICAg
IGxvYWRlZC5mb3JFYWNoIHsgY2hhbm5lbCAtPgogICAgICAgICAgICAgICAgICAgIHZhbCBrZXkg
PSBjaGFubmVsLmVwZ0NoYW5uZWxJZC50cmltKCkubG93ZXJjYXNlKExvY2FsZS5VUykKICAgICAg
ICAgICAgICAgICAgICB2YWwgaXRlbXMgPSB4bWxHdWlkZVtrZXldLm9yRW1wdHkoKQogICAgICAg
ICAgICAgICAgICAgIGlmIChoYXNVc2FibGVHdWlkZShpdGVtcykpIHsKICAgICAgICAgICAgICAg
ICAgICAgICAgZ3VpZGVzW2NoYW5uZWwuaWRdID0gaXRlbXMKICAgICAgICAgICAgICAgICAgICAg
ICAgcmVxdWVzdGVkLmFkZChjaGFubmVsLmlkKQogICAgICAgICAgICAgICAgICAgIH0KICAgICAg
ICAgICAgICAgIH0KCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFkIHsKICAgICAgICAgICAg
ICAgICAgICBpZiAoY2hhbm5lbHMuaXNFbXB0eSgpKSB7CiAgICAgICAgICAgICAgICAgICAgICAg
IHByb2dyZXNzLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAgICAgICAgICAgICAg
ZW1wdHkudGV4dCA9ICJObyBjaGFubmVscyBhcmUgYXZhaWxhYmxlIGZvciB0aGlzIGd1aWRlLiIK
ICAgICAgICAgICAgICAgICAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuVklTSUJMRQog
ICAgICAgICAgICAgICAgICAgICAgICBndWlkZUNoYW5uZWxDb3VudC50ZXh0ID0gIjAgQ0hBTk5F
TFMiCiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybkBydW5PblVpVGhyZWFkCiAgICAgICAg
ICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIGNyZWF0ZUFkYXB0ZXIodGhpc0dlbmVy
YXRpb24pCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IEV4Y2VwdGlv
bikgewogICAgICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAgICAgICAgICAgICAgICAg
cHJvZ3Jlc3MudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAgIGVtcHR5
LnRleHQgPSBlLm1lc3NhZ2UgPzogIlVuYWJsZSB0byBsb2FkIFRWIGd1aWRlIGNoYW5uZWxzLiIK
ICAgICAgICAgICAgICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAg
ICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gY3JlYXRlQWRhcHRlcih0aGlzR2VuZXJhdGlvbjogSW50KSB7CiAgICAgICAgdmFsIGNoYW5u
ZWxXaWR0aCA9IGlmIChyZXNvdXJjZXMuY29uZmlndXJhdGlvbi5vcmllbnRhdGlvbiA9PSBDb25m
aWd1cmF0aW9uLk9SSUVOVEFUSU9OX0xBTkRTQ0FQRSkgMjI0IGVsc2UgMTM4CiAgICAgICAgZ3Vp
ZGVDaGFubmVsQ291bnQudGV4dCA9ICIke2NoYW5uZWxzLnNpemV9IENIQU5ORUxTIgogICAgICAg
IGFkYXB0ZXIgPSBFcGdHdWlkZUFkYXB0ZXIoCiAgICAgICAgICAgIHJvd0NvbnRleHQgPSB0aGlz
LAogICAgICAgICAgICBjaGFubmVscyA9IGNoYW5uZWxzLAogICAgICAgICAgICBndWlkZVByb3Zp
ZGVyID0geyBndWlkZXNbaXQuaWRdIH0sCiAgICAgICAgICAgIHRpbWVsaW5lU3RhcnRNcyA9IHRp
bWVsaW5lU3RhcnRNcywKICAgICAgICAgICAgdGltZWxpbmVFbmRNcyA9IHRpbWVsaW5lRW5kTXMs
CiAgICAgICAgICAgIHBpeGVsc1Blck1pbnV0ZURwID0gcGl4ZWxzUGVyTWludXRlRHAsCiAgICAg
ICAgICAgIGNoYW5uZWxXaWR0aERwID0gY2hhbm5lbFdpZHRoLAogICAgICAgICAgICBvblByb2dy
YW1Gb2N1c2VkID0geyBjaGFubmVsLCBpdGVtLCBzdGFydCwgZW5kLCBjdXJyZW50IC0+IHNlbGVj
dFByb2dyYW0oY2hhbm5lbCwgaXRlbSwgc3RhcnQsIGVuZCwgY3VycmVudCkgfSwKICAgICAgICAg
ICAgb25Qcm9ncmFtQ2xpY2tlZCA9IHsgY2hhbm5lbCwgaXRlbSwgc3RhcnQsIGVuZCwgY3VycmVu
dCAtPgogICAgICAgICAgICAgICAgc2VsZWN0UHJvZ3JhbShjaGFubmVsLCBpdGVtLCBzdGFydCwg
ZW5kLCBjdXJyZW50KQogICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIG9wZW5DaGFubmVsKGNo
YW5uZWwpCiAgICAgICAgICAgICAgICBlbHNlIFRvYXN0Lm1ha2VUZXh0KHRoaXMsICIke2l0ZW0u
dGl0bGV9IHN0YXJ0cyAke2Zvcm1hdFRpbWUoc3RhcnQpfSIsIFRvYXN0LkxFTkdUSF9TSE9SVCku
c2hvdygpCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIG9uSG9yaXpvbnRhbENoYW5nZWQgPSB7
IHggLT4gaWYgKHRpbWVTY3JvbGwuc2Nyb2xsWCAhPSB4KSB0aW1lU2Nyb2xsLnNjcm9sbFRvKHgs
IDApIH0KICAgICAgICApCiAgICAgICAgbGlzdC5hZGFwdGVyID0gYWRhcHRlcgogICAgICAgIGxp
c3QuaXRlbXNDYW5Gb2N1cyA9IHRydWUKICAgICAgICBsaXN0LnZpc2liaWxpdHkgPSBWaWV3LlZJ
U0lCTEUKICAgICAgICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgbGlz
dC5zZXRPblNjcm9sbExpc3RlbmVyKG9iamVjdCA6IGFuZHJvaWQud2lkZ2V0LkFic0xpc3RWaWV3
Lk9uU2Nyb2xsTGlzdGVuZXIgewogICAgICAgICAgICBvdmVycmlkZSBmdW4gb25TY3JvbGxTdGF0
ZUNoYW5nZWQodmlldzogYW5kcm9pZC53aWRnZXQuQWJzTGlzdFZpZXc/LCBzY3JvbGxTdGF0ZTog
SW50KSA9IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uU2Nyb2xsKHZpZXc6IGFuZHJv
aWQud2lkZ2V0LkFic0xpc3RWaWV3PywgZmlyc3RWaXNpYmxlSXRlbTogSW50LCB2aXNpYmxlSXRl
bUNvdW50OiBJbnQsIHRvdGFsSXRlbUNvdW50OiBJbnQpIHsKICAgICAgICAgICAgICAgIGlmICh2
aXNpYmxlSXRlbUNvdW50ID4gMCkgcmVxdWVzdEd1aWRlUmFuZ2UoZmlyc3RWaXNpYmxlSXRlbSwg
dmlzaWJsZUl0ZW1Db3VudCArIDYsIHRoaXNHZW5lcmF0aW9uKQogICAgICAgICAgICB9CiAgICAg
ICAgfSkKICAgICAgICB0aW1lU2Nyb2xsLnNldE9uU2Nyb2xsQ2hhbmdlTGlzdGVuZXIgeyBfLCB4
LCBfLCBfLCBfIC0+IGFkYXB0ZXI/LnNldEdsb2JhbFNjcm9sbFgoeCkgfQogICAgICAgIHJlcXVl
c3RHdWlkZVJhbmdlKDAsIG1pbk9mKDE4LCBjaGFubmVscy5zaXplKSwgdGhpc0dlbmVyYXRpb24p
CiAgICAgICAgbGlzdC5wb3N0IHsKICAgICAgICAgICAganVtcFRvTm93KCkKICAgICAgICAgICAg
c2VsZWN0Rmlyc3RDdXJyZW50UHJvZ3JhbSgpCiAgICAgICAgICAgIGxpc3QucmVxdWVzdEZvY3Vz
KCkKICAgICAgICAgICAgbGlzdC5zZXRTZWxlY3Rpb24oMCkKICAgICAgICB9CiAgICB9CgogICAg
LyoqCiAgICAgKiBYTUxUViByZW1haW5zIHRoZSBwcmVmZXJyZWQgc291cmNlLiBTb21lIGNoYW5u
ZWxzIGluIHRoaXMgcHJvdmlkZXIncwogICAgICogNywwMDArIGNoYW5uZWwgbGlzdCBkbyBub3Qg
aGF2ZSBhIHVzYWJsZSBYTUxUViBtYXRjaCwgc28gZmV0Y2ggdGhlIGZ1bGwKICAgICAqIHBlci1j
aGFubmVsIHRhYmxlIG9uY2UgZm9yIG9ubHkgdGhlIHZpc2libGUgbWlzc2luZyByb3dzLiBBIGNv
bXBsZXRlZAogICAgICogcmVzdWx0IGlzIGNhY2hlZCBhbmQgaXMgbmV2ZXIgY2xlYXJlZCBvciBy
ZXBsYWNlZCBkdXJpbmcgc2Nyb2xsaW5nLgogICAgICovCiAgICBwcml2YXRlIGZ1biByZXF1ZXN0
R3VpZGVSYW5nZShmaXJzdDogSW50LCBjb3VudDogSW50LCB0aGlzR2VuZXJhdGlvbjogSW50KSB7
CiAgICAgICAgaWYgKHRoaXNHZW5lcmF0aW9uICE9IGdlbmVyYXRpb24pIHJldHVybgogICAgICAg
IHZhbCBzdGFydCA9IGZpcnN0LmNvZXJjZUF0TGVhc3QoMCkKICAgICAgICB2YWwgZW5kID0gKHN0
YXJ0ICsgY291bnQpLmNvZXJjZUF0TW9zdChjaGFubmVscy5zaXplKQogICAgICAgIGZvciAoaSBp
biBzdGFydCB1bnRpbCBlbmQpIHsKICAgICAgICAgICAgdmFsIGNoYW5uZWwgPSBjaGFubmVscy5n
ZXRPck51bGwoaSkgPzogY29udGludWUKICAgICAgICAgICAgaWYgKCFyZXF1ZXN0ZWQuYWRkKGNo
YW5uZWwuaWQpKSBjb250aW51ZQogICAgICAgICAgICBlcGdFeGVjdXRvci5leGVjdXRlIHsKICAg
ICAgICAgICAgICAgIHZhbCBmZXRjaGVkID0gcnVuQ2F0Y2hpbmcgewogICAgICAgICAgICAgICAg
ICAgIFh0cmVhbUNsaWVudC5ndWlkZUVwZyhjcmVkZW50aWFscywgY2hhbm5lbC5pZCwgOTYpCiAg
ICAgICAgICAgICAgICB9LmdldE9yRGVmYXVsdChlbXB0eUxpc3QoKSkKICAgICAgICAgICAgICAg
IGlmICh0aGlzR2VuZXJhdGlvbiAhPSBnZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQoKICAgICAg
ICAgICAgICAgIGd1aWRlc1tjaGFubmVsLmlkXSA9IGlmIChoYXNVc2FibGVHdWlkZShmZXRjaGVk
KSkgZmV0Y2hlZCBlbHNlIGVtcHR5TGlzdCgpCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFk
IHsKICAgICAgICAgICAgICAgICAgICBpZiAodGhpc0dlbmVyYXRpb24gPT0gZ2VuZXJhdGlvbikg
ewogICAgICAgICAgICAgICAgICAgICAgICBhZGFwdGVyPy5ub3RpZnlEYXRhU2V0Q2hhbmdlZCgp
CiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEZpcnN0Q3VycmVudFByb2dyYW0oKQogICAg
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAg
IH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBoYXNVc2FibGVHdWlkZShpdGVtczogTGlzdDxFcGdJ
dGVtPik6IEJvb2xlYW4gewogICAgICAgIHJldHVybiBpdGVtcy5hbnkgeyBpdGVtIC0+CiAgICAg
ICAgICAgIHZhbCBzdGFydCA9IGl0ZW0uc3RhcnRUaW1lc3RhbXA/LnRpbWVzKDEwMDBMKQogICAg
ICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3RhbXA/LnRpbWVzKDEwMDBMKQogICAgICAg
ICAgICBzdGFydCAhPSBudWxsICYmIGVuZCAhPSBudWxsICYmIGVuZCA+IHRpbWVsaW5lU3RhcnRN
cyAmJiBzdGFydCA8IHRpbWVsaW5lRW5kTXMKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gYnVpbGRUaW1lQmFyKCkgewogICAgICAgIHRpbWVCYXIucmVtb3ZlQWxsVmlld3MoKQogICAg
ICAgIHZhbCB0b3RhbE1pbnV0ZXMgPSAoKHRpbWVsaW5lRW5kTXMgLSB0aW1lbGluZVN0YXJ0TXMp
IC8gNjBfMDAwTCkudG9JbnQoKQogICAgICAgIHZhbCB3aWR0aFB4ID0gKHRvdGFsTWludXRlcyAq
IHBpeGVsc1Blck1pbnV0ZURwKS5kcAogICAgICAgIHRpbWVCYXIubGF5b3V0UGFyYW1zID0gdGlt
ZUJhci5sYXlvdXRQYXJhbXMuYXBwbHkgeyB3aWR0aCA9IHdpZHRoUHggfQoKICAgICAgICB2YXIg
dCA9IHRpbWVsaW5lU3RhcnRNcwogICAgICAgIHZhciBzbG90SW5kZXggPSAwCiAgICAgICAgd2hp
bGUgKHQgPCB0aW1lbGluZUVuZE1zKSB7CiAgICAgICAgICAgIHZhbCBsZWZ0TWludXRlcyA9ICgo
dCAtIHRpbWVsaW5lU3RhcnRNcykgLyA2MF8wMDBMKS50b0ludCgpCiAgICAgICAgICAgIHZhbCBs
YWJlbCA9IFRleHRWaWV3KHRoaXMpLmFwcGx5IHsKICAgICAgICAgICAgICAgIHRleHQgPSBmb3Jt
YXRUaW1lKHQpCiAgICAgICAgICAgICAgICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoaWYgKHNsb3RJ
bmRleCA9PSAwKSBSLmNvbG9yLmtzX211dGVkIGVsc2UgUi5jb2xvci5rc193aGl0ZSkpCiAgICAg
ICAgICAgICAgICB0ZXh0U2l6ZSA9IDEyZgogICAgICAgICAgICAgICAgc2V0VHlwZWZhY2UodHlw
ZWZhY2UsIGFuZHJvaWQuZ3JhcGhpY3MuVHlwZWZhY2UuQk9MRCkKICAgICAgICAgICAgICAgIGdy
YXZpdHkgPSBHcmF2aXR5LkNFTlRFUl9WRVJUSUNBTAogICAgICAgICAgICAgICAgc2V0UGFkZGlu
ZygxMC5kcCwgMCwgMCwgMCkKICAgICAgICAgICAgICAgIHNldEJhY2tncm91bmRDb2xvcihDb2xv
ci5UUkFOU1BBUkVOVCkKICAgICAgICAgICAgfQogICAgICAgICAgICB0aW1lQmFyLmFkZFZpZXco
bGFiZWwsIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygoMzAgKiBwaXhlbHNQZXJNaW51dGVEcCku
ZHAsIDQ0LmRwKS5hcHBseSB7CiAgICAgICAgICAgICAgICBsZWZ0TWFyZ2luID0gKGxlZnRNaW51
dGVzICogcGl4ZWxzUGVyTWludXRlRHApLmRwCiAgICAgICAgICAgIH0pCgogICAgICAgICAgICB2
YWwgZGl2aWRlciA9IFZpZXcodGhpcykuYXBwbHkgewogICAgICAgICAgICAgICAgc2V0QmFja2dy
b3VuZENvbG9yKGdldENvbG9yKFIuY29sb3Iua3NfbGluZSkpCiAgICAgICAgICAgICAgICBhbHBo
YSA9IDAuNjVmCiAgICAgICAgICAgIH0KICAgICAgICAgICAgdGltZUJhci5hZGRWaWV3KGRpdmlk
ZXIsIEZyYW1lTGF5b3V0LkxheW91dFBhcmFtcygxLmRwLCA0NC5kcCkuYXBwbHkgewogICAgICAg
ICAgICAgICAgbGVmdE1hcmdpbiA9IChsZWZ0TWludXRlcyAqIHBpeGVsc1Blck1pbnV0ZURwKS5k
cAogICAgICAgICAgICB9KQoKICAgICAgICAgICAgdCArPSBzbG90TXMKICAgICAgICAgICAgc2xv
dEluZGV4KysKICAgICAgICB9CgogICAgICAgIG5vd01hcmtlciA9IFZpZXcodGhpcykuYXBwbHkg
ewogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3IoZ2V0Q29sb3IoUi5jb2xvci5rc19yZWQp
KQogICAgICAgICAgICBlbGV2YXRpb24gPSA4ZgogICAgICAgIH0uYWxzbyB7CiAgICAgICAgICAg
IHRpbWVCYXIuYWRkVmlldyhpdCwgRnJhbWVMYXlvdXQuTGF5b3V0UGFyYW1zKDMuZHAsIDQ0LmRw
KSkKICAgICAgICB9CgogICAgICAgIG5vd0xhYmVsID0gVGV4dFZpZXcodGhpcykuYXBwbHkgewog
ICAgICAgICAgICB0ZXh0ID0gIk5PVyIKICAgICAgICAgICAgc2V0VGV4dENvbG9yKGdldENvbG9y
KFIuY29sb3Iua3Nfd2hpdGUpKQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kUmVzb3VyY2UoUi5k
cmF3YWJsZS5iZ19lcGdfbm93X2JhZGdlKQogICAgICAgICAgICB0ZXh0U2l6ZSA9IDlmCiAgICAg
ICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJP
TEQpCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRFUgogICAgICAgICAgICBzZXRQ
YWRkaW5nKDUuZHAsIDAsIDUuZHAsIDApCiAgICAgICAgfS5hbHNvIHsKICAgICAgICAgICAgdGlt
ZUJhci5hZGRWaWV3KGl0LCBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXMoNDguZHAsIDIyLmRwKSkK
ICAgICAgICB9CgogICAgICAgIHVwZGF0ZU5vd1Bvc2l0aW9uKGp1bXAgPSBmYWxzZSkKICAgIH0K
CiAgICBwcml2YXRlIGZ1biB1cGRhdGVOb3dQb3NpdGlvbihqdW1wOiBCb29sZWFuKSB7CiAgICAg
ICAgaWYgKCE6OnRpbWVCYXIuaXNJbml0aWFsaXplZCkgcmV0dXJuCiAgICAgICAgdmFsIHdpZHRo
UHggPSAoKCh0aW1lbGluZUVuZE1zIC0gdGltZWxpbmVTdGFydE1zKSAvIDYwXzAwMEwpICogcGl4
ZWxzUGVyTWludXRlRHApLnRvSW50KCkuZHAKICAgICAgICB2YWwgbm93WCA9ICgoKChTeXN0ZW0u
Y3VycmVudFRpbWVNaWxsaXMoKSAtIHRpbWVsaW5lU3RhcnRNcykuY29lcmNlQXRMZWFzdCgwTCkp
IC8gNjBfMDAwLjApICogcGl4ZWxzUGVyTWludXRlRHApLnRvSW50KCkuZHAKICAgICAgICB2YWwg
c2FmZVggPSBub3dYLmNvZXJjZUluKDAsICh3aWR0aFB4IC0gMy5kcCkuY29lcmNlQXRMZWFzdCgw
KSkKCiAgICAgICAgKG5vd01hcmtlcj8ubGF5b3V0UGFyYW1zIGFzPyBGcmFtZUxheW91dC5MYXlv
dXRQYXJhbXMpPy5sZXQgeyBwYXJhbXMgLT4KICAgICAgICAgICAgcGFyYW1zLmxlZnRNYXJnaW4g
PSBzYWZlWAogICAgICAgICAgICBub3dNYXJrZXI/LmxheW91dFBhcmFtcyA9IHBhcmFtcwogICAg
ICAgIH0KICAgICAgICAobm93TGFiZWw/LmxheW91dFBhcmFtcyBhcz8gRnJhbWVMYXlvdXQuTGF5
b3V0UGFyYW1zKT8ubGV0IHsgcGFyYW1zIC0+CiAgICAgICAgICAgIHBhcmFtcy5sZWZ0TWFyZ2lu
ID0gKHNhZmVYICsgNS5kcCkuY29lcmNlQXRNb3N0KCh3aWR0aFB4IC0gNDguZHApLmNvZXJjZUF0
TGVhc3QoMCkpCiAgICAgICAgICAgIHBhcmFtcy50b3BNYXJnaW4gPSAyLmRwCiAgICAgICAgICAg
IG5vd0xhYmVsPy5sYXlvdXRQYXJhbXMgPSBwYXJhbXMKICAgICAgICB9CiAgICAgICAgbm93TWFy
a2VyPy5yZXF1ZXN0TGF5b3V0KCkKICAgICAgICBub3dMYWJlbD8ucmVxdWVzdExheW91dCgpCgog
ICAgICAgIGlmIChqdW1wKSB7CiAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IHNsb3Qgc3RhcnRz
IG9uIHNjcmVlbiwgc28ga2VlcCBpdHMgbGFiZWwgdmlzaWJsZS4KICAgICAgICAgICAgLy8gSG9y
aXpvbnRhbCBzY3JvbGxpbmcgaXMgc3RpbGwgYXZhaWxhYmxlIGZvciB0aGUgbmV4dCBlaWdodCBo
b3Vycy4KICAgICAgICAgICAgdmFsIHRhcmdldCA9IDAKICAgICAgICAgICAgdGltZVNjcm9sbC5z
bW9vdGhTY3JvbGxUbyh0YXJnZXQsIDApCiAgICAgICAgICAgIGFkYXB0ZXI/LnNldEdsb2JhbFNj
cm9sbFgodGFyZ2V0KQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBqdW1wVG9Ob3co
KSB7CiAgICAgICAgdXBkYXRlSGVhZGVyQ2xvY2soKQogICAgICAgIHVwZGF0ZU5vd1Bvc2l0aW9u
KGp1bXAgPSB0cnVlKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHVwZGF0ZUhlYWRlckNsb2NrKCkg
ewogICAgICAgIHZhbCBub3cgPSBEYXRlKCkKICAgICAgICBndWlkZUNsb2NrLnRleHQgPSBTaW1w
bGVEYXRlRm9ybWF0KCJoOm1tIGEiLCBMb2NhbGUuZ2V0RGVmYXVsdCgpKS5mb3JtYXQobm93KQog
ICAgICAgIGd1aWRlRGF0ZS50ZXh0ID0gU2ltcGxlRGF0ZUZvcm1hdCgiRUVFLCBNTU0gZCIsIExv
Y2FsZS5nZXREZWZhdWx0KCkpLmZvcm1hdChub3cpLnVwcGVyY2FzZShMb2NhbGUuZ2V0RGVmYXVs
dCgpKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHNlbGVjdFByb2dyYW0oY2hhbm5lbDogTGl2ZVN0
cmVhbSwgaXRlbTogRXBnSXRlbSwgc3RhcnQ6IExvbmcsIGVuZDogTG9uZywgY3VycmVudDogQm9v
bGVhbikgewogICAgICAgIHNlbGVjdGVkQ2hhbm5lbCA9IGNoYW5uZWwKICAgICAgICBzZWxlY3Rl
ZEl0ZW0gPSBpdGVtCiAgICAgICAgc2VsZWN0ZWRTdGFydE1zID0gc3RhcnQKICAgICAgICBzZWxl
Y3RlZEVuZE1zID0gZW5kCiAgICAgICAgcmVmcmVzaFNlbGVjdGVkUHJvZ3JhbSgpCiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gc2VsZWN0Rmlyc3RDdXJyZW50UHJvZ3JhbSgpIHsKICAgICAgICBpZiAo
c2VsZWN0ZWRDaGFubmVsICE9IG51bGwpIHJldHVybgogICAgICAgIHZhbCBub3cgPSBTeXN0ZW0u
Y3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIGZvciAoY2hhbm5lbCBpbiBjaGFubmVscykgewog
ICAgICAgICAgICBmb3IgKGl0ZW0gaW4gZ3VpZGVzW2NoYW5uZWwuaWRdLm9yRW1wdHkoKSkgewog
ICAgICAgICAgICAgICAgdmFsIHN0YXJ0ID0gaXRlbS5zdGFydFRpbWVzdGFtcD8udGltZXMoMTAw
MEwpID86IGNvbnRpbnVlCiAgICAgICAgICAgICAgICB2YWwgZW5kID0gaXRlbS5lbmRUaW1lc3Rh
bXA/LnRpbWVzKDEwMDBMKSA/OiBjb250aW51ZQogICAgICAgICAgICAgICAgaWYgKGVuZCA+IHN0
YXJ0ICYmIG5vdyBpbiBzdGFydCB1bnRpbCBlbmQpIHsKICAgICAgICAgICAgICAgICAgICBzZWxl
Y3RQcm9ncmFtKGNoYW5uZWwsIGl0ZW0sIHN0YXJ0LCBlbmQsIHRydWUpCiAgICAgICAgICAgICAg
ICAgICAgcmV0dXJuCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gcmVmcmVzaFNlbGVjdGVkUHJvZ3JhbSgpIHsKICAgICAgICB2
YWwgY2hhbm5lbCA9IHNlbGVjdGVkQ2hhbm5lbCA/OiByZXR1cm4KICAgICAgICB2YWwgaXRlbSA9
IHNlbGVjdGVkSXRlbSA/OiByZXR1cm4KICAgICAgICB2YWwgc3RhcnQgPSBzZWxlY3RlZFN0YXJ0
TXMKICAgICAgICB2YWwgZW5kID0gc2VsZWN0ZWRFbmRNcwogICAgICAgIHZhbCBub3cgPSBTeXN0
ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgICAgIHZhbCBjdXJyZW50ID0gZW5kID4gc3RhcnQg
JiYgbm93IGluIHN0YXJ0IHVudGlsIGVuZAogICAgICAgIHZhbCB1cGNvbWluZyA9IHN0YXJ0ID4g
bm93CiAgICAgICAgdmFsIHRpdGxlID0gaXRlbS50aXRsZS5pZkJsYW5rIHsgIkxpdmUgUHJvZ3Jh
bW1pbmciIH0KCiAgICAgICAgZGV0YWlsVGl0bGUudGV4dCA9IHRpdGxlCgogICAgICAgIHZhbCBw
Y3QgPSBpZiAoY3VycmVudCAmJiBlbmQgPiBzdGFydCkgewogICAgICAgICAgICAoKChub3cgLSBz
dGFydCkuY29lcmNlSW4oMEwsIGVuZCAtIHN0YXJ0KSAqIDEwMCkgLyAoZW5kIC0gc3RhcnQpKS50
b0ludCgpCiAgICAgICAgfSBlbHNlIDAKCiAgICAgICAgZGV0YWlsTWV0YS50ZXh0ID0gYnVpbGRT
dHJpbmcgewogICAgICAgICAgICBhcHBlbmQoaWYgKGN1cnJlbnQpICJMSVZFIE5PVyIgZWxzZSBp
ZiAodXBjb21pbmcpICJVUENPTUlORyIgZWxzZSAiUkVDRU5UIikKICAgICAgICAgICAgYXBwZW5k
KCIgIOKAoiAgJHtjaGFubmVsLm5hbWV9IikKICAgICAgICAgICAgYXBwZW5kKCIgIOKAoiAgJHtm
b3JtYXRUaW1lKHN0YXJ0KX3igJMke2Zvcm1hdFRpbWUoZW5kKX0iKQogICAgICAgICAgICBhcHBl
bmQoIiAg4oCiICAke2Zvcm1hdER1cmF0aW9uKGVuZCAtIHN0YXJ0KX0iKQogICAgICAgIH0KICAg
ICAgICBkZXRhaWxNZXRhLnNldFRleHRDb2xvcihnZXRDb2xvcihpZiAoY3VycmVudCkgUi5jb2xv
ci5rc19yZWQgZWxzZSBSLmNvbG9yLmtzX211dGVkKSkKICAgICAgICBkZXRhaWxEZXNjcmlwdGlv
bi50ZXh0ID0gaXRlbS5kZXNjcmlwdGlvbi5pZkJsYW5rIHsKICAgICAgICAgICAgIk5vIHByb2dy
YW0gZGVzY3JpcHRpb24gaXMgYXZhaWxhYmxlIGZyb20geW91ciBUViBwcm92aWRlci4iCiAgICAg
ICAgfQoKICAgICAgICBkZXRhaWxQcm9ncmVzcy5wcm9ncmVzcyA9IHBjdAogICAgICAgIGRldGFp
bFByb2dyZXNzTGFiZWwudGV4dCA9IHdoZW4gewogICAgICAgICAgICBjdXJyZW50IC0+ICIke2Zv
cm1hdFJlbWFpbmluZyhlbmQgLSBub3cpfSByZW1haW5pbmcgIOKAoiAgJHBjdCUgY29tcGxldGUi
CiAgICAgICAgICAgIHVwY29taW5nIC0+ICJTdGFydHMgaW4gJHtmb3JtYXRSZW1haW5pbmcoc3Rh
cnQgLSBub3cpfSAg4oCiICAke2Zvcm1hdFRpbWUoc3RhcnQpfSIKICAgICAgICAgICAgZWxzZSAt
PiAiUHJvZ3JhbSBlbmRlZCAke2Zvcm1hdFRpbWUoZW5kKX0iCiAgICAgICAgfQoKICAgICAgICB3
YXRjaEJ1dHRvbi5pc0VuYWJsZWQgPSB0cnVlCiAgICAgICAgd2F0Y2hCdXR0b24uYWxwaGEgPSAx
ZgogICAgICAgIHdhdGNoQnV0dG9uLnRleHQgPSBpZiAoY3VycmVudCkgIldBVENIIExJVkUiIGVs
c2UgIkdPIFRPIENIQU5ORUwiCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9ybWF0RHVyYXRpb24o
bXM6IExvbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBtaW51dGVzID0gKG1zLmNvZXJjZUF0TGVh
c3QoMEwpIC8gNjBfMDAwTCkudG9JbnQoKQogICAgICAgIHJldHVybiB3aGVuIHsKICAgICAgICAg
ICAgbWludXRlcyA+PSA2MCAmJiBtaW51dGVzICUgNjAgPT0gMCAtPiAiJHttaW51dGVzIC8gNjB9
IEhSIgogICAgICAgICAgICBtaW51dGVzID49IDYwIC0+ICIke21pbnV0ZXMgLyA2MH0gSFIgJHtt
aW51dGVzICUgNjB9IE1JTiIKICAgICAgICAgICAgZWxzZSAtPiAiJHttaW51dGVzLmNvZXJjZUF0
TGVhc3QoMSl9IE1JTiIKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZm9ybWF0UmVt
YWluaW5nKG1zOiBMb25nKTogU3RyaW5nIHsKICAgICAgICB2YWwgc2FmZSA9IG1zLmNvZXJjZUF0
TGVhc3QoMEwpCiAgICAgICAgdmFsIG1pbnV0ZXMgPSAoc2FmZSAvIDYwXzAwMEwpLnRvSW50KCkK
ICAgICAgICByZXR1cm4gd2hlbiB7CiAgICAgICAgICAgIG1pbnV0ZXMgPj0gNjAgLT4gIiR7bWlu
dXRlcyAvIDYwfWggJHttaW51dGVzICUgNjB9bSIKICAgICAgICAgICAgbWludXRlcyA+IDAgLT4g
IiR7bWludXRlc31tIgogICAgICAgICAgICBlbHNlIC0+ICI8MW0iCiAgICAgICAgfQogICAgfQoK
ICAgIHByaXZhdGUgZnVuIG9wZW5DaGFubmVsKGNoYW5uZWw6IExpdmVTdHJlYW0pIHsKICAgICAg
ICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzLCBQbGF5ZXJBY3Rpdml0eTo6Y2xhc3MuamF2YSku
YXBwbHkgewogICAgICAgICAgICBwdXRFeHRyYSgibmFtZSIsIGNoYW5uZWwubmFtZSkKICAgICAg
ICAgICAgcHV0RXh0cmEoInVybCIsIFh0cmVhbUNsaWVudC5zdHJlYW1VcmwoY3JlZGVudGlhbHMs
IGNoYW5uZWwpKQogICAgICAgICAgICBwdXRFeHRyYSgia2luZCIsICJsaXZlIikKICAgICAgICAg
ICAgcHV0RXh0cmEoInN0cmVhbUlkIiwgY2hhbm5lbC5pZCkKICAgICAgICB9KQogICAgfQoKICAg
IHByaXZhdGUgZnVuIGZvcm1hdFRpbWUobXM6IExvbmcpOiBTdHJpbmcgPSB0cnkgewogICAgICAg
IFNpbXBsZURhdGVGb3JtYXQoImg6bW0gYSIsIExvY2FsZS5nZXREZWZhdWx0KCkpLmZvcm1hdChE
YXRlKG1zKSkKICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgeyAiIiB9CgogICAgcHJpdmF0ZSB2
YWwgSW50LmRwOiBJbnQgZ2V0KCkgPSAodGhpcyAqIHJlc291cmNlcy5kaXNwbGF5TWV0cmljcy5k
ZW5zaXR5KS50b0ludCgpCgogICAgb3ZlcnJpZGUgZnVuIG9uRGVzdHJveSgpIHsKICAgICAgICBn
ZW5lcmF0aW9uKysKICAgICAgICB1aUhhbmRsZXIucmVtb3ZlQ2FsbGJhY2tzKGNsb2NrVGlja2Vy
KQogICAgICAgIGV4ZWN1dG9yLnNodXRkb3duTm93KCkKICAgICAgICBlcGdFeGVjdXRvci5zaHV0
ZG93bk5vdygpCiAgICAgICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
:::END GUIDE
:::BEGIN ADAPTER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQ29sb3IKaW1wb3J0IGFuZHJvaWQudGV4
dC5UZXh0VXRpbHMKaW1wb3J0IGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlCmltcG9ydCBhbmRyb2lk
LnZpZXcuR3Jhdml0eQppbXBvcnQgYW5kcm9pZC52aWV3LlZpZXcKaW1wb3J0IGFuZHJvaWQudmll
dy5WaWV3R3JvdXAKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkFycmF5QWRhcHRlcgppbXBvcnQgYW5k
cm9pZC53aWRnZXQuRnJhbWVMYXlvdXQKaW1wb3J0IGFuZHJvaWQud2lkZ2V0Lkhvcml6b250YWxT
Y3JvbGxWaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5MaW5lYXJMYXlvdXQKaW1wb3J0IGFuZHJv
aWQud2lkZ2V0LlRleHRWaWV3CmltcG9ydCBhbmRyb2lkeC5jb3JlLndpZGdldC5UZXh0Vmlld0Nv
bXBhdAppbXBvcnQgamF2YS50ZXh0LlNpbXBsZURhdGVGb3JtYXQKaW1wb3J0IGphdmEudXRpbC5D
b2xsZWN0aW9ucwppbXBvcnQgamF2YS51dGlsLkRhdGUKaW1wb3J0IGphdmEudXRpbC5Mb2NhbGUK
aW1wb3J0IGphdmEudXRpbC5XZWFrSGFzaE1hcAppbXBvcnQga290bGluLm1hdGgubWF4CmltcG9y
dCBrb3RsaW4ubWF0aC5taW4KCi8qKgogKiBDb21wbGV0ZSBmaXhlZC1ncmlkIEVQRyByZW5kZXJl
ci4KICoKICogVGhlIHByZXZpb3VzIHZhcmlhYmxlLXdpZHRoIEZyYW1lTGF5b3V0IHJlbmRlcmVy
IGhhcyBiZWVuIHJlbW92ZWQuIEV2ZXJ5CiAqIGNoYW5uZWwgb3ducyBleGFjdGx5IG9uZSBob3Jp
em9udGFsIGxhbmUgYnVpbHQgb24gYSBmaXZlLW1pbnV0ZSBncmlkIGFsaWduZWQKICogd2l0aCB0
aGUgdGltZSBoZWFkZXIuIENvbnNlY3V0aXZlIHNsaWNlcyBiZWxvbmdpbmcgdG8gdGhlIHNhbWUg
cHJvZ3JhbW1lIGFyZQogKiBtZXJnZWQgaW50byBvbmUgZHVyYXRpb24td2lkdGggY2FyZCwgd2hp
bGUgZXZlcnkgc2xpY2Ugc3RpbGwgc2VsZWN0cyBhdCBtb3N0CiAqIG9uZSBwcm92aWRlciBwcm9n
cmFtbWUuIFN0YWNraW5nIGFuZCBvdmVybGFwIHJlbWFpbiBzdHJ1Y3R1cmFsbHkgaW1wb3NzaWJs
ZS4KICovCmNsYXNzIEVwZ0d1aWRlQWRhcHRlcigKICAgIHByaXZhdGUgdmFsIHJvd0NvbnRleHQ6
IENvbnRleHQsCiAgICBwcml2YXRlIHZhbCBjaGFubmVsczogTGlzdDxMaXZlU3RyZWFtPiwKICAg
IHByaXZhdGUgdmFsIGd1aWRlUHJvdmlkZXI6IChMaXZlU3RyZWFtKSAtPiBMaXN0PEVwZ0l0ZW0+
PywKICAgIHByaXZhdGUgdmFsIHRpbWVsaW5lU3RhcnRNczogTG9uZywKICAgIHByaXZhdGUgdmFs
IHRpbWVsaW5lRW5kTXM6IExvbmcsCiAgICBwcml2YXRlIHZhbCBwaXhlbHNQZXJNaW51dGVEcDog
SW50LAogICAgcHJpdmF0ZSB2YWwgY2hhbm5lbFdpZHRoRHA6IEludCwKICAgIHByaXZhdGUgdmFs
IG9uUHJvZ3JhbUZvY3VzZWQ6IChMaXZlU3RyZWFtLCBFcGdJdGVtLCBMb25nLCBMb25nLCBCb29s
ZWFuKSAtPiBVbml0LAogICAgcHJpdmF0ZSB2YWwgb25Qcm9ncmFtQ2xpY2tlZDogKExpdmVTdHJl
YW0sIEVwZ0l0ZW0sIExvbmcsIExvbmcsIEJvb2xlYW4pIC0+IFVuaXQsCiAgICBwcml2YXRlIHZh
bCBvbkhvcml6b250YWxDaGFuZ2VkOiAoSW50KSAtPiBVbml0CikgOiBBcnJheUFkYXB0ZXI8TGl2
ZVN0cmVhbT4ocm93Q29udGV4dCwgYW5kcm9pZC5SLmxheW91dC5zaW1wbGVfbGlzdF9pdGVtXzEs
IGNoYW5uZWxzKSB7CgogICAgcHJpdmF0ZSBkYXRhIGNsYXNzIFJlc29sdmVkRXZlbnQoCiAgICAg
ICAgdmFsIGl0ZW06IEVwZ0l0ZW0sCiAgICAgICAgdmFsIHN0YXJ0TXM6IExvbmcsCiAgICAgICAg
dmFsIGVuZE1zOiBMb25nCiAgICApCgogICAgcHJpdmF0ZSB2YWwgdmlzaWJsZVNjcm9sbHMgPSBD
b2xsZWN0aW9ucy5uZXdTZXRGcm9tTWFwKFdlYWtIYXNoTWFwPEhvcml6b250YWxTY3JvbGxWaWV3
LCBCb29sZWFuPigpKQogICAgcHJpdmF0ZSB2YXIgc3luY2luZyA9IGZhbHNlCiAgICBwcml2YXRl
IHZhciBnbG9iYWxTY3JvbGxYID0gMAogICAgcHJpdmF0ZSB2YWwgbm93TXM6IExvbmcgZ2V0KCkg
PSBTeXN0ZW0uY3VycmVudFRpbWVNaWxsaXMoKQogICAgcHJpdmF0ZSB2YWwgcm93SGVpZ2h0UHgg
PSA4Ni5kcAogICAgcHJpdmF0ZSB2YWwgc2xvdE1zID0gMzAgKiA2MF8wMDBMCiAgICBwcml2YXRl
IHZhbCBxdWFudHVtTXMgPSA1ICogNjBfMDAwTAogICAgcHJpdmF0ZSB2YWwgcXVhbnR1bVdpZHRo
UHggPSAoNSAqIHBpeGVsc1Blck1pbnV0ZURwKS5kcAogICAgcHJpdmF0ZSB2YWwgcXVhbnR1bUNv
dW50ID0gKCgodGltZWxpbmVFbmRNcyAtIHRpbWVsaW5lU3RhcnRNcykgKyBxdWFudHVtTXMgLSAx
TCkgLyBxdWFudHVtTXMpLnRvSW50KCkKICAgIHByaXZhdGUgdmFsIHRpbWVsaW5lV2lkdGhQeCA9
IHF1YW50dW1Db3VudCAqIHF1YW50dW1XaWR0aFB4CgogICAgb3ZlcnJpZGUgZnVuIGdldENvdW50
KCk6IEludCA9IGNoYW5uZWxzLnNpemUKCiAgICBvdmVycmlkZSBmdW4gZ2V0Vmlldyhwb3NpdGlv
bjogSW50LCBjb252ZXJ0VmlldzogVmlldz8sIHBhcmVudDogVmlld0dyb3VwKTogVmlldyB7CiAg
ICAgICAgdmFsIGNoYW5uZWwgPSBjaGFubmVsc1twb3NpdGlvbl0KICAgICAgICB2YWwgcm9vdCA9
IExpbmVhckxheW91dChyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIG9yaWVudGF0aW9u
ID0gTGluZWFyTGF5b3V0LkhPUklaT05UQUwKICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHku
Q0VOVEVSX1ZFUlRJQ0FMCiAgICAgICAgICAgIGxheW91dFBhcmFtcyA9IFZpZXdHcm91cC5MYXlv
dXRQYXJhbXMoVmlld0dyb3VwLkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQsIHJvd0hlaWdodFB4
KQogICAgICAgICAgICBzZXRQYWRkaW5nKDAsIDMuZHAsIDAsIDMuZHApCiAgICAgICAgICAgIGRl
c2NlbmRhbnRGb2N1c2FiaWxpdHkgPSBWaWV3R3JvdXAuRk9DVVNfQUZURVJfREVTQ0VOREFOVFMK
ICAgICAgICB9CgogICAgICAgIHZhbCBjaGFubmVsQ2VsbCA9IFRleHRWaWV3KHJvd0NvbnRleHQp
LmFwcGx5IHsKICAgICAgICAgICAgdGV4dCA9IFN0cmluZy5mb3JtYXQoTG9jYWxlLmdldERlZmF1
bHQoKSwgIiUwM2QgICAlcyIsIHBvc2l0aW9uICsgMSwgY2hhbm5lbC5uYW1lKQogICAgICAgICAg
ICBzZXRUZXh0Q29sb3IoQ29sb3IuV0hJVEUpCiAgICAgICAgICAgIHRleHRTaXplID0gMTNmCiAg
ICAgICAgICAgIHNldFR5cGVmYWNlKHR5cGVmYWNlLCBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNl
LkJPTEQpCiAgICAgICAgICAgIGdyYXZpdHkgPSBHcmF2aXR5LkNFTlRFUl9WRVJUSUNBTAogICAg
ICAgICAgICBtYXhMaW5lcyA9IDIKICAgICAgICAgICAgZWxsaXBzaXplID0gVGV4dFV0aWxzLlRy
dW5jYXRlQXQuRU5ECiAgICAgICAgICAgIHNldFBhZGRpbmcoMTMuZHAsIDYuZHAsIDEwLmRwLCA2
LmRwKQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kUmVzb3VyY2UoUi5kcmF3YWJsZS5iZ19lcGdf
Y2hhbm5lbCkKICAgICAgICAgICAgaXNGb2N1c2FibGUgPSBmYWxzZQogICAgICAgICAgICBpc0Ns
aWNrYWJsZSA9IGZhbHNlCiAgICAgICAgfQogICAgICAgIHJvb3QuYWRkVmlldygKICAgICAgICAg
ICAgY2hhbm5lbENlbGwsCiAgICAgICAgICAgIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoY2hh
bm5lbFdpZHRoRHAuZHAsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5UKS5h
cHBseSB7CiAgICAgICAgICAgICAgICBtYXJnaW5FbmQgPSA2LmRwCiAgICAgICAgICAgIH0KICAg
ICAgICApCgogICAgICAgIHZhbCBzY3JvbGwgPSBIb3Jpem9udGFsU2Nyb2xsVmlldyhyb3dDb250
ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIGlzSG9yaXpvbnRhbFNjcm9sbEJhckVuYWJsZWQgPSBm
YWxzZQogICAgICAgICAgICBpc0ZpbGxWaWV3cG9ydCA9IGZhbHNlCiAgICAgICAgICAgIG92ZXJT
Y3JvbGxNb2RlID0gVmlldy5PVkVSX1NDUk9MTF9ORVZFUgogICAgICAgICAgICBpc0ZvY3VzYWJs
ZSA9IGZhbHNlCiAgICAgICAgICAgIGRlc2NlbmRhbnRGb2N1c2FiaWxpdHkgPSBWaWV3R3JvdXAu
Rk9DVVNfQUZURVJfREVTQ0VOREFOVFMKICAgICAgICB9CiAgICAgICAgdmlzaWJsZVNjcm9sbHMu
YWRkKHNjcm9sbCkKCiAgICAgICAgdmFsIGNhbnZhcyA9IEZyYW1lTGF5b3V0KHJvd0NvbnRleHQp
LmFwcGx5IHsKICAgICAgICAgICAgbGF5b3V0UGFyYW1zID0gVmlld0dyb3VwLkxheW91dFBhcmFt
cyh0aW1lbGluZVdpZHRoUHgsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5U
KQogICAgICAgICAgICBzZXRCYWNrZ3JvdW5kQ29sb3Iocm93Q29udGV4dC5nZXRDb2xvcihSLmNv
bG9yLmtzX2d1aWRlX2NhbnZhcykpCiAgICAgICAgfQoKICAgICAgICB2YWwgbGFuZSA9IExpbmVh
ckxheW91dChyb3dDb250ZXh0KS5hcHBseSB7CiAgICAgICAgICAgIG9yaWVudGF0aW9uID0gTGlu
ZWFyTGF5b3V0LkhPUklaT05UQUwKICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VOVEVS
X1ZFUlRJQ0FMCiAgICAgICAgfQogICAgICAgIGNhbnZhcy5hZGRWaWV3KAogICAgICAgICAgICBs
YW5lLAogICAgICAgICAgICBGcmFtZUxheW91dC5MYXlvdXRQYXJhbXModGltZWxpbmVXaWR0aFB4
LCA3NC5kcCkuYXBwbHkgeyB0b3BNYXJnaW4gPSAzLmRwIH0KICAgICAgICApCgogICAgICAgIHZh
bCBndWlkZSA9IGd1aWRlUHJvdmlkZXIoY2hhbm5lbCkKICAgICAgICB2YWwgZXZlbnRzID0gZ3Vp
ZGU/LmxldCB7IHJlc29sdmVFdmVudHMoaXQpIH0ub3JFbXB0eSgpCgogICAgICAgIHZhbCBzZWxl
Y3RlZCA9IExpc3QocXVhbnR1bUNvdW50KSB7IHF1YW50dW1JbmRleCAtPgogICAgICAgICAgICBp
ZiAoZ3VpZGUgPT0gbnVsbCkgbnVsbAogICAgICAgICAgICBlbHNlIHsKICAgICAgICAgICAgICAg
IHZhbCBxdWFudHVtU3RhcnQgPSB0aW1lbGluZVN0YXJ0TXMgKyBxdWFudHVtSW5kZXggKiBxdWFu
dHVtTXMKICAgICAgICAgICAgICAgIHZhbCBxdWFudHVtRW5kID0gbWluKHF1YW50dW1TdGFydCAr
IHF1YW50dW1NcywgdGltZWxpbmVFbmRNcykKICAgICAgICAgICAgICAgIHByb2dyYW1Gb3JTbG90
KGV2ZW50cywgcXVhbnR1bVN0YXJ0LCBxdWFudHVtRW5kKQogICAgICAgICAgICB9CiAgICAgICAg
fQoKICAgICAgICB2YXIgcXVhbnR1bUluZGV4ID0gMAogICAgICAgIHdoaWxlIChxdWFudHVtSW5k
ZXggPCBxdWFudHVtQ291bnQpIHsKICAgICAgICAgICAgdmFsIGV2ZW50ID0gc2VsZWN0ZWRbcXVh
bnR1bUluZGV4XQogICAgICAgICAgICB2YWwgbG9hZGluZyA9IGd1aWRlID09IG51bGwKICAgICAg
ICAgICAgdmFyIHNwYW4gPSAxCiAgICAgICAgICAgIGlmIChldmVudCAhPSBudWxsKSB7CiAgICAg
ICAgICAgICAgICB3aGlsZSAoCiAgICAgICAgICAgICAgICAgICAgcXVhbnR1bUluZGV4ICsgc3Bh
biA8IHF1YW50dW1Db3VudCAmJgogICAgICAgICAgICAgICAgICAgIHNhbWVQcm9ncmFtbWUoZXZl
bnQsIHNlbGVjdGVkW3F1YW50dW1JbmRleCArIHNwYW5dKQogICAgICAgICAgICAgICAgKSB7CiAg
ICAgICAgICAgICAgICAgICAgc3BhbisrCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0g
ZWxzZSB7CiAgICAgICAgICAgICAgICAvLyBLZWVwIGxvYWRpbmcgYW5kIG1pc3NpbmctZGF0YSBw
bGFjZWhvbGRlcnMgcmVhZGFibGUgaW4KICAgICAgICAgICAgICAgIC8vIHJlZ3VsYXIgaGFsZi1o
b3VyIGJsb2NrcyBpbnN0ZWFkIG9mIG9uZSBlaWdodC1ob3VyIGNhcmQuCiAgICAgICAgICAgICAg
ICB3aGlsZSAoCiAgICAgICAgICAgICAgICAgICAgc3BhbiA8IDYgJiYKICAgICAgICAgICAgICAg
ICAgICBxdWFudHVtSW5kZXggKyBzcGFuIDwgcXVhbnR1bUNvdW50ICYmCiAgICAgICAgICAgICAg
ICAgICAgc2VsZWN0ZWRbcXVhbnR1bUluZGV4ICsgc3Bhbl0gPT0gbnVsbAogICAgICAgICAgICAg
ICAgKSB7CiAgICAgICAgICAgICAgICAgICAgc3BhbisrCiAgICAgICAgICAgICAgICB9CiAgICAg
ICAgICAgIH0KCiAgICAgICAgICAgIHZhbCB2aXNpYmxlU3RhcnQgPSB0aW1lbGluZVN0YXJ0TXMg
KyBxdWFudHVtSW5kZXggKiBxdWFudHVtTXMKICAgICAgICAgICAgdmFsIHZpc2libGVFbmQgPSBt
aW4odmlzaWJsZVN0YXJ0ICsgc3BhbiAqIHF1YW50dW1NcywgdGltZWxpbmVFbmRNcykKICAgICAg
ICAgICAgdmFsIGl0ZW0gPSBldmVudD8uaXRlbSA/OiBFcGdJdGVtKAogICAgICAgICAgICAgICAg
dGl0bGUgPSBpZiAobG9hZGluZykgIkxvYWRpbmcgR3VpZGUiIGVsc2UgIk5vIEluZm9ybWF0aW9u
IiwKICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gIiIsCiAgICAgICAgICAgICAgICBzdGFy
dCA9ICIiLAogICAgICAgICAgICAgICAgZW5kID0gIiIsCiAgICAgICAgICAgICAgICBzdGFydFRp
bWVzdGFtcCA9IHZpc2libGVTdGFydCAvIDEwMDBMLAogICAgICAgICAgICAgICAgZW5kVGltZXN0
YW1wID0gdmlzaWJsZUVuZCAvIDEwMDBMCiAgICAgICAgICAgICkKICAgICAgICAgICAgdmFsIGV2
ZW50U3RhcnQgPSBldmVudD8uc3RhcnRNcyA/OiB2aXNpYmxlU3RhcnQKICAgICAgICAgICAgdmFs
IGV2ZW50RW5kID0gZXZlbnQ/LmVuZE1zID86IHZpc2libGVFbmQKICAgICAgICAgICAgdmFsIGN1
cnJlbnQgPSBub3dNcyBpbiBldmVudFN0YXJ0IHVudGlsIGV2ZW50RW5kICYmICFsb2FkaW5nCiAg
ICAgICAgICAgIHZhbCBwYXN0ID0gZXZlbnRFbmQgPD0gbm93TXMKICAgICAgICAgICAgdmFsIG5v
SW5mb3JtYXRpb24gPSBldmVudCA9PSBudWxsICYmICFsb2FkaW5nCiAgICAgICAgICAgIHZhbCBj
b21wYWN0Q2FyZCA9IHNwYW4gPD0gNgogICAgICAgICAgICB2YWwgdGl0bGUgPSB3aGVuIHsKICAg
ICAgICAgICAgICAgIGxvYWRpbmcgLT4gIkxPQURJTkcgR1VJREXigKYiCiAgICAgICAgICAgICAg
ICBub0luZm9ybWF0aW9uIC0+ICJOTyBHVUlERSBEQVRBIgogICAgICAgICAgICAgICAgY3VycmVu
dCAmJiAhY29tcGFjdENhcmQgLT4gIkxJVkUgIOKAoiAgJHtpdGVtLnRpdGxlLmlmQmxhbmsgeyAi
TElWRSBQUk9HUkFNTUlORyIgfX0iCiAgICAgICAgICAgICAgICBlbHNlIC0+IGl0ZW0udGl0bGUu
aWZCbGFuayB7ICJMSVZFIFBST0dSQU1NSU5HIiB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAg
dmFsIHRpbWUgPSBmb3JtYXRSYW5nZShldmVudFN0YXJ0LCBldmVudEVuZCkKCiAgICAgICAgICAg
IHZhbCBibG9jayA9IFRleHRWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgICAg
IC8vIEhhbGYtaG91ciBjYXJkcyBoYXZlIGxpbWl0ZWQgd2lkdGguIFRoZWlyIGV4YWN0IHRpbWUg
aXMKICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgc2hvd24gYnkgdGhlIGFsaWduZWQgaGVhZGVy
IGFuZCBkZXRhaWxzIHBhbmVsLCBzbwogICAgICAgICAgICAgICAgLy8gcmVzZXJ2ZSB0aGUgZnVs
bCBjYXJkIGZvciB0aGUgcHJvZ3JhbW1lIHRpdGxlLgogICAgICAgICAgICAgICAgdGV4dCA9IGlm
IChjb21wYWN0Q2FyZCkgdGl0bGUgZWxzZSAiJHRpdGxlXG4kdGltZSIKICAgICAgICAgICAgICAg
IHNldFRleHRDb2xvcihDb2xvci5XSElURSkKICAgICAgICAgICAgICAgIGVsbGlwc2l6ZSA9IFRl
eHRVdGlscy5UcnVuY2F0ZUF0LkVORAogICAgICAgICAgICAgICAgaW5jbHVkZUZvbnRQYWRkaW5n
ID0gZmFsc2UKICAgICAgICAgICAgICAgIGlmIChjb21wYWN0Q2FyZCkgewogICAgICAgICAgICAg
ICAgICAgIHRleHRTaXplID0gMTBmCiAgICAgICAgICAgICAgICAgICAgbWF4TGluZXMgPSA2CiAg
ICAgICAgICAgICAgICAgICAgZ3Jhdml0eSA9IEdyYXZpdHkuQ0VOVEVSCiAgICAgICAgICAgICAg
ICAgICAgdGV4dEFsaWdubWVudCA9IFZpZXcuVEVYVF9BTElHTk1FTlRfQ0VOVEVSCiAgICAgICAg
ICAgICAgICAgICAgZWxsaXBzaXplID0gbnVsbAogICAgICAgICAgICAgICAgICAgIHNldEhvcml6
b250YWxseVNjcm9sbGluZyhmYWxzZSkKICAgICAgICAgICAgICAgICAgICBzZXRMaW5lU3BhY2lu
ZygwZiwgMC45MGYpCiAgICAgICAgICAgICAgICAgICAgc2V0UGFkZGluZygyLmRwLCAxLmRwLCAy
LmRwLCAxLmRwKQogICAgICAgICAgICAgICAgICAgIFRleHRWaWV3Q29tcGF0LnNldEF1dG9TaXpl
VGV4dFR5cGVVbmlmb3JtV2l0aENvbmZpZ3VyYXRpb24oCiAgICAgICAgICAgICAgICAgICAgICAg
IHRoaXMsCiAgICAgICAgICAgICAgICAgICAgICAgIDYsCiAgICAgICAgICAgICAgICAgICAgICAg
IDEwLAogICAgICAgICAgICAgICAgICAgICAgICAxLAogICAgICAgICAgICAgICAgICAgICAgICBU
eXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUAogICAgICAgICAgICAgICAgICAgICkKICAgICAgICAg
ICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICAgICAgc2V0VGV4dFNpemUoVHlwZWRWYWx1
ZS5DT01QTEVYX1VOSVRfU1AsIDEzZikKICAgICAgICAgICAgICAgICAgICBtYXhMaW5lcyA9IDQK
ICAgICAgICAgICAgICAgICAgICBncmF2aXR5ID0gR3Jhdml0eS5DRU5URVJfVkVSVElDQUwKICAg
ICAgICAgICAgICAgICAgICB0ZXh0QWxpZ25tZW50ID0gVmlldy5URVhUX0FMSUdOTUVOVF9WSUVX
X1NUQVJUCiAgICAgICAgICAgICAgICAgICAgc2V0TGluZVNwYWNpbmcoMGYsIDFmKQogICAgICAg
ICAgICAgICAgICAgIHNldFBhZGRpbmcoMTIuZHAsIDQuZHAsIDEwLmRwLCA0LmRwKQogICAgICAg
ICAgICAgICAgfQogICAgICAgICAgICAgICAgc2V0VHlwZWZhY2UodHlwZWZhY2UsIGlmIChjdXJy
ZW50KSBhbmRyb2lkLmdyYXBoaWNzLlR5cGVmYWNlLkJPTEQgZWxzZSBhbmRyb2lkLmdyYXBoaWNz
LlR5cGVmYWNlLk5PUk1BTCkKICAgICAgICAgICAgICAgIHNldEJhY2tncm91bmRSZXNvdXJjZSgK
ICAgICAgICAgICAgICAgICAgICB3aGVuIHsKICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVu
dCAmJiAhbm9JbmZvcm1hdGlvbiAtPiBSLmRyYXdhYmxlLmJnX2VwZ19ub3cKICAgICAgICAgICAg
ICAgICAgICAgICAgcGFzdCB8fCBsb2FkaW5nIC0+IFIuZHJhd2FibGUuYmdfZXBnX3Bhc3QKICAg
ICAgICAgICAgICAgICAgICAgICAgZWxzZSAtPiBSLmRyYXdhYmxlLmJnX2VwZ19wcm9ncmFtCiAg
ICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgKQogICAgICAgICAgICAgICAgaXNG
b2N1c2FibGUgPSAhbG9hZGluZwogICAgICAgICAgICAgICAgaXNGb2N1c2FibGVJblRvdWNoTW9k
ZSA9IGZhbHNlCiAgICAgICAgICAgICAgICBpc0NsaWNrYWJsZSA9ICFsb2FkaW5nCiAgICAgICAg
ICAgICAgICBjb250ZW50RGVzY3JpcHRpb24gPSAiJHtjaGFubmVsLm5hbWV9LCAkdGl0bGUsICR0
aW1lIgogICAgICAgICAgICAgICAgaWYgKCFsb2FkaW5nKSB7CiAgICAgICAgICAgICAgICAgICAg
c2V0T25Gb2N1c0NoYW5nZUxpc3RlbmVyIHsgdmlldywgaGFzRm9jdXMgLT4KICAgICAgICAgICAg
ICAgICAgICAgICAgdmlldy5lbGV2YXRpb24gPSBpZiAoaGFzRm9jdXMpIDEwZiBlbHNlIDBmCiAg
ICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2NhbGVYID0gaWYgKGhhc0ZvY3VzKSAxLjAxNWYg
ZWxzZSAxZgogICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNjYWxlWSA9IGlmIChoYXNGb2N1
cykgMS4wM2YgZWxzZSAxZgogICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRm9jdXMpIG9u
UHJvZ3JhbUZvY3VzZWQoY2hhbm5lbCwgaXRlbSwgZXZlbnRTdGFydCwgZXZlbnRFbmQsIGN1cnJl
bnQpCiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIHNldE9uQ2xpY2tM
aXN0ZW5lciB7CiAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJvZ3JhbUNsaWNrZWQoY2hhbm5l
bCwgaXRlbSwgZXZlbnRTdGFydCwgZXZlbnRFbmQsIGN1cnJlbnQpCiAgICAgICAgICAgICAgICAg
ICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CgogICAgICAgICAgICBsYW5lLmFk
ZFZpZXcoCiAgICAgICAgICAgICAgICBibG9jaywKICAgICAgICAgICAgICAgIExpbmVhckxheW91
dC5MYXlvdXRQYXJhbXMoKHNwYW4gKiBxdWFudHVtV2lkdGhQeCAtIDQuZHApLmNvZXJjZUF0TGVh
c3QoMS5kcCksIDc0LmRwKS5hcHBseSB7CiAgICAgICAgICAgICAgICAgICAgbWFyZ2luRW5kID0g
NC5kcAogICAgICAgICAgICAgICAgfQogICAgICAgICAgICApCiAgICAgICAgICAgIHF1YW50dW1J
bmRleCArPSBzcGFuCiAgICAgICAgfQoKICAgICAgICB2YWwgbWFya2VyWCA9ICgoKG5vd01zIC0g
dGltZWxpbmVTdGFydE1zKS5jb2VyY2VBdExlYXN0KDBMKSAvIDYwXzAwMC4wKSAqIHBpeGVsc1Bl
ck1pbnV0ZURwKS50b0ludCgpLmRwCiAgICAgICAgaWYgKG1hcmtlclggaW4gMCB1bnRpbCB0aW1l
bGluZVdpZHRoUHgpIHsKICAgICAgICAgICAgY2FudmFzLmFkZFZpZXcoCiAgICAgICAgICAgICAg
ICBWaWV3KHJvd0NvbnRleHQpLmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICBzZXRCYWNrZ3Jv
dW5kQ29sb3Iocm93Q29udGV4dC5nZXRDb2xvcihSLmNvbG9yLmtzX3JlZCkpCiAgICAgICAgICAg
ICAgICAgICAgYWxwaGEgPSAwLjk1ZgogICAgICAgICAgICAgICAgICAgIGVsZXZhdGlvbiA9IDEy
ZgogICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAgIEZyYW1lTGF5b3V0LkxheW91dFBh
cmFtcygzLmRwLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zLk1BVENIX1BBUkVOVCkuYXBwbHkg
ewogICAgICAgICAgICAgICAgICAgIGxlZnRNYXJnaW4gPSBtYXJrZXJYCiAgICAgICAgICAgICAg
ICB9CiAgICAgICAgICAgICkKICAgICAgICB9CgogICAgICAgIHNjcm9sbC5hZGRWaWV3KGNhbnZh
cykKICAgICAgICByb290LmFkZFZpZXcoc2Nyb2xsLCBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1z
KDAsIExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5ULCAxZikpCiAgICAgICAg
c2Nyb2xsLnBvc3QgeyBzY3JvbGwuc2Nyb2xsVG8oZ2xvYmFsU2Nyb2xsWCwgMCkgfQogICAgICAg
IHNjcm9sbC5zZXRPblNjcm9sbENoYW5nZUxpc3RlbmVyIHsgXywgc2Nyb2xsWCwgXywgXywgXyAt
PgogICAgICAgICAgICBpZiAoIXN5bmNpbmcgJiYgc2Nyb2xsWCAhPSBnbG9iYWxTY3JvbGxYKSB7
CiAgICAgICAgICAgICAgICBnbG9iYWxTY3JvbGxYID0gc2Nyb2xsWAogICAgICAgICAgICAgICAg
c3luY1Zpc2libGUoc2Nyb2xsKQogICAgICAgICAgICAgICAgb25Ib3Jpem9udGFsQ2hhbmdlZChz
Y3JvbGxYKQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiByb290CiAgICB9
CgogICAgZnVuIHNldEdsb2JhbFNjcm9sbFgoeDogSW50KSB7CiAgICAgICAgdmFsIHNhZmUgPSB4
LmNvZXJjZUF0TGVhc3QoMCkKICAgICAgICBpZiAoc2FmZSA9PSBnbG9iYWxTY3JvbGxYKSByZXR1
cm4KICAgICAgICBnbG9iYWxTY3JvbGxYID0gc2FmZQogICAgICAgIHN5bmNWaXNpYmxlKG51bGwp
CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc3luY1Zpc2libGUoc291cmNlOiBIb3Jpem9udGFsU2Ny
b2xsVmlldz8pIHsKICAgICAgICBzeW5jaW5nID0gdHJ1ZQogICAgICAgIHRyeSB7CiAgICAgICAg
ICAgIHZpc2libGVTY3JvbGxzLnRvTGlzdCgpLmZvckVhY2ggeyB2aWV3IC0+CiAgICAgICAgICAg
ICAgICBpZiAodmlldyAhPT0gc291cmNlICYmIHZpZXcuc2Nyb2xsWCAhPSBnbG9iYWxTY3JvbGxY
KSB2aWV3LnNjcm9sbFRvKGdsb2JhbFNjcm9sbFgsIDApCiAgICAgICAgICAgIH0KICAgICAgICB9
IGZpbmFsbHkgewogICAgICAgICAgICBzeW5jaW5nID0gZmFsc2UKICAgICAgICB9CiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gcmVzb2x2ZUV2ZW50cyhzb3VyY2U6IExpc3Q8RXBnSXRlbT4pOiBMaXN0
PFJlc29sdmVkRXZlbnQ+IHsKICAgICAgICByZXR1cm4gc291cmNlLm1hcEluZGV4ZWROb3ROdWxs
IHsgaW5kZXgsIGl0ZW0gLT4KICAgICAgICAgICAgdmFsIChzdGFydCwgZW5kKSA9IHJlc29sdmVk
VGltZXMoaXRlbSwgaW5kZXgpCiAgICAgICAgICAgIGlmIChlbmQgPD0gdGltZWxpbmVTdGFydE1z
IHx8IHN0YXJ0ID49IHRpbWVsaW5lRW5kTXMgfHwgZW5kIDw9IHN0YXJ0KSBudWxsCiAgICAgICAg
ICAgIGVsc2UgUmVzb2x2ZWRFdmVudChpdGVtLCBzdGFydCwgZW5kKQogICAgICAgIH0uc29ydGVk
V2l0aChjb21wYXJlQnk8UmVzb2x2ZWRFdmVudD4geyBpdC5zdGFydE1zIH0udGhlbkJ5RGVzY2Vu
ZGluZyB7IGl0LmVuZE1zIH0pCiAgICB9CgogICAgLyoqIFNlbGVjdCBleGFjdGx5IG9uZSBwcm9n
cmFtbWUgZm9yIG9uZSBmaXhlZCBoYWxmLWhvdXIgY2VsbC4gKi8KICAgIHByaXZhdGUgZnVuIHBy
b2dyYW1Gb3JTbG90KGV2ZW50czogTGlzdDxSZXNvbHZlZEV2ZW50Piwgc2xvdFN0YXJ0OiBMb25n
LCBzbG90RW5kOiBMb25nKTogUmVzb2x2ZWRFdmVudD8gewogICAgICAgIHZhciBiZXN0OiBSZXNv
bHZlZEV2ZW50PyA9IG51bGwKICAgICAgICB2YXIgYmVzdE92ZXJsYXAgPSAwTAogICAgICAgIGZv
ciAoZXZlbnQgaW4gZXZlbnRzKSB7CiAgICAgICAgICAgIGlmIChldmVudC5zdGFydE1zID49IHNs
b3RFbmQpIGJyZWFrCiAgICAgICAgICAgIHZhbCBvdmVybGFwID0gbWluKGV2ZW50LmVuZE1zLCBz
bG90RW5kKSAtIG1heChldmVudC5zdGFydE1zLCBzbG90U3RhcnQpCiAgICAgICAgICAgIGlmIChv
dmVybGFwID4gYmVzdE92ZXJsYXApIHsKICAgICAgICAgICAgICAgIGJlc3QgPSBldmVudAogICAg
ICAgICAgICAgICAgYmVzdE92ZXJsYXAgPSBvdmVybGFwCiAgICAgICAgICAgIH0KICAgICAgICB9
CiAgICAgICAgcmV0dXJuIGJlc3QKICAgIH0KCiAgICBwcml2YXRlIGZ1biBzYW1lUHJvZ3JhbW1l
KGZpcnN0OiBSZXNvbHZlZEV2ZW50LCBzZWNvbmQ6IFJlc29sdmVkRXZlbnQ/KTogQm9vbGVhbiB7
CiAgICAgICAgcmV0dXJuIHNlY29uZCAhPSBudWxsICYmCiAgICAgICAgICAgIGZpcnN0LnN0YXJ0
TXMgPT0gc2Vjb25kLnN0YXJ0TXMgJiYKICAgICAgICAgICAgZmlyc3QuZW5kTXMgPT0gc2Vjb25k
LmVuZE1zICYmCiAgICAgICAgICAgIGZpcnN0Lml0ZW0udGl0bGUgPT0gc2Vjb25kLml0ZW0udGl0
bGUKICAgIH0KCiAgICBwcml2YXRlIGZ1biByZXNvbHZlZFRpbWVzKGl0ZW06IEVwZ0l0ZW0sIGlu
ZGV4OiBJbnQpOiBQYWlyPExvbmcsIExvbmc+IHsKICAgICAgICB2YWwgZmxvb3JOb3cgPSAobm93
TXMgLyBzbG90TXMpICogc2xvdE1zCiAgICAgICAgdmFsIHN0YXJ0ID0gaXRlbS5zdGFydFRpbWVz
dGFtcD8ubGV0IHsgaXQgKiAxMDAwTCB9CiAgICAgICAgICAgID86IHBhcnNlR3VpZGVUaW1lKGl0
ZW0uc3RhcnQpCiAgICAgICAgICAgID86IGlmIChpdGVtLnN0YXJ0LmVxdWFscygiTm93IiwgdHJ1
ZSkpIGZsb29yTm93IGVsc2UgZmxvb3JOb3cgKyBpbmRleCAqIHNsb3RNcwogICAgICAgIHZhbCBl
bmQgPSBpdGVtLmVuZFRpbWVzdGFtcD8ubGV0IHsgaXQgKiAxMDAwTCB9CiAgICAgICAgICAgID86
IHBhcnNlR3VpZGVUaW1lKGl0ZW0uZW5kKQogICAgICAgICAgICA/OiAoc3RhcnQgKyBzbG90TXMp
CiAgICAgICAgcmV0dXJuIHN0YXJ0IHRvIG1heChlbmQsIHN0YXJ0ICsgNSAqIDYwXzAwMEwpCiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gcGFyc2VHdWlkZVRpbWUocmF3OiBTdHJpbmcpOiBMb25nPyB7
CiAgICAgICAgdmFsIHZhbHVlID0gcmF3LnRyaW0oKQogICAgICAgIGlmICh2YWx1ZS5pc0JsYW5r
KCkgfHwgdmFsdWUuZXF1YWxzKCJOb3ciLCB0cnVlKSB8fCB2YWx1ZS5lcXVhbHMoIk5leHQiLCB0
cnVlKSB8fCB2YWx1ZS5lcXVhbHMoIkxhdGVyIiwgdHJ1ZSkpIHJldHVybiBudWxsCiAgICAgICAg
dmFsIG51bWVyaWMgPSB2YWx1ZS50b0xvbmdPck51bGwoKQogICAgICAgIGlmIChudW1lcmljICE9
IG51bGwpIHJldHVybiBpZiAobnVtZXJpYyA8IDEwMF8wMDBfMDAwXzAwMEwpIG51bWVyaWMgKiAx
MDAwTCBlbHNlIG51bWVyaWMKICAgICAgICB2YWwgcGF0dGVybnMgPSBsaXN0T2YoInl5eXktTU0t
ZGQgSEg6bW06c3MiLCAieXl5eS1NTS1kZCBISDptbSIpCiAgICAgICAgZm9yIChwYXR0ZXJuIGlu
IHBhdHRlcm5zKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgcGFyc2Vk
ID0gU2ltcGxlRGF0ZUZvcm1hdChwYXR0ZXJuLCBMb2NhbGUuVVMpLnBhcnNlKHZhbHVlKQogICAg
ICAgICAgICAgICAgaWYgKHBhcnNlZCAhPSBudWxsKSByZXR1cm4gcGFyc2VkLnRpbWUKICAgICAg
ICAgICAgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IH0KICAgICAgICB9CiAgICAgICAgcmV0dXJu
IG51bGwKICAgIH0KCiAgICBwcml2YXRlIGZ1biBmb3JtYXRSYW5nZShzdGFydDogTG9uZywgZW5k
OiBMb25nKTogU3RyaW5nIHsKICAgICAgICByZXR1cm4gdHJ5IHsKICAgICAgICAgICAgdmFsIGZv
cm1hdHRlciA9IFNpbXBsZURhdGVGb3JtYXQoImg6bW0gYSIsIExvY2FsZS5nZXREZWZhdWx0KCkp
CiAgICAgICAgICAgICIke2Zvcm1hdHRlci5mb3JtYXQoRGF0ZShzdGFydCkpfSDigJMgJHtmb3Jt
YXR0ZXIuZm9ybWF0KERhdGUoZW5kKSl9IgogICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikg
ewogICAgICAgICAgICAiIgogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIHZhbCBJbnQuZHA6
IEludCBnZXQoKSA9ICh0aGlzICogcm93Q29udGV4dC5yZXNvdXJjZXMuZGlzcGxheU1ldHJpY3Mu
ZGVuc2l0eSkudG9JbnQoKQp9Cg==
:::END ADAPTER
:::BEGIN GRADLE
cGx1Z2lucyB7CiAgICBpZCgiY29tLmFuZHJvaWQuYXBwbGljYXRpb24iKQogICAgaWQoIm9yZy5q
ZXRicmFpbnMua290bGluLmFuZHJvaWQiKQp9CgphbmRyb2lkIHsKICAgIG5hbWVzcGFjZSA9ICJj
b20ua3Jpc3RhbHN0cmVhbXMucGxheWVyIgogICAgY29tcGlsZVNkayA9IDM1CgogICAgZGVmYXVs
dENvbmZpZyB7CiAgICAgICAgYXBwbGljYXRpb25JZCA9ICJjb20ua3Jpc3RhbHN0cmVhbXMucGxh
eWVyIgogICAgICAgIG1pblNkayA9IDIzCiAgICAgICAgdGFyZ2V0U2RrID0gMzUKICAgICAgICB2
ZXJzaW9uQ29kZSA9IDE2ODIwMjEKICAgICAgICB2ZXJzaW9uTmFtZSA9ICIxLjYuOC1zZXJpZXMt
Y29tcGxldGUiCiAgICB9CgogICAgYnVpbGRGZWF0dXJlcyB7CiAgICAgICAgdmlld0JpbmRpbmcg
PSBmYWxzZQogICAgfQoKICAgIGNvbXBpbGVPcHRpb25zIHsKICAgICAgICBzb3VyY2VDb21wYXRp
YmlsaXR5ID0gSmF2YVZlcnNpb24uVkVSU0lPTl8xMQogICAgICAgIHRhcmdldENvbXBhdGliaWxp
dHkgPSBKYXZhVmVyc2lvbi5WRVJTSU9OXzExCiAgICB9CgogICAga290bGluIHsKICAgICAgICBq
dm1Ub29sY2hhaW4oMTEpCiAgICB9Cn0KCmRlcGVuZGVuY2llcyB7CiAgICBpbXBsZW1lbnRhdGlv
bigiYW5kcm9pZHguY29yZTpjb3JlLWt0eDoxLjE1LjAiKQogICAgaW1wbGVtZW50YXRpb24oImFu
ZHJvaWR4LmFwcGNvbXBhdDphcHBjb21wYXQ6MS43LjAiKQogICAgaW1wbGVtZW50YXRpb24oImNv
bS5nb29nbGUuYW5kcm9pZC5tYXRlcmlhbDptYXRlcmlhbDoxLjEyLjAiKQogICAgaW1wbGVtZW50
YXRpb24oImFuZHJvaWR4Lm1lZGlhMzptZWRpYTMtZXhvcGxheWVyOjEuNS4xIikKICAgIGltcGxl
bWVudGF0aW9uKCJhbmRyb2lkeC5tZWRpYTM6bWVkaWEzLWV4b3BsYXllci1obHM6MS41LjEiKQog
ICAgaW1wbGVtZW50YXRpb24oImFuZHJvaWR4Lm1lZGlhMzptZWRpYTMtdWk6MS41LjEiKQogICAg
aW1wbGVtZW50YXRpb24oIm9yZy5qZWxseWZpbi5tZWRpYTM6bWVkaWEzLWZmbXBlZy1kZWNvZGVy
OjEuNS4wKzEiKQp9Cg==
:::END GRADLE
:::BEGIN AUDIT
S1JJU1RBTCBTVFJFQU1TIDEuNi44IFJDMSBSMiDigJQgREFTSEJPQVJEIEhFQURFUiBCTEFDSyBS
RU1PVkVECgpCQVNFTElORQotIEtub3duLWdvb2QgUjIgYXBwLgotIExvZ2luLCBwbGF5YmFjaywg
TW92aWVzLCBTZXJpZXMgYW5kIExpdmUgVFYgTm93L05leHQgYXJlIHVuY2hhbmdlZC4KLSBUaGUg
ZWFybGllciB2YXJpYWJsZS13aWR0aCBFUEcgcmVuZGVyZXIgd2FzIHJlbW92ZWQgcmF0aGVyIHRo
YW4gcGF0Y2hlZC4KClJFQlVJTFQgR1VJREUKLSBVc2VzIHRoZSBzdXBwbGllZCB3b3JraW5nIElQ
VFYgQVBLJ3MgZHVyYXRpb24td2lkdGggYmVoYXZpb3Igb24gdG9wIG9mIHRoZQogIHJlYnVpbHQg
bm9uLXN0YWNraW5nIGdyaWQuCi0gRWFjaCBmaXZlLW1pbnV0ZSBzbGljZSBzZWxlY3RzIGF0IG1v
c3Qgb25lIHByb3ZpZGVyIHByb2dyYW1tZSBieSBncmVhdGVzdAogIHRpbWUgb3ZlcmxhcCwgdGhl
biBjb25zZWN1dGl2ZSBzbGljZXMgZm9yIHRoZSBzYW1lIHNob3cgbWVyZ2UgaW50byBvbmUgY2Fy
ZC4KLSBBIG9uZS1ob3VyIHNob3cgc3BhbnMgb25lIGhvdXIsIGEgOTAtbWludXRlIHNob3cgc3Bh
bnMgOTAgbWludXRlcywgYW5kIGxvbmdlcgogIHNob3dzIGNvbnRpbnVlIGZyb20gdGhlaXIgc3Rh
cnQgdGhyb3VnaCBmaW5pc2ggdGltZS4KLSBEdXBsaWNhdGUgb3IgY29uZmxpY3RpbmcgcHJvdmlk
ZXIgZW50cmllcyBjYW5ub3Qgc3RhY2sgYmVjYXVzZSBldmVyeQogIGZpdmUtbWludXRlIHNsaWNl
IHN0aWxsIGhhcyBleGFjdGx5IG9uZSBzZWxlY3RlZCBwcm9ncmFtbWUuCi0gRXZlcnkgY2FyZCBr
ZWVwcyB0aGUgc2FtZSBmb3VyLWRwIGd1dHRlciBpbiBwb3J0cmFpdCBhbmQgbGFuZHNjYXBlLgot
IENhcmRzIG9mIDMwIG1pbnV0ZXMgb3IgbGVzcyB1c2UgYSBjb21wYWN0IHRpdGxlLW9ubHkgbGF5
b3V0IHdpdGggbWluaW1hbAogIHBhZGRpbmcgYW5kIHNpeCBhdmFpbGFibGUgdGV4dCBsaW5lcy4g
RXhhY3QgdGltZXMgcmVtYWluIGluIHRoZSBhbGlnbmVkCiAgdGltZWxpbmUgYW5kIGRldGFpbHMg
cGFuZWwsIHByZXZlbnRpbmcgbmFycm93LWNhcmQgdGV4dCBmcm9tIGJlaW5nIGN1dCBvZmYuCi0g
SGFsZi1ob3VyIGNhcmRzIGNlbnRlciB0aGVpciBjb21wYWN0IHRpdGxlIGhvcml6b250YWxseSBh
bmQgdmVydGljYWxseS4KLSBMb25nZXIgY2FyZHMgcmV0dXJuIHRvIGxlZnQtYWxpZ25lZCBjb250
ZW50IHdpdGggMTNzcCB0ZXh0LCBub3JtYWwgc2lkZQogIHBhZGRpbmcsIGFuZCB0aGUgdGl0bGUg
cGx1cyB0aW1lIHJhbmdlIHNvIHdpZGUgY2FyZHMgZG8gbm90IGxvb2sgZW1wdHkuCi0gQXV0b21h
dGljIHNpemluZyBhcHBsaWVzIG9ubHkgdG8gY29tcGFjdCBoYWxmLWhvdXIgY2FyZHMsIGRvd24g
dG8gNnNwIHdoZW4KICBuZWVkZWQsIHdpdGggc2l4IGxpbmVzLCB0aWdodGVyIGxpbmUgc3BhY2lu
ZywgYW5kIHJlZHVjZWQgZm9udCBwYWRkaW5nLgotIENvbXBhY3QgY2FyZHMgd3JhcCBpbnN0ZWFk
IG9mIGFkZGluZyBhbiBlbGxpcHNpcywgbWF4aW1pemluZyB0aGUgdmlzaWJsZQogIHByb2dyYW1t
ZSB0aXRsZSB3aXRob3V0IGNoYW5naW5nIHRoZSBjYXJkJ3MgdHJ1ZSBkdXJhdGlvbiB3aWR0aC4K
LSBUaGUgcHJvZ3JhbS1kZXRhaWxzIHBhbmVsIG5vdyBzZWxlY3RzIHRoZSBmaXJzdCBjdXJyZW50
bHkgYWlyaW5nIHByb2dyYW1tZQogIGF1dG9tYXRpY2FsbHkgaW5zdGVhZCBvZiByZW1haW5pbmcg
ZW1wdHkgdW50aWwgYSBjYXJkIHJlY2VpdmVzIGZvY3VzLgotIFRoZSBzZWxlY3RlZCBwcm9ncmFt
IHNob3dzIGEgbGFyZ2VyIHRpdGxlLCBzdGF0dXMsIGNoYW5uZWwsIGNvbXBsZXRlIGFpcnRpbWUs
CiAgZHVyYXRpb24sIHByb3ZpZGVyIGRlc2NyaXB0aW9uLCByZW1haW5pbmcgdGltZSwgcHJvZ3Jl
c3MsIGFuZCBhIGNsZWFyIGFjdGlvbi4KLSBMaXZlIHByb2dyZXNzIGFuZCBzdGF0dXMgcmVmcmVz
aCBldmVyeSAzMCBzZWNvbmRzIHdpdGhvdXQgcmVidWlsZGluZyB0aGUgRVBHLgotIFRoZSBmaXhl
ZCBncmlkLCBjYXJkIHdpZHRocywgY29tcGFjdCB0aXRsZSBydWxlcywgYWxpZ25tZW50LCBhbmQg
Z3VpZGUgZGF0YQogIGxvYWRpbmcgYmVoYXZpb3IgYXJlIHVuY2hhbmdlZCBmcm9tIHRoZSBhcHBy
b3ZlZCBzdGFibGUgYmFzZWxpbmUuCi0gVGhlIHJlZ3VsYXIgTGl2ZSBUViBjaGFubmVsIGxpc3Qg
aXMgZGV0ZWN0ZWQgYnkgaXRzIExJVkUgVFYgYW5kIENIQU5ORUwKICBDQVRFR09SSUVTIGhlYWRp
bmdzOyBvdGhlciBtZWRpYSBzY3JlZW5zIGFyZSBub3QgcmVzdHlsZWQuCi0gRXZlcnkgc3F1YXJl
IGNoYW5uZWwtbG9nbyBwYW5lbCBvbiB0aGF0IHNjcmVlbiByZWNlaXZlcyB0aGUgc2FtZSBsaWdo
dAogIG5ldXRyYWwgcm91bmRlZCBiYWNrZ3JvdW5kIGFuZCBib3JkZXIsIGZpeGluZyBibGFjayBC
RVQsIENvbWVkeSBDZW50cmFsLAogIEJyYXZvLCBhbmQgc2ltaWxhciBhcnR3b3JrIGFjcm9zcyB0
aGUgY29tcGxldGUgbGlzdC4KLSBQcm92aWRlciBhcnR3b3JrIHdpdGggYSBiYWtlZC1pbiBuZWFy
LWJsYWNrIGJhY2tkcm9wIGlzIGxpZ2h0ZW5lZCBvbmx5IHdoZW4KICBpdCBsYWNrcyBicmlnaHQg
Zm9yZWdyb3VuZCBhcnR3b3JrLiBBbHJlYWR5LXZpc2libGUgbG9nb3MgcmVtYWluIHVuY2hhbmdl
ZC4KLSBUaGUgd2lkZSBLUyBLcmlzdGFsIFN0cmVhbXMgYmFubmVyIGluIHRoZSBkYXNoYm9hcmQn
cyB0b3AgbmF2aWdhdGlvbiBiYXIgaXMKICBkZXRlY3RlZCBieSB0aGUgQ29ubmVjdGVkIGFzIGFu
ZCBTVFJFQU1JTkcgaGVhZGluZ3MuIEl0cyBibGFjayB2aWV3IG9yIGltYWdlCiAgYmFja2Ryb3Ag
aXMgcmVtb3ZlZCB3aGlsZSB0aGUgcmVkIGFuZCB3aGl0ZSBicmFuZCBhcnR3b3JrIGlzIHByZXNl
cnZlZC4KLSBHZW5lcmljIGJhY2tncm91bmRzLCBBbmRyb2lkIGJhY2tncm91bmQgdGludHMsIGFu
ZCBjYXJkLXZpZXcgYmFja2dyb3VuZAogIGNvbG9ycyBhcmUgY2xlYXJlZCB0aHJvdWdob3V0IHRo
ZSBiYW5uZXIgYXJlYS4gTmV1dHJhbCBibGFjayBhbmQgZ3JheSBwaXhlbHMKICBpbnNpZGUgdGhl
IEtTIGxldHRlcmluZyBhcmUgYWxzbyBtYWRlIHRyYW5zcGFyZW50IHNvIHRoZSBwYWdlIHNob3dz
IHRocm91Z2guCi0gVGhlIHNtYWxsZXIgTGl2ZSBUViBoZWFkZXIgYXJ0d29yayByZWNlaXZlcyB0
aGUgc2FtZSB0cmFuc3BhcmVudCB0cmVhdG1lbnQuCi0gVGhlIGFwcHJvdmVkIEVQRyBhZGFwdGVy
IGlzIHJlc3RvcmVkIHVuY2hhbmdlZC4gR3VpZGUgcm93cywgcHJvZ3JhbW1lIHdpZHRocywKICBz
Y2hlZHVsZSBiZWhhdmlvciwgYW5kIHRoZSBpbXByb3ZlZCBkZXRhaWxzIHBhbmVsIHJlbWFpbiB1
bmNoYW5nZWQuCi0gWE1MVFYgcmVtYWlucyB0aGUgcHJlZmVycmVkIHNjaGVkdWxlIHNvdXJjZS4g
VmlzaWJsZSBjaGFubmVscyB3aXRob3V0IHVzYWJsZQogIFhNTFRWIHVzZSBvbmUgY2FjaGVkIGZ1
bGwgcGVyLWNoYW5uZWwgcHJvdmlkZXIgcmVxdWVzdC4KLSBTY2hlZHVsZSB0aW1lcywgdGltZWxp
bmUgbGFiZWxzIGFuZCBOT1cgdXNlIHRoZSBBbmRyb2lkIGRldmljZSBjbG9jay4KLSBNaXNzaW5n
IHNjaGVkdWxlIGNlbGxzIHZpc2libHkgc2F5IE5PIEdVSURFIERBVEEuCgpWRVJTSU9OCi0gdmVy
c2lvbkNvZGUgMTY4MjAxMQotIHZlcnNpb25OYW1lIDEuNi44LWhlYWRlci1ibGFjay1yZW1vdmVk
Cg==
:::END AUDIT

:::BEGIN UICONTEXT
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5hcHAuQWN0
aXZpdHkKaW1wb3J0IGFuZHJvaWQuYXBwLkFwcGxpY2F0aW9uCmltcG9ydCBhbmRyb2lkLmNvbnRl
bnQuQ29udGVudFByb3ZpZGVyCmltcG9ydCBhbmRyb2lkLmNvbnRlbnQuQ29udGVudFZhbHVlcwpp
bXBvcnQgYW5kcm9pZC5jb250ZW50LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQuY29udGVudC5yZXMu
Q29sb3JTdGF0ZUxpc3QKaW1wb3J0IGFuZHJvaWQuZGF0YWJhc2UuQ3Vyc29yCmltcG9ydCBhbmRy
b2lkLmdyYXBoaWNzLkJpdG1hcAppbXBvcnQgYW5kcm9pZC5ncmFwaGljcy5DYW52YXMKaW1wb3J0
IGFuZHJvaWQuZ3JhcGhpY3MuQ29sb3IKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuUmVjdAppbXBv
cnQgYW5kcm9pZC5ncmFwaGljcy5kcmF3YWJsZS5Db2xvckRyYXdhYmxlCmltcG9ydCBhbmRyb2lk
LmdyYXBoaWNzLmRyYXdhYmxlLkRyYXdhYmxlCmltcG9ydCBhbmRyb2lkLmdyYXBoaWNzLmRyYXdh
YmxlLkdyYWRpZW50RHJhd2FibGUKaW1wb3J0IGFuZHJvaWQubmV0LlVyaQppbXBvcnQgYW5kcm9p
ZC5vcy5CdW5kbGUKaW1wb3J0IGFuZHJvaWQub3MuSGFuZGxlcgppbXBvcnQgYW5kcm9pZC5vcy5M
b29wZXIKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLnZpZXcuVmlld0dy
b3VwCmltcG9ydCBhbmRyb2lkLndpZGdldC5JbWFnZVZpZXcKaW1wb3J0IGFuZHJvaWQud2lkZ2V0
LlRleHRWaWV3CmltcG9ydCBqYXZhLnV0aWwuTG9jYWxlCmltcG9ydCBqYXZhLnV0aWwuV2Vha0hh
c2hNYXAKaW1wb3J0IGtvdGxpbi5tYXRoLmFicwppbXBvcnQga290bGluLm1hdGgubWF4CgovKioK
ICogQXBwbGllcyB0aGUgTGl2ZSBUViBsb2dvIHRyZWF0bWVudCBhbmQgdHJhbnNwYXJlbnQgZGFz
aGJvYXJkIGJyYW5kIGJhbm5lcgogKiB3aXRob3V0IGNoYW5naW5nIHRoZSBFUEcgcmVuZGVyZXIu
IEl0IGlzIGluaXRpYWxpemVkIGJ5IGEgcHJpdmF0ZSBtYW5pZmVzdAogKiBwcm92aWRlciBhbmQg
b25seSBhY3RpdmF0ZXMgb24gdGhlIHR3byBzcGVjaWZpY2FsbHkgaWRlbnRpZmllZCBzY3JlZW5z
LgogKi8KY2xhc3MgVWlDb250cmFzdFByb3ZpZGVyIDogQ29udGVudFByb3ZpZGVyKCkgewogICAg
cHJpdmF0ZSB2YWwgY29udHJvbGxlciA9IExpdmVUdkxvZ29Db250cmFzdENvbnRyb2xsZXIoKQoK
ICAgIG92ZXJyaWRlIGZ1biBvbkNyZWF0ZSgpOiBCb29sZWFuIHsKICAgICAgICB2YWwgYXBwID0g
Y29udGV4dD8uYXBwbGljYXRpb25Db250ZXh0IGFzPyBBcHBsaWNhdGlvbiA/OiByZXR1cm4gZmFs
c2UKICAgICAgICBhcHAucmVnaXN0ZXJBY3Rpdml0eUxpZmVjeWNsZUNhbGxiYWNrcyhvYmplY3Qg
OiBBcHBsaWNhdGlvbi5BY3Rpdml0eUxpZmVjeWNsZUNhbGxiYWNrcyB7CiAgICAgICAgICAgIG92
ZXJyaWRlIGZ1biBvbkFjdGl2aXR5UmVzdW1lZChhY3Rpdml0eTogQWN0aXZpdHkpID0gY29udHJv
bGxlci5zdGFydChhY3Rpdml0eSkKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlQ
YXVzZWQoYWN0aXZpdHk6IEFjdGl2aXR5KSA9IGNvbnRyb2xsZXIuc3RvcChhY3Rpdml0eSkKICAg
ICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlEZXN0cm95ZWQoYWN0aXZpdHk6IEFjdGl2
aXR5KSA9IGNvbnRyb2xsZXIuc3RvcChhY3Rpdml0eSkKICAgICAgICAgICAgb3ZlcnJpZGUgZnVu
IG9uQWN0aXZpdHlDcmVhdGVkKGFjdGl2aXR5OiBBY3Rpdml0eSwgc3RhdGU6IEJ1bmRsZT8pID0g
VW5pdAogICAgICAgICAgICBvdmVycmlkZSBmdW4gb25BY3Rpdml0eVN0YXJ0ZWQoYWN0aXZpdHk6
IEFjdGl2aXR5KSA9IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlTdG9w
cGVkKGFjdGl2aXR5OiBBY3Rpdml0eSkgPSBVbml0CiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBv
bkFjdGl2aXR5U2F2ZUluc3RhbmNlU3RhdGUoYWN0aXZpdHk6IEFjdGl2aXR5LCBzdGF0ZTogQnVu
ZGxlKSA9IFVuaXQKICAgICAgICB9KQogICAgICAgIHJldHVybiB0cnVlCiAgICB9CgogICAgb3Zl
cnJpZGUgZnVuIHF1ZXJ5KHVyaTogVXJpLCBwcm9qZWN0aW9uOiBBcnJheTxvdXQgU3RyaW5nPj8s
IHNlbGVjdGlvbjogU3RyaW5nPywgc2VsZWN0aW9uQXJnczogQXJyYXk8b3V0IFN0cmluZz4/LCBz
b3J0T3JkZXI6IFN0cmluZz8pOiBDdXJzb3I/ID0gbnVsbAogICAgb3ZlcnJpZGUgZnVuIGdldFR5
cGUodXJpOiBVcmkpOiBTdHJpbmc/ID0gbnVsbAogICAgb3ZlcnJpZGUgZnVuIGluc2VydCh1cmk6
IFVyaSwgdmFsdWVzOiBDb250ZW50VmFsdWVzPyk6IFVyaT8gPSBudWxsCiAgICBvdmVycmlkZSBm
dW4gZGVsZXRlKHVyaTogVXJpLCBzZWxlY3Rpb246IFN0cmluZz8sIHNlbGVjdGlvbkFyZ3M6IEFy
cmF5PG91dCBTdHJpbmc+Pyk6IEludCA9IDAKICAgIG92ZXJyaWRlIGZ1biB1cGRhdGUodXJpOiBV
cmksIHZhbHVlczogQ29udGVudFZhbHVlcz8sIHNlbGVjdGlvbjogU3RyaW5nPywgc2VsZWN0aW9u
QXJnczogQXJyYXk8b3V0IFN0cmluZz4/KTogSW50ID0gMAp9Cgpwcml2YXRlIGNsYXNzIExpdmVU
dkxvZ29Db250cmFzdENvbnRyb2xsZXIgewogICAgcHJpdmF0ZSB2YWwgaGFuZGxlciA9IEhhbmRs
ZXIoTG9vcGVyLmdldE1haW5Mb29wZXIoKSkKICAgIHByaXZhdGUgdmFsIHRhc2tzID0gV2Vha0hh
c2hNYXA8QWN0aXZpdHksIFJ1bm5hYmxlPigpCiAgICBwcml2YXRlIHZhbCBwcm9jZXNzZWRIZWFk
ZXJzID0gV2Vha0hhc2hNYXA8SW1hZ2VWaWV3LCBEcmF3YWJsZT4oKQogICAgcHJpdmF0ZSB2YWwg
cHJvY2Vzc2VkTG9nb3MgPSBXZWFrSGFzaE1hcDxJbWFnZVZpZXcsIERyYXdhYmxlPigpCgogICAg
ZnVuIHN0YXJ0KGFjdGl2aXR5OiBBY3Rpdml0eSkgewogICAgICAgIHN0b3AoYWN0aXZpdHkpCiAg
ICAgICAgdmFsIHJvb3QgPSBhY3Rpdml0eS53aW5kb3c/LmRlY29yVmlldyA/OiByZXR1cm4KICAg
ICAgICB2YWwgdGFzayA9IG9iamVjdCA6IFJ1bm5hYmxlIHsKICAgICAgICAgICAgb3ZlcnJpZGUg
ZnVuIHJ1bigpIHsKICAgICAgICAgICAgICAgIGlmICghYWN0aXZpdHkuaXNGaW5pc2hpbmcgJiYg
IWFjdGl2aXR5LmlzRGVzdHJveWVkKSB7CiAgICAgICAgICAgICAgICAgICAgYXBwbHlVaUNvbnRy
YXN0KHJvb3QsIGFjdGl2aXR5KQogICAgICAgICAgICAgICAgICAgIGhhbmRsZXIucG9zdERlbGF5
ZWQodGhpcywgODAwTCkKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgIH0K
ICAgICAgICB0YXNrc1thY3Rpdml0eV0gPSB0YXNrCiAgICAgICAgaGFuZGxlci5wb3N0KHRhc2sp
CiAgICB9CgogICAgZnVuIHN0b3AoYWN0aXZpdHk6IEFjdGl2aXR5KSB7CiAgICAgICAgdGFza3Mu
cmVtb3ZlKGFjdGl2aXR5KT8ubGV0KGhhbmRsZXI6OnJlbW92ZUNhbGxiYWNrcykKICAgIH0KCiAg
ICBwcml2YXRlIGZ1biBhcHBseVVpQ29udHJhc3Qocm9vdDogVmlldywgY29udGV4dDogQ29udGV4
dCkgewogICAgICAgIHZhbCBsaXZlVHZTY3JlZW4gPSBpc0xpdmVUdlNjcmVlbihyb290KQogICAg
ICAgIHZhbCBkYXNoYm9hcmRTY3JlZW4gPSBpc0Rhc2hib2FyZFNjcmVlbihyb290KQogICAgICAg
IGlmICghbGl2ZVR2U2NyZWVuICYmICFkYXNoYm9hcmRTY3JlZW4pIHJldHVybgogICAgICAgIHZh
bCBkZW5zaXR5ID0gY29udGV4dC5yZXNvdXJjZXMuZGlzcGxheU1ldHJpY3MuZGVuc2l0eQogICAg
ICAgIGNsZWFyVG9wTGVmdENvbnRhaW5lcnMocm9vdCwgZGVuc2l0eSkKICAgICAgICB2aXNpdChy
b290KSB7IHZpZXcgLT4KICAgICAgICAgICAgaWYgKHZpZXcgIWlzIEltYWdlVmlldyB8fCB2aWV3
LndpZHRoIDw9IDAgfHwgdmlldy5oZWlnaHQgPD0gMCkgcmV0dXJuQHZpc2l0CiAgICAgICAgICAg
IHZhbCBsb2NhdGlvbiA9IEludEFycmF5KDIpCiAgICAgICAgICAgIHZpZXcuZ2V0TG9jYXRpb25P
blNjcmVlbihsb2NhdGlvbikKICAgICAgICAgICAgdmFsIHhEcCA9IGxvY2F0aW9uWzBdIC8gZGVu
c2l0eQogICAgICAgICAgICB2YWwgeURwID0gbG9jYXRpb25bMV0gLyBkZW5zaXR5CiAgICAgICAg
ICAgIHZhbCB3aWR0aERwID0gdmlldy53aWR0aCAvIGRlbnNpdHkKICAgICAgICAgICAgdmFsIGhl
aWdodERwID0gdmlldy5oZWlnaHQgLyBkZW5zaXR5CiAgICAgICAgICAgIHZhbCBzcXVhcmVFbm91
Z2ggPSB3aWR0aERwIC8gaGVpZ2h0RHAgaW4gMC42MmYuLjEuNjJmCgogICAgICAgICAgICB3aGVu
IHsKICAgICAgICAgICAgICAgIGRhc2hib2FyZFNjcmVlbiAmJiB4RHAgPCAyMzBmICYmIHlEcCA8
IDEzMGYgJiYKICAgICAgICAgICAgICAgICAgICB3aWR0aERwIGluIDk1Zi4uMjg1ZiAmJiBoZWln
aHREcCBpbiAyOGYuLjEyMGYgLT4gewogICAgICAgICAgICAgICAgICAgIG1ha2VIZWFkZXJBcnR3
b3JrVHJhbnNwYXJlbnQodmlldywgZGVuc2l0eSkKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgICAgIGxpdmVUdlNjcmVlbiAmJiB4RHAgPCAxNTBmICYmIHlEcCA8IDEyNWYgJiYKICAgICAg
ICAgICAgICAgICAgICB3aWR0aERwIGluIDM0Zi4uMTI1ZiAmJiBoZWlnaHREcCBpbiAzNGYuLjEy
NWYgLT4gewogICAgICAgICAgICAgICAgICAgIG1ha2VIZWFkZXJBcnR3b3JrVHJhbnNwYXJlbnQo
dmlldywgZGVuc2l0eSkKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGxpdmVUdlNj
cmVlbiAmJiB5RHAgPiAxNDVmICYmIHdpZHRoRHAgaW4gMzRmLi4xMDVmICYmCiAgICAgICAgICAg
ICAgICAgICAgaGVpZ2h0RHAgaW4gMzRmLi4xMDVmICYmIHNxdWFyZUVub3VnaCAtPiB7CiAgICAg
ICAgICAgICAgICAgICAgc3R5bGVDaGFubmVsTG9nbyh2aWV3LCBkZW5zaXR5KQogICAgICAgICAg
ICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGlz
TGl2ZVR2U2NyZWVuKHJvb3Q6IFZpZXcpOiBCb29sZWFuIHsKICAgICAgICB2YXIgbGl2ZVR2ID0g
ZmFsc2UKICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IGZhbHNlCiAgICAgICAgdmlzaXQocm9vdCkg
eyB2aWV3IC0+CiAgICAgICAgICAgIGlmICh2aWV3IGlzIFRleHRWaWV3KSB7CiAgICAgICAgICAg
ICAgICB2YWwgdmFsdWUgPSB2aWV3LnRleHQ/LnRvU3RyaW5nKCk/LnRyaW0oKT8udXBwZXJjYXNl
KExvY2FsZS5VUykub3JFbXB0eSgpCiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gIkxJVkUg
VFYiIHx8IHZhbHVlLmNvbnRhaW5zKCJQUk9WSURFUiBDSEFOTkVMUyIpKSBsaXZlVHYgPSB0cnVl
CiAgICAgICAgICAgICAgICBpZiAodmFsdWUuY29udGFpbnMoIkNIQU5ORUwgQ0FURUdPUklFUyIp
KSBjYXRlZ29yaWVzID0gdHJ1ZQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVy
biBsaXZlVHYgJiYgY2F0ZWdvcmllcwogICAgfQoKICAgIHByaXZhdGUgZnVuIGlzRGFzaGJvYXJk
U2NyZWVuKHJvb3Q6IFZpZXcpOiBCb29sZWFuIHsKICAgICAgICB2YXIgY29ubmVjdGVkID0gZmFs
c2UKICAgICAgICB2YXIgc3RyZWFtaW5nID0gZmFsc2UKICAgICAgICB2aXNpdChyb290KSB7IHZp
ZXcgLT4KICAgICAgICAgICAgaWYgKHZpZXcgaXMgVGV4dFZpZXcpIHsKICAgICAgICAgICAgICAg
IHZhbCB2YWx1ZSA9IHZpZXcudGV4dD8udG9TdHJpbmcoKT8udHJpbSgpPy51cHBlcmNhc2UoTG9j
YWxlLlVTKS5vckVtcHR5KCkKICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCJD
T05ORUNURUQgQVMiKSkgY29ubmVjdGVkID0gdHJ1ZQogICAgICAgICAgICAgICAgaWYgKHZhbHVl
ID09ICJTVFJFQU1JTkciKSBzdHJlYW1pbmcgPSB0cnVlCiAgICAgICAgICAgIH0KICAgICAgICB9
CiAgICAgICAgcmV0dXJuIGNvbm5lY3RlZCAmJiBzdHJlYW1pbmcKICAgIH0KCiAgICBwcml2YXRl
IGZ1biBzdHlsZUNoYW5uZWxMb2dvKGltYWdlOiBJbWFnZVZpZXcsIGRlbnNpdHk6IEZsb2F0KSB7
CiAgICAgICAgdmFsIHRpbGUgPSBmaW5kU3F1YXJlVGlsZShpbWFnZSwgZGVuc2l0eSkKICAgICAg
ICB0aWxlLmJhY2tncm91bmQgPSBHcmFkaWVudERyYXdhYmxlKCkuYXBwbHkgewogICAgICAgICAg
ICBzaGFwZSA9IEdyYWRpZW50RHJhd2FibGUuUkVDVEFOR0xFCiAgICAgICAgICAgIGNvcm5lclJh
ZGl1cyA9IDEwZiAqIGRlbnNpdHkKICAgICAgICAgICAgc2V0Q29sb3IoQ29sb3IucmdiKDI0Niwg
MjQ2LCAyNDYpKQogICAgICAgICAgICBzZXRTdHJva2UobWF4KDEsIGRlbnNpdHkudG9JbnQoKSks
IENvbG9yLnJnYigxNTAsIDE1MCwgMTUwKSkKICAgICAgICB9CiAgICAgICAgaW1hZ2Uuc2NhbGVU
eXBlID0gSW1hZ2VWaWV3LlNjYWxlVHlwZS5DRU5URVJfSU5TSURFCiAgICAgICAgdmFsIGluc2V0
ID0gbWF4KDQsICg2ZiAqIGRlbnNpdHkpLnRvSW50KCkpCiAgICAgICAgaW1hZ2Uuc2V0UGFkZGlu
ZyhpbnNldCwgaW5zZXQsIGluc2V0LCBpbnNldCkKICAgICAgICBpbXByb3ZlRGFya0VtYmVkZGVk
QmFja2dyb3VuZChpbWFnZSkKICAgIH0KCiAgICBwcml2YXRlIGZ1biBmaW5kU3F1YXJlVGlsZShp
bWFnZTogSW1hZ2VWaWV3LCBkZW5zaXR5OiBGbG9hdCk6IFZpZXcgewogICAgICAgIHZhciBiZXN0
OiBWaWV3ID0gaW1hZ2UKICAgICAgICB2YXIgY2FuZGlkYXRlID0gaW1hZ2UucGFyZW50IGFzPyBW
aWV3CiAgICAgICAgcmVwZWF0KDMpIHsKICAgICAgICAgICAgY2FuZGlkYXRlID86IHJldHVybkBy
ZXBlYXQKICAgICAgICAgICAgdmFsIHdpZHRoRHAgPSBjYW5kaWRhdGUhIS53aWR0aCAvIGRlbnNp
dHkKICAgICAgICAgICAgdmFsIGhlaWdodERwID0gY2FuZGlkYXRlISEuaGVpZ2h0IC8gZGVuc2l0
eQogICAgICAgICAgICB2YWwgcmF0aW8gPSBpZiAoaGVpZ2h0RHAgPiAwZikgd2lkdGhEcCAvIGhl
aWdodERwIGVsc2UgOTlmCiAgICAgICAgICAgIGlmICh3aWR0aERwIGluIDM0Zi4uMTE1ZiAmJiBo
ZWlnaHREcCBpbiAzNGYuLjExNWYgJiYgcmF0aW8gaW4gMC42MmYuLjEuNjJmKSB7CiAgICAgICAg
ICAgICAgICBiZXN0ID0gY2FuZGlkYXRlISEKICAgICAgICAgICAgICAgIGNhbmRpZGF0ZSA9IGNh
bmRpZGF0ZSEhLnBhcmVudCBhcz8gVmlldwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAg
ICAgICAgY2FuZGlkYXRlID0gbnVsbAogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJl
dHVybiBiZXN0CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbWFrZUhlYWRlckFydHdvcmtUcmFuc3Bh
cmVudChpbWFnZTogSW1hZ2VWaWV3LCBkZW5zaXR5OiBGbG9hdCkgewogICAgICAgIHZhbCBhcnR3
b3JrID0gaW1hZ2UuZHJhd2FibGUgPzogaW1hZ2UuYmFja2dyb3VuZCA/OiByZXR1cm4KICAgICAg
ICBjbGVhclZpZXdCYWNrZ3JvdW5kKGltYWdlKQogICAgICAgIHZhciBwYXJlbnQgPSBpbWFnZS5w
YXJlbnQgYXM/IFZpZXcKICAgICAgICByZXBlYXQoNCkgewogICAgICAgICAgICBwYXJlbnQgPzog
cmV0dXJuQHJlcGVhdAogICAgICAgICAgICB2YWwgd2lkdGhEcCA9IHBhcmVudCEhLndpZHRoIC8g
ZGVuc2l0eQogICAgICAgICAgICB2YWwgaGVpZ2h0RHAgPSBwYXJlbnQhIS5oZWlnaHQgLyBkZW5z
aXR5CiAgICAgICAgICAgIHZhbCBsb2NhdGlvbiA9IEludEFycmF5KDIpCiAgICAgICAgICAgIHBh
cmVudCEhLmdldExvY2F0aW9uT25TY3JlZW4obG9jYXRpb24pCiAgICAgICAgICAgIHZhbCB4RHAg
PSBsb2NhdGlvblswXSAvIGRlbnNpdHkKICAgICAgICAgICAgdmFsIHlEcCA9IGxvY2F0aW9uWzFd
IC8gZGVuc2l0eQogICAgICAgICAgICBpZiAoeERwIDwgMTU1ZiAmJiB5RHAgPCAxMzVmICYmIHdp
ZHRoRHAgaW4gMzRmLi4xODBmICYmIGhlaWdodERwIGluIDM0Zi4uMTQwZikgewogICAgICAgICAg
ICAgICAgY2xlYXJWaWV3QmFja2dyb3VuZChwYXJlbnQhISkKICAgICAgICAgICAgICAgIHBhcmVu
dCA9IHBhcmVudCEhLnBhcmVudCBhcz8gVmlldwogICAgICAgICAgICB9IGVsc2UgewogICAgICAg
ICAgICAgICAgcGFyZW50ID0gbnVsbAogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICBp
ZiAocHJvY2Vzc2VkSGVhZGVyc1tpbWFnZV0gPT09IGFydHdvcmspIHJldHVybgogICAgICAgIHZh
bCBzb3VyY2UgPSBkcmF3YWJsZVRvQml0bWFwKGFydHdvcmssIGltYWdlKSA/OiByZXR1cm4KICAg
ICAgICB2YWwgb3V0cHV0ID0gc291cmNlLmNvcHkoQml0bWFwLkNvbmZpZy5BUkdCXzg4ODgsIHRy
dWUpCiAgICAgICAgZm9yICh5IGluIDAgdW50aWwgb3V0cHV0LmhlaWdodCkgewogICAgICAgICAg
ICBmb3IgKHggaW4gMCB1bnRpbCBvdXRwdXQud2lkdGgpIHsKICAgICAgICAgICAgICAgIHZhbCBw
aXhlbCA9IG91dHB1dC5nZXRQaXhlbCh4LCB5KQogICAgICAgICAgICAgICAgdmFsIHJlZCA9IENv
bG9yLnJlZChwaXhlbCkKICAgICAgICAgICAgICAgIHZhbCBncmVlbiA9IENvbG9yLmdyZWVuKHBp
eGVsKQogICAgICAgICAgICAgICAgdmFsIGJsdWUgPSBDb2xvci5ibHVlKHBpeGVsKQogICAgICAg
ICAgICAgICAgaWYgKENvbG9yLmFscGhhKHBpeGVsKSA+IDAgJiYgcmVkIDwgMTQwICYmIGdyZWVu
IDwgMTQwICYmIGJsdWUgPCAxNDAgJiYKICAgICAgICAgICAgICAgICAgICBhYnMocmVkIC0gZ3Jl
ZW4pIDwgNDYgJiYgYWJzKGdyZWVuIC0gYmx1ZSkgPCA0NgogICAgICAgICAgICAgICAgKSB7CiAg
ICAgICAgICAgICAgICAgICAgb3V0cHV0LnNldFBpeGVsKHgsIHksIENvbG9yLlRSQU5TUEFSRU5U
KQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIGltYWdl
LnNldEltYWdlQml0bWFwKG91dHB1dCkKICAgICAgICBpbWFnZS5kcmF3YWJsZT8ubGV0IHsgcHJv
Y2Vzc2VkSGVhZGVyc1tpbWFnZV0gPSBpdCB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gY2xlYXJU
b3BMZWZ0Q29udGFpbmVycyhyb290OiBWaWV3LCBkZW5zaXR5OiBGbG9hdCkgewogICAgICAgIHZp
c2l0KHJvb3QpIHsgdmlldyAtPgogICAgICAgICAgICBpZiAodmlldyBpcyBJbWFnZVZpZXcgfHwg
dmlldy53aWR0aCA8PSAwIHx8IHZpZXcuaGVpZ2h0IDw9IDApIHJldHVybkB2aXNpdAogICAgICAg
ICAgICB2YWwgbG9jYXRpb24gPSBJbnRBcnJheSgyKQogICAgICAgICAgICB2aWV3LmdldExvY2F0
aW9uT25TY3JlZW4obG9jYXRpb24pCiAgICAgICAgICAgIHZhbCB4RHAgPSBsb2NhdGlvblswXSAv
IGRlbnNpdHkKICAgICAgICAgICAgdmFsIHlEcCA9IGxvY2F0aW9uWzFdIC8gZGVuc2l0eQogICAg
ICAgICAgICB2YWwgd2lkdGhEcCA9IHZpZXcud2lkdGggLyBkZW5zaXR5CiAgICAgICAgICAgIHZh
bCBoZWlnaHREcCA9IHZpZXcuaGVpZ2h0IC8gZGVuc2l0eQogICAgICAgICAgICBpZiAoeERwIDwg
MjMwZiAmJiB5RHAgPCAxMzVmICYmIHdpZHRoRHAgaW4gMzRmLi4yODVmICYmIGhlaWdodERwIGlu
IDI4Zi4uMTQwZikgewogICAgICAgICAgICAgICAgY2xlYXJWaWV3QmFja2dyb3VuZCh2aWV3KQog
ICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGNsZWFyVmlld0Jh
Y2tncm91bmQodmlldzogVmlldykgewogICAgICAgIHZpZXcuYmFja2dyb3VuZCA9IENvbG9yRHJh
d2FibGUoQ29sb3IuVFJBTlNQQVJFTlQpCiAgICAgICAgdmlldy5iYWNrZ3JvdW5kVGludExpc3Qg
PSBDb2xvclN0YXRlTGlzdC52YWx1ZU9mKENvbG9yLlRSQU5TUEFSRU5UKQogICAgICAgIHJ1bkNh
dGNoaW5nIHsKICAgICAgICAgICAgdmlldy5qYXZhQ2xhc3MubWV0aG9kcwogICAgICAgICAgICAg
ICAgLmZpcnN0T3JOdWxsIHsgbWV0aG9kIC0+CiAgICAgICAgICAgICAgICAgICAgbWV0aG9kLm5h
bWUgPT0gInNldENhcmRCYWNrZ3JvdW5kQ29sb3IiICYmCiAgICAgICAgICAgICAgICAgICAgICAg
IG1ldGhvZC5wYXJhbWV0ZXJUeXBlcy5zaXplID09IDEgJiYKICAgICAgICAgICAgICAgICAgICAg
ICAgbWV0aG9kLnBhcmFtZXRlclR5cGVzWzBdID09IEludDo6Y2xhc3MuamF2YVByaW1pdGl2ZVR5
cGUKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgID8uaW52b2tlKHZpZXcsIENvbG9y
LlRSQU5TUEFSRU5UKQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBpbXByb3ZlRGFy
a0VtYmVkZGVkQmFja2dyb3VuZChpbWFnZTogSW1hZ2VWaWV3KSB7CiAgICAgICAgdmFsIGRyYXdh
YmxlID0gaW1hZ2UuZHJhd2FibGUgPzogcmV0dXJuCiAgICAgICAgaWYgKHByb2Nlc3NlZExvZ29z
W2ltYWdlXSA9PT0gZHJhd2FibGUpIHJldHVybgogICAgICAgIHZhbCBzb3VyY2UgPSBkcmF3YWJs
ZVRvQml0bWFwKGRyYXdhYmxlLCBpbWFnZSkgPzogcmV0dXJuCiAgICAgICAgdmFsIGNvcm5lcnMg
PSBsaXN0T2YoCiAgICAgICAgICAgIHNvdXJjZS5nZXRQaXhlbCgwLCAwKSwKICAgICAgICAgICAg
c291cmNlLmdldFBpeGVsKHNvdXJjZS53aWR0aCAtIDEsIDApLAogICAgICAgICAgICBzb3VyY2Uu
Z2V0UGl4ZWwoMCwgc291cmNlLmhlaWdodCAtIDEpLAogICAgICAgICAgICBzb3VyY2UuZ2V0UGl4
ZWwoc291cmNlLndpZHRoIC0gMSwgc291cmNlLmhlaWdodCAtIDEpCiAgICAgICAgKQogICAgICAg
IHZhbCBkYXJrT3BhcXVlQ29ybmVycyA9IGNvcm5lcnMuY291bnQgeyBDb2xvci5hbHBoYShpdCkg
Pj0gMTgwICYmIGx1bWluYW5jZShpdCkgPCA2NSB9CiAgICAgICAgaWYgKGRhcmtPcGFxdWVDb3Ju
ZXJzIDwgMykgewogICAgICAgICAgICBwcm9jZXNzZWRMb2dvc1tpbWFnZV0gPSBkcmF3YWJsZQog
ICAgICAgICAgICByZXR1cm4KICAgICAgICB9CgogICAgICAgIHZhciB2aXNpYmxlID0gMAogICAg
ICAgIHZhciBicmlnaHQgPSAwCiAgICAgICAgdmFsIHN0ZXBYID0gbWF4KDEsIHNvdXJjZS53aWR0
aCAvIDIwKQogICAgICAgIHZhbCBzdGVwWSA9IG1heCgxLCBzb3VyY2UuaGVpZ2h0IC8gMjApCiAg
ICAgICAgdmFyIHkgPSAwCiAgICAgICAgd2hpbGUgKHkgPCBzb3VyY2UuaGVpZ2h0KSB7CiAgICAg
ICAgICAgIHZhciB4ID0gMAogICAgICAgICAgICB3aGlsZSAoeCA8IHNvdXJjZS53aWR0aCkgewog
ICAgICAgICAgICAgICAgdmFsIHBpeGVsID0gc291cmNlLmdldFBpeGVsKHgsIHkpCiAgICAgICAg
ICAgICAgICBpZiAoQ29sb3IuYWxwaGEocGl4ZWwpID49IDEwMCkgewogICAgICAgICAgICAgICAg
ICAgIHZpc2libGUrKwogICAgICAgICAgICAgICAgICAgIGlmIChsdW1pbmFuY2UocGl4ZWwpID4g
MTc1KSBicmlnaHQrKwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgeCArPSBzdGVw
WAogICAgICAgICAgICB9CiAgICAgICAgICAgIHkgKz0gc3RlcFkKICAgICAgICB9CiAgICAgICAg
aWYgKHZpc2libGUgPiAwICYmIGJyaWdodCAqIDEwMCA+PSB2aXNpYmxlICogNCkgewogICAgICAg
ICAgICBwcm9jZXNzZWRMb2dvc1tpbWFnZV0gPSBkcmF3YWJsZQogICAgICAgICAgICByZXR1cm4K
ICAgICAgICB9CgogICAgICAgIHZhbCBvdXRwdXQgPSBzb3VyY2UuY29weShCaXRtYXAuQ29uZmln
LkFSR0JfODg4OCwgdHJ1ZSkKICAgICAgICBmb3IgKHB5IGluIDAgdW50aWwgb3V0cHV0LmhlaWdo
dCkgewogICAgICAgICAgICBmb3IgKHB4IGluIDAgdW50aWwgb3V0cHV0LndpZHRoKSB7CiAgICAg
ICAgICAgICAgICB2YWwgcGl4ZWwgPSBvdXRwdXQuZ2V0UGl4ZWwocHgsIHB5KQogICAgICAgICAg
ICAgICAgdmFsIHJlZCA9IENvbG9yLnJlZChwaXhlbCkKICAgICAgICAgICAgICAgIHZhbCBncmVl
biA9IENvbG9yLmdyZWVuKHBpeGVsKQogICAgICAgICAgICAgICAgdmFsIGJsdWUgPSBDb2xvci5i
bHVlKHBpeGVsKQogICAgICAgICAgICAgICAgaWYgKENvbG9yLmFscGhhKHBpeGVsKSA+IDAgJiYg
cmVkIDwgNTggJiYgZ3JlZW4gPCA1OCAmJiBibHVlIDwgNTggJiYKICAgICAgICAgICAgICAgICAg
ICBhYnMocmVkIC0gZ3JlZW4pIDwgMTYgJiYgYWJzKGdyZWVuIC0gYmx1ZSkgPCAxNgogICAgICAg
ICAgICAgICAgKSB7CiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNldFBpeGVsKHB4LCBweSwg
Q29sb3IuYXJnYihDb2xvci5hbHBoYShwaXhlbCksIDI0NiwgMjQ2LCAyNDYpKQogICAgICAgICAg
ICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIGltYWdlLnNldEltYWdlQml0
bWFwKG91dHB1dCkKICAgICAgICBpbWFnZS5kcmF3YWJsZT8ubGV0IHsgcHJvY2Vzc2VkTG9nb3Nb
aW1hZ2VdID0gaXQgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGRyYXdhYmxlVG9CaXRtYXAoZHJh
d2FibGU6IERyYXdhYmxlLCBpbWFnZTogSW1hZ2VWaWV3KTogQml0bWFwPyB7CiAgICAgICAgdmFs
IHdpZHRoID0gaW1hZ2Uud2lkdGguY29lcmNlSW4oMSwgMjU2KQogICAgICAgIHZhbCBoZWlnaHQg
PSBpbWFnZS5oZWlnaHQuY29lcmNlSW4oMSwgMjU2KQogICAgICAgIHJldHVybiBydW5DYXRjaGlu
ZyB7CiAgICAgICAgICAgIEJpdG1hcC5jcmVhdGVCaXRtYXAod2lkdGgsIGhlaWdodCwgQml0bWFw
LkNvbmZpZy5BUkdCXzg4ODgpLmFsc28geyBiaXRtYXAgLT4KICAgICAgICAgICAgICAgIHZhbCBj
YW52YXMgPSBDYW52YXMoYml0bWFwKQogICAgICAgICAgICAgICAgdmFsIG9sZEJvdW5kcyA9IFJl
Y3QoZHJhd2FibGUuYm91bmRzKQogICAgICAgICAgICAgICAgZHJhd2FibGUuc2V0Qm91bmRzKDAs
IDAsIHdpZHRoLCBoZWlnaHQpCiAgICAgICAgICAgICAgICBkcmF3YWJsZS5kcmF3KGNhbnZhcykK
ICAgICAgICAgICAgICAgIGRyYXdhYmxlLnNldEJvdW5kcyhvbGRCb3VuZHMpCiAgICAgICAgICAg
IH0KICAgICAgICB9LmdldE9yTnVsbCgpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbHVtaW5hbmNl
KGNvbG9yOiBJbnQpOiBJbnQgewogICAgICAgIHJldHVybiAoQ29sb3IucmVkKGNvbG9yKSAqIDI5
OSArIENvbG9yLmdyZWVuKGNvbG9yKSAqIDU4NyArIENvbG9yLmJsdWUoY29sb3IpICogMTE0KSAv
IDEwMDAKICAgIH0KCiAgICBwcml2YXRlIGZ1biB2aXNpdChyb290OiBWaWV3LCBhY3Rpb246IChW
aWV3KSAtPiBVbml0KSB7CiAgICAgICAgYWN0aW9uKHJvb3QpCiAgICAgICAgaWYgKHJvb3QgaXMg
Vmlld0dyb3VwKSB7CiAgICAgICAgICAgIGZvciAoaW5kZXggaW4gMCB1bnRpbCByb290LmNoaWxk
Q291bnQpIHZpc2l0KHJvb3QuZ2V0Q2hpbGRBdChpbmRleCksIGFjdGlvbikKICAgICAgICB9CiAg
ICB9Cn0K
:::END UICONTEXT

:::BEGIN IMMERSIVE
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5hcHAuQWN0
aXZpdHkKaW1wb3J0IGFuZHJvaWQuYXBwLkFwcGxpY2F0aW9uCmltcG9ydCBhbmRyb2lkLmNvbnRl
bnQuQ29udGVudFByb3ZpZGVyCmltcG9ydCBhbmRyb2lkLmNvbnRlbnQuQ29udGVudFZhbHVlcwpp
bXBvcnQgYW5kcm9pZC5kYXRhYmFzZS5DdXJzb3IKaW1wb3J0IGFuZHJvaWQuZ3JhcGhpY3MuQ29s
b3IKaW1wb3J0IGFuZHJvaWQubWVkaWEuQXVkaW9NYW5hZ2VyCmltcG9ydCBhbmRyb2lkLm5ldC5V
cmkKaW1wb3J0IGFuZHJvaWQub3MuQnVpbGQKaW1wb3J0IGFuZHJvaWQub3MuQnVuZGxlCmltcG9y
dCBhbmRyb2lkLm9zLkhhbmRsZXIKaW1wb3J0IGFuZHJvaWQub3MuTG9vcGVyCmltcG9ydCBhbmRy
b2lkLnZpZXcuVmlldwppbXBvcnQgYW5kcm9pZC52aWV3LlZpZXdHcm91cAppbXBvcnQgYW5kcm9p
ZC52aWV3LldpbmRvd0luc2V0cwppbXBvcnQgYW5kcm9pZC52aWV3LldpbmRvd0luc2V0c0NvbnRy
b2xsZXIKaW1wb3J0IGFuZHJvaWQudmlldy5XaW5kb3dNYW5hZ2VyCmltcG9ydCBhbmRyb2lkLndp
ZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZHguYWN0aXZpdHkuQ29tcG9uZW50QWN0aXZpdHkK
aW1wb3J0IGFuZHJvaWR4LmFjdGl2aXR5Lk9uQmFja1ByZXNzZWRDYWxsYmFjawppbXBvcnQgYW5k
cm9pZHguY29yZS52aWV3LldpbmRvd0NvbXBhdAppbXBvcnQgYW5kcm9pZHgubWVkaWEzLmNvbW1v
bi5DCmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuY29tbW9uLlBsYXllcgppbXBvcnQgYW5kcm9pZHgu
bWVkaWEzLmNvbW1vbi5UcmFja1NlbGVjdGlvbk92ZXJyaWRlCmltcG9ydCBhbmRyb2lkeC5tZWRp
YTMuY29tbW9uLlRyYWNrcwppbXBvcnQgYW5kcm9pZHgubWVkaWEzLnVpLkFzcGVjdFJhdGlvRnJh
bWVMYXlvdXQKaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy51aS5QbGF5ZXJWaWV3CmltcG9ydCBqYXZh
LnV0aWwuV2Vha0hhc2hNYXAKCi8qKgogKiBLZWVwcyBwbGF5YmFjayB0cnVseSBlZGdlLXRvLWVk
Z2Ugd2l0aG91dCBtb2RpZnlpbmcgUGxheWVyQWN0aXZpdHkgb3IgYW55CiAqIHN0cmVhbS1yb3V0
aW5nIGNvZGUuIEFsbCBub24tcGxheWVyIHNjcmVlbnMgcmV0YWluIHRoZWlyIGV4aXN0aW5nIHN5
c3RlbSBVSS4KICovCmNsYXNzIFBsYXliYWNrSW1tZXJzaXZlUHJvdmlkZXIgOiBDb250ZW50UHJv
dmlkZXIoKSB7CiAgICBwcml2YXRlIHZhbCBtYWluSGFuZGxlciA9IEhhbmRsZXIoTG9vcGVyLmdl
dE1haW5Mb29wZXIoKSkKICAgIHByaXZhdGUgdmFsIGJhY2tDYWxsYmFja3MgPSBXZWFrSGFzaE1h
cDxBY3Rpdml0eSwgT25CYWNrUHJlc3NlZENhbGxiYWNrPigpCiAgICBwcml2YXRlIHZhbCBhdWRp
b0xpc3RlbmVycyA9IFdlYWtIYXNoTWFwPEFjdGl2aXR5LCBNdXRhYmxlTWFwPFBsYXllciwgUGxh
eWVyLkxpc3RlbmVyPj4oKQoKICAgIG92ZXJyaWRlIGZ1biBvbkNyZWF0ZSgpOiBCb29sZWFuIHsK
ICAgICAgICB2YWwgYXBwID0gY29udGV4dD8uYXBwbGljYXRpb25Db250ZXh0IGFzPyBBcHBsaWNh
dGlvbiA/OiByZXR1cm4gZmFsc2UKICAgICAgICBhcHAucmVnaXN0ZXJBY3Rpdml0eUxpZmVjeWNs
ZUNhbGxiYWNrcyhvYmplY3QgOiBBcHBsaWNhdGlvbi5BY3Rpdml0eUxpZmVjeWNsZUNhbGxiYWNr
cyB7CiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBvbkFjdGl2aXR5Q3JlYXRlZChhY3Rpdml0eTog
QWN0aXZpdHksIHN0YXRlOiBCdW5kbGU/KSB7CiAgICAgICAgICAgICAgICBpZiAoaXNQbGF5ZXIo
YWN0aXZpdHkpKSB7CiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbEltbWVyc2l2ZU1vZGUoYWN0
aXZpdHkpCiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbEJhY2tIYW5kbGluZyhhY3Rpdml0eSkK
ICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQoKICAgICAgICAgICAgb3ZlcnJpZGUgZnVu
IG9uQWN0aXZpdHlSZXN1bWVkKGFjdGl2aXR5OiBBY3Rpdml0eSkgewogICAgICAgICAgICAgICAg
aWYgKGlzUGxheWVyKGFjdGl2aXR5KSkgewogICAgICAgICAgICAgICAgICAgIGluc3RhbGxJbW1l
cnNpdmVNb2RlKGFjdGl2aXR5KQogICAgICAgICAgICAgICAgICAgIGluc3RhbGxCYWNrSGFuZGxp
bmcoYWN0aXZpdHkpCiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZVBsYXllckF1ZGlvKGFjdGl2
aXR5KQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CgogICAgICAgICAgICBvdmVycmlk
ZSBmdW4gb25BY3Rpdml0eVN0YXJ0ZWQoYWN0aXZpdHk6IEFjdGl2aXR5KSA9IFVuaXQKICAgICAg
ICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlQYXVzZWQoYWN0aXZpdHk6IEFjdGl2aXR5KSA9
IFVuaXQKICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlTdG9wcGVkKGFjdGl2aXR5
OiBBY3Rpdml0eSkgPSBVbml0CiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBvbkFjdGl2aXR5U2F2
ZUluc3RhbmNlU3RhdGUoYWN0aXZpdHk6IEFjdGl2aXR5LCBzdGF0ZTogQnVuZGxlKSA9IFVuaXQK
ICAgICAgICAgICAgb3ZlcnJpZGUgZnVuIG9uQWN0aXZpdHlEZXN0cm95ZWQoYWN0aXZpdHk6IEFj
dGl2aXR5KSB7CiAgICAgICAgICAgICAgICBiYWNrQ2FsbGJhY2tzLnJlbW92ZShhY3Rpdml0eSk/
LnJlbW92ZSgpCiAgICAgICAgICAgICAgICBhdWRpb0xpc3RlbmVycy5yZW1vdmUoYWN0aXZpdHkp
Py5mb3JFYWNoIHsgKHBsYXllciwgbGlzdGVuZXIpIC0+CiAgICAgICAgICAgICAgICAgICAgcGxh
eWVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKQogICAgICAgICAgICAgICAgfQogICAgICAgICAg
ICB9CiAgICAgICAgfSkKICAgICAgICByZXR1cm4gdHJ1ZQogICAgfQoKICAgIHByaXZhdGUgZnVu
IGlzUGxheWVyKGFjdGl2aXR5OiBBY3Rpdml0eSk6IEJvb2xlYW4gewogICAgICAgIHJldHVybiBh
Y3Rpdml0eS5qYXZhQ2xhc3MubmFtZSA9PSAiY29tLmtyaXN0YWxzdHJlYW1zLnBsYXllci5QbGF5
ZXJBY3Rpdml0eSIgfHwKICAgICAgICAgICAgYWN0aXZpdHkuamF2YUNsYXNzLnNpbXBsZU5hbWUg
PT0gIlBsYXllckFjdGl2aXR5IgogICAgfQoKICAgIHByaXZhdGUgZnVuIGluc3RhbGxJbW1lcnNp
dmVNb2RlKGFjdGl2aXR5OiBBY3Rpdml0eSkgewogICAgICAgIHZhbCB3aW5kb3cgPSBhY3Rpdml0
eS53aW5kb3cKICAgICAgICB3aW5kb3cuYWRkRmxhZ3MoV2luZG93TWFuYWdlci5MYXlvdXRQYXJh
bXMuRkxBR19GVUxMU0NSRUVOKQogICAgICAgIHdpbmRvdy5hZGRGbGFncyhXaW5kb3dNYW5hZ2Vy
LkxheW91dFBhcmFtcy5GTEFHX0tFRVBfU0NSRUVOX09OKQogICAgICAgIHdpbmRvdy5zdGF0dXNC
YXJDb2xvciA9IENvbG9yLlRSQU5TUEFSRU5UCiAgICAgICAgd2luZG93Lm5hdmlnYXRpb25CYXJD
b2xvciA9IENvbG9yLlRSQU5TUEFSRU5UCiAgICAgICAgV2luZG93Q29tcGF0LnNldERlY29yRml0
c1N5c3RlbVdpbmRvd3Mod2luZG93LCBmYWxzZSkKCiAgICAgICAgaWYgKEJ1aWxkLlZFUlNJT04u
U0RLX0lOVCA+PSBCdWlsZC5WRVJTSU9OX0NPREVTLlApIHsKICAgICAgICAgICAgd2luZG93LmF0
dHJpYnV0ZXMgPSB3aW5kb3cuYXR0cmlidXRlcy5hcHBseSB7CiAgICAgICAgICAgICAgICBsYXlv
dXRJbkRpc3BsYXlDdXRvdXRNb2RlID0KICAgICAgICAgICAgICAgICAgICBXaW5kb3dNYW5hZ2Vy
LkxheW91dFBhcmFtcy5MQVlPVVRfSU5fRElTUExBWV9DVVRPVVRfTU9ERV9TSE9SVF9FREdFUwog
ICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAgICBoaWRlU3lzdGVtQmFycyhhY3Rpdml0eSkK
ICAgICAgICBzdHJldGNoVmlkZW9Ub0ZpbGwoYWN0aXZpdHkpCiAgICAgICAgcmVtb3ZlQ2hhbm5l
bEJhbm5lcihhY3Rpdml0eSkKICAgICAgICByZXN0b3JlUGxheWVyQXVkaW8oYWN0aXZpdHkpCgog
ICAgICAgIEBTdXBwcmVzcygiREVQUkVDQVRJT04iKQogICAgICAgIHdpbmRvdy5kZWNvclZpZXcu
c2V0T25TeXN0ZW1VaVZpc2liaWxpdHlDaGFuZ2VMaXN0ZW5lciB7CiAgICAgICAgICAgIGlmIChp
c1BsYXllcihhY3Rpdml0eSkpIHsKICAgICAgICAgICAgICAgIG1haW5IYW5kbGVyLnBvc3REZWxh
eWVkKHsKICAgICAgICAgICAgICAgICAgICBpZiAoIWFjdGl2aXR5LmlzRmluaXNoaW5nICYmICFh
Y3Rpdml0eS5pc0Rlc3Ryb3llZCkgewogICAgICAgICAgICAgICAgICAgICAgICBoaWRlU3lzdGVt
QmFycyhhY3Rpdml0eSkKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9LCAz
XzUwMEwpCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaW5z
dGFsbEJhY2tIYW5kbGluZyhhY3Rpdml0eTogQWN0aXZpdHkpIHsKICAgICAgICBpZiAoYmFja0Nh
bGxiYWNrcy5jb250YWluc0tleShhY3Rpdml0eSkpIHJldHVybgogICAgICAgIHZhbCBob3N0ID0g
YWN0aXZpdHkgYXM/IENvbXBvbmVudEFjdGl2aXR5ID86IHJldHVybgogICAgICAgIHZhbCBjYWxs
YmFjayA9IG9iamVjdCA6IE9uQmFja1ByZXNzZWRDYWxsYmFjayh0cnVlKSB7CiAgICAgICAgICAg
IG92ZXJyaWRlIGZ1biBoYW5kbGVPbkJhY2tQcmVzc2VkKCkgewogICAgICAgICAgICAgICAgaXNF
bmFibGVkID0gZmFsc2UKICAgICAgICAgICAgICAgIGFjdGl2aXR5LmZpbmlzaCgpCiAgICAgICAg
ICAgIH0KICAgICAgICB9CiAgICAgICAgaG9zdC5vbkJhY2tQcmVzc2VkRGlzcGF0Y2hlci5hZGRD
YWxsYmFjayhob3N0LCBjYWxsYmFjaykKICAgICAgICBiYWNrQ2FsbGJhY2tzW2FjdGl2aXR5XSA9
IGNhbGxiYWNrCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gcmVzdG9yZVBsYXllckF1ZGlvKGFjdGl2
aXR5OiBBY3Rpdml0eSkgewogICAgICAgIGFjdGl2aXR5LnZvbHVtZUNvbnRyb2xTdHJlYW0gPSBB
dWRpb01hbmFnZXIuU1RSRUFNX01VU0lDCiAgICAgICAgdmFsIHJvb3QgPSBhY3Rpdml0eS53aW5k
b3cuZGVjb3JWaWV3CiAgICAgICAgbGlzdE9mKDBMLCAyNTBMLCA5MDBMLCAxXzgwMEwsIDRfMDAw
TCkuZm9yRWFjaCB7IGRlbGF5IC0+CiAgICAgICAgICAgIG1haW5IYW5kbGVyLnBvc3REZWxheWVk
KHsKICAgICAgICAgICAgICAgIGlmICghYWN0aXZpdHkuaXNGaW5pc2hpbmcgJiYgIWFjdGl2aXR5
LmlzRGVzdHJveWVkKSB7CiAgICAgICAgICAgICAgICAgICAgdmlzaXQocm9vdCkgeyB2aWV3IC0+
CiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2aWV3IGlzIFBsYXllclZpZXcpIHsKICAgICAg
ICAgICAgICAgICAgICAgICAgICAgIHZpZXcucGxheWVyPy5sZXQgeyBwbGF5ZXIgLT4KICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXIudm9sdW1lID0gMWYKICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICBpbnN0YWxsQXVkaW9UcmFja1JlY292ZXJ5KGFjdGl2aXR5LCBw
bGF5ZXIpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAg
ICAgIH0KICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAg
IH0sIGRlbGF5KQogICAgICAgIH0KICAgIH0KCiAgICAvKioKICAgICAqIEtlZXBzIGF1ZGlvIGVu
YWJsZWQgZm9yIGV2ZXJ5IHBsYXllciBpbnN0YW5jZSBhbmQgZmFsbHMgYmFjayB0byB0aGUgZmly
c3QKICAgICAqIGRldmljZS1zdXBwb3J0ZWQgYXVkaW8gdHJhY2sgd2hlbiBhIHByb3ZpZGVyIHN0
cmVhbSBleHBvc2VzIHNldmVyYWwuCiAgICAgKi8KICAgIHByaXZhdGUgZnVuIGluc3RhbGxBdWRp
b1RyYWNrUmVjb3ZlcnkoYWN0aXZpdHk6IEFjdGl2aXR5LCBwbGF5ZXI6IFBsYXllcikgewogICAg
ICAgIHZhbCBsaXN0ZW5lcnMgPSBhdWRpb0xpc3RlbmVycy5nZXRPclB1dChhY3Rpdml0eSkgeyBt
dXRhYmxlTWFwT2YoKSB9CiAgICAgICAgaWYgKGxpc3RlbmVycy5jb250YWluc0tleShwbGF5ZXIp
KSByZXR1cm4KCiAgICAgICAgcGxheWVyLnRyYWNrU2VsZWN0aW9uUGFyYW1ldGVycyA9IHBsYXll
ci50cmFja1NlbGVjdGlvblBhcmFtZXRlcnMKICAgICAgICAgICAgLmJ1aWxkVXBvbigpCiAgICAg
ICAgICAgIC5zZXRUcmFja1R5cGVEaXNhYmxlZChDLlRSQUNLX1RZUEVfQVVESU8sIGZhbHNlKQog
ICAgICAgICAgICAuYnVpbGQoKQoKICAgICAgICB2YWwgbGlzdGVuZXIgPSBvYmplY3QgOiBQbGF5
ZXIuTGlzdGVuZXIgewogICAgICAgICAgICBvdmVycmlkZSBmdW4gb25UcmFja3NDaGFuZ2VkKHRy
YWNrczogVHJhY2tzKSB7CiAgICAgICAgICAgICAgICBwbGF5ZXIudm9sdW1lID0gMWYKICAgICAg
ICAgICAgICAgIHNlbGVjdFN1cHBvcnRlZEF1ZGlvVHJhY2socGxheWVyLCB0cmFja3MpCiAgICAg
ICAgICAgIH0KCiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBvblBsYXliYWNrU3RhdGVDaGFuZ2Vk
KHBsYXliYWNrU3RhdGU6IEludCkgewogICAgICAgICAgICAgICAgcGxheWVyLnZvbHVtZSA9IDFm
CiAgICAgICAgICAgICAgICBpZiAocGxheWJhY2tTdGF0ZSA9PSBQbGF5ZXIuU1RBVEVfUkVBRFkp
IHsKICAgICAgICAgICAgICAgICAgICBzZWxlY3RTdXBwb3J0ZWRBdWRpb1RyYWNrKHBsYXllciwg
cGxheWVyLmN1cnJlbnRUcmFja3MpCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAg
ICAgICB9CiAgICAgICAgcGxheWVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKQogICAgICAgIGxpc3Rl
bmVyc1twbGF5ZXJdID0gbGlzdGVuZXIKICAgICAgICBzZWxlY3RTdXBwb3J0ZWRBdWRpb1RyYWNr
KHBsYXllciwgcGxheWVyLmN1cnJlbnRUcmFja3MpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc2Vs
ZWN0U3VwcG9ydGVkQXVkaW9UcmFjayhwbGF5ZXI6IFBsYXllciwgdHJhY2tzOiBUcmFja3MpIHsK
ICAgICAgICB2YWwgYXVkaW9Hcm91cHMgPSB0cmFja3MuZ3JvdXBzLmZpbHRlciB7IGl0LnR5cGUg
PT0gQy5UUkFDS19UWVBFX0FVRElPIH0KICAgICAgICBpZiAoYXVkaW9Hcm91cHMuaXNFbXB0eSgp
KSByZXR1cm4KCiAgICAgICAgdmFsIGFscmVhZHlTZWxlY3RlZCA9IGF1ZGlvR3JvdXBzLmFueSB7
IGdyb3VwIC0+CiAgICAgICAgICAgICgwIHVudGlsIGdyb3VwLmxlbmd0aCkuYW55IHsgaW5kZXgg
LT4KICAgICAgICAgICAgICAgIGdyb3VwLmlzVHJhY2tTZWxlY3RlZChpbmRleCkgJiYgZ3JvdXAu
aXNUcmFja1N1cHBvcnRlZChpbmRleCkKICAgICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBp
ZiAoYWxyZWFkeVNlbGVjdGVkKSByZXR1cm4KCiAgICAgICAgdmFsIHN1cHBvcnRlZCA9IGF1ZGlv
R3JvdXBzLmFzU2VxdWVuY2UoKS5tYXBOb3ROdWxsIHsgZ3JvdXAgLT4KICAgICAgICAgICAgKDAg
dW50aWwgZ3JvdXAubGVuZ3RoKQogICAgICAgICAgICAgICAgLmZpcnN0T3JOdWxsIHsgaW5kZXgg
LT4gZ3JvdXAuaXNUcmFja1N1cHBvcnRlZChpbmRleCkgfQogICAgICAgICAgICAgICAgPy5sZXQg
eyBpbmRleCAtPiBncm91cCB0byBpbmRleCB9CiAgICAgICAgfS5maXJzdE9yTnVsbCgpID86IHJl
dHVybgoKICAgICAgICB2YWwgb3ZlcnJpZGUgPSBUcmFja1NlbGVjdGlvbk92ZXJyaWRlKAogICAg
ICAgICAgICBzdXBwb3J0ZWQuZmlyc3QubWVkaWFUcmFja0dyb3VwLAogICAgICAgICAgICBsaXN0
T2Yoc3VwcG9ydGVkLnNlY29uZCkKICAgICAgICApCiAgICAgICAgcGxheWVyLnRyYWNrU2VsZWN0
aW9uUGFyYW1ldGVycyA9IHBsYXllci50cmFja1NlbGVjdGlvblBhcmFtZXRlcnMKICAgICAgICAg
ICAgLmJ1aWxkVXBvbigpCiAgICAgICAgICAgIC5zZXRUcmFja1R5cGVEaXNhYmxlZChDLlRSQUNL
X1RZUEVfQVVESU8sIGZhbHNlKQogICAgICAgICAgICAuY2xlYXJPdmVycmlkZXNPZlR5cGUoQy5U
UkFDS19UWVBFX0FVRElPKQogICAgICAgICAgICAuc2V0T3ZlcnJpZGVGb3JUeXBlKG92ZXJyaWRl
KQogICAgICAgICAgICAuYnVpbGQoKQogICAgICAgIHBsYXllci52b2x1bWUgPSAxZgogICAgfQoK
ICAgIHByaXZhdGUgZnVuIHN0cmV0Y2hWaWRlb1RvRmlsbChhY3Rpdml0eTogQWN0aXZpdHkpIHsK
ICAgICAgICB2YWwgcm9vdCA9IGFjdGl2aXR5LndpbmRvdy5kZWNvclZpZXcKICAgICAgICBsaXN0
T2YoMEwsIDI1MEwsIDkwMEwpLmZvckVhY2ggeyBkZWxheSAtPgogICAgICAgICAgICBtYWluSGFu
ZGxlci5wb3N0RGVsYXllZCh7CiAgICAgICAgICAgICAgICBpZiAoIWFjdGl2aXR5LmlzRmluaXNo
aW5nICYmICFhY3Rpdml0eS5pc0Rlc3Ryb3llZCkgewogICAgICAgICAgICAgICAgICAgIHZpc2l0
KHJvb3QpIHsgdmlldyAtPgogICAgICAgICAgICAgICAgICAgICAgICBpZiAodmlldyBpcyBQbGF5
ZXJWaWV3KSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaWxsIHRoZSBjb21wbGV0
ZSBkaXNwbGF5IHdpdGhvdXQgem9vbS1jcm9wcGluZy4KICAgICAgICAgICAgICAgICAgICAgICAg
ICAgIC8vIEV4dHJhLXdpZGUgZGV2aWNlcyBtYXkgd2lkZW4gdGhlIHBpY3R1cmUgc2xpZ2h0bHk7
CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGFuZGFyZCAxNjo5IHRlbGV2aXNpb24g
ZGlzcGxheXMgcmVtYWluIG5hdHVyYWwuCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3
LnJlc2l6ZU1vZGUgPSBBc3BlY3RSYXRpb0ZyYW1lTGF5b3V0LlJFU0laRV9NT0RFX0ZJTEwKICAg
ICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcubGF5b3V0UGFyYW1zID0gdmlldy5sYXlvdXRQ
YXJhbXM/LmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IFZp
ZXdHcm91cC5MYXlvdXRQYXJhbXMuTUFUQ0hfUEFSRU5UCiAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgaGVpZ2h0ID0gVmlld0dyb3VwLkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQKICAg
ICAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZp
ZXcucmVxdWVzdExheW91dCgpCiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAg
ICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0sIGRlbGF5KQogICAgICAg
IH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biB2aXNpdCh2aWV3OiBWaWV3LCBhY3Rpb246IChWaWV3
KSAtPiBVbml0KSB7CiAgICAgICAgYWN0aW9uKHZpZXcpCiAgICAgICAgaWYgKHZpZXcgaXMgVmll
d0dyb3VwKSB7CiAgICAgICAgICAgIGZvciAoaW5kZXggaW4gMCB1bnRpbCB2aWV3LmNoaWxkQ291
bnQpIHsKICAgICAgICAgICAgICAgIHZpc2l0KHZpZXcuZ2V0Q2hpbGRBdChpbmRleCksIGFjdGlv
bikKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICAvKiogUmVtb3ZlcyBvbmx5IHRo
ZSBwZXJzaXN0ZW50IGluLWFwcCBjaGFubmVsL0VQRyBiYW5uZXIgYXQgdGhlIHRvcC4gKi8KICAg
IHByaXZhdGUgZnVuIHJlbW92ZUNoYW5uZWxCYW5uZXIoYWN0aXZpdHk6IEFjdGl2aXR5KSB7CiAg
ICAgICAgdmFsIHJvb3QgPSBhY3Rpdml0eS53aW5kb3cuZGVjb3JWaWV3CiAgICAgICAgdmFsIGNo
YW5uZWxOYW1lID0gYWN0aXZpdHkuaW50ZW50LmdldFN0cmluZ0V4dHJhKCJuYW1lIik/LnRyaW0o
KS5vckVtcHR5KCkKCiAgICAgICAgbGlzdE9mKDBMLCAyMDBMLCA4MDBMLCAxXzYwMEwpLmZvckVh
Y2ggeyBkZWxheSAtPgogICAgICAgICAgICBtYWluSGFuZGxlci5wb3N0RGVsYXllZCh7CiAgICAg
ICAgICAgICAgICBpZiAoYWN0aXZpdHkuaXNGaW5pc2hpbmcgfHwgYWN0aXZpdHkuaXNEZXN0cm95
ZWQpIHJldHVybkBwb3N0RGVsYXllZAoKICAgICAgICAgICAgICAgIHZhbCBuYW1lZFZpZXdzID0g
bXV0YWJsZUxpc3RPZjxUZXh0Vmlldz4oKQogICAgICAgICAgICAgICAgdmlzaXQocm9vdCkgeyB2
aWV3IC0+CiAgICAgICAgICAgICAgICAgICAgaWYgKHZpZXcgaXMgVGV4dFZpZXcpIHsKICAgICAg
ICAgICAgICAgICAgICAgICAgdmFsIHZhbHVlID0gdmlldy50ZXh0Py50b1N0cmluZygpPy50cmlt
KCkub3JFbXB0eSgpCiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCByZXNvdXJjZU5hbWUgPSBy
ZXNvdXJjZUVudHJ5TmFtZSh2aWV3KQogICAgICAgICAgICAgICAgICAgICAgICB2YWwgbWF0Y2hl
c0NoYW5uZWwgPSBjaGFubmVsTmFtZS5pc05vdEJsYW5rKCkgJiYgdmFsdWUuZXF1YWxzKGNoYW5u
ZWxOYW1lLCB0cnVlKQogICAgICAgICAgICAgICAgICAgICAgICB2YWwgbWF0Y2hlc0tub3duSWQg
PSByZXNvdXJjZU5hbWUuY29udGFpbnMoInBsYXllclRpdGxlIiwgdHJ1ZSkgfHwKICAgICAgICAg
ICAgICAgICAgICAgICAgICAgIHJlc291cmNlTmFtZS5jb250YWlucygiY2hhbm5lbFRpdGxlIiwg
dHJ1ZSkgfHwKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlTmFtZS5jb250YWlu
cygiY2hhbm5lbE5hbWUiLCB0cnVlKSB8fAogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVz
b3VyY2VOYW1lLmNvbnRhaW5zKCJwbGF5ZXJDaGFubmVsIiwgdHJ1ZSkKICAgICAgICAgICAgICAg
ICAgICAgICAgaWYgKG1hdGNoZXNDaGFubmVsIHx8IG1hdGNoZXNLbm93bklkKSBuYW1lZFZpZXdz
ICs9IHZpZXcKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CgogICAgICAg
ICAgICAgICAgbmFtZWRWaWV3cy5mb3JFYWNoIHsgdGl0bGUgLT4KICAgICAgICAgICAgICAgICAg
ICB2YWwgYmFubmVyID0gZmluZENoYW5uZWxCYW5uZXIocm9vdCwgdGl0bGUsIGNoYW5uZWxOYW1l
KQogICAgICAgICAgICAgICAgICAgIGJhbm5lci52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAg
ICAgICAgICAgICB9CgogICAgICAgICAgICAgICAgLy8gUmVzb3VyY2UtbmFtZSBmYWxsYmFjayBm
b3IgbGF5b3V0cyB3aG9zZSB0aXRsZSB0ZXh0IGlzIGZpbGxlZAogICAgICAgICAgICAgICAgLy8g
YWZ0ZXIgdGhlIGZpcnN0IGZyYW1lIG9yIGRpZmZlcnMgc2xpZ2h0bHkgZnJvbSB0aGUgaW50ZW50
IG5hbWUuCiAgICAgICAgICAgICAgICB2aXNpdChyb290KSB7IHZpZXcgLT4KICAgICAgICAgICAg
ICAgICAgICBpZiAodmlldyAhPT0gcm9vdCAmJiB2aWV3ICFpcyBQbGF5ZXJWaWV3KSB7CiAgICAg
ICAgICAgICAgICAgICAgICAgIHZhbCBpZE5hbWUgPSByZXNvdXJjZUVudHJ5TmFtZSh2aWV3KS5s
b3dlcmNhc2UoKQogICAgICAgICAgICAgICAgICAgICAgICB2YWwgbG9va3NMaWtlQmFubmVyID0K
ICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpZE5hbWUuY29udGFpbnMoInBsYXllciIpIHx8
IGlkTmFtZS5jb250YWlucygiY2hhbm5lbCIpIHx8IGlkTmFtZS5jb250YWlucygiZXBnIikpICYm
CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGlkTmFtZS5jb250YWlucygiaGVhZGVy
IikgfHwgaWROYW1lLmNvbnRhaW5zKCJiYW5uZXIiKSB8fCBpZE5hbWUuY29udGFpbnMoImluZm8i
KSB8fCBpZE5hbWUuY29udGFpbnMoIm92ZXJsYXkiKSkKICAgICAgICAgICAgICAgICAgICAgICAg
aWYgKGxvb2tzTGlrZUJhbm5lciAmJiBpc1RvcEJhbm5lclNpemVkKHJvb3QsIHZpZXcpICYmICFj
b250YWluc1BsYXllclZpZXcodmlldykpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZp
ZXcudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAg
ICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9LCBkZWxheSkK
ICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gZmluZENoYW5uZWxCYW5uZXIocm9vdDog
VmlldywgdGl0bGU6IFRleHRWaWV3LCBjaGFubmVsTmFtZTogU3RyaW5nKTogVmlldyB7CiAgICAg
ICAgdmFyIGN1cnJlbnQ6IFZpZXcgPSB0aXRsZQogICAgICAgIHZhciBiZXN0OiBWaWV3ID0gdGl0
bGUKICAgICAgICBmb3IgKGxldmVsIGluIDAgdW50aWwgNSkgewogICAgICAgICAgICB2YWwgcGFy
ZW50ID0gY3VycmVudC5wYXJlbnQgYXM/IFZpZXdHcm91cCA/OiBicmVhawogICAgICAgICAgICBp
ZiAocGFyZW50ID09PSByb290IHx8IGNvbnRhaW5zUGxheWVyVmlldyhwYXJlbnQpKSBicmVhawog
ICAgICAgICAgICB2YWwgdGV4dHMgPSBtdXRhYmxlTGlzdE9mPFN0cmluZz4oKQogICAgICAgICAg
ICB2aXNpdChwYXJlbnQpIHsgY2hpbGQgLT4KICAgICAgICAgICAgICAgIGlmIChjaGlsZCBpcyBU
ZXh0VmlldykgdGV4dHMgKz0gY2hpbGQudGV4dD8udG9TdHJpbmcoKT8udHJpbSgpLm9yRW1wdHko
KQogICAgICAgICAgICB9CiAgICAgICAgICAgIHZhbCBoYXNDaGFubmVsID0gY2hhbm5lbE5hbWUu
aXNOb3RCbGFuaygpICYmIHRleHRzLmFueSB7IGl0LmVxdWFscyhjaGFubmVsTmFtZSwgdHJ1ZSkg
fQogICAgICAgICAgICB2YWwgaGFzU2NoZWR1bGUgPSB0ZXh0cy5hbnkgewogICAgICAgICAgICAg
ICAgaXQuc3RhcnRzV2l0aCgiTk9XIiwgdHJ1ZSkgfHwgaXQuc3RhcnRzV2l0aCgiTkVYVCIsIHRy
dWUpIHx8CiAgICAgICAgICAgICAgICAgICAgKGl0LmNvbnRhaW5zKCJOT1ciLCB0cnVlKSAmJiBp
dC5jb250YWlucygiTkVYVCIsIHRydWUpKQogICAgICAgICAgICB9CiAgICAgICAgICAgIGlmIChp
c1RvcEJhbm5lclNpemVkKHJvb3QsIHBhcmVudCkgJiYgKGhhc0NoYW5uZWwgfHwgaGFzU2NoZWR1
bGUpKSBiZXN0ID0gcGFyZW50CiAgICAgICAgICAgIGN1cnJlbnQgPSBwYXJlbnQKICAgICAgICB9
CiAgICAgICAgcmV0dXJuIGJlc3QKICAgIH0KCiAgICBwcml2YXRlIGZ1biBpc1RvcEJhbm5lclNp
emVkKHJvb3Q6IFZpZXcsIHZpZXc6IFZpZXcpOiBCb29sZWFuIHsKICAgICAgICB2YWwgc2NyZWVu
SGVpZ2h0ID0gcm9vdC5oZWlnaHQuY29lcmNlQXRMZWFzdCgxKQogICAgICAgIHZhbCBoZWlnaHQg
PSB2aWV3LmhlaWdodC50YWtlSWYgeyBpdCA+IDAgfSA/OiB2aWV3LmxheW91dFBhcmFtcz8uaGVp
Z2h0ID86IDAKICAgICAgICByZXR1cm4gaGVpZ2h0IGluIDEuLihzY3JlZW5IZWlnaHQgKiAyIC8g
NSkgJiYgdmlldy55IDw9IHNjcmVlbkhlaWdodCAqIDAuMzVmCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gY29udGFpbnNQbGF5ZXJWaWV3KHZpZXc6IFZpZXcpOiBCb29sZWFuIHsKICAgICAgICB2YXIg
Zm91bmQgPSBmYWxzZQogICAgICAgIHZpc2l0KHZpZXcpIHsgaWYgKGl0IGlzIFBsYXllclZpZXcp
IGZvdW5kID0gdHJ1ZSB9CiAgICAgICAgcmV0dXJuIGZvdW5kCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gcmVzb3VyY2VFbnRyeU5hbWUodmlldzogVmlldyk6IFN0cmluZyB7CiAgICAgICAgaWYgKHZp
ZXcuaWQgPT0gVmlldy5OT19JRCkgcmV0dXJuICIiCiAgICAgICAgcmV0dXJuIHJ1bkNhdGNoaW5n
IHsgdmlldy5yZXNvdXJjZXMuZ2V0UmVzb3VyY2VFbnRyeU5hbWUodmlldy5pZCkgfS5nZXRPckRl
ZmF1bHQoIiIpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaGlkZVN5c3RlbUJhcnMoYWN0aXZpdHk6
IEFjdGl2aXR5KSB7CiAgICAgICAgdmFsIHdpbmRvdyA9IGFjdGl2aXR5LndpbmRvdwogICAgICAg
IFdpbmRvd0NvbXBhdC5zZXREZWNvckZpdHNTeXN0ZW1XaW5kb3dzKHdpbmRvdywgZmFsc2UpCgog
ICAgICAgIGlmIChCdWlsZC5WRVJTSU9OLlNES19JTlQgPj0gQnVpbGQuVkVSU0lPTl9DT0RFUy5S
KSB7CiAgICAgICAgICAgIHdpbmRvdy5pbnNldHNDb250cm9sbGVyPy5sZXQgeyBjb250cm9sbGVy
IC0+CiAgICAgICAgICAgICAgICBjb250cm9sbGVyLmhpZGUoV2luZG93SW5zZXRzLlR5cGUuc3lz
dGVtQmFycygpKQogICAgICAgICAgICAgICAgY29udHJvbGxlci5zeXN0ZW1CYXJzQmVoYXZpb3Ig
PQogICAgICAgICAgICAgICAgICAgIFdpbmRvd0luc2V0c0NvbnRyb2xsZXIuQkVIQVZJT1JfU0hP
V19UUkFOU0lFTlRfQkFSU19CWV9TV0lQRQogICAgICAgICAgICB9CiAgICAgICAgfQoKICAgICAg
ICBAU3VwcHJlc3MoIkRFUFJFQ0FUSU9OIikKICAgICAgICB3aW5kb3cuZGVjb3JWaWV3LnN5c3Rl
bVVpVmlzaWJpbGl0eSA9CiAgICAgICAgICAgIFZpZXcuU1lTVEVNX1VJX0ZMQUdfSU1NRVJTSVZF
X1NUSUNLWSBvcgogICAgICAgICAgICAgICAgVmlldy5TWVNURU1fVUlfRkxBR19GVUxMU0NSRUVO
IG9yCiAgICAgICAgICAgICAgICBWaWV3LlNZU1RFTV9VSV9GTEFHX0hJREVfTkFWSUdBVElPTiBv
cgogICAgICAgICAgICAgICAgVmlldy5TWVNURU1fVUlfRkxBR19MQVlPVVRfU1RBQkxFIG9yCiAg
ICAgICAgICAgICAgICBWaWV3LlNZU1RFTV9VSV9GTEFHX0xBWU9VVF9GVUxMU0NSRUVOIG9yCiAg
ICAgICAgICAgICAgICBWaWV3LlNZU1RFTV9VSV9GTEFHX0xBWU9VVF9ISURFX05BVklHQVRJT04K
ICAgIH0KCiAgICBvdmVycmlkZSBmdW4gcXVlcnkoCiAgICAgICAgdXJpOiBVcmksCiAgICAgICAg
cHJvamVjdGlvbjogQXJyYXk8b3V0IFN0cmluZz4/LAogICAgICAgIHNlbGVjdGlvbjogU3RyaW5n
PywKICAgICAgICBzZWxlY3Rpb25BcmdzOiBBcnJheTxvdXQgU3RyaW5nPj8sCiAgICAgICAgc29y
dE9yZGVyOiBTdHJpbmc/CiAgICApOiBDdXJzb3I/ID0gbnVsbAoKICAgIG92ZXJyaWRlIGZ1biBn
ZXRUeXBlKHVyaTogVXJpKTogU3RyaW5nPyA9IG51bGwKICAgIG92ZXJyaWRlIGZ1biBpbnNlcnQo
dXJpOiBVcmksIHZhbHVlczogQ29udGVudFZhbHVlcz8pOiBVcmk/ID0gbnVsbAogICAgb3ZlcnJp
ZGUgZnVuIGRlbGV0ZSh1cmk6IFVyaSwgc2VsZWN0aW9uOiBTdHJpbmc/LCBzZWxlY3Rpb25Bcmdz
OiBBcnJheTxvdXQgU3RyaW5nPj8pOiBJbnQgPSAwCiAgICBvdmVycmlkZSBmdW4gdXBkYXRlKHVy
aTogVXJpLCB2YWx1ZXM6IENvbnRlbnRWYWx1ZXM/LCBzZWxlY3Rpb246IFN0cmluZz8sIHNlbGVj
dGlvbkFyZ3M6IEFycmF5PG91dCBTdHJpbmc+Pyk6IEludCA9IDAKfQo=
:::END IMMERSIVE

:::BEGIN UIPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV0KICAgIFtzdHJpbmddJFBy
b2plY3RSb290CikKCiRtYW5pZmVzdCA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNc
bWFpblxBbmRyb2lkTWFuaWZlc3QueG1sJwppZiAoLW5vdCAoVGVzdC1QYXRoIC1MaXRlcmFsUGF0
aCAkbWFuaWZlc3QpKSB7CiAgICB0aHJvdyAiQW5kcm9pZCBtYW5pZmVzdCBub3QgZm91bmQ6ICRt
YW5pZmVzdCIKfQoKJGNvbnRlbnQgPSBbSU8uRmlsZV06OlJlYWRBbGxUZXh0KCRtYW5pZmVzdCkK
aWYgKCRjb250ZW50IC1ub3RtYXRjaCAnTW92aWVEZXRhaWxzQWN0aXZpdHknKSB7CiAgICAkYWN0
aXZpdHkgPSAnICAgICAgICA8YWN0aXZpdHkgYW5kcm9pZDpuYW1lPSIuTW92aWVEZXRhaWxzQWN0
aXZpdHkiIC8+JwogICAgaWYgKCRjb250ZW50IC1tYXRjaCAnPGFjdGl2aXR5IGFuZHJvaWQ6bmFt
ZT0iXC5TZXJpZXNEZXRhaWxzQWN0aXZpdHkiXHMqLz4nKSB7CiAgICAgICAgJGNvbnRlbnQgPSAk
Y29udGVudC5SZXBsYWNlKAogICAgICAgICAgICAnICAgICAgICA8YWN0aXZpdHkgYW5kcm9pZDpu
YW1lPSIuU2VyaWVzRGV0YWlsc0FjdGl2aXR5IiAvPicsCiAgICAgICAgICAgICIkYWN0aXZpdHlg
cmBuICAgICAgICA8YWN0aXZpdHkgYW5kcm9pZDpuYW1lPWAiLlNlcmllc0RldGFpbHNBY3Rpdml0
eWAiIC8+IgogICAgICAgICkKICAgIH0gZWxzZWlmICgkY29udGVudCAtbWF0Y2ggJzwvYXBwbGlj
YXRpb24+JykgewogICAgICAgICRjb250ZW50ID0gJGNvbnRlbnQuUmVwbGFjZSgnPC9hcHBsaWNh
dGlvbj4nLCAiJGFjdGl2aXR5YHJgbiAgICA8L2FwcGxpY2F0aW9uPiIpCiAgICB9IGVsc2Ugewog
ICAgICAgIHRocm93ICdBbmRyb2lkIG1hbmlmZXN0IGFwcGxpY2F0aW9uIGVsZW1lbnQgd2FzIG5v
dCBmb3VuZC4nCiAgICB9CiAgICBbSU8uRmlsZV06OldyaXRlQWxsVGV4dCgkbWFuaWZlc3QsICRj
b250ZW50LCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKaWYgKCRjb250ZW50
IC1ub3RtYXRjaCAnTW92aWVXYXRjaGxpc3RBY3Rpdml0eScpIHsKICAgICRhY3Rpdml0eSA9ICcg
ICAgICAgIDxhY3Rpdml0eSBhbmRyb2lkOm5hbWU9Ii5Nb3ZpZVdhdGNobGlzdEFjdGl2aXR5IiAv
PicKICAgIGlmICgkY29udGVudCAtbWF0Y2ggJzxhY3Rpdml0eSBhbmRyb2lkOm5hbWU9IlwuTW92
aWVEZXRhaWxzQWN0aXZpdHkiXHMqLz4nKSB7CiAgICAgICAgJGNvbnRlbnQgPSAkY29udGVudC5S
ZXBsYWNlKAogICAgICAgICAgICAnICAgICAgICA8YWN0aXZpdHkgYW5kcm9pZDpuYW1lPSIuTW92
aWVEZXRhaWxzQWN0aXZpdHkiIC8+JywKICAgICAgICAgICAgJyAgICAgICAgPGFjdGl2aXR5IGFu
ZHJvaWQ6bmFtZT0iLk1vdmllRGV0YWlsc0FjdGl2aXR5IiAvPicgKyAiYHJgbiRhY3Rpdml0eSIK
ICAgICAgICApCiAgICB9IGVsc2VpZiAoJGNvbnRlbnQgLW1hdGNoICc8L2FwcGxpY2F0aW9uPicp
IHsKICAgICAgICAkY29udGVudCA9ICRjb250ZW50LlJlcGxhY2UoJzwvYXBwbGljYXRpb24+Jywg
IiRhY3Rpdml0eWByYG4gICAgPC9hcHBsaWNhdGlvbj4iKQogICAgfSBlbHNlIHsKICAgICAgICB0
aHJvdyAnQW5kcm9pZCBtYW5pZmVzdCBhcHBsaWNhdGlvbiBlbGVtZW50IHdhcyBub3QgZm91bmQu
JwogICAgfQogICAgW0lPLkZpbGVdOjpXcml0ZUFsbFRleHQoJG1hbmlmZXN0LCAkY29udGVudCwg
W1RleHQuVVRGOEVuY29kaW5nXTo6bmV3KCRmYWxzZSkpCn0KCmlmICgkY29udGVudCAtbm90bWF0
Y2ggJ1Nlcmllc1dhdGNobGlzdEFjdGl2aXR5JykgewogICAgJGFjdGl2aXR5ID0gJyAgICAgICAg
PGFjdGl2aXR5IGFuZHJvaWQ6bmFtZT0iLlNlcmllc1dhdGNobGlzdEFjdGl2aXR5IiAvPicKICAg
IGlmICgkY29udGVudCAtbWF0Y2ggJzxhY3Rpdml0eSBhbmRyb2lkOm5hbWU9IlwuU2VyaWVzRGV0
YWlsc0FjdGl2aXR5IlxzKi8+JykgewogICAgICAgICRjb250ZW50ID0gJGNvbnRlbnQuUmVwbGFj
ZSgKICAgICAgICAgICAgJyAgICAgICAgPGFjdGl2aXR5IGFuZHJvaWQ6bmFtZT0iLlNlcmllc0Rl
dGFpbHNBY3Rpdml0eSIgLz4nLAogICAgICAgICAgICAnICAgICAgICA8YWN0aXZpdHkgYW5kcm9p
ZDpuYW1lPSIuU2VyaWVzRGV0YWlsc0FjdGl2aXR5IiAvPicgKyAiYHJgbiRhY3Rpdml0eSIKICAg
ICAgICApCiAgICB9IGVsc2VpZiAoJGNvbnRlbnQgLW1hdGNoICc8L2FwcGxpY2F0aW9uPicpIHsK
ICAgICAgICAkY29udGVudCA9ICRjb250ZW50LlJlcGxhY2UoJzwvYXBwbGljYXRpb24+JywgIiRh
Y3Rpdml0eWByYG4gICAgPC9hcHBsaWNhdGlvbj4iKQogICAgfSBlbHNlIHsKICAgICAgICB0aHJv
dyAnQW5kcm9pZCBtYW5pZmVzdCBhcHBsaWNhdGlvbiBlbGVtZW50IHdhcyBub3QgZm91bmQuJwog
ICAgfQogICAgW0lPLkZpbGVdOjpXcml0ZUFsbFRleHQoJG1hbmlmZXN0LCAkY29udGVudCwgW1Rl
eHQuVVRGOEVuY29kaW5nXTo6bmV3KCRmYWxzZSkpCn0KCmlmICgkY29udGVudCAtbm90bWF0Y2gg
J1VpQ29udHJhc3RQcm92aWRlcicpIHsKICAgICRwcm92aWRlciA9ICcgICAgICAgIDxwcm92aWRl
ciBhbmRyb2lkOm5hbWU9Ii5VaUNvbnRyYXN0UHJvdmlkZXIiIGFuZHJvaWQ6YXV0aG9yaXRpZXM9
IiR7YXBwbGljYXRpb25JZH0udWlfY29udHJhc3QiIGFuZHJvaWQ6ZXhwb3J0ZWQ9ImZhbHNlIiBh
bmRyb2lkOmluaXRPcmRlcj0iMTAwIiAvPicKICAgIGlmICgkY29udGVudCAtbm90bWF0Y2ggJzwv
YXBwbGljYXRpb24+JykgewogICAgICAgIHRocm93ICdBbmRyb2lkIG1hbmlmZXN0IGFwcGxpY2F0
aW9uIGVsZW1lbnQgd2FzIG5vdCBmb3VuZC4nCiAgICB9CiAgICAkY29udGVudCA9ICRjb250ZW50
LlJlcGxhY2UoJzwvYXBwbGljYXRpb24+JywgIiRwcm92aWRlcmByYG4gICAgPC9hcHBsaWNhdGlv
bj4iKQogICAgW0lPLkZpbGVdOjpXcml0ZUFsbFRleHQoJG1hbmlmZXN0LCAkY29udGVudCwgW1Rl
eHQuVVRGOEVuY29kaW5nXTo6bmV3KCRmYWxzZSkpCn0KCmlmICgkY29udGVudCAtbm90bWF0Y2gg
J1BsYXliYWNrSW1tZXJzaXZlUHJvdmlkZXInKSB7CiAgICAkcHJvdmlkZXIgPSAnICAgICAgICA8
cHJvdmlkZXIgYW5kcm9pZDpuYW1lPSIuUGxheWJhY2tJbW1lcnNpdmVQcm92aWRlciIgYW5kcm9p
ZDphdXRob3JpdGllcz0iJHthcHBsaWNhdGlvbklkfS5wbGF5YmFja19pbW1lcnNpdmUiIGFuZHJv
aWQ6ZXhwb3J0ZWQ9ImZhbHNlIiBhbmRyb2lkOmluaXRPcmRlcj0iMTEwIiAvPicKICAgIGlmICgk
Y29udGVudCAtbm90bWF0Y2ggJzwvYXBwbGljYXRpb24+JykgewogICAgICAgIHRocm93ICdBbmRy
b2lkIG1hbmlmZXN0IGFwcGxpY2F0aW9uIGVsZW1lbnQgd2FzIG5vdCBmb3VuZC4nCiAgICB9CiAg
ICAkY29udGVudCA9ICRjb250ZW50LlJlcGxhY2UoJzwvYXBwbGljYXRpb24+JywgIiRwcm92aWRl
cmByYG4gICAgPC9hcHBsaWNhdGlvbj4iKQogICAgW0lPLkZpbGVdOjpXcml0ZUFsbFRleHQoJG1h
bmlmZXN0LCAkY29udGVudCwgW1RleHQuVVRGOEVuY29kaW5nXTo6bmV3KCRmYWxzZSkpCn0KCiRw
bGF5ZXJBY3Rpdml0eSA9IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZh
XGNvbVxrcmlzdGFsc3RyZWFtc1xwbGF5ZXJcUGxheWVyQWN0aXZpdHkua3QnCmlmICgtbm90IChU
ZXN0LVBhdGggLUxpdGVyYWxQYXRoICRwbGF5ZXJBY3Rpdml0eSkpIHsKICAgIHRocm93ICJQbGF5
ZXIgYWN0aXZpdHkgbm90IGZvdW5kOiAkcGxheWVyQWN0aXZpdHkiCn0KCiRwbGF5ZXJDb250ZW50
ID0gW0lPLkZpbGVdOjpSZWFkQWxsVGV4dCgkcGxheWVyQWN0aXZpdHkpCmlmICgkcGxheWVyQ29u
dGVudCAtbm90bWF0Y2ggJ0VYVEVOU0lPTl9SRU5ERVJFUl9NT0RFX1BSRUZFUicpIHsKICAgIGlm
ICgkcGxheWVyQ29udGVudCAtbm90bWF0Y2ggJ2ltcG9ydCBhbmRyb2lkeFwubWVkaWEzXC5leG9w
bGF5ZXJcLkRlZmF1bHRSZW5kZXJlcnNGYWN0b3J5JykgewogICAgICAgIGlmICgkcGxheWVyQ29u
dGVudCAtbWF0Y2ggJ2ltcG9ydCBhbmRyb2lkeFwubWVkaWEzXC5leG9wbGF5ZXJcLkV4b1BsYXll
cicpIHsKICAgICAgICAgICAgJHBsYXllckNvbnRlbnQgPSAkcGxheWVyQ29udGVudC5SZXBsYWNl
KAogICAgICAgICAgICAgICAgJ2ltcG9ydCBhbmRyb2lkeC5tZWRpYTMuZXhvcGxheWVyLkV4b1Bs
YXllcicsCiAgICAgICAgICAgICAgICAiaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy5leG9wbGF5ZXIu
RXhvUGxheWVyYHJgbmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuZXhvcGxheWVyLkRlZmF1bHRSZW5k
ZXJlcnNGYWN0b3J5IgogICAgICAgICAgICApCiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAg
JHBhY2thZ2VQYXR0ZXJuID0gJyg/bSleKHBhY2thZ2VccytbXlxyXG5dKyknCiAgICAgICAgICAg
IGlmICgkcGxheWVyQ29udGVudCAtbm90bWF0Y2ggJHBhY2thZ2VQYXR0ZXJuKSB7CiAgICAgICAg
ICAgICAgICB0aHJvdyAnUGxheWVyQWN0aXZpdHkgcGFja2FnZSBkZWNsYXJhdGlvbiB3YXMgbm90
IGZvdW5kLicKICAgICAgICAgICAgfQogICAgICAgICAgICAkcGxheWVyQ29udGVudCA9IFtyZWdl
eF06OlJlcGxhY2UoCiAgICAgICAgICAgICAgICAkcGxheWVyQ29udGVudCwKICAgICAgICAgICAg
ICAgICRwYWNrYWdlUGF0dGVybiwKICAgICAgICAgICAgICAgICckMScgKyAiYHJgbmByYG5pbXBv
cnQgYW5kcm9pZHgubWVkaWEzLmV4b3BsYXllci5EZWZhdWx0UmVuZGVyZXJzRmFjdG9yeSIsCiAg
ICAgICAgICAgICAgICAxCiAgICAgICAgICAgICkKICAgICAgICB9CiAgICB9CgogICAgJGJ1aWxk
ZXJQYXR0ZXJuID0gJ0V4b1BsYXllclwuQnVpbGRlclwoXHMqKHRoaXMoPzpAUGxheWVyQWN0aXZp
dHkpP3xhcHBsaWNhdGlvbkNvbnRleHR8dGhpc1wuYXBwbGljYXRpb25Db250ZXh0KVxzKlwpJwog
ICAgJGJ1aWxkZXJNYXRjaCA9IFtyZWdleF06Ok1hdGNoKCRwbGF5ZXJDb250ZW50LCAkYnVpbGRl
clBhdHRlcm4pCiAgICBpZiAoLW5vdCAkYnVpbGRlck1hdGNoLlN1Y2Nlc3MpIHsKICAgICAgICB0
aHJvdyAnVGhlIEV4b1BsYXllciBidWlsZGVyIGluIFBsYXllckFjdGl2aXR5IGNvdWxkIG5vdCBi
ZSBsb2NhdGVkIHNhZmVseS4nCiAgICB9CgogICAgJGN0eCA9ICRidWlsZGVyTWF0Y2guR3JvdXBz
WzFdLlZhbHVlCiAgICAkcmVwbGFjZW1lbnQgPSAiRXhvUGxheWVyLkJ1aWxkZXIoJGN0eCwgRGVm
YXVsdFJlbmRlcmVyc0ZhY3RvcnkoJGN0eCkuc2V0RXh0ZW5zaW9uUmVuZGVyZXJNb2RlKERlZmF1
bHRSZW5kZXJlcnNGYWN0b3J5LkVYVEVOU0lPTl9SRU5ERVJFUl9NT0RFX1BSRUZFUikuc2V0RW5h
YmxlRGVjb2RlckZhbGxiYWNrKHRydWUpKSIKICAgICRwbGF5ZXJDb250ZW50ID0gW3JlZ2V4XTo6
UmVwbGFjZSgkcGxheWVyQ29udGVudCwgJGJ1aWxkZXJQYXR0ZXJuLCAkcmVwbGFjZW1lbnQsIDEp
CiAgICBbSU8uRmlsZV06OldyaXRlQWxsVGV4dCgkcGxheWVyQWN0aXZpdHksICRwbGF5ZXJDb250
ZW50LCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKaWYgKCRwbGF5ZXJDb250
ZW50IC1ub3RtYXRjaCAnRVhURU5TSU9OX1JFTkRFUkVSX01PREVfUFJFRkVSJykgewogICAgdGhy
b3cgJ1NvZnR3YXJlIGF1ZGlvIHJlbmRlcmVyIHdhcyBub3QgZW5hYmxlZCBpbiBQbGF5ZXJBY3Rp
dml0eS4nCn0K
:::END UIPATCH

:::BEGIN LIBRARY
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5jb250ZW50LnJlcy5Db25maWd1cmF0aW9uCmltcG9ydCBh
bmRyb2lkLmdyYXBoaWNzLkNvbG9yCmltcG9ydCBhbmRyb2lkLm9zLkJ1bmRsZQppbXBvcnQgYW5k
cm9pZC50ZXh0LkVkaXRhYmxlCmltcG9ydCBhbmRyb2lkLnRleHQuVGV4dFdhdGNoZXIKaW1wb3J0
IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLnZpZXcuVmlld0dyb3VwCmltcG9ydCBh
bmRyb2lkLndpZGdldC5CdXR0b24KaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkVkaXRUZXh0CmltcG9y
dCBhbmRyb2lkLndpZGdldC5HcmlkVmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuSW1hZ2VWaWV3
CmltcG9ydCBhbmRyb2lkLndpZGdldC5MaW5lYXJMYXlvdXQKaW1wb3J0IGFuZHJvaWQud2lkZ2V0
LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9p
ZC53aWRnZXQuVG9hc3QKaW1wb3J0IGFuZHJvaWR4LmFwcGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0
aXZpdHkKaW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkV4ZWN1dG9ycwoKY2xhc3MgTGlicmFy
eUFjdGl2aXR5IDogQXBwQ29tcGF0QWN0aXZpdHkoKSB7CiAgICBwcml2YXRlIHZhbCBleGVjdXRv
ciA9IEV4ZWN1dG9ycy5uZXdTaW5nbGVUaHJlYWRFeGVjdXRvcigpCiAgICBwcml2YXRlIGxhdGVp
bml0IHZhciBjcmVkZW50aWFsczogWHRyZWFtQ3JlZGVudGlhbHMKICAgIHByaXZhdGUgbGF0ZWlu
aXQgdmFyIGdyaWQ6IEdyaWRWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBwcm9ncmVzczog
UHJvZ3Jlc3NCYXIKICAgIHByaXZhdGUgbGF0ZWluaXQgdmFyIGVtcHR5OiBUZXh0VmlldwogICAg
cHJpdmF0ZSBsYXRlaW5pdCB2YXIgY291bnQ6IFRleHRWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0
IHZhciBleWVicm93OiBUZXh0VmlldwogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgY2F0ZWdvcnlC
YXI6IExpbmVhckxheW91dAoKICAgIHByaXZhdGUgdmFyIGFsbEl0ZW1zOiBMaXN0PExpYnJhcnlJ
dGVtPiA9IGVtcHR5TGlzdCgpCiAgICBwcml2YXRlIHZhciBpdGVtczogTGlzdDxMaWJyYXJ5SXRl
bT4gPSBlbXB0eUxpc3QoKQogICAgcHJpdmF0ZSB2YXIgbW9kZSA9ICJtb3ZpZXMiCiAgICBwcml2
YXRlIHZhciBjdXJyZW50Q2F0ZWdvcnlJZCA9ICIiCiAgICBwcml2YXRlIHZhciBjdXJyZW50Q2F0
ZWdvcnlOYW1lID0gIiIKICAgIHByaXZhdGUgdmFsIGNhdGVnb3J5QnV0dG9ucyA9IG11dGFibGVM
aXN0T2Y8UGFpcjxTdHJpbmcsIEJ1dHRvbj4+KCkKICAgIHByaXZhdGUgdmFyIHNvcnRNb2RlID0g
MAogICAgQFZvbGF0aWxlIHByaXZhdGUgdmFyIGxvYWRHZW5lcmF0aW9uID0gMAoKICAgIG92ZXJy
aWRlIGZ1biBvbkNyZWF0ZShzYXZlZEluc3RhbmNlU3RhdGU6IEJ1bmRsZT8pIHsKICAgICAgICBz
dXBlci5vbkNyZWF0ZShzYXZlZEluc3RhbmNlU3RhdGUpCiAgICAgICAgc2V0Q29udGVudFZpZXco
Ui5sYXlvdXQuYWN0aXZpdHlfbGlicmFyeSkKCiAgICAgICAgY3JlZGVudGlhbHMgPSBTZXNzaW9u
LmxvYWQodGhpcykgPzogcnVuIHsgZmluaXNoKCk7IHJldHVybiB9CiAgICAgICAgbW9kZSA9IGlu
dGVudC5nZXRTdHJpbmdFeHRyYSgibW9kZSIpID86ICJtb3ZpZXMiCgogICAgICAgIHZhbCBpc1Nl
cmllcyA9IG1vZGUgPT0gInNlcmllcyIKICAgICAgICBmaW5kVmlld0J5SWQ8VGV4dFZpZXc+KFIu
aWQubGlicmFyeVRpdGxlKS50ZXh0ID0gaWYgKGlzU2VyaWVzKSAiU2VyaWVzIiBlbHNlICJNb3Zp
ZXMiCiAgICAgICAgZmluZFZpZXdCeUlkPEltYWdlVmlldz4oUi5pZC5saWJyYXJ5SWNvbikuc2V0
SW1hZ2VSZXNvdXJjZSgKICAgICAgICAgICAgaWYgKGlzU2VyaWVzKSBSLmRyYXdhYmxlLm9mZmlj
aWFsX3NlcmllcyBlbHNlIFIuZHJhd2FibGUub2ZmaWNpYWxfbW92aWVzCiAgICAgICAgKQogICAg
ICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuaG9tZUJ1dHRvbikuc2V0T25DbGlja0xpc3Rl
bmVyIHsgZmluaXNoKCkgfQoKICAgICAgICBncmlkID0gZmluZFZpZXdCeUlkKFIuaWQubGlicmFy
eUdyaWQpCiAgICAgICAgcHJvZ3Jlc3MgPSBmaW5kVmlld0J5SWQoUi5pZC5wcm9ncmVzcykKICAg
ICAgICBlbXB0eSA9IGZpbmRWaWV3QnlJZChSLmlkLmVtcHR5VGV4dCkKICAgICAgICBjb3VudCA9
IGZpbmRWaWV3QnlJZChSLmlkLmxpYnJhcnlDb3VudCkKICAgICAgICBleWVicm93ID0gZmluZFZp
ZXdCeUlkKFIuaWQubGlicmFyeUV5ZWJyb3cpCiAgICAgICAgY2F0ZWdvcnlCYXIgPSBmaW5kVmll
d0J5SWQoUi5pZC5saWJyYXJ5Q2F0ZWdvcnlCYXIpCgogICAgICAgIHZhbCBzZWFyY2ggPSBmaW5k
Vmlld0J5SWQ8RWRpdFRleHQ+KFIuaWQubGlicmFyeVNlYXJjaCkKICAgICAgICB2YWwgc29ydCA9
IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQubGlicmFyeVNvcnQpCiAgICAgICAgdmFsIHdhdGNo
bGlzdCA9IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQubGlicmFyeVdhdGNobGlzdCkKICAgICAg
ICBzZWFyY2guaGludCA9IGlmIChpc1NlcmllcykgIlNlYXJjaCBzZXJpZXMiIGVsc2UgIlNlYXJj
aCBtb3ZpZXMiCiAgICAgICAgd2F0Y2hsaXN0LnRleHQgPSBpZiAoaXNTZXJpZXMpICJNWSBTRVJJ
RVMiIGVsc2UgIk1ZIExJU1QiCiAgICAgICAgd2F0Y2hsaXN0LnNldE9uQ2xpY2tMaXN0ZW5lciB7
CiAgICAgICAgICAgIHN0YXJ0QWN0aXZpdHkoSW50ZW50KHRoaXMsIGlmIChpc1NlcmllcykgU2Vy
aWVzV2F0Y2hsaXN0QWN0aXZpdHk6OmNsYXNzLmphdmEgZWxzZSBNb3ZpZVdhdGNobGlzdEFjdGl2
aXR5OjpjbGFzcy5qYXZhKSkKICAgICAgICB9CiAgICAgICAgc2VhcmNoLmFkZFRleHRDaGFuZ2Vk
TGlzdGVuZXIob2JqZWN0IDogVGV4dFdhdGNoZXIgewogICAgICAgICAgICBvdmVycmlkZSBmdW4g
YmVmb3JlVGV4dENoYW5nZWQoczogQ2hhclNlcXVlbmNlPywgc3RhcnQ6IEludCwgY291bnQ6IElu
dCwgYWZ0ZXI6IEludCkgPSBVbml0CiAgICAgICAgICAgIG92ZXJyaWRlIGZ1biBvblRleHRDaGFu
Z2VkKHM6IENoYXJTZXF1ZW5jZT8sIHN0YXJ0OiBJbnQsIGJlZm9yZTogSW50LCBjb3VudDogSW50
KSA9IGFwcGx5Q3VycmVudFZpZXcoKQogICAgICAgICAgICBvdmVycmlkZSBmdW4gYWZ0ZXJUZXh0
Q2hhbmdlZChzOiBFZGl0YWJsZT8pID0gVW5pdAogICAgICAgIH0pCiAgICAgICAgc29ydC5zZXRP
bkNsaWNrTGlzdGVuZXIgewogICAgICAgICAgICBzb3J0TW9kZSA9IChzb3J0TW9kZSArIDEpICUg
NAogICAgICAgICAgICBzb3J0LnRleHQgPSB3aGVuIChzb3J0TW9kZSkgewogICAgICAgICAgICAg
ICAgMSAtPiAiU09SVDogQeKAk1oiCiAgICAgICAgICAgICAgICAyIC0+ICJTT1JUOiBORVdFU1Qi
CiAgICAgICAgICAgICAgICAzIC0+ICJTT1JUOiBSQVRJTkciCiAgICAgICAgICAgICAgICBlbHNl
IC0+ICJTT1JUOiBQUk9WSURFUiIKICAgICAgICAgICAgfQogICAgICAgICAgICBhcHBseUN1cnJl
bnRWaWV3KCkKICAgICAgICB9CgogICAgICAgIGV5ZWJyb3cudGV4dCA9IGlmIChpc1Nlcmllcykg
IlNIT1dTIOKAoiBTRUFTT05TIOKAoiBFUElTT0RFUyIgZWxzZSAiT04tREVNQU5EIENJTkVNQSIK
ICAgICAgICBjb25maWd1cmVNZWRpYUdyaWQoZ3JpZCkgeyBwb3NpdGlvbiAtPiBvcGVuSXRlbShw
b3NpdGlvbikgfQogICAgICAgIGxvYWRDYXRlZ29yaWVzKCkKICAgIH0KCiAgICBwcml2YXRlIGZ1
biBjYXRlZ29yeUJ1dHRvbihjYXRlZ29yeTogTWVkaWFDYXRlZ29yeSk6IEJ1dHRvbiA9IEJ1dHRv
bih0aGlzKS5hcHBseSB7CiAgICAgICAgdGV4dCA9IGNhdGVnb3J5Lm5hbWUKICAgICAgICBpc0Fs
bENhcHMgPSBmYWxzZQogICAgICAgIHNldFRleHRDb2xvcihDb2xvci5XSElURSkKICAgICAgICB0
ZXh0U2l6ZSA9IDEyZgogICAgICAgIGJhY2tncm91bmQgPSBnZXREcmF3YWJsZShSLmRyYXdhYmxl
LmJnX3JvdykKICAgICAgICBpc0ZvY3VzYWJsZSA9IHRydWUKICAgICAgICBpc0NsaWNrYWJsZSA9
IHRydWUKICAgICAgICBzZXRQYWRkaW5nKDE4LmRwLCAwLCAxOC5kcCwgMCkKCiAgICAgICAgdmFs
IGxhbmRzY2FwZSA9IHJlc291cmNlcy5jb25maWd1cmF0aW9uLm9yaWVudGF0aW9uID09IENvbmZp
Z3VyYXRpb24uT1JJRU5UQVRJT05fTEFORFNDQVBFCiAgICAgICAgbGF5b3V0UGFyYW1zID0gTGlu
ZWFyTGF5b3V0LkxheW91dFBhcmFtcygKICAgICAgICAgICAgaWYgKGxhbmRzY2FwZSkgVmlld0dy
b3VwLkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQgZWxzZSBWaWV3R3JvdXAuTGF5b3V0UGFyYW1z
LldSQVBfQ09OVEVOVCwKICAgICAgICAgICAgNDYuZHAKICAgICAgICApLmFwcGx5IHsKICAgICAg
ICAgICAgc2V0TWFyZ2lucyg1LmRwLCA0LmRwLCA1LmRwLCA0LmRwKQogICAgICAgIH0KICAgICAg
ICBzZXRPbkNsaWNrTGlzdGVuZXIgewogICAgICAgICAgICBjdXJyZW50Q2F0ZWdvcnlOYW1lID0g
Y2F0ZWdvcnkubmFtZQogICAgICAgICAgICBsb2FkKGNhdGVnb3J5LmlkKQogICAgICAgIH0KICAg
IH0KCiAgICBwcml2YXRlIGZ1biBsb2FkQ2F0ZWdvcmllcygpIHsKICAgICAgICBwcm9ncmVzcy52
aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAgY291bnQudGV4dCA9ICJMb2FkaW5nIGNh
dGVnb3JpZXPigKYiCiAgICAgICAgZXhlY3V0b3IuZXhlY3V0ZSB7CiAgICAgICAgICAgIHZhbCBj
YXRlZ29yaWVzID0gdHJ5IHsKICAgICAgICAgICAgICAgIGlmIChtb2RlID09ICJzZXJpZXMiKSBY
dHJlYW1DbGllbnQuc2VyaWVzQ2F0ZWdvcmllcyhjcmVkZW50aWFscykKICAgICAgICAgICAgICAg
IGVsc2UgWHRyZWFtQ2xpZW50Lm1vdmllQ2F0ZWdvcmllcyhjcmVkZW50aWFscykKICAgICAgICAg
ICAgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7CiAgICAgICAgICAgICAgICBsaXN0T2YoTWVkaWFD
YXRlZ29yeSgiIiwgaWYgKG1vZGUgPT0gInNlcmllcyIpICJBbGwgU2VyaWVzIiBlbHNlICJBbGwg
TW92aWVzIikpCiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIHJ1bk9uVWlUaHJlYWQgewogICAg
ICAgICAgICAgICAgY2F0ZWdvcnlCYXIucmVtb3ZlQWxsVmlld3MoKQogICAgICAgICAgICAgICAg
Y2F0ZWdvcnlCdXR0b25zLmNsZWFyKCkKICAgICAgICAgICAgICAgIGNhdGVnb3JpZXMuZm9yRWFj
aCB7IGNhdGVnb3J5IC0+CiAgICAgICAgICAgICAgICAgICAgdmFsIGJ1dHRvbiA9IGNhdGVnb3J5
QnV0dG9uKGNhdGVnb3J5KQogICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5QnV0dG9ucyArPSBj
YXRlZ29yeS5pZCB0byBidXR0b24KICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUJhci5hZGRW
aWV3KGJ1dHRvbikKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHZhbCBmaXJzdCA9
IGNhdGVnb3JpZXMuZmlyc3RPck51bGwoKSA/OiBNZWRpYUNhdGVnb3J5KCIiLCBpZiAobW9kZSA9
PSAic2VyaWVzIikgIkFsbCBTZXJpZXMiIGVsc2UgIkFsbCBNb3ZpZXMiKQogICAgICAgICAgICAg
ICAgY3VycmVudENhdGVnb3J5TmFtZSA9IGZpcnN0Lm5hbWUKICAgICAgICAgICAgICAgIGxvYWQo
Zmlyc3QuaWQpCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4g
dXBkYXRlQ2F0ZWdvcnlTZWxlY3Rpb24oKSB7CiAgICAgICAgY2F0ZWdvcnlCdXR0b25zLmZvckVh
Y2ggeyAoaWQsIGJ1dHRvbikgLT4KICAgICAgICAgICAgYnV0dG9uLmlzQWN0aXZhdGVkID0gaWQg
PT0gY3VycmVudENhdGVnb3J5SWQKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gbG9h
ZChjYXRlZ29yeUlkOiBTdHJpbmcpIHsKICAgICAgICBjdXJyZW50Q2F0ZWdvcnlJZCA9IGNhdGVn
b3J5SWQKICAgICAgICB1cGRhdGVDYXRlZ29yeVNlbGVjdGlvbigpCiAgICAgICAgdmFsIGdlbmVy
YXRpb24gPSArK2xvYWRHZW5lcmF0aW9uCgogICAgICAgIHByb2dyZXNzLnZpc2liaWxpdHkgPSBW
aWV3LlZJU0lCTEUKICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAg
Z3JpZC52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgY291bnQudGV4dCA9ICJMb2FkaW5n
IGNhdGFsb2figKYiCiAgICAgICAgdmFsIHNlY3Rpb25MYWJlbCA9IGlmIChtb2RlID09ICJzZXJp
ZXMiKSAiU0VSSUVTIExJQlJBUlkiIGVsc2UgIk9OLURFTUFORCBDSU5FTUEiCiAgICAgICAgdmFs
IGNhdGVnb3J5TGFiZWwgPSBjdXJyZW50Q2F0ZWdvcnlOYW1lLmlmQmxhbmsgeyBpZiAobW9kZSA9
PSAic2VyaWVzIikgIkFMTCBTRVJJRVMiIGVsc2UgIkFMTCBNT1ZJRVMiIH0KICAgICAgICBleWVi
cm93LnRleHQgPSAiJHNlY3Rpb25MYWJlbCAg4oCiICAke2NhdGVnb3J5TGFiZWwudXBwZXJjYXNl
KCl9IgoKICAgICAgICBleGVjdXRvci5leGVjdXRlIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAg
ICAgICAgICAgIHZhbCBsb2FkZWQgPSBpZiAobW9kZSA9PSAic2VyaWVzIikgWHRyZWFtQ2xpZW50
LnNlcmllcyhjcmVkZW50aWFscywgY2F0ZWdvcnlJZCkKICAgICAgICAgICAgICAgIGVsc2UgWHRy
ZWFtQ2xpZW50Lm1vdmllcyhjcmVkZW50aWFscywgY2F0ZWdvcnlJZCkKICAgICAgICAgICAgICAg
IGlmIChnZW5lcmF0aW9uICE9IGxvYWRHZW5lcmF0aW9uKSByZXR1cm5AZXhlY3V0ZQogICAgICAg
ICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAgICAgICAgICAgICAgICAgaWYgKGdlbmVyYXRp
b24gIT0gbG9hZEdlbmVyYXRpb24pIHJldHVybkBydW5PblVpVGhyZWFkCiAgICAgICAgICAgICAg
ICAgICAgcHJvZ3Jlc3MudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAg
IGFsbEl0ZW1zID0gbG9hZGVkCiAgICAgICAgICAgICAgICAgICAgYXBwbHlDdXJyZW50Vmlldygp
CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IEV4Y2VwdGlvbikgewog
ICAgICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT0gbG9hZEdlbmVyYXRpb24pIHJldHVybkBl
eGVjdXRlCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFkIHsKICAgICAgICAgICAgICAgICAg
ICBwcm9ncmVzcy52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgICAgICAgICAgICAgZ3Jp
ZC52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgICAgICAgICAgICAgY291bnQudGV4dCA9
ICJDYXRhbG9nIHVuYXZhaWxhYmxlIgogICAgICAgICAgICAgICAgICAgIGVtcHR5LnRleHQgPSBl
Lm1lc3NhZ2UgPzogIlVuYWJsZSB0byBsb2FkIGxpYnJhcnkiCiAgICAgICAgICAgICAgICAgICAg
ZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcuVklTSUJMRQogICAgICAgICAgICAgICAgfQogICAgICAg
ICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGFwcGx5Q3VycmVudFZpZXco
KSB7CiAgICAgICAgaWYgKCE6OmdyaWQuaXNJbml0aWFsaXplZCkgcmV0dXJuCiAgICAgICAgdmFs
IHF1ZXJ5ID0gZmluZFZpZXdCeUlkPEVkaXRUZXh0PihSLmlkLmxpYnJhcnlTZWFyY2gpLnRleHQ/
LnRvU3RyaW5nKCk/LnRyaW0oKS5vckVtcHR5KCkKCiAgICAgICAgdmFyIHZpc2libGUgPSBpZiAo
cXVlcnkuaXNCbGFuaygpKSBhbGxJdGVtcyBlbHNlIGFsbEl0ZW1zLmZpbHRlciB7IGl0Lm5hbWUu
Y29udGFpbnMocXVlcnksIHRydWUpIH0KICAgICAgICB2aXNpYmxlID0gd2hlbiAoc29ydE1vZGUp
IHsKICAgICAgICAgICAgMSAtPiB2aXNpYmxlLnNvcnRlZEJ5IHsgaXQubmFtZS5sb3dlcmNhc2Uo
KSB9CiAgICAgICAgICAgIDIgLT4gdmlzaWJsZS5zb3J0ZWRXaXRoKGNvbXBhcmVCeURlc2NlbmRp
bmc8TGlicmFyeUl0ZW0+IHsgaXQueWVhci50b0ludE9yTnVsbCgpID86IDAgfS50aGVuQnkgeyBp
dC5uYW1lLmxvd2VyY2FzZSgpIH0pCiAgICAgICAgICAgIDMgLT4gdmlzaWJsZS5zb3J0ZWRXaXRo
KGNvbXBhcmVCeURlc2NlbmRpbmc8TGlicmFyeUl0ZW0+IHsgaXQucmF0aW5nLnRvRG91YmxlT3JO
dWxsKCkgPzogLTEuMCB9LnRoZW5CeSB7IGl0Lm5hbWUubG93ZXJjYXNlKCkgfSkKICAgICAgICAg
ICAgZWxzZSAtPiB2aXNpYmxlCiAgICAgICAgfQogICAgICAgIGl0ZW1zID0gdmlzaWJsZQoKICAg
ICAgICB2YWwgbGFiZWwgPSBpZiAobW9kZSA9PSAic2VyaWVzIikgIlNFUklFUyIgZWxzZSAiTU9W
SUVTIgogICAgICAgIGNvdW50LnRleHQgPSBpZiAocXVlcnkuaXNOb3RCbGFuaygpKSAiJHtpdGVt
cy5zaXplfSBPRiAke2FsbEl0ZW1zLnNpemV9ICRsYWJlbCIgZWxzZSAiJHtpdGVtcy5zaXplfSAk
bGFiZWwiCiAgICAgICAgaWYgKGl0ZW1zLmlzRW1wdHkoKSkgewogICAgICAgICAgICBncmlkLmFk
YXB0ZXIgPSBudWxsCiAgICAgICAgICAgIGdyaWQudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAg
ICAgICAgICBlbXB0eS50ZXh0ID0gaWYgKHF1ZXJ5LmlzTm90QmxhbmsoKSkgIk5vICR7aWYgKG1v
ZGUgPT0gInNlcmllcyIpICJzZXJpZXMiIGVsc2UgIm1vdmllcyJ9IG1hdGNoIFwiJHF1ZXJ5XCIu
IiBlbHNlICJObyAke2lmIChtb2RlID09ICJzZXJpZXMiKSAic2VyaWVzIiBlbHNlICJtb3ZpZXMi
fSBmb3VuZCBpbiB0aGlzIGNhdGVnb3J5LiIKICAgICAgICAgICAgZW1wdHkudmlzaWJpbGl0eSA9
IFZpZXcuVklTSUJMRQogICAgICAgICAgICByZXR1cm4KICAgICAgICB9CgogICAgICAgIGVtcHR5
LnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICBncmlkLmFkYXB0ZXIgPSBNZWRpYUdyaWRB
ZGFwdGVyKHRoaXMsIGl0ZW1zKQogICAgICAgIGdyaWQudmlzaWJpbGl0eSA9IFZpZXcuVklTSUJM
RQogICAgICAgIHZhbCBzZWFyY2hIYXNGb2N1cyA9IGZpbmRWaWV3QnlJZDxFZGl0VGV4dD4oUi5p
ZC5saWJyYXJ5U2VhcmNoKS5oYXNGb2N1cygpCiAgICAgICAgaWYgKCFzZWFyY2hIYXNGb2N1cykg
Zm9jdXNGaXJzdE1lZGlhSXRlbShncmlkKQogICAgfQoKICAgIHByaXZhdGUgZnVuIG9wZW5JdGVt
KHBvc2l0aW9uOiBJbnQpIHsKICAgICAgICBpZiAocG9zaXRpb24gIWluIGl0ZW1zLmluZGljZXMp
IHJldHVybgogICAgICAgIHZhbCBpdGVtID0gaXRlbXNbcG9zaXRpb25dCgogICAgICAgIGlmIChp
dGVtLmtpbmQgPT0gInNlcmllcyIpIHsKICAgICAgICAgICAgVG9hc3QubWFrZVRleHQodGhpcywg
Ik9wZW5pbmcgJHtpdGVtLm5hbWV9IiwgVG9hc3QuTEVOR1RIX1NIT1JUKS5zaG93KCkKICAgICAg
ICAgICAgc3RhcnRBY3Rpdml0eShJbnRlbnQodGhpcywgU2VyaWVzRGV0YWlsc0FjdGl2aXR5Ojpj
bGFzcy5qYXZhKS5hcHBseSB7CiAgICAgICAgICAgICAgICBwdXRFeHRyYSgic2VyaWVzSWQiLCBp
dGVtLmlkKQogICAgICAgICAgICAgICAgcHV0RXh0cmEoInNlcmllc05hbWUiLCBpdGVtLm5hbWUp
CiAgICAgICAgICAgICAgICBwdXRFeHRyYSgic2VyaWVzSW1hZ2VVcmwiLCBpdGVtLmltYWdlVXJs
KQogICAgICAgICAgICAgICAgcHV0RXh0cmEoInNlcmllc01ldGEiLCBidWlsZE1ldGEoaXRlbSkp
CiAgICAgICAgICAgICAgICBwdXRFeHRyYSgic2VyaWVzQ2F0ZWdvcnlJZCIsIGl0ZW0uY2F0ZWdv
cnlJZCkKICAgICAgICAgICAgICAgIHB1dEV4dHJhKCJzZXJpZXNZZWFyIiwgaXRlbS55ZWFyKQog
ICAgICAgICAgICAgICAgcHV0RXh0cmEoInNlcmllc1JhdGluZyIsIGl0ZW0ucmF0aW5nKQogICAg
ICAgICAgICB9KQogICAgICAgICAgICByZXR1cm4KICAgICAgICB9CgogICAgICAgIHN0YXJ0QWN0
aXZpdHkoSW50ZW50KHRoaXMsIE1vdmllRGV0YWlsc0FjdGl2aXR5OjpjbGFzcy5qYXZhKS5hcHBs
eSB7CiAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZUlkIiwgaXRlbS5pZCkKICAgICAgICAgICAg
cHV0RXh0cmEoIm1vdmllTmFtZSIsIGl0ZW0ubmFtZSkKICAgICAgICAgICAgcHV0RXh0cmEoIm1v
dmllUGxheVVybCIsIGl0ZW0ucGxheVVybC5vckVtcHR5KCkpCiAgICAgICAgICAgIHB1dEV4dHJh
KCJtb3ZpZUltYWdlVXJsIiwgaXRlbS5pbWFnZVVybCkKICAgICAgICAgICAgcHV0RXh0cmEoIm1v
dmllWWVhciIsIGl0ZW0ueWVhcikKICAgICAgICAgICAgcHV0RXh0cmEoIm1vdmllUmF0aW5nIiwg
aXRlbS5yYXRpbmcpCiAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZUNhdGVnb3J5SWQiLCBpdGVt
LmNhdGVnb3J5SWQpCiAgICAgICAgfSkKICAgIH0KCiAgICBwcml2YXRlIGZ1biBidWlsZE1ldGEo
aXRlbTogTGlicmFyeUl0ZW0pOiBTdHJpbmcgewogICAgICAgIHZhbCBwYXJ0cyA9IG11dGFibGVM
aXN0T2Y8U3RyaW5nPigpCiAgICAgICAgaXRlbS55ZWFyLnRha2VJZiB7IGl0LmlzTm90Qmxhbmso
KSB9Py5sZXQgeyBwYXJ0cyArPSBpdCB9CiAgICAgICAgaXRlbS5yYXRpbmcudGFrZUlmIHsgaXQu
aXNOb3RCbGFuaygpIH0/LmxldCB7IHBhcnRzICs9ICLimIUgJGl0IiB9CiAgICAgICAgcGFydHMg
Kz0gaWYgKGl0ZW0ua2luZCA9PSAic2VyaWVzIikgIlNFQVNPTlMgJiBFUElTT0RFUyIgZWxzZSAi
TU9WSUUgREVUQUlMUyIKICAgICAgICByZXR1cm4gcGFydHMuam9pblRvU3RyaW5nKCIgIOKAoiAg
IikKICAgIH0KCiAgICBwcml2YXRlIHZhbCBJbnQuZHA6IEludCBnZXQoKSA9ICh0aGlzICogcmVz
b3VyY2VzLmRpc3BsYXlNZXRyaWNzLmRlbnNpdHkpLnRvSW50KCkKCiAgICBvdmVycmlkZSBmdW4g
b25EZXN0cm95KCkgewogICAgICAgIGxvYWRHZW5lcmF0aW9uKysKICAgICAgICBleGVjdXRvci5z
aHV0ZG93bk5vdygpCiAgICAgICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
:::END LIBRARY

:::BEGIN MEDIAADAPTER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQudmlldy5MYXlvdXRJbmZsYXRlcgppbXBvcnQgYW5kcm9p
ZC52aWV3LlZpZXcKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3R3JvdXAKaW1wb3J0IGFuZHJvaWQu
d2lkZ2V0LkJhc2VBZGFwdGVyCmltcG9ydCBhbmRyb2lkLndpZGdldC5JbWFnZVZpZXcKaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LlRleHRWaWV3CgpjbGFzcyBNZWRpYUdyaWRBZGFwdGVyKAogICAgcHJp
dmF0ZSB2YWwgY29udGV4dDogQ29udGV4dCwKICAgIHByaXZhdGUgdmFsIGl0ZW1zOiBMaXN0PExp
YnJhcnlJdGVtPgopIDogQmFzZUFkYXB0ZXIoKSB7CgogICAgcHJpdmF0ZSBkYXRhIGNsYXNzIEhv
bGRlcigKICAgICAgICB2YWwgcG9zdGVyOiBJbWFnZVZpZXcsCiAgICAgICAgdmFsIGtpbmQ6IFRl
eHRWaWV3LAogICAgICAgIHZhbCBuYW1lOiBUZXh0VmlldywKICAgICAgICB2YWwgbWV0YTogVGV4
dFZpZXcKICAgICkKCiAgICBvdmVycmlkZSBmdW4gZ2V0Q291bnQoKTogSW50ID0gaXRlbXMuc2l6
ZQogICAgb3ZlcnJpZGUgZnVuIGdldEl0ZW0ocG9zaXRpb246IEludCk6IExpYnJhcnlJdGVtID0g
aXRlbXNbcG9zaXRpb25dCiAgICBvdmVycmlkZSBmdW4gZ2V0SXRlbUlkKHBvc2l0aW9uOiBJbnQp
OiBMb25nID0gaXRlbXNbcG9zaXRpb25dLmlkLnRvTG9uZygpCgogICAgb3ZlcnJpZGUgZnVuIGdl
dFZpZXcocG9zaXRpb246IEludCwgY29udmVydFZpZXc6IFZpZXc/LCBwYXJlbnQ6IFZpZXdHcm91
cCk6IFZpZXcgewogICAgICAgIHZhbCByb3c6IFZpZXcKICAgICAgICB2YWwgaG9sZGVyOiBIb2xk
ZXIKICAgICAgICBpZiAoY29udmVydFZpZXcgPT0gbnVsbCkgewogICAgICAgICAgICByb3cgPSBM
YXlvdXRJbmZsYXRlci5mcm9tKGNvbnRleHQpLmluZmxhdGUoUi5sYXlvdXQuaXRlbV9tZWRpYV9w
b3N0ZXIsIHBhcmVudCwgZmFsc2UpCiAgICAgICAgICAgIGhvbGRlciA9IEhvbGRlcigKICAgICAg
ICAgICAgICAgIHJvdy5maW5kVmlld0J5SWQoUi5pZC5tZWRpYVBvc3RlciksCiAgICAgICAgICAg
ICAgICByb3cuZmluZFZpZXdCeUlkKFIuaWQubWVkaWFLaW5kKSwKICAgICAgICAgICAgICAgIHJv
dy5maW5kVmlld0J5SWQoUi5pZC5tZWRpYU5hbWUpLAogICAgICAgICAgICAgICAgcm93LmZpbmRW
aWV3QnlJZChSLmlkLm1lZGlhTWV0YSkKICAgICAgICAgICAgKQogICAgICAgICAgICByb3cudGFn
ID0gaG9sZGVyCiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgcm93ID0gY29udmVydFZpZXcK
ICAgICAgICAgICAgaG9sZGVyID0gcm93LnRhZyBhcyBIb2xkZXIKICAgICAgICB9CgogICAgICAg
IHZhbCBpdGVtID0gZ2V0SXRlbShwb3NpdGlvbikKICAgICAgICB2YWwgaXNTZXJpZXMgPSBpdGVt
LmtpbmQgPT0gInNlcmllcyIKICAgICAgICBob2xkZXIua2luZC50ZXh0ID0gaWYgKGlzU2VyaWVz
KSAiU0VSSUVTIiBlbHNlICJNT1ZJRSIKICAgICAgICBob2xkZXIubmFtZS50ZXh0ID0gaXRlbS5u
YW1lCgogICAgICAgIHZhbCBtZXRhUGFydHMgPSBtdXRhYmxlTGlzdE9mPFN0cmluZz4oKQogICAg
ICAgIGl0ZW0ueWVhci50YWtlSWYgeyBpdC5pc05vdEJsYW5rKCkgfT8ubGV0IHsgbWV0YVBhcnRz
ICs9IGl0IH0KICAgICAgICBpdGVtLnJhdGluZy50YWtlSWYgeyBpdC5pc05vdEJsYW5rKCkgfT8u
bGV0IHsgbWV0YVBhcnRzICs9ICLimIUgJGl0IiB9CiAgICAgICAgbWV0YVBhcnRzICs9IGlmIChp
c1NlcmllcykgIkJyb3dzZSBlcGlzb2RlcyIgZWxzZSAiVmlldyBkZXRhaWxzIgogICAgICAgIGhv
bGRlci5tZXRhLnRleHQgPSBtZXRhUGFydHMuam9pblRvU3RyaW5nKCIgIOKAoiAgIikKCiAgICAg
ICAgdmFsIHBsYWNlaG9sZGVyID0gaWYgKGlzU2VyaWVzKSBSLmRyYXdhYmxlLm9mZmljaWFsX3Nl
cmllcyBlbHNlIFIuZHJhd2FibGUub2ZmaWNpYWxfbW92aWVzCiAgICAgICAgUmVtb3RlSW1hZ2VM
b2FkZXIubG9hZChpdGVtLmltYWdlVXJsLCBob2xkZXIucG9zdGVyLCBwbGFjZWhvbGRlciwgY3Jv
cCA9IGl0ZW0uaW1hZ2VVcmwuaXNOb3RCbGFuaygpKQoKICAgICAgICByb3cuaXNGb2N1c2FibGUg
PSBmYWxzZQogICAgICAgIHJvdy5pc0ZvY3VzYWJsZUluVG91Y2hNb2RlID0gZmFsc2UKICAgICAg
ICByb3cuaXNDbGlja2FibGUgPSBmYWxzZQogICAgICAgIHJldHVybiByb3cKICAgIH0KfQo=
:::END MEDIAADAPTER

:::BEGIN MOVIEDETAILS
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5uZXQuVXJpCmltcG9ydCBhbmRyb2lkLm9zLkJ1bmRsZQpp
bXBvcnQgYW5kcm9pZC52aWV3LlZpZXcKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkJ1dHRvbgppbXBv
cnQgYW5kcm9pZC53aWRnZXQuSW1hZ2VWaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5MaW5lYXJM
YXlvdXQKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndp
ZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQuVG9hc3QKaW1wb3J0IGFuZHJvaWR4
LmFwcGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0aXZpdHkKaW1wb3J0IGphdmEudXRpbC5jb25jdXJy
ZW50LkV4ZWN1dG9ycwppbXBvcnQga290bGluLm1hdGgucm91bmRUb0ludAoKY2xhc3MgTW92aWVE
ZXRhaWxzQWN0aXZpdHkgOiBBcHBDb21wYXRBY3Rpdml0eSgpIHsKICAgIHByaXZhdGUgdmFsIGV4
ZWN1dG9yID0gRXhlY3V0b3JzLm5ld1NpbmdsZVRocmVhZEV4ZWN1dG9yKCkKICAgIHByaXZhdGUg
bGF0ZWluaXQgdmFyIGNyZWRlbnRpYWxzOiBYdHJlYW1DcmVkZW50aWFscwogICAgcHJpdmF0ZSBs
YXRlaW5pdCB2YXIgcGxheUJ1dHRvbjogQnV0dG9uCiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBy
ZXN1bWVCdXR0b246IEJ1dHRvbgogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgd2F0Y2hsaXN0QnV0
dG9uOiBCdXR0b24KICAgIHByaXZhdGUgbGF0ZWluaXQgdmFyIHRyYWlsZXJCdXR0b246IEJ1dHRv
bgogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgcHJvZ3Jlc3M6IFByb2dyZXNzQmFyCiAgICBwcml2
YXRlIGxhdGVpbml0IHZhciBub3RpY2U6IFRleHRWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZh
ciBjdXJyZW50OiBNb3ZpZURldGFpbHMKICAgIHByaXZhdGUgdmFyIHJlbGF0ZWRDYXRlZ29yeSA9
ICIiCgogICAgb3ZlcnJpZGUgZnVuIG9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZTogQnVuZGxl
PykgewogICAgICAgIHN1cGVyLm9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZSkKICAgICAgICBz
ZXRDb250ZW50VmlldyhSLmxheW91dC5hY3Rpdml0eV9tb3ZpZV9kZXRhaWxzKQoKICAgICAgICBj
cmVkZW50aWFscyA9IFNlc3Npb24ubG9hZCh0aGlzKSA/OiBydW4geyBmaW5pc2goKTsgcmV0dXJu
IH0KICAgICAgICB2YWwgbW92aWVJZCA9IGludGVudC5nZXRJbnRFeHRyYSgibW92aWVJZCIsIC0x
KQogICAgICAgIGN1cnJlbnQgPSBNb3ZpZURldGFpbHMoCiAgICAgICAgICAgIGlkID0gbW92aWVJ
ZCwKICAgICAgICAgICAgbmFtZSA9IGludGVudC5nZXRTdHJpbmdFeHRyYSgibW92aWVOYW1lIikg
PzogIk1vdmllIiwKICAgICAgICAgICAgcGxheVVybCA9IGludGVudC5nZXRTdHJpbmdFeHRyYSgi
bW92aWVQbGF5VXJsIikub3JFbXB0eSgpLAogICAgICAgICAgICBwb3N0ZXJVcmwgPSBpbnRlbnQu
Z2V0U3RyaW5nRXh0cmEoIm1vdmllSW1hZ2VVcmwiKS5vckVtcHR5KCksCiAgICAgICAgICAgIHll
YXIgPSBpbnRlbnQuZ2V0U3RyaW5nRXh0cmEoIm1vdmllWWVhciIpLm9yRW1wdHkoKSwKICAgICAg
ICAgICAgcmF0aW5nID0gaW50ZW50LmdldFN0cmluZ0V4dHJhKCJtb3ZpZVJhdGluZyIpLm9yRW1w
dHkoKSwKICAgICAgICAgICAgY2F0ZWdvcnlJZCA9IGludGVudC5nZXRTdHJpbmdFeHRyYSgibW92
aWVDYXRlZ29yeUlkIikub3JFbXB0eSgpCiAgICAgICAgKQoKICAgICAgICBwbGF5QnV0dG9uID0g
ZmluZFZpZXdCeUlkKFIuaWQubW92aWVQbGF5KQogICAgICAgIHJlc3VtZUJ1dHRvbiA9IGZpbmRW
aWV3QnlJZChSLmlkLm1vdmllUmVzdW1lKQogICAgICAgIHdhdGNobGlzdEJ1dHRvbiA9IGZpbmRW
aWV3QnlJZChSLmlkLm1vdmllV2F0Y2hsaXN0KQogICAgICAgIHRyYWlsZXJCdXR0b24gPSBmaW5k
Vmlld0J5SWQoUi5pZC5tb3ZpZVRyYWlsZXIpCiAgICAgICAgcHJvZ3Jlc3MgPSBmaW5kVmlld0J5
SWQoUi5pZC5tb3ZpZVByb2dyZXNzKQogICAgICAgIG5vdGljZSA9IGZpbmRWaWV3QnlJZChSLmlk
Lm1vdmllUHJvdmlkZXJOb3RpY2UpCgogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQu
bW92aWVCYWNrKS5zZXRPbkNsaWNrTGlzdGVuZXIgeyBmaW5pc2goKSB9CiAgICAgICAgcGxheUJ1
dHRvbi5zZXRPbkNsaWNrTGlzdGVuZXIgeyBwbGF5TW92aWUoMEwsIHJlc3RhcnQgPSB0cnVlKSB9
CiAgICAgICAgcmVzdW1lQnV0dG9uLnNldE9uQ2xpY2tMaXN0ZW5lciB7CiAgICAgICAgICAgIHZh
bCBzYXZlZCA9IENvbnRpbnVlV2F0Y2hpbmcuZmluZCh0aGlzLCBjdXJyZW50LnBsYXlVcmwsICJt
b3ZpZSIpCiAgICAgICAgICAgIHBsYXlNb3ZpZShzYXZlZD8ucG9zaXRpb25NcyA/OiAwTCwgcmVz
dGFydCA9IGZhbHNlKQogICAgICAgIH0KICAgICAgICB3YXRjaGxpc3RCdXR0b24uc2V0T25DbGlj
a0xpc3RlbmVyIHsKICAgICAgICAgICAgdmFsIGFkZGVkID0gTW92aWVXYXRjaGxpc3QudG9nZ2xl
KHRoaXMsIGN1cnJlbnQpCiAgICAgICAgICAgIHVwZGF0ZVdhdGNobGlzdEJ1dHRvbigpCiAgICAg
ICAgICAgIFRvYXN0Lm1ha2VUZXh0KHRoaXMsIGlmIChhZGRlZCkgIkFkZGVkIHRvIE15IExpc3Qi
IGVsc2UgIlJlbW92ZWQgZnJvbSBNeSBMaXN0IiwgVG9hc3QuTEVOR1RIX1NIT1JUKS5zaG93KCkK
ICAgICAgICB9CiAgICAgICAgdHJhaWxlckJ1dHRvbi5zZXRPbkNsaWNrTGlzdGVuZXIgeyBvcGVu
VHJhaWxlcigpIH0KCiAgICAgICAgcmVuZGVyKGN1cnJlbnQpCiAgICAgICAgcGxheUJ1dHRvbi5w
b3N0IHsgcGxheUJ1dHRvbi5yZXF1ZXN0Rm9jdXMoKSB9CiAgICAgICAgbG9hZFJlbGF0ZWQoY3Vy
cmVudC5jYXRlZ29yeUlkKQoKICAgICAgICBpZiAobW92aWVJZCA8PSAwKSB7CiAgICAgICAgICAg
IHByb2dyZXNzLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAgbm90aWNlLnRleHQg
PSAiQWRkaXRpb25hbCBtb3ZpZSBpbmZvcm1hdGlvbiBpcyB1bmF2YWlsYWJsZS4iCiAgICAgICAg
ICAgIG5vdGljZS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAgICAgICAgIHJldHVybgog
ICAgICAgIH0KCiAgICAgICAgZXhlY3V0b3IuZXhlY3V0ZSB7CiAgICAgICAgICAgIHRyeSB7CiAg
ICAgICAgICAgICAgICB2YWwgbG9hZGVkID0gWHRyZWFtQ2xpZW50Lm1vdmllRGV0YWlscyhjcmVk
ZW50aWFscywgbW92aWVJZCkKICAgICAgICAgICAgICAgIHZhbCBtZXJnZWQgPSBsb2FkZWQuY29w
eSgKICAgICAgICAgICAgICAgICAgICBuYW1lID0gbG9hZGVkLm5hbWUudGFrZVVubGVzcyB7IGl0
ID09ICJNb3ZpZSIgfS5vckVtcHR5KCkuaWZCbGFuayB7IGN1cnJlbnQubmFtZSB9LAogICAgICAg
ICAgICAgICAgICAgIHBsYXlVcmwgPSBsb2FkZWQucGxheVVybC5pZkJsYW5rIHsgY3VycmVudC5w
bGF5VXJsIH0sCiAgICAgICAgICAgICAgICAgICAgcG9zdGVyVXJsID0gbG9hZGVkLnBvc3RlclVy
bC5pZkJsYW5rIHsgY3VycmVudC5wb3N0ZXJVcmwgfSwKICAgICAgICAgICAgICAgICAgICB5ZWFy
ID0gbG9hZGVkLnllYXIuaWZCbGFuayB7IGN1cnJlbnQueWVhciB9LAogICAgICAgICAgICAgICAg
ICAgIHJhdGluZyA9IGxvYWRlZC5yYXRpbmcuaWZCbGFuayB7IGN1cnJlbnQucmF0aW5nIH0sCiAg
ICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlJZCA9IGxvYWRlZC5jYXRlZ29yeUlkLmlmQmxhbmsg
eyBjdXJyZW50LmNhdGVnb3J5SWQgfQogICAgICAgICAgICAgICAgKQogICAgICAgICAgICAgICAg
cnVuT25VaVRocmVhZCB7CiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MudmlzaWJpbGl0eSA9
IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAgIG5vdGljZS52aXNpYmlsaXR5ID0gVmlldy5H
T05FCiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IG1lcmdlZAogICAgICAgICAgICAgICAg
ICAgIHJlbmRlcihjdXJyZW50KQogICAgICAgICAgICAgICAgICAgIHJlZnJlc2hQbGF5YmFja1By
b2dyZXNzKCkKICAgICAgICAgICAgICAgICAgICBsb2FkUmVsYXRlZChjdXJyZW50LmNhdGVnb3J5
SWQpCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikg
ewogICAgICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAgICAgICAgICAgICAgICAgcHJv
Z3Jlc3MudmlzaWJpbGl0eSA9IFZpZXcuR09ORQogICAgICAgICAgICAgICAgICAgIG5vdGljZS50
ZXh0ID0gIlNob3dpbmcgdGhlIG1vdmllIGluZm9ybWF0aW9uIHN1cHBsaWVkIHdpdGggdGhlIGNh
dGFsb2cuIgogICAgICAgICAgICAgICAgICAgIG5vdGljZS52aXNpYmlsaXR5ID0gVmlldy5WSVNJ
QkxFCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9CgogICAg
b3ZlcnJpZGUgZnVuIG9uUmVzdW1lKCkgewogICAgICAgIHN1cGVyLm9uUmVzdW1lKCkKICAgICAg
ICBpZiAoOjpjdXJyZW50LmlzSW5pdGlhbGl6ZWQpIHJlZnJlc2hQbGF5YmFja1Byb2dyZXNzKCkK
ICAgIH0KCiAgICBwcml2YXRlIGZ1biByZW5kZXIobW92aWU6IE1vdmllRGV0YWlscykgewogICAg
ICAgIGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5pZC5tb3ZpZVRpdGxlKS50ZXh0ID0gbW92aWUu
bmFtZQoKICAgICAgICB2YWwgbWV0YSA9IGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIG1vdmllLnll
YXIudGFrZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0/LmxldCB7IGFkZChpdCkgfQogICAgICAgICAg
ICBtb3ZpZS5yYXRpbmcudGFrZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0/LmxldCB7IGFkZCgi4piF
ICRpdCIpIH0KICAgICAgICAgICAgbW92aWUuZHVyYXRpb24udGFrZUlmIHsgaXQuaXNOb3RCbGFu
aygpIH0/LmxldCB7IGFkZChpdCkgfQogICAgICAgICAgICBtb3ZpZS5jZXJ0aWZpY2F0aW9uLnRh
a2VJZiB7IGl0LmlzTm90QmxhbmsoKSB9Py5sZXQgeyBhZGQoaXQpIH0KICAgICAgICB9LmpvaW5U
b1N0cmluZygiICDigKIgICIpCiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLm1v
dmllTWV0YSkudGV4dCA9IG1ldGEuaWZCbGFuayB7ICJPTi1ERU1BTkQgTU9WSUUiIH0KCiAgICAg
ICAgc2V0T3B0aW9uYWxUZXh0KFIuaWQubW92aWVUYWdsaW5lLCBtb3ZpZS50YWdsaW5lKQogICAg
ICAgIGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5pZC5tb3ZpZURlc2NyaXB0aW9uKS50ZXh0ID0g
bW92aWUuZGVzY3JpcHRpb24uaWZCbGFuayB7CiAgICAgICAgICAgICJBIGRlc2NyaXB0aW9uIHdh
cyBub3Qgc3VwcGxpZWQgZm9yIHRoaXMgbW92aWUgYnkgdGhlIHByb3ZpZGVyLiIKICAgICAgICB9
CiAgICAgICAgc2V0RmFjdChSLmlkLm1vdmllR2VucmUsICJHRU5SRSIsIG1vdmllLmdlbnJlKQog
ICAgICAgIHNldEZhY3QoUi5pZC5tb3ZpZUNhc3QsICJDQVNUIiwgbW92aWUuY2FzdCkKICAgICAg
ICBzZXRGYWN0KFIuaWQubW92aWVEaXJlY3RvciwgIkRJUkVDVE9SIiwgbW92aWUuZGlyZWN0b3Ip
CiAgICAgICAgc2V0RmFjdChSLmlkLm1vdmllQ291bnRyeSwgIkNPVU5UUlkiLCBtb3ZpZS5jb3Vu
dHJ5KQogICAgICAgIHNldEZhY3QoUi5pZC5tb3ZpZVJlbGVhc2UsICJSRUxFQVNFRCIsIG1vdmll
LnJlbGVhc2VEYXRlKQoKICAgICAgICBSZW1vdGVJbWFnZUxvYWRlci5sb2FkKG1vdmllLnBvc3Rl
clVybCwgZmluZFZpZXdCeUlkKFIuaWQubW92aWVQb3N0ZXIpLCBSLmRyYXdhYmxlLm9mZmljaWFs
X21vdmllcywgY3JvcCA9IG1vdmllLnBvc3RlclVybC5pc05vdEJsYW5rKCkpCiAgICAgICAgdmFs
IGJhY2tkcm9wID0gbW92aWUuYmFja2Ryb3BVcmwuaWZCbGFuayB7IG1vdmllLnBvc3RlclVybCB9
CiAgICAgICAgUmVtb3RlSW1hZ2VMb2FkZXIubG9hZChiYWNrZHJvcCwgZmluZFZpZXdCeUlkKFIu
aWQubW92aWVCYWNrZHJvcCksIFIuZHJhd2FibGUub2ZmaWNpYWxfZGFzaGJvYXJkX2JnLCBjcm9w
ID0gYmFja2Ryb3AuaXNOb3RCbGFuaygpKQoKICAgICAgICBwbGF5QnV0dG9uLmlzRW5hYmxlZCA9
IG1vdmllLnBsYXlVcmwuaXNOb3RCbGFuaygpCiAgICAgICAgcGxheUJ1dHRvbi5hbHBoYSA9IGlm
IChwbGF5QnV0dG9uLmlzRW5hYmxlZCkgMWYgZWxzZSAwLjQ1ZgogICAgICAgIHRyYWlsZXJCdXR0
b24udmlzaWJpbGl0eSA9IGlmIChtb3ZpZS50cmFpbGVyVXJsLmlzQmxhbmsoKSkgVmlldy5HT05F
IGVsc2UgVmlldy5WSVNJQkxFCiAgICAgICAgdXBkYXRlV2F0Y2hsaXN0QnV0dG9uKCkKICAgICAg
ICByZWZyZXNoUGxheWJhY2tQcm9ncmVzcygpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gcmVmcmVz
aFBsYXliYWNrUHJvZ3Jlc3MoKSB7CiAgICAgICAgaWYgKCE6OnBsYXlCdXR0b24uaXNJbml0aWFs
aXplZCkgcmV0dXJuCiAgICAgICAgdmFsIHNhdmVkID0gY3VycmVudC5wbGF5VXJsLnRha2VJZiB7
IGl0LmlzTm90QmxhbmsoKSB9Py5sZXQgeyBDb250aW51ZVdhdGNoaW5nLmZpbmQodGhpcywgaXQs
ICJtb3ZpZSIpIH0KICAgICAgICB2YWwgcGFuZWwgPSBmaW5kVmlld0J5SWQ8Vmlldz4oUi5pZC5t
b3ZpZVJlc3VtZVBhbmVsKQogICAgICAgIGlmIChzYXZlZCA9PSBudWxsIHx8IHNhdmVkLnBvc2l0
aW9uTXMgPCAxNV8wMDBMKSB7CiAgICAgICAgICAgIHBhbmVsLnZpc2liaWxpdHkgPSBWaWV3LkdP
TkUKICAgICAgICAgICAgcGxheUJ1dHRvbi50ZXh0ID0gaWYgKHBsYXlCdXR0b24uaXNFbmFibGVk
KSAi4pa2ICBQTEFZIE1PVklFIiBlbHNlICJNT1ZJRSBVTkFWQUlMQUJMRSIKICAgICAgICAgICAg
cmV0dXJuCiAgICAgICAgfQoKICAgICAgICBwYW5lbC52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxF
CiAgICAgICAgcmVzdW1lQnV0dG9uLnRleHQgPSAi4pa2ICBSRVNVTUUgRlJPTSAke2Zvcm1hdFRp
bWUoc2F2ZWQucG9zaXRpb25Ncyl9IgogICAgICAgIGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5p
ZC5tb3ZpZVdhdGNoUHJvZ3Jlc3NMYWJlbCkudGV4dCA9IHdoZW4gewogICAgICAgICAgICBzYXZl
ZC5kdXJhdGlvbk1zID4gMCAtPiAiJHtmb3JtYXRUaW1lKHNhdmVkLnBvc2l0aW9uTXMpfSB3YXRj
aGVkICDigKIgICR7Zm9ybWF0VGltZShzYXZlZC5kdXJhdGlvbk1zKX0gdG90YWwiCiAgICAgICAg
ICAgIGVsc2UgLT4gIkNvbnRpbnVlIGZyb20gJHtmb3JtYXRUaW1lKHNhdmVkLnBvc2l0aW9uTXMp
fSIKICAgICAgICB9CiAgICAgICAgZmluZFZpZXdCeUlkPFByb2dyZXNzQmFyPihSLmlkLm1vdmll
V2F0Y2hQcm9ncmVzcykucHJvZ3Jlc3MgPSBpZiAoc2F2ZWQuZHVyYXRpb25NcyA+IDApIHsKICAg
ICAgICAgICAgKChzYXZlZC5wb3NpdGlvbk1zICogMTAwLjApIC8gc2F2ZWQuZHVyYXRpb25Ncyku
cm91bmRUb0ludCgpLmNvZXJjZUluKDAsIDEwMCkKICAgICAgICB9IGVsc2UgMAogICAgICAgIHBs
YXlCdXR0b24udGV4dCA9ICLihrogIFBMQVkgRlJPTSBCRUdJTk5JTkciCiAgICB9CgogICAgcHJp
dmF0ZSBmdW4gdXBkYXRlV2F0Y2hsaXN0QnV0dG9uKCkgewogICAgICAgIGlmICghOjp3YXRjaGxp
c3RCdXR0b24uaXNJbml0aWFsaXplZCkgcmV0dXJuCiAgICAgICAgdmFsIHNhdmVkID0gTW92aWVX
YXRjaGxpc3QuY29udGFpbnModGhpcywgY3VycmVudC5pZCkKICAgICAgICB3YXRjaGxpc3RCdXR0
b24udGV4dCA9IGlmIChzYXZlZCkgIuKckyAgSU4gTVkgTElTVCIgZWxzZSAiKyAgTVkgTElTVCIK
ICAgIH0KCiAgICBwcml2YXRlIGZ1biBvcGVuVHJhaWxlcigpIHsKICAgICAgICBpZiAoY3VycmVu
dC50cmFpbGVyVXJsLmlzQmxhbmsoKSkgcmV0dXJuCiAgICAgICAgdHJ5IHsKICAgICAgICAgICAg
c3RhcnRBY3Rpdml0eShJbnRlbnQoSW50ZW50LkFDVElPTl9WSUVXLCBVcmkucGFyc2UoY3VycmVu
dC50cmFpbGVyVXJsKSkpCiAgICAgICAgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7CiAgICAgICAg
ICAgIFRvYXN0Lm1ha2VUZXh0KHRoaXMsICJObyBhcHAgaXMgYXZhaWxhYmxlIHRvIG9wZW4gdGhp
cyB0cmFpbGVyLiIsIFRvYXN0LkxFTkdUSF9TSE9SVCkuc2hvdygpCiAgICAgICAgfQogICAgfQoK
ICAgIHByaXZhdGUgZnVuIGxvYWRSZWxhdGVkKGNhdGVnb3J5SWQ6IFN0cmluZykgewogICAgICAg
IGlmIChjYXRlZ29yeUlkLmlzQmxhbmsoKSB8fCBjYXRlZ29yeUlkID09IHJlbGF0ZWRDYXRlZ29y
eSkgcmV0dXJuCiAgICAgICAgcmVsYXRlZENhdGVnb3J5ID0gY2F0ZWdvcnlJZAogICAgICAgIGV4
ZWN1dG9yLmV4ZWN1dGUgewogICAgICAgICAgICB2YWwgcmVsYXRlZCA9IHRyeSB7CiAgICAgICAg
ICAgICAgICBYdHJlYW1DbGllbnQubW92aWVzKGNyZWRlbnRpYWxzLCBjYXRlZ29yeUlkKS5maWx0
ZXJOb3QgeyBpdC5pZCA9PSBjdXJyZW50LmlkIH0udGFrZSgxMCkKICAgICAgICAgICAgfSBjYXRj
aCAoXzogRXhjZXB0aW9uKSB7IGVtcHR5TGlzdCgpIH0KICAgICAgICAgICAgcnVuT25VaVRocmVh
ZCB7IHJlbmRlclJlbGF0ZWQocmVsYXRlZCkgfQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRl
IGZ1biByZW5kZXJSZWxhdGVkKGl0ZW1zOiBMaXN0PExpYnJhcnlJdGVtPikgewogICAgICAgIHZh
bCBzZWN0aW9uID0gZmluZFZpZXdCeUlkPFZpZXc+KFIuaWQubW92aWVSZWxhdGVkU2VjdGlvbikK
ICAgICAgICB2YWwgcm93ID0gZmluZFZpZXdCeUlkPExpbmVhckxheW91dD4oUi5pZC5tb3ZpZVJl
bGF0ZWRSb3cpCiAgICAgICAgcm93LnJlbW92ZUFsbFZpZXdzKCkKICAgICAgICBzZWN0aW9uLnZp
c2liaWxpdHkgPSBpZiAoaXRlbXMuaXNFbXB0eSgpKSBWaWV3LkdPTkUgZWxzZSBWaWV3LlZJU0lC
TEUKICAgICAgICBpdGVtcy5mb3JFYWNoIHsgaXRlbSAtPgogICAgICAgICAgICB2YWwgY2FyZCA9
IExpbmVhckxheW91dCh0aGlzKS5hcHBseSB7CiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbiA9
IExpbmVhckxheW91dC5WRVJUSUNBTAogICAgICAgICAgICAgICAgaXNGb2N1c2FibGUgPSB0cnVl
CiAgICAgICAgICAgICAgICBpc0NsaWNrYWJsZSA9IHRydWUKICAgICAgICAgICAgICAgIGJhY2tn
cm91bmQgPSBnZXREcmF3YWJsZShSLmRyYXdhYmxlLmJnX3JvdykKICAgICAgICAgICAgICAgIHNl
dFBhZGRpbmcoNy5kcCwgNy5kcCwgNy5kcCwgOC5kcCkKICAgICAgICAgICAgICAgIGxheW91dFBh
cmFtcyA9IExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoMTQ4LmRwLCAyMzAuZHApLmFwcGx5IHsg
bWFyZ2luRW5kID0gMTAuZHAgfQogICAgICAgICAgICAgICAgc2V0T25DbGlja0xpc3RlbmVyIHsK
ICAgICAgICAgICAgICAgICAgICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzQE1vdmllRGV0YWls
c0FjdGl2aXR5LCBNb3ZpZURldGFpbHNBY3Rpdml0eTo6Y2xhc3MuamF2YSkuYXBwbHkgewogICAg
ICAgICAgICAgICAgICAgICAgICBwdXRFeHRyYSgibW92aWVJZCIsIGl0ZW0uaWQpCiAgICAgICAg
ICAgICAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZU5hbWUiLCBpdGVtLm5hbWUpCiAgICAgICAg
ICAgICAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZVBsYXlVcmwiLCBpdGVtLnBsYXlVcmwub3JF
bXB0eSgpKQogICAgICAgICAgICAgICAgICAgICAgICBwdXRFeHRyYSgibW92aWVJbWFnZVVybCIs
IGl0ZW0uaW1hZ2VVcmwpCiAgICAgICAgICAgICAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZVll
YXIiLCBpdGVtLnllYXIpCiAgICAgICAgICAgICAgICAgICAgICAgIHB1dEV4dHJhKCJtb3ZpZVJh
dGluZyIsIGl0ZW0ucmF0aW5nKQogICAgICAgICAgICAgICAgICAgICAgICBwdXRFeHRyYSgibW92
aWVDYXRlZ29yeUlkIiwgaXRlbS5jYXRlZ29yeUlkKQogICAgICAgICAgICAgICAgICAgIH0pCiAg
ICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdmFsIHBvc3RlciA9IElt
YWdlVmlldyh0aGlzKS5hcHBseSB7CiAgICAgICAgICAgICAgICBzY2FsZVR5cGUgPSBJbWFnZVZp
ZXcuU2NhbGVUeXBlLkNFTlRFUl9DUk9QCiAgICAgICAgICAgICAgICBsYXlvdXRQYXJhbXMgPSBM
aW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zKExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMuTUFUQ0hf
UEFSRU5ULCAxNzQuZHApCiAgICAgICAgICAgICAgICBjb250ZW50RGVzY3JpcHRpb24gPSBpdGVt
Lm5hbWUKICAgICAgICAgICAgfQogICAgICAgICAgICB2YWwgdGl0bGUgPSBUZXh0Vmlldyh0aGlz
KS5hcHBseSB7CiAgICAgICAgICAgICAgICB0ZXh0ID0gaXRlbS5uYW1lCiAgICAgICAgICAgICAg
ICBzZXRUZXh0Q29sb3IoZ2V0Q29sb3IoUi5jb2xvci5rc193aGl0ZSkpCiAgICAgICAgICAgICAg
ICB0ZXh0U2l6ZSA9IDEyZgogICAgICAgICAgICAgICAgbWF4TGluZXMgPSAyCiAgICAgICAgICAg
ICAgICBzZXRQYWRkaW5nKDMuZHAsIDYuZHAsIDMuZHAsIDApCiAgICAgICAgICAgIH0KICAgICAg
ICAgICAgY2FyZC5hZGRWaWV3KHBvc3RlcikKICAgICAgICAgICAgY2FyZC5hZGRWaWV3KHRpdGxl
KQogICAgICAgICAgICBSZW1vdGVJbWFnZUxvYWRlci5sb2FkKGl0ZW0uaW1hZ2VVcmwsIHBvc3Rl
ciwgUi5kcmF3YWJsZS5vZmZpY2lhbF9tb3ZpZXMsIGNyb3AgPSBpdGVtLmltYWdlVXJsLmlzTm90
QmxhbmsoKSkKICAgICAgICAgICAgcm93LmFkZFZpZXcoY2FyZCkKICAgICAgICB9CiAgICB9Cgog
ICAgcHJpdmF0ZSBmdW4gc2V0T3B0aW9uYWxUZXh0KGlkOiBJbnQsIHZhbHVlOiBTdHJpbmcpIHsK
ICAgICAgICBmaW5kVmlld0J5SWQ8VGV4dFZpZXc+KGlkKS5hcHBseSB7IHRleHQgPSB2YWx1ZTsg
dmlzaWJpbGl0eSA9IGlmICh2YWx1ZS5pc0JsYW5rKCkpIFZpZXcuR09ORSBlbHNlIFZpZXcuVklT
SUJMRSB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc2V0RmFjdChpZDogSW50LCBsYWJlbDogU3Ry
aW5nLCB2YWx1ZTogU3RyaW5nKSB7CiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihpZCku
YXBwbHkgeyB0ZXh0ID0gIiRsYWJlbCAg4oCiICAkdmFsdWUiOyB2aXNpYmlsaXR5ID0gaWYgKHZh
bHVlLmlzQmxhbmsoKSkgVmlldy5HT05FIGVsc2UgVmlldy5WSVNJQkxFIH0KICAgIH0KCiAgICBw
cml2YXRlIGZ1biBwbGF5TW92aWUocG9zaXRpb25NczogTG9uZywgcmVzdGFydDogQm9vbGVhbikg
ewogICAgICAgIGlmIChjdXJyZW50LnBsYXlVcmwuaXNCbGFuaygpKSB7CiAgICAgICAgICAgIFRv
YXN0Lm1ha2VUZXh0KHRoaXMsICJUaGlzIG1vdmllIGhhcyBubyBwbGF5YWJsZSBVUkwuIiwgVG9h
c3QuTEVOR1RIX1NIT1JUKS5zaG93KCkKICAgICAgICAgICAgcmV0dXJuCiAgICAgICAgfQogICAg
ICAgIGlmIChyZXN0YXJ0KSBDb250aW51ZVdhdGNoaW5nLnJlbW92ZSh0aGlzLCBjdXJyZW50LnBs
YXlVcmwpCiAgICAgICAgc3RhcnRBY3Rpdml0eShJbnRlbnQodGhpcywgUGxheWVyQWN0aXZpdHk6
OmNsYXNzLmphdmEpLmFwcGx5IHsKICAgICAgICAgICAgcHV0RXh0cmEoIm5hbWUiLCBjdXJyZW50
Lm5hbWUpCiAgICAgICAgICAgIHB1dEV4dHJhKCJ1cmwiLCBjdXJyZW50LnBsYXlVcmwpCiAgICAg
ICAgICAgIHB1dEV4dHJhKCJraW5kIiwgIm1vdmllIikKICAgICAgICAgICAgcHV0RXh0cmEoInJl
c3VtZU1zIiwgcG9zaXRpb25NcykKICAgICAgICB9KQogICAgfQoKICAgIHByaXZhdGUgZnVuIGZv
cm1hdFRpbWUodmFsdWVNczogTG9uZyk6IFN0cmluZyB7CiAgICAgICAgdmFsIHRvdGFsTWludXRl
cyA9IHZhbHVlTXMuY29lcmNlQXRMZWFzdCgwTCkgLyA2MF8wMDBMCiAgICAgICAgdmFsIGhvdXJz
ID0gdG90YWxNaW51dGVzIC8gNjAKICAgICAgICB2YWwgbWludXRlcyA9IHRvdGFsTWludXRlcyAl
IDYwCiAgICAgICAgcmV0dXJuIGlmIChob3VycyA+IDApICIke2hvdXJzfWggJHttaW51dGVzfW0i
IGVsc2UgIiR7bWludXRlc31tIgogICAgfQoKICAgIHByaXZhdGUgdmFsIEludC5kcDogSW50IGdl
dCgpID0gKHRoaXMgKiByZXNvdXJjZXMuZGlzcGxheU1ldHJpY3MuZGVuc2l0eSkucm91bmRUb0lu
dCgpCgogICAgb3ZlcnJpZGUgZnVuIG9uRGVzdHJveSgpIHsKICAgICAgICBleGVjdXRvci5zaHV0
ZG93bk5vdygpCiAgICAgICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
:::END MOVIEDETAILS

:::BEGIN MOVIEFACT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHNoYXBlIHhtbG5zOmFuZHJv
aWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIgYW5kcm9pZDpz
aGFwZT0icmVjdGFuZ2xlIj4KICAgIDxzb2xpZCBhbmRyb2lkOmNvbG9yPSIjRTYxRDFEMUQiLz4K
ICAgIDxjb3JuZXJzIGFuZHJvaWQ6cmFkaXVzPSI4ZHAiLz4KICAgIDxzdHJva2UgYW5kcm9pZDp3
aWR0aD0iMWRwIiBhbmRyb2lkOmNvbG9yPSIjNEU0RTRFIi8+CiAgICA8cGFkZGluZyBhbmRyb2lk
OmxlZnQ9IjEyZHAiIGFuZHJvaWQ6dG9wPSI5ZHAiIGFuZHJvaWQ6cmlnaHQ9IjEyZHAiIGFuZHJv
aWQ6Ym90dG9tPSI5ZHAiLz4KPC9zaGFwZT4K
:::END MOVIEFACT

:::BEGIN MOVIELAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPEZyYW1lTGF5b3V0IHhtbG5z
OmFuZHJvaWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIKICAg
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOmxheW91dF9o
ZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29m
ZmljaWFsX2Rhc2hib2FyZF9iZyI+CgogICAgPEltYWdlVmlldwogICAgICAgIGFuZHJvaWQ6aWQ9
IkAraWQvbW92aWVCYWNrZHJvcCIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMjU1ZHAiCiAgICAgICAgYW5k
cm9pZDpzY2FsZVR5cGU9ImNlbnRlckNyb3AiCiAgICAgICAgYW5kcm9pZDphbHBoYT0iMC4yMCIK
ICAgICAgICBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iTW92aWUgYmFja2Ryb3AiLz4KCiAg
ICA8TGluZWFyTGF5b3V0CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVu
dCIKICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICBh
bmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCI+CgogICAgICAgIDxMaW5lYXJMYXlvdXQKICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI2OGRwIgogICAgICAgICAgICBhbmRyb2lkOmdyYXZpdHk9
ImNlbnRlcl92ZXJ0aWNhbCIKICAgICAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjEwZHAi
CiAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZ0VuZD0iMTJkcCIKICAgICAgICAgICAgYW5kcm9p
ZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfb2ZmaWNpYWxfaGVhZGVyIj4KCiAgICAgICAgICAg
IDxCdXR0b24KICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVCYWNrIgogICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjcyZHAiCiAgICAgICAgICAgICAgICBh
bmRyb2lkOmxheW91dF9oZWlnaHQ9IjQyZHAiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9
IkJBQ0siCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRl
IgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAgICAg
ICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3Jv
dW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CgogICAgICAgICAgICA8TGluZWFyTGF5b3V0CiAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIgogICAgICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICBhbmRy
b2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJn
aW5TdGFydD0iMTJkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRp
Y2FsIj4KICAgICAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDp0ZXh0PSJLUklTVEFMIFNUUkVBTVMiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
Q29sb3I9IkBjb2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5
bGU9ImJvbGQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iOXNwIgogICAg
ICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGV0dGVyU3BhY2luZz0iMC4xNCIvPgogICAgICAgICAg
ICAgICAgPFRleHRWaWV3CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9
IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9Ik1PVklFIERF
VEFJTFMiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193
aGl0ZSIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxOHNwIi8+CiAgICAgICAgICAgIDwvTGlu
ZWFyTGF5b3V0PgogICAgICAgIDwvTGluZWFyTGF5b3V0PgoKICAgICAgICA8U2Nyb2xsVmlldwog
ICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjBkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRf
d2VpZ2h0PSIxIgogICAgICAgICAgICBhbmRyb2lkOmZpbGxWaWV3cG9ydD0idHJ1ZSI+CgogICAg
ICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0
aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3
cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNh
bCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iMTJkcCI+CgogICAgICAgICAgICAg
ICAgPExpbmVhckxheW91dAogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRo
PSJtYXRjaF9wYXJlbnQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0
PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDptaW5IZWlnaHQ9IjIy
OGRwIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwi
CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiCiAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfbW92aWVf
ZGV0YWlsc19wYW5lbCI+CgogICAgICAgICAgICAgICAgICAgIDxJbWFnZVZpZXcKICAgICAgICAg
ICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZVBvc3RlciIKICAgICAgICAgICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjE0MmRwIgogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjIwNGRwIgogICAgICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVyQ3JvcCIKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfcG9zdGVyX2ZyYW1lIgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iTW92aWUgcG9zdGVy
Ii8+CgogICAgICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAgICAgICAgICAg
ICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIKICAgICAgICAgICAgICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICAgICAgICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjE0ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxU
ZXh0VmlldwogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDp0ZXh0PSJOT1cgU0hPV0lORyIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsZXR0
ZXJTcGFjaW5nPSIwLjEyIi8+CiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldwogICAg
ICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZVRpdGxlIgogICAg
ICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVu
dCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3Jh
cF9jb250ZW50IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luVG9wPSI2ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm1heExpbmVz
PSI0IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIK
ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iTW92aWUiCiAgICAgICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgog
ICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAg
ICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIyNHNwIi8+CiAgICAgICAg
ICAgICAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDppZD0iQCtpZC9tb3ZpZU1ldGEiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAg
ICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjhkcCIKICAgICAgICAgICAgICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iT04tREVNQU5EIE1PVklFIgogICAgICAgICAgICAg
ICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIKICAgICAg
ICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTJzcCIvPgogICAgICAgICAgICAg
ICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
aWQ9IkAraWQvbW92aWVUYWdsaW5lIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI4ZHAiCiAgICAgICAgICAgICAgICAg
ICAgICAgICAgICBhbmRyb2lkOm1heExpbmVzPSIyIgogICAgICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWRfMiIKICAgICAgICAgICAgICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJpdGFsaWMiCiAgICAgICAgICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIxMXNwIgogICAgICAgICAgICAgICAgICAgICAgICAgICAg
YW5kcm9pZDp2aXNpYmlsaXR5PSJnb25lIi8+CiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0
b24KICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVQbGF5
IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdo
dD0iNDhkcCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdp
blRvcD0iMTJkcCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0i4pa2
ICBQTEFZIE1PVklFIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29s
b3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
U2l6ZT0iMTJzcCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3Vu
ZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIvPgogICAgICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5
b3V0PgogICAgICAgICAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgICAgICAgICAgICAgPExp
bmVhckxheW91dAogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVSZXN1
bWVQYW5lbCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9j
b250ZW50IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMTBk
cCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19t
b3ZpZV9kZXRhaWxzX3BhbmVsIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6b3JpZW50YXRp
b249InZlcnRpY2FsIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29u
ZSI+CiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbgogICAgICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOmlkPSJAK2lkL21vdmllUmVzdW1lIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOmxheW91dF9oZWlnaHQ9IjQ4ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDpmb2N1c2FibGU9InRydWUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6dGV4dD0i4pa2ICBSRVNVTUUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dFNpemU9IjEyc3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxl
PSJib2xkIi8+CiAgICAgICAgICAgICAgICAgICAgPFByb2dyZXNzQmFyCiAgICAgICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVXYXRjaFByb2dyZXNzIgogICAgICAgICAg
ICAgICAgICAgICAgICBzdHlsZT0iP2FuZHJvaWQ6YXR0ci9wcm9ncmVzc0JhclN0eWxlSG9yaXpv
bnRhbCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI2
ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iOGRw
IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm1heD0iMTAwIgogICAgICAgICAgICAg
ICAgICAgICAgICBhbmRyb2lkOnByb2dyZXNzPSIwIgogICAgICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOnByb2dyZXNzVGludD0iQGNvbG9yL2tzX3JlZCIvPgogICAgICAgICAgICAgICAgICAg
IDxUZXh0VmlldwogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmll
V2F0Y2hQcm9ncmVzc0xhYmVsIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91
dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxh
eW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDpsYXlvdXRfbWFyZ2luVG9wPSI2ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6dGV4dFNpemU9IjEwc3AiLz4KICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0PgoKICAg
ICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxh
eW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X2hlaWdodD0iNTBkcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJn
aW5Ub3A9IjhkcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jp
em9udGFsIj4KICAgICAgICAgICAgICAgICAgICA8QnV0dG9uCiAgICAgICAgICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVUcmFpbGVyIgogICAgICAgICAgICAgICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OmxheW91dF9tYXJnaW5FbmQ9IjRkcCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpi
YWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIgogICAgICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOmZvY3VzYWJsZT0idHJ1ZSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0
ZXh0PSLilrcgIFRSQUlMRVIiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENv
bG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dFNpemU9IjEwc3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJi
b2xkIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiLz4K
ICAgICAgICAgICAgICAgICAgICA8QnV0dG9uCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6aWQ9IkAraWQvbW92aWVXYXRjaGxpc3QiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblN0YXJ0PSI0ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dy
b3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDpmb2N1c2FibGU9InRydWUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0i
KyAgTVkgTElTVCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc193aGl0ZSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0i
MTBzcCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiLz4K
ICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0PgoKICAgICAgICAgICAgICAgIDxMaW5lYXJM
YXlvdXQKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFy
ZW50IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250
ZW50IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMTJkcCIK
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIKICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19tb3ZpZV9kZXRh
aWxzX3BhbmVsIj4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAg
ICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iQUJPVVQgVEhJUyBNT1ZJRSIKICAgICAgICAg
ICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19yZWQiCiAgICAgICAg
ICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOmxldHRlclNwYWNpbmc9IjAuMTIiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZp
ZXcKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZURlc2NyaXB0
aW9uIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Indy
YXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2lu
VG9wPSI4ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29s
b3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjE0
c3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGluZVNwYWNpbmdFeHRyYT0iNGRw
Ii8+CiAgICAgICAgICAgICAgICA8L0xpbmVhckxheW91dD4KCiAgICAgICAgICAgICAgICA8TGlu
ZWFyTGF5b3V0CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBf
Y29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjEy
ZHAiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiPgog
ICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lkL21vdmllR2VucmUi
IHN0eWxlPSJAc3R5bGUvTW92aWVGYWN0Ii8+CiAgICAgICAgICAgICAgICAgICAgPFRleHRWaWV3
IGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVDYXN0IiBzdHlsZT0iQHN0eWxlL01vdmllRmFjdCIvPgog
ICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lkL21vdmllRGlyZWN0
b3IiIHN0eWxlPSJAc3R5bGUvTW92aWVGYWN0Ii8+CiAgICAgICAgICAgICAgICAgICAgPFRleHRW
aWV3IGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVDb3VudHJ5IiBzdHlsZT0iQHN0eWxlL01vdmllRmFj
dCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lkL21vdmll
UmVsZWFzZSIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAgICAgICAgICAgICAgIDwvTGlu
ZWFyTGF5b3V0PgoKICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllUmVsYXRlZFNlY3Rpb24iCiAgICAgICAgICAgICAg
ICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjEyZHAiCiAgICAgICAgICAgICAgICAgICAg
YW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDp2aXNpYmlsaXR5PSJnb25lIj4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcKICAgICAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQi
CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iTU9SRSBMSUtFIFRISVMiCiAg
ICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIgog
ICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAgICAgICAgICAgICAg
ICAgICAgYW5kcm9pZDpsZXR0ZXJTcGFjaW5nPSIwLjEyIi8+CiAgICAgICAgICAgICAgICAgICAg
PEhvcml6b250YWxTY3JvbGxWaWV3CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iMjQyZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X21hcmdpblRvcD0iOGRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmZpbGxW
aWV3cG9ydD0iZmFsc2UiPgogICAgICAgICAgICAgICAgICAgICAgICA8TGluZWFyTGF5b3V0CiAg
ICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllUmVsYXRlZFJv
dyIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFw
X2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWln
aHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6b3Jp
ZW50YXRpb249Imhvcml6b250YWwiLz4KICAgICAgICAgICAgICAgICAgICA8L0hvcml6b250YWxT
Y3JvbGxWaWV3PgogICAgICAgICAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgICAgICAgICAg
ICAgPFByb2dyZXNzQmFyCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9tb3Zp
ZVByb2dyZXNzIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIzNGRw
IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMzRkcCIKICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9ncmF2aXR5PSJjZW50ZXJfaG9yaXpvbnRhbCIK
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjEyZHAiLz4KCiAg
ICAgICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJA
K2lkL21vdmllUHJvdmlkZXJOb3RpY2UiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlv
dXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9tYXJnaW5Ub3A9IjhkcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmdyYXZpdHk9ImNl
bnRlciIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211
dGVkXzIiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIKICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiLz4KICAgICAgICAgICAgPC9M
aW5lYXJMYXlvdXQ+CiAgICAgICAgPC9TY3JvbGxWaWV3PgogICAgPC9MaW5lYXJMYXlvdXQ+Cjwv
RnJhbWVMYXlvdXQ+Cg==
:::END MOVIELAYOUT

:::BEGIN MOVIELAYOUTLAND
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPEZyYW1lTGF5b3V0IHhtbG5z
OmFuZHJvaWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIKICAg
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOmxheW91dF9o
ZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29m
ZmljaWFsX2Rhc2hib2FyZF9iZyI+CgogICAgPEltYWdlVmlldwogICAgICAgIGFuZHJvaWQ6aWQ9
IkAraWQvbW92aWVCYWNrZHJvcCIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAg
ICAgIGFuZHJvaWQ6c2NhbGVUeXBlPSJjZW50ZXJDcm9wIgogICAgICAgIGFuZHJvaWQ6YWxwaGE9
IjAuMTYiCiAgICAgICAgYW5kcm9pZDpjb250ZW50RGVzY3JpcHRpb249Ik1vdmllIGJhY2tkcm9w
Ii8+CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRj
aF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAg
ICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiPgoKICAgICAgICA8TGluZWFyTGF5
b3V0CiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNjhkcCIKICAgICAgICAgICAgYW5kcm9pZDpn
cmF2aXR5PSJjZW50ZXJfdmVydGljYWwiCiAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0
PSIxNGRwIgogICAgICAgICAgICBhbmRyb2lkOnBhZGRpbmdFbmQ9IjE0ZHAiCiAgICAgICAgICAg
IGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX29mZmljaWFsX2hlYWRlciI+CiAgICAg
ICAgICAgIDxCdXR0b24KICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVCYWNr
IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Ijc2ZHAiCiAgICAgICAgICAg
ICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQyZHAiCiAgICAgICAgICAgICAgICBhbmRyb2lk
OnRleHQ9IkJBQ0siCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tz
X3doaXRlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpi
YWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CiAgICAgICAgICAgIDxJbWFnZVZpZXcK
ICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIyMTBkcCIKICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNTBkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X21hcmdpblN0YXJ0PSIxMmRwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpzcmM9IkBk
cmF3YWJsZS9rc19iYW5uZXIiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0iZml0
U3RhcnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iS3Jpc3Rh
bCBTdHJlYW1zIi8+CiAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9o
ZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdo
dD0iMSIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxNGRwIgog
ICAgICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiPgogICAgICAgICAg
ICAgICAgPFRleHRWaWV3CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9
IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9IktSSVNUQUwg
U1RSRUFNUyBDSU5FTUEiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQi
CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iOXNwIgogICAgICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6bGV0dGVyU3BhY2luZz0iMC4xNCIvPgogICAgICAgICAgICAgICAgPFRl
eHRWaWV3CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29u
dGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29u
dGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9Ik1PVklFIERFVEFJTFMiCiAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIxOXNwIi8+CiAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0
PgogICAgICAgIDwvTGluZWFyTGF5b3V0PgoKICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X2hlaWdodD0iMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9
IjEiCiAgICAgICAgICAgIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiCiAgICAgICAg
ICAgIGFuZHJvaWQ6cGFkZGluZz0iMTRkcCI+CgogICAgICAgICAgICA8TGluZWFyTGF5b3V0CiAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iMjQ4ZHAiCiAgICAgICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIgogICAgICAgICAgICAgICAgYW5kcm9pZDpncmF2
aXR5PSJjZW50ZXJfaG9yaXpvbnRhbCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3Vu
ZD0iQGRyYXdhYmxlL2JnX21vdmllX2RldGFpbHNfcGFuZWwiPgogICAgICAgICAgICAgICAgPElt
YWdlVmlldwogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVQb3N0ZXIi
CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjIxMGRwIgogICAgICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMGRwIgogICAgICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OnNjYWxlVHlwZT0iY2VudGVyQ3JvcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmJhY2tn
cm91bmQ9IkBkcmF3YWJsZS9iZ19wb3N0ZXJfZnJhbWUiCiAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDpjb250ZW50RGVzY3JpcHRpb249Ik1vdmllIHBvc3RlciIvPgogICAgICAgICAgICAgICAg
PEJ1dHRvbgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVQbGF5Igog
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1MGRwIgogICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMTJkcCIKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHQ9IuKWtiAgUExBWSBNT1ZJRSIKICAgICAgICAgICAgICAgICAgICBh
bmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgogICAgICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNp
emU9IjEyc3AiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2Fi
bGUvYmdfYnV0dG9uIi8+CgogICAgICAgICAgICAgICAgPExpbmVhckxheW91dAogICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVSZXN1bWVQYW5lbCIKICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iOGRwIgogICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIgogICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6dmlzaWJpbGl0eT0iZ29uZSI+CiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllUmVzdW1lIgogICAgICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQ2ZHAiCiAgICAgICAgICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9InRydWUiCiAgICAgICAgICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0i4pa2ICBSRVNVTUUiCiAgICAgICAgICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjExc3AiCiAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIi8+CiAgICAgICAgICAgICAgICAgICAgPFByb2dyZXNz
QmFyCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVXYXRjaFBy
b2dyZXNzIgogICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT0iP2FuZHJvaWQ6YXR0ci9wcm9n
cmVzc0JhclN0eWxlSG9yaXpvbnRhbCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDps
YXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9p
ZDpsYXlvdXRfaGVpZ2h0PSI2ZHAiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X21hcmdpblRvcD0iNmRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm1heD0i
MTAwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnByb2dyZXNzVGludD0iQGNvbG9y
L2tzX3JlZCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllV2F0Y2hQcm9ncmVzc0xhYmVsIgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIK
ICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI0ZHAiCiAg
ICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIgogICAgICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkIgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSI5c3AiLz4KICAgICAgICAgICAgICAg
IDwvTGluZWFyTGF5b3V0PgoKICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAg
ICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDZkcCIKICAgICAgICAgICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjhkcCIKICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIj4KICAgICAgICAgICAgICAgICAgICA8QnV0dG9u
CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVUcmFpbGVyIgog
ICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIgogICAgICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAgICAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5FbmQ9IjNkcCIKICAgICAgICAgICAg
ICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIgogICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmZvY3VzYWJsZT0idHJ1ZSIKICAgICAgICAgICAg
ICAgICAgICAgICAgYW5kcm9pZDp0ZXh0PSJUUkFJTEVSIgogICAgICAgICAgICAgICAgICAgICAg
ICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgogICAgICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSI5c3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJv
aWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnZpc2li
aWxpdHk9ImdvbmUiLz4KICAgICAgICAgICAgICAgICAgICA8QnV0dG9uCiAgICAgICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVXYXRjaGxpc3QiCiAgICAgICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIzZHAiCiAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIKICAgICAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9InRydWUiCiAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6dGV4dD0iKyBNWSBMSVNUIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRy
b2lkOnRleHRTaXplPSI5c3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0
eWxlPSJib2xkIi8+CiAgICAgICAgICAgICAgICA8L0xpbmVhckxheW91dD4KICAgICAgICAgICAg
PC9MaW5lYXJMYXlvdXQ+CgogICAgICAgICAgICA8U2Nyb2xsVmlldwogICAgICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2Vp
Z2h0PSIxIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjE0ZHAi
CiAgICAgICAgICAgICAgICBhbmRyb2lkOmZpbGxWaWV3cG9ydD0idHJ1ZSI+CiAgICAgICAgICAg
ICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lk
dGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWln
aHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9u
PSJ2ZXJ0aWNhbCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3
YWJsZS9iZ19tb3ZpZV9kZXRhaWxzX3BhbmVsIj4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZp
ZXcKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29u
dGVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFw
X2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iTk9XIFNIT1dJ
TkciCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nf
cmVkIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIKICAgICAgICAgICAg
ICAgICAgICAgICAgYW5kcm9pZDpsZXR0ZXJTcGFjaW5nPSIwLjEyIi8+CiAgICAgICAgICAgICAg
ICAgICAgPFRleHRWaWV3CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQv
bW92aWVUaXRsZSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVp
Z2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblRvcD0iNWRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm1heExpbmVz
PSIzIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmVsbGlwc2l6ZT0iZW5kIgogICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9Ik1vdmllIgogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgogICAgICAgICAgICAg
ICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMjhzcCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0Vmll
dwogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllTWV0YSIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIK
ICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRl
bnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iN2Rw
IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9Ik9OLURFTUFORCBNT1ZJRSIK
ICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRl
ZCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAg
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEyc3AiLz4KICAgICAgICAgICAg
ICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtp
ZC9tb3ZpZVRhZ2xpbmUiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxh
eW91dF9tYXJnaW5Ub3A9IjdkcCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
Q29sb3I9IkBjb2xvci9rc19tdXRlZF8yIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OnRleHRTdHlsZT0iaXRhbGljIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRT
aXplPSIxMnNwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9Imdv
bmUiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAg
ICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMTVkcCIKICAgICAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDp0ZXh0PSJBQk9VVCBUSElTIE1PVklFIgogICAgICAgICAgICAgICAg
ICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3JlZCIKICAgICAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGV0dGVyU3BhY2luZz0iMC4xMiIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldwogICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllRGVzY3JpcHRpb24iCiAg
ICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQi
CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250
ZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9Ijdk
cCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193
aGl0ZSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTRzcCIKICAg
ICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsaW5lU3BhY2luZ0V4dHJhPSI0ZHAiLz4KICAg
ICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZUdlbnJlIiBz
dHlsZT0iQHN0eWxlL01vdmllRmFjdCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBh
bmRyb2lkOmlkPSJAK2lkL21vdmllQ2FzdCIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAg
ICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZURpcmVjdG9y
IiBzdHlsZT0iQHN0eWxlL01vdmllRmFjdCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0Vmll
dyBhbmRyb2lkOmlkPSJAK2lkL21vdmllQ291bnRyeSIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3Qi
Lz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZVJl
bGVhc2UiIHN0eWxlPSJAc3R5bGUvTW92aWVGYWN0Ii8+CgogICAgICAgICAgICAgICAgICAgIDxM
aW5lYXJMYXlvdXQKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9tb3Zp
ZVJlbGF0ZWRTZWN0aW9uIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93
aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDps
YXlvdXRfbWFyZ2luVG9wPSIxNGRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm9y
aWVudGF0aW9uPSJ2ZXJ0aWNhbCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp2aXNp
YmlsaXR5PSJnb25lIj4KICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRWaWV3CiAgICAgICAg
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50Igog
ICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2Nv
bnRlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9Ik1PUkUgTElL
RSBUSElTIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXpl
PSIxMHNwIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJv
bGQiCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxldHRlclNwYWNpbmc9IjAu
MTIiLz4KICAgICAgICAgICAgICAgICAgICAgICAgPEhvcml6b250YWxTY3JvbGxWaWV3CiAgICAg
ICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50
IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSIyNDJk
cCIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0i
OGRwIgogICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpmaWxsVmlld3BvcnQ9ImZh
bHNlIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL21vdmllUmVsYXRlZFJvdyIK
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0id3Jh
cF9jb250ZW50IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiLz4KICAgICAgICAgICAgICAgICAgICAgICAg
PC9Ib3Jpem9udGFsU2Nyb2xsVmlldz4KICAgICAgICAgICAgICAgICAgICA8L0xpbmVhckxheW91
dD4KICAgICAgICAgICAgICAgICAgICA8UHJvZ3Jlc3NCYXIKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDppZD0iQCtpZC9tb3ZpZVByb2dyZXNzIgogICAgICAgICAgICAgICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0iMzRkcCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDpsYXlvdXRfaGVpZ2h0PSIzNGRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OmxheW91dF9ncmF2aXR5PSJjZW50ZXJfaG9yaXpvbnRhbCIKICAgICAgICAgICAgICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSIxMGRwIi8+CiAgICAgICAgICAgICAgICAgICAg
PFRleHRWaWV3CiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbW92aWVQ
cm92aWRlck5vdGljZSIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lk
dGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X21hcmdpblRvcD0iOGRwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmdyYXZp
dHk9ImNlbnRlciIKICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc19tdXRlZF8yIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXpl
PSIxMHNwIgogICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUi
Lz4KICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgICAgICA8L1Njcm9sbFZp
ZXc+CiAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CiAgICA8L0xpbmVhckxheW91dD4KPC9GcmFtZUxh
eW91dD4K
:::END MOVIELAYOUTLAND

:::BEGIN MOVIEPANEL
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHNoYXBlIHhtbG5zOmFuZHJv
aWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIgYW5kcm9pZDpz
aGFwZT0icmVjdGFuZ2xlIj4KICAgIDxncmFkaWVudCBhbmRyb2lkOmFuZ2xlPSIwIiBhbmRyb2lk
OnN0YXJ0Q29sb3I9IiNGMDFCMUIxQiIgYW5kcm9pZDpjZW50ZXJDb2xvcj0iI0YwMjcyNzI3IiBh
bmRyb2lkOmVuZENvbG9yPSIjRjAxQTFBMUEiLz4KICAgIDxjb3JuZXJzIGFuZHJvaWQ6cmFkaXVz
PSIxNmRwIi8+CiAgICA8c3Ryb2tlIGFuZHJvaWQ6d2lkdGg9IjFkcCIgYW5kcm9pZDpjb2xvcj0i
IzZBNkE2QSIvPgogICAgPHBhZGRpbmcgYW5kcm9pZDpsZWZ0PSIxNGRwIiBhbmRyb2lkOnRvcD0i
MTRkcCIgYW5kcm9pZDpyaWdodD0iMTRkcCIgYW5kcm9pZDpib3R0b209IjE0ZHAiLz4KPC9zaGFw
ZT4K
:::END MOVIEPANEL

:::BEGIN MOVIESTYLES
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHJlc291cmNlcz4KICAgIDxz
dHlsZSBuYW1lPSJNb3ZpZUZhY3QiPgogICAgICAgIDxpdGVtIG5hbWU9ImFuZHJvaWQ6bGF5b3V0
X3dpZHRoIj5tYXRjaF9wYXJlbnQ8L2l0ZW0+CiAgICAgICAgPGl0ZW0gbmFtZT0iYW5kcm9pZDps
YXlvdXRfaGVpZ2h0Ij53cmFwX2NvbnRlbnQ8L2l0ZW0+CiAgICAgICAgPGl0ZW0gbmFtZT0iYW5k
cm9pZDpsYXlvdXRfbWFyZ2luVG9wIj44ZHA8L2l0ZW0+CiAgICAgICAgPGl0ZW0gbmFtZT0iYW5k
cm9pZDpiYWNrZ3JvdW5kIj5AZHJhd2FibGUvYmdfbW92aWVfZmFjdDwvaXRlbT4KICAgICAgICA8
aXRlbSBuYW1lPSJhbmRyb2lkOnRleHRDb2xvciI+QGNvbG9yL2tzX211dGVkPC9pdGVtPgogICAg
ICAgIDxpdGVtIG5hbWU9ImFuZHJvaWQ6dGV4dFNpemUiPjEyc3A8L2l0ZW0+CiAgICAgICAgPGl0
ZW0gbmFtZT0iYW5kcm9pZDptYXhMaW5lcyI+NDwvaXRlbT4KICAgICAgICA8aXRlbSBuYW1lPSJh
bmRyb2lkOmVsbGlwc2l6ZSI+ZW5kPC9pdGVtPgogICAgICAgIDxpdGVtIG5hbWU9ImFuZHJvaWQ6
dmlzaWJpbGl0eSI+Z29uZTwvaXRlbT4KICAgIDwvc3R5bGU+CjwvcmVzb3VyY2VzPgo=
:::END MOVIESTYLES

:::BEGIN CONTINUEWATCHING
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQppbXBvcnQgb3JnLmpzb24uSlNPTk9i
amVjdAoKb2JqZWN0IENvbnRpbnVlV2F0Y2hpbmcgewogICAgcHJpdmF0ZSBjb25zdCB2YWwgUFJF
RlMgPSAiY29udGludWVfd2F0Y2hpbmciCiAgICBwcml2YXRlIGNvbnN0IHZhbCBLRVkgPSAiaXRl
bXMiCgogICAgZnVuIHNhdmUoY29udGV4dDogQ29udGV4dCwgaXRlbTogQ29udGludWVJdGVtKSB7
CiAgICAgICAgdmFsIGN1cnJlbnQgPSBhbGwoY29udGV4dCkuZmlsdGVyTm90IHsgaXQudXJsID09
IGl0ZW0udXJsIH0udG9NdXRhYmxlTGlzdCgpCiAgICAgICAgaWYgKGl0ZW0uZHVyYXRpb25NcyA+
IDAgJiYgaXRlbS5wb3NpdGlvbk1zID49IGl0ZW0uZHVyYXRpb25NcyAqIDAuOTUpIHsKICAgICAg
ICAgICAgd3JpdGUoY29udGV4dCwgY3VycmVudCkKICAgICAgICAgICAgcmV0dXJuCiAgICAgICAg
fQogICAgICAgIGN1cnJlbnQuYWRkKDAsIGl0ZW0pCiAgICAgICAgd3JpdGUoY29udGV4dCwgY3Vy
cmVudC50YWtlKDIwKSkKICAgIH0KCiAgICBmdW4gYWxsKGNvbnRleHQ6IENvbnRleHQpOiBMaXN0
PENvbnRpbnVlSXRlbT4gewogICAgICAgIHZhbCByYXcgPSBjb250ZXh0LmdldFNoYXJlZFByZWZl
cmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSkuZ2V0U3RyaW5nKEtFWSwgIltdIikg
PzogIltdIgogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAgICB2YWwgYXJyID0gSlNPTkFy
cmF5KHJhdykKICAgICAgICAgICAgYnVpbGRMaXN0IHsKICAgICAgICAgICAgICAgIGZvciAoaSBp
biAwIHVudGlsIGFyci5sZW5ndGgoKSkgewogICAgICAgICAgICAgICAgICAgIHZhbCBvID0gYXJy
LmdldEpTT05PYmplY3QoaSkKICAgICAgICAgICAgICAgICAgICBhZGQoQ29udGludWVJdGVtKG8u
b3B0U3RyaW5nKCJuYW1lIiksIG8ub3B0U3RyaW5nKCJ1cmwiKSwgby5vcHRMb25nKCJwb3NpdGlv
bk1zIiksIG8ub3B0TG9uZygiZHVyYXRpb25NcyIpLCBvLm9wdFN0cmluZygia2luZCIsICJ2aWRl
byIpLCBvLm9wdExvbmcoInVwZGF0ZWRBdCIpKSkKICAgICAgICAgICAgICAgIH0KICAgICAgICAg
ICAgfS5zb3J0ZWRCeURlc2NlbmRpbmcgeyBpdC51cGRhdGVkQXQgfQogICAgICAgIH0gY2F0Y2gg
KF86IEV4Y2VwdGlvbikgeyBlbXB0eUxpc3QoKSB9CiAgICB9CgogICAgZnVuIGZpbmQoY29udGV4
dDogQ29udGV4dCwgdXJsOiBTdHJpbmcsIGtpbmQ6IFN0cmluZz8gPSBudWxsKTogQ29udGludWVJ
dGVtPyA9CiAgICAgICAgYWxsKGNvbnRleHQpLmZpcnN0T3JOdWxsIHsgaXQudXJsID09IHVybCAm
JiAoa2luZCA9PSBudWxsIHx8IGl0LmtpbmQgPT0ga2luZCkgfQoKICAgIGZ1biByZW1vdmUoY29u
dGV4dDogQ29udGV4dCwgdXJsOiBTdHJpbmcpIHsKICAgICAgICB3cml0ZShjb250ZXh0LCBhbGwo
Y29udGV4dCkuZmlsdGVyTm90IHsgaXQudXJsID09IHVybCB9KQogICAgfQoKICAgIGZ1biBjbGVh
cihjb250ZXh0OiBDb250ZXh0KSA9IGNvbnRleHQuZ2V0U2hhcmVkUHJlZmVyZW5jZXMoUFJFRlMs
IENvbnRleHQuTU9ERV9QUklWQVRFKS5lZGl0KCkucmVtb3ZlKEtFWSkuYXBwbHkoKQoKICAgIHBy
aXZhdGUgZnVuIHdyaXRlKGNvbnRleHQ6IENvbnRleHQsIGl0ZW1zOiBMaXN0PENvbnRpbnVlSXRl
bT4pIHsKICAgICAgICB2YWwgYXJyID0gSlNPTkFycmF5KCkKICAgICAgICBpdGVtcy5mb3JFYWNo
IHsgaSAtPiBhcnIucHV0KEpTT05PYmplY3QoKS5hcHBseSB7CiAgICAgICAgICAgIHB1dCgibmFt
ZSIsIGkubmFtZSk7IHB1dCgidXJsIiwgaS51cmwpOyBwdXQoInBvc2l0aW9uTXMiLCBpLnBvc2l0
aW9uTXMpOyBwdXQoImR1cmF0aW9uTXMiLCBpLmR1cmF0aW9uTXMpOyBwdXQoImtpbmQiLCBpLmtp
bmQpOyBwdXQoInVwZGF0ZWRBdCIsIGkudXBkYXRlZEF0KQogICAgICAgIH0pIH0KICAgICAgICBj
b250ZXh0LmdldFNoYXJlZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSku
ZWRpdCgpLnB1dFN0cmluZyhLRVksIGFyci50b1N0cmluZygpKS5hcHBseSgpCiAgICB9Cn0K
:::END CONTINUEWATCHING

:::BEGIN LIBRARYLAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI3OGRwIgogICAgICAgIGFuZHJv
aWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0
PSIxMGRwIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ0VuZD0iMTBkcCIKICAgICAgICBhbmRyb2lk
OmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9oZWFkZXIiPgoKICAgICAgICA8SW1h
Z2VWaWV3CiAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbGlicmFyeUljb24iCiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSI2MGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IjYwZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6c3JjPSJAZHJhd2FibGUvb2ZmaWNp
YWxfbW92aWVzIgogICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVySW5zaWRlIgog
ICAgICAgICAgICBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iU2VjdGlvbiBpY29uIi8+Cgog
ICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBk
cCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgYW5kcm9pZDpsYXlv
dXRfbWFyZ2luU3RhcnQ9IjhkcCIKICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVy
dGljYWwiPgogICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dD0iS1JJU1RBTCBTVFJFQU1TIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICAgICAgICAgIGFuZHJv
aWQ6bGV0dGVyU3BhY2luZz0iMC4xNiIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9
IndyYXBfY29udGVudCIvPgogICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6aWQ9IkAraWQvbGlicmFyeVRpdGxlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
PSJNb3ZpZXMiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3do
aXRlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIxOXNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlv
dXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0id3JhcF9jb250ZW50Ii8+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAg
ICAgYW5kcm9pZDppZD0iQCtpZC9saWJyYXJ5Q291bnQiCiAgICAgICAgICAgICAgICBhbmRyb2lk
OnRleHQ9IkxvYWRpbmcgY2F0YWxvZ+KApiIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENv
bG9yPSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIx
MHNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIK
ICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50Ii8+CiAg
ICAgICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgICAgIDxCdXR0b24KICAgICAgICAgICAgYW5kcm9p
ZDppZD0iQCtpZC9ob21lQnV0dG9uIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0i
NjhkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0MmRwIgogICAgICAgICAg
ICBhbmRyb2lkOnRleHQ9IkhPTUUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29s
b3Iva3Nfd2hpdGUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91
bmQ9IkBkcmF3YWJsZS9iZ19idXR0b24iLz4KICAgIDwvTGluZWFyTGF5b3V0PgoKICAgIDxMaW5l
YXJMYXlvdXQKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMzhkcCIKICAgICAgICBhbmRyb2lkOmdyYXZpdHk9
ImNlbnRlcl92ZXJ0aWNhbCIKICAgICAgICBhbmRyb2lkOnBhZGRpbmdTdGFydD0iMTJkcCIKICAg
ICAgICBhbmRyb2lkOnBhZGRpbmdFbmQ9IjEyZHAiPgogICAgICAgIDxUZXh0VmlldwogICAgICAg
ICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlFeWVicm93IgogICAgICAgICAgICBhbmRyb2lk
OmxheW91dF93aWR0aD0iMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Indy
YXBfY29udGVudCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAg
ICAgICBhbmRyb2lkOnRleHQ9Ik9OLURFTUFORCBDSU5FTUEiCiAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIgogICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0i
Ym9sZCIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIKICAgICAgICAgICAgYW5k
cm9pZDpsZXR0ZXJTcGFjaW5nPSIwLjEwIi8+CiAgICAgICAgPFRleHRWaWV3CiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICBhbmRyb2lkOnRleHQ9IkNB
VEVHT1JJRVMiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQi
CiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICBhbmRyb2lk
OnRleHRTaXplPSI5c3AiLz4KICAgIDwvTGluZWFyTGF5b3V0PgoKICAgIDxIb3Jpem9udGFsU2Ny
b2xsVmlldwogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1NmRwIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X21h
cmdpblN0YXJ0PSIxMGRwIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpbkVuZD0iMTBkcCIK
ICAgICAgICBhbmRyb2lkOmZpbGxWaWV3cG9ydD0iZmFsc2UiCiAgICAgICAgYW5kcm9pZDpiYWNr
Z3JvdW5kPSJAZHJhd2FibGUvYmdfb2ZmaWNpYWxfcGFuZWwiPgogICAgICAgIDxMaW5lYXJMYXlv
dXQKICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9saWJyYXJ5Q2F0ZWdvcnlCYXIiCiAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IgogICAgICAgICAgICBhbmRyb2lkOm9y
aWVudGF0aW9uPSJob3Jpem9udGFsIgogICAgICAgICAgICBhbmRyb2lkOmdyYXZpdHk9ImNlbnRl
cl92ZXJ0aWNhbCIKICAgICAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjVkcCIKICAgICAg
ICAgICAgYW5kcm9pZDpwYWRkaW5nRW5kPSI1ZHAiLz4KICAgIDwvSG9yaXpvbnRhbFNjcm9sbFZp
ZXc+CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbGlicmFyeU1v
dmllVG9vbHMiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAg
ICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU0ZHAiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRf
bWFyZ2luU3RhcnQ9IjEwZHAiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI3ZHAi
CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luRW5kPSIxMGRwIgogICAgICAgIGFuZHJvaWQ6
Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6b3JpZW50YXRpb249Imhv
cml6b250YWwiPgoKICAgICAgICA8RWRpdFRleHQKICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtp
ZC9saWJyYXJ5U2VhcmNoIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIgog
ICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQ2ZHAiCiAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJh
d2FibGUvYmdfaW5wdXQiCiAgICAgICAgICAgIGFuZHJvaWQ6aGludD0iU2VhcmNoIG1vdmllcyIK
ICAgICAgICAgICAgYW5kcm9pZDppbWVPcHRpb25zPSJhY3Rpb25Eb25lIgogICAgICAgICAgICBh
bmRyb2lkOmlucHV0VHlwZT0idGV4dCIKICAgICAgICAgICAgYW5kcm9pZDptYXhMaW5lcz0iMSIK
ICAgICAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjE0ZHAiCiAgICAgICAgICAgIGFuZHJv
aWQ6cGFkZGluZ0VuZD0iMTBkcCIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xv
ci9rc193aGl0ZSIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3JIaW50PSJAY29sb3Iva3Nf
bXV0ZWQiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEyc3AiLz4KCiAgICAgICAgPEJ1
dHRvbgogICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlTb3J0IgogICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0iOTJkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSI0NmRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5TdGFydD0iNmRw
IgogICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19idXR0b24iCiAg
ICAgICAgICAgIGFuZHJvaWQ6Zm9jdXNhYmxlPSJ0cnVlIgogICAgICAgICAgICBhbmRyb2lkOnRl
eHQ9IlNPUlQiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUi
CiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICAgICAgYW5kcm9pZDp0
ZXh0U3R5bGU9ImJvbGQiLz4KCiAgICAgICAgPEJ1dHRvbgogICAgICAgICAgICBhbmRyb2lkOmlk
PSJAK2lkL2xpYnJhcnlXYXRjaGxpc3QiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRo
PSI4OGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQ2ZHAiCiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI2ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6
YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIKICAgICAgICAgICAgYW5kcm9pZDpmb2N1
c2FibGU9InRydWUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iTVkgTElTVCIKICAgICAgICAg
ICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAgYW5kcm9p
ZDp0ZXh0U2l6ZT0iOXNwIgogICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIvPgog
ICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgPFByb2dyZXNzQmFyCiAgICAgICAgYW5kcm9pZDppZD0i
QCtpZC9wcm9ncmVzcyIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iNDJkcCIKICAgICAg
ICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQyZHAiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfZ3Jh
dml0eT0iY2VudGVyX2hvcml6b250YWwiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9w
PSIxMmRwIi8+CgogICAgPFRleHRWaWV3CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9lbXB0eVRl
eHQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICBh
bmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICBhbmRyb2lkOnRleHRD
b2xvcj0iQGNvbG9yL2tzX211dGVkIgogICAgICAgIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIgog
ICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iMjBkcCIKICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9
ImdvbmUiLz4KCiAgICA8R3JpZFZpZXcKICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlH
cmlkIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSIwZHAiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0
PSIxIgogICAgICAgIGFuZHJvaWQ6bnVtQ29sdW1ucz0iMiIKICAgICAgICBhbmRyb2lkOmhvcml6
b250YWxTcGFjaW5nPSIxMWRwIgogICAgICAgIGFuZHJvaWQ6dmVydGljYWxTcGFjaW5nPSIxNGRw
IgogICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iMTBkcCIKICAgICAgICBhbmRyb2lkOmNsaXBUb1Bh
ZGRpbmc9ImZhbHNlIgogICAgICAgIGFuZHJvaWQ6c3RyZXRjaE1vZGU9ImNvbHVtbldpZHRoIgog
ICAgICAgIGFuZHJvaWQ6bGlzdFNlbGVjdG9yPSJAZHJhd2FibGUvYmdfbWVkaWFfZ3JpZF9zZWxl
Y3RvciIKICAgICAgICBhbmRyb2lkOmRyYXdTZWxlY3Rvck9uVG9wPSJ0cnVlIgogICAgICAgIGFu
ZHJvaWQ6YmFja2dyb3VuZD0iQGFuZHJvaWQ6Y29sb3IvdHJhbnNwYXJlbnQiLz4KPC9MaW5lYXJM
YXlvdXQ+Cg==
:::END LIBRARYLAYOUT

:::BEGIN LIBRARYLAYOUTLAND
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI3MmRwIgogICAgICAgIGFuZHJv
aWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0
PSIxNGRwIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ0VuZD0iMTJkcCIKICAgICAgICBhbmRyb2lk
OmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9oZWFkZXIiPgoKICAgICAgICA8SW1h
Z2VWaWV3CiAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvbGlicmFyeUljb24iCiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSI1OGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IjU4ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6c3JjPSJAZHJhd2FibGUvb2ZmaWNp
YWxfbW92aWVzIgogICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVySW5zaWRlIgog
ICAgICAgICAgICBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iU2VjdGlvbiBpY29uIi8+Cgog
ICAgICAgIDxJbWFnZVZpZXcKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjIxNWRw
IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU0ZHAiCiAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI4ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6c3JjPSJA
ZHJhd2FibGUva3NfYmFubmVyIgogICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0iZml0U3Rh
cnQiCiAgICAgICAgICAgIGFuZHJvaWQ6Y29udGVudERlc2NyaXB0aW9uPSJLcmlzdGFsIFN0cmVh
bXMiLz4KCiAgICAgICAgPExpbmVhckxheW91dAogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93
aWR0aD0iMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVu
dCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAgICAgICBhbmRy
b2lkOmxheW91dF9tYXJnaW5TdGFydD0iMTJkcCIKICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRh
dGlvbj0idmVydGljYWwiPgogICAgICAgICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6aWQ9IkAraWQvbGlicmFyeVRpdGxlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
PSJNb3ZpZXMiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3do
aXRlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIyMHNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlv
dXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0id3JhcF9jb250ZW50Ii8+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAg
ICAgYW5kcm9pZDppZD0iQCtpZC9saWJyYXJ5RXllYnJvdyIKICAgICAgICAgICAgICAgIGFuZHJv
aWQ6dGV4dD0iT04tREVNQU5EIENJTkVNQSIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENv
bG9yPSJAY29sb3Iva3NfcmVkIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJv
bGQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICAg
ICAgYW5kcm9pZDpsZXR0ZXJTcGFjaW5nPSIwLjEwIgogICAgICAgICAgICAgICAgYW5kcm9pZDps
YXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0id3JhcF9jb250ZW50Ii8+CiAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgICAg
IDxUZXh0VmlldwogICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlDb3VudCIKICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X21hcmdpbkVuZD0iMTZkcCIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0PSJMb2FkaW5n
IGNhdGFsb2figKYiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0
ZWQiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICBhbmRy
b2lkOnRleHRTaXplPSIxMHNwIi8+CgogICAgICAgIDxCdXR0b24KICAgICAgICAgICAgYW5kcm9p
ZDppZD0iQCtpZC9ob21lQnV0dG9uIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0i
NzZkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0MmRwIgogICAgICAgICAg
ICBhbmRyb2lkOnRleHQ9IkhPTUUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29s
b3Iva3Nfd2hpdGUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAg
ICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91
bmQ9IkBkcmF3YWJsZS9iZ19idXR0b24iLz4KICAgIDwvTGluZWFyTGF5b3V0PgoKICAgIDxMaW5l
YXJMYXlvdXQKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMGRwIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dl
aWdodD0iMSIKICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIgogICAgICAg
IGFuZHJvaWQ6cGFkZGluZz0iMTJkcCI+CgogICAgICAgIDxMaW5lYXJMYXlvdXQKICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjIzMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0i
dmVydGljYWwiCiAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iMTBkcCIKICAgICAgICAgICAg
YW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfb2ZmaWNpYWxfcGFuZWwiPgogICAgICAg
ICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFw
X2NvbnRlbnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29u
dGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iQ0FURUdPUklFUyIKICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIgogICAgICAgICAgICAgICAg
YW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXpl
PSIxMXNwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsZXR0ZXJTcGFjaW5nPSIwLjEzIgogICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luQm90dG9tPSI3ZHAiLz4KICAgICAgICAg
ICAgPFNjcm9sbFZpZXcKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRj
aF9wYXJlbnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjBkcCIKICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6ZmlsbFZpZXdwb3J0PSJ0cnVlIj4KICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQK
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlDYXRlZ29yeUJhciIK
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50Igog
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50Igog
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIgogICAgICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZ1RvcD0iMmRwIgogICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6cGFkZGluZ0JvdHRvbT0iMmRwIi8+CiAgICAgICAgICAgIDwvU2Nyb2xsVmlldz4K
ICAgICAgICA8L0xpbmVhckxheW91dD4KCiAgICAgICAgPExpbmVhckxheW91dAogICAgICAgICAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9o
ZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIx
IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5TdGFydD0iMTJkcCIKICAgICAgICAg
ICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiCiAgICAgICAgICAgIGFuZHJvaWQ6cGFk
ZGluZz0iNmRwIgogICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19v
ZmZpY2lhbF9wYW5lbCI+CgogICAgICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgICAg
ICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlNb3ZpZVRvb2xzIgogICAgICAgICAgICAgICAgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iNTRkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6Z3Jhdml0eT0iY2Vu
dGVyX3ZlcnRpY2FsIgogICAgICAgICAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpv
bnRhbCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0PSI0ZHAiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOnBhZGRpbmdFbmQ9IjRkcCI+CgogICAgICAgICAgICAgICAgPEVkaXRU
ZXh0CiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9saWJyYXJ5U2VhcmNoIgog
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0NmRwIgogICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmJh
Y2tncm91bmQ9IkBkcmF3YWJsZS9iZ19pbnB1dCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lk
OmhpbnQ9IlNlYXJjaCBtb3ZpZXMiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDppbWVPcHRp
b25zPSJhY3Rpb25Eb25lIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aW5wdXRUeXBlPSJ0
ZXh0IgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bWF4TGluZXM9IjEiCiAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjE0ZHAiCiAgICAgICAgICAgICAgICAgICAg
YW5kcm9pZDpwYWRkaW5nRW5kPSIxMGRwIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
Q29sb3JIaW50PSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0
ZXh0U2l6ZT0iMTJzcCIvPgoKICAgICAgICAgICAgICAgIDxCdXR0b24KICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlTb3J0IgogICAgICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X3dpZHRoPSIxMThkcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmxh
eW91dF9oZWlnaHQ9IjQ2ZHAiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luU3RhcnQ9IjhkcCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBk
cmF3YWJsZS9iZ19idXR0b24iCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9
InRydWUiCiAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0PSJTT1JUOiBQUk9WSURFUiIK
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgog
ICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICAgICAgICAg
ICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIvPgoKICAgICAgICAgICAgICAgIDxCdXR0b24K
ICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2xpYnJhcnlXYXRjaGxpc3QiCiAg
ICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Ijk2ZHAiCiAgICAgICAgICAg
ICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0NmRwIgogICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI4ZHAiCiAgICAgICAgICAgICAgICAgICAgYW5k
cm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIgogICAgICAgICAgICAgICAgICAg
IGFuZHJvaWQ6Zm9jdXNhYmxlPSJ0cnVlIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dD0iTVkgTElTVCIKICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9y
L2tzX3doaXRlIgogICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAg
ICAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIvPgogICAgICAgICAgICA8
L0xpbmVhckxheW91dD4KCiAgICAgICAgICAgIDxQcm9ncmVzc0JhcgogICAgICAgICAgICAgICAg
YW5kcm9pZDppZD0iQCtpZC9wcm9ncmVzcyIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0
X3dpZHRoPSI0MmRwIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0MmRw
IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfZ3Jhdml0eT0iY2VudGVyX2hvcml6b250
YWwiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjhkcCIvPgoKICAg
ICAgICAgICAgPFRleHRWaWV3CiAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2VtcHR5
VGV4dCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQi
CiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlciIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
cGFkZGluZz0iMjBkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29uZSIv
PgoKICAgICAgICAgICAgPEdyaWRWaWV3CiAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lk
L2xpYnJhcnlHcmlkIgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMGRwIgogICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAgICAgICAgICAgYW5k
cm9pZDpudW1Db2x1bW5zPSI0IgogICAgICAgICAgICAgICAgYW5kcm9pZDpob3Jpem9udGFsU3Bh
Y2luZz0iMTRkcCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dmVydGljYWxTcGFjaW5nPSIxNGRw
IgogICAgICAgICAgICAgICAgYW5kcm9pZDpwYWRkaW5nPSI4ZHAiCiAgICAgICAgICAgICAgICBh
bmRyb2lkOmNsaXBUb1BhZGRpbmc9ImZhbHNlIgogICAgICAgICAgICAgICAgYW5kcm9pZDpzdHJl
dGNoTW9kZT0iY29sdW1uV2lkdGgiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxpc3RTZWxlY3Rv
cj0iQGRyYXdhYmxlL2JnX21lZGlhX2dyaWRfc2VsZWN0b3IiCiAgICAgICAgICAgICAgICBhbmRy
b2lkOmRyYXdTZWxlY3Rvck9uVG9wPSJ0cnVlIgogICAgICAgICAgICAgICAgYW5kcm9pZDpiYWNr
Z3JvdW5kPSJAYW5kcm9pZDpjb2xvci90cmFuc3BhcmVudCIvPgogICAgICAgIDwvTGluZWFyTGF5
b3V0PgogICAgPC9MaW5lYXJMYXlvdXQ+CjwvTGluZWFyTGF5b3V0Pgo=
:::END LIBRARYLAYOUTLAND

:::BEGIN PLAYER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5vcy5CdW5k
bGUKaW1wb3J0IGFuZHJvaWQub3MuSGFuZGxlcgppbXBvcnQgYW5kcm9pZC5vcy5Mb29wZXIKaW1w
b3J0IGFuZHJvaWQudmlldy5WaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5CdXR0b24KaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0Vmll
dwppbXBvcnQgYW5kcm9pZHguYXBwY29tcGF0LmFwcC5BcHBDb21wYXRBY3Rpdml0eQppbXBvcnQg
YW5kcm9pZHguYXBwY29tcGF0LmFwcC5BbGVydERpYWxvZwppbXBvcnQgYW5kcm9pZHgubWVkaWEz
LmNvbW1vbi5DCmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuY29tbW9uLkZvcm1hdAppbXBvcnQgYW5k
cm9pZHgubWVkaWEzLmNvbW1vbi5NZWRpYUl0ZW0KaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21t
b24uUGxheWJhY2tFeGNlcHRpb24KaW1wb3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21tb24uUGxheWVy
CmltcG9ydCBhbmRyb2lkeC5tZWRpYTMuY29tbW9uLlRyYWNrU2VsZWN0aW9uT3ZlcnJpZGUKaW1w
b3J0IGFuZHJvaWR4Lm1lZGlhMy5jb21tb24uVHJhY2tzCmltcG9ydCBhbmRyb2lkeC5tZWRpYTMu
ZXhvcGxheWVyLkV4b1BsYXllcgppbXBvcnQgYW5kcm9pZHgubWVkaWEzLnVpLlBsYXllclZpZXcK
aW1wb3J0IGphdmEudXRpbC5jb25jdXJyZW50LkV4ZWN1dG9ycwoKY2xhc3MgUGxheWVyQWN0aXZp
dHkgOiBBcHBDb21wYXRBY3Rpdml0eSgpIHsKICAgIHByaXZhdGUgdmFyIHBsYXllcjogRXhvUGxh
eWVyPyA9IG51bGwKICAgIHByaXZhdGUgdmFsIGV4ZWN1dG9yID0gRXhlY3V0b3JzLm5ld1Npbmds
ZVRocmVhZEV4ZWN1dG9yKCkKICAgIHByaXZhdGUgdmFsIGhhbmRsZXIgPSBIYW5kbGVyKExvb3Bl
ci5nZXRNYWluTG9vcGVyKCkpCiAgICBwcml2YXRlIHZhciB1cmw6IFN0cmluZyA9ICIiCiAgICBw
cml2YXRlIHZhciBuYW1lOiBTdHJpbmcgPSAiS3Jpc3RhbCBTdHJlYW1zIgogICAgcHJpdmF0ZSB2
YXIga2luZDogU3RyaW5nID0gInZpZGVvIgogICAgcHJpdmF0ZSB2YXIgcmVzdW1lTXM6IExvbmcg
PSAwCiAgICBwcml2YXRlIHZhciByZXRyeUNvdW50ID0gMAogICAgcHJpdmF0ZSB2YXIgcmV0cnlS
dW5uYWJsZTogUnVubmFibGU/ID0gbnVsbAogICAgcHJpdmF0ZSB2YXIgY29udHJvbGxlclZpc2li
bGUgPSBmYWxzZQoKICAgIHByaXZhdGUgZGF0YSBjbGFzcyBUcmFja0Nob2ljZSh2YWwgZ3JvdXA6
IFRyYWNrcy5Hcm91cCwgdmFsIGluZGV4OiBJbnQsIHZhbCBsYWJlbDogU3RyaW5nKQoKICAgIHBy
aXZhdGUgdmFsIGxpc3RlbmVyID0gb2JqZWN0IDogUGxheWVyLkxpc3RlbmVyIHsKICAgICAgICBv
dmVycmlkZSBmdW4gb25QbGF5YmFja1N0YXRlQ2hhbmdlZChwbGF5YmFja1N0YXRlOiBJbnQpIHsK
ICAgICAgICAgICAgd2hlbiAocGxheWJhY2tTdGF0ZSkgewogICAgICAgICAgICAgICAgUGxheWVy
LlNUQVRFX0JVRkZFUklORyAtPiBzaG93TG9hZGluZygiQnVmZmVyaW5n4oCmIikKICAgICAgICAg
ICAgICAgIFBsYXllci5TVEFURV9SRUFEWSAtPiB7CiAgICAgICAgICAgICAgICAgICAgcmV0cnlD
b3VudCA9IDAKICAgICAgICAgICAgICAgICAgICBoaWRlU3RhdHVzKCkKICAgICAgICAgICAgICAg
IH0KICAgICAgICAgICAgICAgIFBsYXllci5TVEFURV9FTkRFRCAtPiBoaWRlU3RhdHVzKCkKICAg
ICAgICAgICAgICAgIFBsYXllci5TVEFURV9JRExFIC0+IFVuaXQKICAgICAgICAgICAgfQogICAg
ICAgIH0KCiAgICAgICAgb3ZlcnJpZGUgZnVuIG9uUGxheWVyRXJyb3IoZXJyb3I6IFBsYXliYWNr
RXhjZXB0aW9uKSB7CiAgICAgICAgICAgIGhhbmRsZVBsYXliYWNrRXJyb3IoZXJyb3IpCiAgICAg
ICAgfQoKICAgICAgICBvdmVycmlkZSBmdW4gb25UcmFja3NDaGFuZ2VkKHRyYWNrczogVHJhY2tz
KSB7CiAgICAgICAgICAgIHVwZGF0ZVRyYWNrQ29udHJvbHModHJhY2tzKQogICAgICAgIH0KICAg
IH0KCiAgICBvdmVycmlkZSBmdW4gb25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlOiBCdW5kbGU/
KSB7CiAgICAgICAgc3VwZXIub25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlKQogICAgICAgIHNl
dENvbnRlbnRWaWV3KFIubGF5b3V0LmFjdGl2aXR5X3BsYXllcikKICAgICAgICBuYW1lID0gaW50
ZW50LmdldFN0cmluZ0V4dHJhKCJuYW1lIikgPzogIktyaXN0YWwgU3RyZWFtcyIKICAgICAgICB1
cmwgPSBpbnRlbnQuZ2V0U3RyaW5nRXh0cmEoInVybCIpID86ICIiCiAgICAgICAga2luZCA9IGlu
dGVudC5nZXRTdHJpbmdFeHRyYSgia2luZCIpID86ICJ2aWRlbyIKICAgICAgICByZXN1bWVNcyA9
IGludGVudC5nZXRMb25nRXh0cmEoInJlc3VtZU1zIiwgMCkKICAgICAgICBmaW5kVmlld0J5SWQ8
VGV4dFZpZXc+KFIuaWQuY2hhbm5lbE5hbWUpLnRleHQgPSBuYW1lCiAgICAgICAgZmluZFZpZXdC
eUlkPEJ1dHRvbj4oUi5pZC5yZXRyeUJ1dHRvbikuc2V0T25DbGlja0xpc3RlbmVyIHsKICAgICAg
ICAgICAgcmV0cnlDb3VudCA9IDAKICAgICAgICAgICAgc3RhcnRQbGF5YmFjayhmb3JjZVJlc3Rh
cnQgPSBraW5kID09ICJsaXZlIikKICAgICAgICB9CiAgICAgICAgdmFsIHBsYXllclZpZXcgPSBm
aW5kVmlld0J5SWQ8UGxheWVyVmlldz4oUi5pZC5wbGF5ZXJWaWV3KQogICAgICAgIHBsYXllclZp
ZXcuc2V0Q29udHJvbGxlclZpc2liaWxpdHlMaXN0ZW5lcihQbGF5ZXJWaWV3LkNvbnRyb2xsZXJW
aXNpYmlsaXR5TGlzdGVuZXIgeyB2aXNpYmlsaXR5IC0+CiAgICAgICAgICAgIGNvbnRyb2xsZXJW
aXNpYmxlID0gdmlzaWJpbGl0eSA9PSBWaWV3LlZJU0lCTEUKICAgICAgICAgICAgdmFsIHRyYWNr
cyA9IHBsYXllcj8uY3VycmVudFRyYWNrcwogICAgICAgICAgICBpZiAodHJhY2tzID09IG51bGwp
IGZpbmRWaWV3QnlJZDxWaWV3PihSLmlkLnBsYXllclRyYWNrQ29udHJvbHMpLnZpc2liaWxpdHkg
PSBWaWV3LkdPTkUKICAgICAgICAgICAgZWxzZSB1cGRhdGVUcmFja0NvbnRyb2xzKHRyYWNrcykK
ICAgICAgICB9KQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuYXVkaW9UcmFja0J1
dHRvbikuc2V0T25DbGlja0xpc3RlbmVyIHsgc2hvd0F1ZGlvVHJhY2tzKCkgfQogICAgICAgIGZp
bmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc3VidGl0bGVUcmFja0J1dHRvbikuc2V0T25DbGlja0xp
c3RlbmVyIHsgc2hvd1N1YnRpdGxlVHJhY2tzKCkgfQogICAgICAgIHZhbCBzdHJlYW1JZCA9IGlu
dGVudC5nZXRJbnRFeHRyYSgic3RyZWFtSWQiLCAtMSkKICAgICAgICBpZiAoa2luZCA9PSAibGl2
ZSIgJiYgc3RyZWFtSWQgPiAwKSBsb2FkRXBnKHN0cmVhbUlkKSBlbHNlIGZpbmRWaWV3QnlJZDxU
ZXh0Vmlldz4oUi5pZC5ub3dOZXh0KS52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICB9CgogICAg
cHJpdmF0ZSBmdW4gbG9hZEVwZyhzdHJlYW1JZDogSW50KSB7CiAgICAgICAgdmFsIGMgPSBTZXNz
aW9uLmxvYWQodGhpcykgPzogcmV0dXJuCiAgICAgICAgZXhlY3V0b3IuZXhlY3V0ZSB7CiAgICAg
ICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICB2YWwgZXBnID0gWHRyZWFtQ2xpZW50LnNob3J0
RXBnKGMsIHN0cmVhbUlkLCAyKQogICAgICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7CiAgICAg
ICAgICAgICAgICAgICAgdmFsIGxhYmVsID0gZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLm5v
d05leHQpCiAgICAgICAgICAgICAgICAgICAgaWYgKGVwZy5pc0VtcHR5KCkpIGxhYmVsLnZpc2li
aWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAgICAgICAgICBlbHNlIHsKICAgICAgICAgICAg
ICAgICAgICAgICAgdmFsIG5vdyA9IGVwZy5nZXRPck51bGwoMCk/LnRpdGxlID86ICJMaXZlIgog
ICAgICAgICAgICAgICAgICAgICAgICB2YWwgbmV4dCA9IGVwZy5nZXRPck51bGwoMSk/LnRpdGxl
CiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnRleHQgPSBpZiAobmV4dC5pc051bGxPckJs
YW5rKCkpICJOT1cgIOKAoiAgJG5vdyIgZWxzZSAiTk9XICDigKIgICRub3cgICAgIE5FWFQgIOKA
oiAgJG5leHQiCiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnZpc2liaWxpdHkgPSBWaWV3
LlZJU0lCTEUKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAg
ICAgIH0gY2F0Y2ggKF86IEV4Y2VwdGlvbikgewogICAgICAgICAgICAgICAgcnVuT25VaVRocmVh
ZCB7IGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5pZC5ub3dOZXh0KS52aXNpYmlsaXR5ID0gVmll
dy5HT05FIH0KICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICBvdmVycmlkZSBmdW4g
b25TdGFydCgpIHsKICAgICAgICBzdXBlci5vblN0YXJ0KCkKICAgICAgICBzdGFydFBsYXliYWNr
KGZvcmNlUmVzdGFydCA9IGZhbHNlKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHN0YXJ0UGxheWJh
Y2soZm9yY2VSZXN0YXJ0OiBCb29sZWFuKSB7CiAgICAgICAgcmV0cnlSdW5uYWJsZT8ubGV0IHsg
aGFuZGxlci5yZW1vdmVDYWxsYmFja3MoaXQpIH0KICAgICAgICByZXRyeVJ1bm5hYmxlID0gbnVs
bAogICAgICAgIGlmICh1cmwuaXNCbGFuaygpKSB7CiAgICAgICAgICAgIHNob3dFcnJvcigiVGhp
cyBzdHJlYW0gZG9lcyBub3QgaGF2ZSBhIHBsYXlhYmxlIFVSTC4iKQogICAgICAgICAgICByZXR1
cm4KICAgICAgICB9CiAgICAgICAgaWYgKCFOZXR3b3JrU3RhdGUuaXNPbmxpbmUodGhpcykpIHsK
ICAgICAgICAgICAgc2hvd0Vycm9yKCJObyBpbnRlcm5ldCBjb25uZWN0aW9uLiBDaGVjayBXaS1G
aSBvciBFdGhlcm5ldCwgdGhlbiBjaG9vc2UgUmV0cnkuIikKICAgICAgICAgICAgcmV0dXJuCiAg
ICAgICAgfQoKICAgICAgICB2YWwgb2xkUG9zaXRpb24gPSBpZiAoIWZvcmNlUmVzdGFydCAmJiBr
aW5kICE9ICJsaXZlIikgcGxheWVyPy5jdXJyZW50UG9zaXRpb24gPzogcmVzdW1lTXMgZWxzZSBp
ZiAoZm9yY2VSZXN0YXJ0KSAwTCBlbHNlIHJlc3VtZU1zCiAgICAgICAgcGxheWVyPy5yZW1vdmVM
aXN0ZW5lcihsaXN0ZW5lcikKICAgICAgICBwbGF5ZXI/LnJlbGVhc2UoKQogICAgICAgIHBsYXll
ciA9IG51bGwKCiAgICAgICAgLy8gTWVkaWEgc291cmNlIGNyZWF0aW9uIGNhbiBmYWlsIHN5bmNo
cm9ub3VzbHkgd2hlbiBhIHN0cmVhbSB0eXBlIGlzIHVuc3VwcG9ydGVkLgogICAgICAgIC8vIE5l
dmVyIGxldCB0aGF0IGNyYXNoIHRoZSBBY3Rpdml0eSBhbmQgZHVtcCB0aGUgdmlld2VyIGJhY2sg
dG8gSG9tZS4KICAgICAgICB0cnkgewogICAgICAgICAgICB2YWwgbmV3UGxheWVyID0gRXhvUGxh
eWVyLkJ1aWxkZXIodGhpcykuYnVpbGQoKQogICAgICAgICAgICBwbGF5ZXIgPSBuZXdQbGF5ZXIK
ICAgICAgICAgICAgZmluZFZpZXdCeUlkPFBsYXllclZpZXc+KFIuaWQucGxheWVyVmlldykucGxh
eWVyID0gbmV3UGxheWVyCiAgICAgICAgICAgIG5ld1BsYXllci5hZGRMaXN0ZW5lcihsaXN0ZW5l
cikKICAgICAgICAgICAgbmV3UGxheWVyLnNldE1lZGlhSXRlbShNZWRpYUl0ZW0uZnJvbVVyaSh1
cmwpKQogICAgICAgICAgICBuZXdQbGF5ZXIucHJlcGFyZSgpCiAgICAgICAgICAgIGlmIChvbGRQ
b3NpdGlvbiA+IDAgJiYga2luZCAhPSAibGl2ZSIpIG5ld1BsYXllci5zZWVrVG8ob2xkUG9zaXRp
b24pCiAgICAgICAgICAgIG5ld1BsYXllci5wbGF5V2hlblJlYWR5ID0gdHJ1ZQogICAgICAgICAg
ICBzaG93TG9hZGluZygiQ29ubmVjdGluZ+KApiIpCiAgICAgICAgfSBjYXRjaCAodDogVGhyb3dh
YmxlKSB7CiAgICAgICAgICAgIHBsYXllcj8ucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpCiAgICAg
ICAgICAgIHBsYXllcj8ucmVsZWFzZSgpCiAgICAgICAgICAgIHBsYXllciA9IG51bGwKICAgICAg
ICAgICAgdmFsIGRldGFpbCA9IHQubWVzc2FnZT8udGFrZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0K
ICAgICAgICAgICAgICAgID86ICJUaGUgcGxheWVyIGNvdWxkIG5vdCBzdGFydCB0aGlzIHN0cmVh
bS4iCiAgICAgICAgICAgIHNob3dFcnJvcigiUGxheWVyIHN0YXJ0dXAgZmFpbGVkLlxuJGRldGFp
bCIpCiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGhhbmRsZVBsYXliYWNrRXJyb3Io
ZXJyb3I6IFBsYXliYWNrRXhjZXB0aW9uKSB7CiAgICAgICAgaWYgKCFOZXR3b3JrU3RhdGUuaXNP
bmxpbmUodGhpcykpIHsKICAgICAgICAgICAgc2hvd0Vycm9yKCJDb25uZWN0aW9uIGxvc3QuIFJl
Y29ubmVjdCB0byB0aGUgaW50ZXJuZXQsIHRoZW4gY2hvb3NlIFJldHJ5LiIpCiAgICAgICAgICAg
IHJldHVybgogICAgICAgIH0KCiAgICAgICAgaWYgKFBsYXllclByZWZzLmF1dG9SZXRyeSh0aGlz
KSAmJiByZXRyeUNvdW50IDwgMikgewogICAgICAgICAgICByZXRyeUNvdW50KysKICAgICAgICAg
ICAgdmFsIHNlY29uZHMgPSByZXRyeUNvdW50ICogMkwKICAgICAgICAgICAgc2hvd0xvYWRpbmco
IlN0cmVhbSBpbnRlcnJ1cHRlZCDigKIgcmVjb25uZWN0aW5nIGluICR7c2Vjb25kc31z4oCmIikK
ICAgICAgICAgICAgcmV0cnlSdW5uYWJsZSA9IFJ1bm5hYmxlIHsgc3RhcnRQbGF5YmFjayhmb3Jj
ZVJlc3RhcnQgPSBraW5kID09ICJsaXZlIikgfS5hbHNvIHsKICAgICAgICAgICAgICAgIGhhbmRs
ZXIucG9zdERlbGF5ZWQoaXQsIHNlY29uZHMgKiAxMDAwTCkKICAgICAgICAgICAgfQogICAgICAg
IH0gZWxzZSB7CiAgICAgICAgICAgIHZhbCBkZXRhaWwgPSB3aGVuIChlcnJvci5lcnJvckNvZGUp
IHsKICAgICAgICAgICAgICAgIFBsYXliYWNrRXhjZXB0aW9uLkVSUk9SX0NPREVfSU9fTkVUV09S
S19DT05ORUNUSU9OX0ZBSUxFRCwKICAgICAgICAgICAgICAgIFBsYXliYWNrRXhjZXB0aW9uLkVS
Uk9SX0NPREVfSU9fTkVUV09SS19DT05ORUNUSU9OX1RJTUVPVVQgLT4gIlRoZSBzdHJlYW0gc2Vy
dmVyIGNvdWxkIG5vdCBiZSByZWFjaGVkLiIKICAgICAgICAgICAgICAgIFBsYXliYWNrRXhjZXB0
aW9uLkVSUk9SX0NPREVfUEFSU0lOR19DT05UQUlORVJfVU5TVVBQT1JURUQsCiAgICAgICAgICAg
ICAgICBQbGF5YmFja0V4Y2VwdGlvbi5FUlJPUl9DT0RFX0RFQ09ESU5HX0ZPUk1BVF9VTlNVUFBP
UlRFRCAtPiAiVGhpcyBzdHJlYW0gZm9ybWF0IGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBkZXZp
Y2UuIgogICAgICAgICAgICAgICAgZWxzZSAtPiAiVGhlIHN0cmVhbSBjb3VsZCBub3QgYmUgcGxh
eWVkIHJpZ2h0IG5vdy4iCiAgICAgICAgICAgIH0KICAgICAgICAgICAgc2hvd0Vycm9yKCIkZGV0
YWlsXG5UcnkgdGhlIGNoYW5uZWwgYWdhaW4gb3IgY2hvb3NlIGFub3RoZXIgc3RyZWFtLiIpCiAg
ICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIHNob3dMb2FkaW5nKG1lc3NhZ2U6IFN0cmlu
ZykgewogICAgICAgIGZpbmRWaWV3QnlJZDxWaWV3PihSLmlkLnN0YXR1c092ZXJsYXkpLnZpc2li
aWxpdHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICBmaW5kVmlld0J5SWQ8UHJvZ3Jlc3NCYXI+KFIu
aWQubG9hZGluZ1NwaW5uZXIpLnZpc2liaWxpdHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICBmaW5k
Vmlld0J5SWQ8VGV4dFZpZXc+KFIuaWQuc3RhdHVzVGV4dCkudGV4dCA9IG1lc3NhZ2UKICAgICAg
ICBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLnJldHJ5QnV0dG9uKS52aXNpYmlsaXR5ID0gVmll
dy5HT05FCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc2hvd0Vycm9yKG1lc3NhZ2U6IFN0cmluZykg
ewogICAgICAgIGZpbmRWaWV3QnlJZDxWaWV3PihSLmlkLnN0YXR1c092ZXJsYXkpLnZpc2liaWxp
dHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICBmaW5kVmlld0J5SWQ8UHJvZ3Jlc3NCYXI+KFIuaWQu
bG9hZGluZ1NwaW5uZXIpLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICBmaW5kVmlld0J5
SWQ8VGV4dFZpZXc+KFIuaWQuc3RhdHVzVGV4dCkudGV4dCA9IG1lc3NhZ2UKICAgICAgICBmaW5k
Vmlld0J5SWQ8QnV0dG9uPihSLmlkLnJldHJ5QnV0dG9uKS5hcHBseSB7CiAgICAgICAgICAgIHZp
c2liaWxpdHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICAgICAgcmVxdWVzdEZvY3VzKCkKICAgICAg
ICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gaGlkZVN0YXR1cygpIHsKICAgICAgICBmaW5kVmll
d0J5SWQ8Vmlldz4oUi5pZC5zdGF0dXNPdmVybGF5KS52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gc3VwcG9ydGVkVHJhY2tzKHRyYWNrczogVHJhY2tzLCB0eXBl
OiBJbnQsIHByZWZpeDogU3RyaW5nKTogTGlzdDxUcmFja0Nob2ljZT4gewogICAgICAgIHZhciBu
dW1iZXIgPSAwCiAgICAgICAgcmV0dXJuIGJ1aWxkTGlzdCB7CiAgICAgICAgICAgIHRyYWNrcy5n
cm91cHMuZmlsdGVyIHsgaXQudHlwZSA9PSB0eXBlIH0uZm9yRWFjaCB7IGdyb3VwIC0+CiAgICAg
ICAgICAgICAgICBmb3IgKGluZGV4IGluIDAgdW50aWwgZ3JvdXAubGVuZ3RoKSB7CiAgICAgICAg
ICAgICAgICAgICAgaWYgKCFncm91cC5pc1RyYWNrU3VwcG9ydGVkKGluZGV4KSkgY29udGludWUK
ICAgICAgICAgICAgICAgICAgICBudW1iZXIrKwogICAgICAgICAgICAgICAgICAgIGFkZChUcmFj
a0Nob2ljZShncm91cCwgaW5kZXgsIHRyYWNrTGFiZWwoZ3JvdXAuZ2V0VHJhY2tGb3JtYXQoaW5k
ZXgpLCAiJHByZWZpeCAkbnVtYmVyIikpKQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9
CiAgICAgICAgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIHRyYWNrTGFiZWwoZm9ybWF0OiBGb3Jt
YXQsIGZhbGxiYWNrOiBTdHJpbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBwYXJ0cyA9IGxpc3RP
Zihmb3JtYXQubGFiZWwsIGZvcm1hdC5sYW5ndWFnZT8udXBwZXJjYXNlKCksIGZvcm1hdC5jb2Rl
Y3MpCiAgICAgICAgICAgIC5maWx0ZXJOb3ROdWxsKCkubWFwIHsgaXQudHJpbSgpIH0uZmlsdGVy
IHsgaXQuaXNOb3RCbGFuaygpIH0uZGlzdGluY3QoKQogICAgICAgIHJldHVybiBwYXJ0cy5qb2lu
VG9TdHJpbmcoIiDigKIgIikuaWZCbGFuayB7IGZhbGxiYWNrIH0KICAgIH0KCiAgICBwcml2YXRl
IGZ1biB1cGRhdGVUcmFja0NvbnRyb2xzKHRyYWNrczogVHJhY2tzKSB7CiAgICAgICAgdmFsIGF1
ZGlvID0gc3VwcG9ydGVkVHJhY2tzKHRyYWNrcywgQy5UUkFDS19UWVBFX0FVRElPLCAiQXVkaW8i
KQogICAgICAgIHZhbCBzdWJ0aXRsZXMgPSBzdXBwb3J0ZWRUcmFja3ModHJhY2tzLCBDLlRSQUNL
X1RZUEVfVEVYVCwgIlN1YnRpdGxlcyIpCiAgICAgICAgdmFsIHBhbmVsID0gZmluZFZpZXdCeUlk
PFZpZXc+KFIuaWQucGxheWVyVHJhY2tDb250cm9scykKICAgICAgICBwYW5lbC52aXNpYmlsaXR5
ID0gaWYgKGNvbnRyb2xsZXJWaXNpYmxlICYmIChhdWRpby5pc05vdEVtcHR5KCkgfHwgc3VidGl0
bGVzLmlzTm90RW1wdHkoKSkpIFZpZXcuVklTSUJMRSBlbHNlIFZpZXcuR09ORQoKICAgICAgICBm
aW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLmF1ZGlvVHJhY2tCdXR0b24pLmFwcGx5IHsKICAgICAg
ICAgICAgdmlzaWJpbGl0eSA9IGlmIChhdWRpby5pc0VtcHR5KCkpIFZpZXcuR09ORSBlbHNlIFZp
ZXcuVklTSUJMRQogICAgICAgICAgICB0ZXh0ID0gIkFVRElPICDigKIgICR7YXVkaW8uZmlyc3RP
ck51bGwgeyBpdC5ncm91cC5pc1RyYWNrU2VsZWN0ZWQoaXQuaW5kZXgpIH0/LmxhYmVsID86ICJB
VVRPIn0iCiAgICAgICAgfQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc3VidGl0
bGVUcmFja0J1dHRvbikuYXBwbHkgewogICAgICAgICAgICB2aXNpYmlsaXR5ID0gaWYgKHN1YnRp
dGxlcy5pc0VtcHR5KCkpIFZpZXcuR09ORSBlbHNlIFZpZXcuVklTSUJMRQogICAgICAgICAgICB0
ZXh0ID0gIlNVQlRJVExFUyAg4oCiICAke3N1YnRpdGxlcy5maXJzdE9yTnVsbCB7IGl0Lmdyb3Vw
LmlzVHJhY2tTZWxlY3RlZChpdC5pbmRleCkgfT8ubGFiZWwgPzogIk9GRiJ9IgogICAgICAgIH0K
ICAgIH0KCiAgICBwcml2YXRlIGZ1biBzaG93QXVkaW9UcmFja3MoKSB7CiAgICAgICAgdmFsIGFj
dGl2ZVBsYXllciA9IHBsYXllciA/OiByZXR1cm4KICAgICAgICB2YWwgY2hvaWNlcyA9IHN1cHBv
cnRlZFRyYWNrcyhhY3RpdmVQbGF5ZXIuY3VycmVudFRyYWNrcywgQy5UUkFDS19UWVBFX0FVRElP
LCAiQXVkaW8iKQogICAgICAgIGlmIChjaG9pY2VzLmlzRW1wdHkoKSkgcmV0dXJuCiAgICAgICAg
dmFsIGxhYmVscyA9IGFycmF5T2YoIkF1dG8iKSArIGNob2ljZXMubWFwIHsgaXQubGFiZWwgfQog
ICAgICAgIEFsZXJ0RGlhbG9nLkJ1aWxkZXIodGhpcykKICAgICAgICAgICAgLnNldFRpdGxlKCJB
dWRpbyB0cmFjayIpCiAgICAgICAgICAgIC5zZXRTaW5nbGVDaG9pY2VJdGVtcyhsYWJlbHMsIDAp
IHsgZGlhbG9nLCB3aGljaCAtPgogICAgICAgICAgICAgICAgdmFsIGJ1aWxkZXIgPSBhY3RpdmVQ
bGF5ZXIudHJhY2tTZWxlY3Rpb25QYXJhbWV0ZXJzLmJ1aWxkVXBvbigpCiAgICAgICAgICAgICAg
ICAgICAgLnNldFRyYWNrVHlwZURpc2FibGVkKEMuVFJBQ0tfVFlQRV9BVURJTywgZmFsc2UpCiAg
ICAgICAgICAgICAgICAgICAgLmNsZWFyT3ZlcnJpZGVzT2ZUeXBlKEMuVFJBQ0tfVFlQRV9BVURJ
TykKICAgICAgICAgICAgICAgIGlmICh3aGljaCA+IDApIHsKICAgICAgICAgICAgICAgICAgICB2
YWwgY2hvaWNlID0gY2hvaWNlc1t3aGljaCAtIDFdCiAgICAgICAgICAgICAgICAgICAgYnVpbGRl
ci5zZXRPdmVycmlkZUZvclR5cGUoVHJhY2tTZWxlY3Rpb25PdmVycmlkZShjaG9pY2UuZ3JvdXAu
bWVkaWFUcmFja0dyb3VwLCBsaXN0T2YoY2hvaWNlLmluZGV4KSkpCiAgICAgICAgICAgICAgICB9
CiAgICAgICAgICAgICAgICBhY3RpdmVQbGF5ZXIudHJhY2tTZWxlY3Rpb25QYXJhbWV0ZXJzID0g
YnVpbGRlci5idWlsZCgpCiAgICAgICAgICAgICAgICBhY3RpdmVQbGF5ZXIudm9sdW1lID0gMWYK
ICAgICAgICAgICAgICAgIGRpYWxvZy5kaXNtaXNzKCkKICAgICAgICAgICAgICAgIHVwZGF0ZVRy
YWNrQ29udHJvbHMoYWN0aXZlUGxheWVyLmN1cnJlbnRUcmFja3MpCiAgICAgICAgICAgIH0KICAg
ICAgICAgICAgLnNldE5lZ2F0aXZlQnV0dG9uKCJDYW5jZWwiLCBudWxsKQogICAgICAgICAgICAu
c2hvdygpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gc2hvd1N1YnRpdGxlVHJhY2tzKCkgewogICAg
ICAgIHZhbCBhY3RpdmVQbGF5ZXIgPSBwbGF5ZXIgPzogcmV0dXJuCiAgICAgICAgdmFsIGNob2lj
ZXMgPSBzdXBwb3J0ZWRUcmFja3MoYWN0aXZlUGxheWVyLmN1cnJlbnRUcmFja3MsIEMuVFJBQ0tf
VFlQRV9URVhULCAiU3VidGl0bGVzIikKICAgICAgICBpZiAoY2hvaWNlcy5pc0VtcHR5KCkpIHJl
dHVybgogICAgICAgIHZhbCBsYWJlbHMgPSBhcnJheU9mKCJPZmYiKSArIGNob2ljZXMubWFwIHsg
aXQubGFiZWwgfQogICAgICAgIEFsZXJ0RGlhbG9nLkJ1aWxkZXIodGhpcykKICAgICAgICAgICAg
LnNldFRpdGxlKCJTdWJ0aXRsZXMiKQogICAgICAgICAgICAuc2V0U2luZ2xlQ2hvaWNlSXRlbXMo
bGFiZWxzLCAwKSB7IGRpYWxvZywgd2hpY2ggLT4KICAgICAgICAgICAgICAgIHZhbCBidWlsZGVy
ID0gYWN0aXZlUGxheWVyLnRyYWNrU2VsZWN0aW9uUGFyYW1ldGVycy5idWlsZFVwb24oKQogICAg
ICAgICAgICAgICAgICAgIC5jbGVhck92ZXJyaWRlc09mVHlwZShDLlRSQUNLX1RZUEVfVEVYVCkK
ICAgICAgICAgICAgICAgICAgICAuc2V0VHJhY2tUeXBlRGlzYWJsZWQoQy5UUkFDS19UWVBFX1RF
WFQsIHdoaWNoID09IDApCiAgICAgICAgICAgICAgICBpZiAod2hpY2ggPiAwKSB7CiAgICAgICAg
ICAgICAgICAgICAgdmFsIGNob2ljZSA9IGNob2ljZXNbd2hpY2ggLSAxXQogICAgICAgICAgICAg
ICAgICAgIGJ1aWxkZXIuc2V0T3ZlcnJpZGVGb3JUeXBlKFRyYWNrU2VsZWN0aW9uT3ZlcnJpZGUo
Y2hvaWNlLmdyb3VwLm1lZGlhVHJhY2tHcm91cCwgbGlzdE9mKGNob2ljZS5pbmRleCkpKQogICAg
ICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgYWN0aXZlUGxheWVyLnRyYWNrU2VsZWN0aW9u
UGFyYW1ldGVycyA9IGJ1aWxkZXIuYnVpbGQoKQogICAgICAgICAgICAgICAgZGlhbG9nLmRpc21p
c3MoKQogICAgICAgICAgICAgICAgdXBkYXRlVHJhY2tDb250cm9scyhhY3RpdmVQbGF5ZXIuY3Vy
cmVudFRyYWNrcykKICAgICAgICAgICAgfQogICAgICAgICAgICAuc2V0TmVnYXRpdmVCdXR0b24o
IkNhbmNlbCIsIG51bGwpCiAgICAgICAgICAgIC5zaG93KCkKICAgIH0KCiAgICBvdmVycmlkZSBm
dW4gb25TdG9wKCkgewogICAgICAgIHJldHJ5UnVubmFibGU/LmxldCB7IGhhbmRsZXIucmVtb3Zl
Q2FsbGJhY2tzKGl0KSB9CiAgICAgICAgcmV0cnlSdW5uYWJsZSA9IG51bGwKICAgICAgICB2YWwg
cCA9IHBsYXllcgogICAgICAgIGlmIChwICE9IG51bGwgJiYga2luZCAhPSAibGl2ZSIgJiYgdXJs
LmlzTm90QmxhbmsoKSAmJiBQbGF5ZXJQcmVmcy5zYXZlUHJvZ3Jlc3ModGhpcykpIHsKICAgICAg
ICAgICAgdmFsIHBvc2l0aW9uID0gcC5jdXJyZW50UG9zaXRpb24uY29lcmNlQXRMZWFzdCgwKQog
ICAgICAgICAgICB2YWwgZHVyYXRpb24gPSBwLmR1cmF0aW9uLmNvZXJjZUF0TGVhc3QoMCkKICAg
ICAgICAgICAgLy8gQXZvaWQgY2x1dHRlcmluZyBDb250aW51ZSBXYXRjaGluZyB3aGVuIHRoZSB2
aWV3ZXIgb25seSBvcGVuZWQgYW4gaXRlbSBicmllZmx5LgogICAgICAgICAgICBpZiAocG9zaXRp
b24gPj0gMTVfMDAwTCAmJiAoZHVyYXRpb24gPD0gMEwgfHwgcG9zaXRpb24gPCBkdXJhdGlvbiAt
IDEwXzAwMEwpKSB7CiAgICAgICAgICAgICAgICBDb250aW51ZVdhdGNoaW5nLnNhdmUodGhpcywg
Q29udGludWVJdGVtKG5hbWUsIHVybCwgcG9zaXRpb24sIGR1cmF0aW9uLCBraW5kLCBTeXN0ZW0u
Y3VycmVudFRpbWVNaWxsaXMoKSkpCiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgZmlu
ZFZpZXdCeUlkPFBsYXllclZpZXc+KFIuaWQucGxheWVyVmlldykucGxheWVyID0gbnVsbAogICAg
ICAgIHA/LnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKQogICAgICAgIHA/LnJlbGVhc2UoKQogICAg
ICAgIHBsYXllciA9IG51bGwKICAgICAgICBzdXBlci5vblN0b3AoKQogICAgfQoKICAgIG92ZXJy
aWRlIGZ1biBvbkRlc3Ryb3koKSB7CiAgICAgICAgcmV0cnlSdW5uYWJsZT8ubGV0IHsgaGFuZGxl
ci5yZW1vdmVDYWxsYmFja3MoaXQpIH0KICAgICAgICBleGVjdXRvci5zaHV0ZG93bk5vdygpCiAg
ICAgICAgc3VwZXIub25EZXN0cm95KCkKICAgIH0KfQo=
:::END PLAYER

:::BEGIN PLAYERLAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPEZyYW1lTGF5b3V0IHhtbG5z
OmFuZHJvaWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIgeG1s
bnM6YXBwPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzLWF1dG8iIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hf
cGFyZW50IiBhbmRyb2lkOmJhY2tncm91bmQ9IiMwMDAwMDAiPgogICAgPGFuZHJvaWR4Lm1lZGlh
My51aS5QbGF5ZXJWaWV3CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9wbGF5ZXJWaWV3IgogICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDps
YXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9InRy
dWUiCiAgICAgICAgYW5kcm9pZDpmb2N1c2FibGVJblRvdWNoTW9kZT0idHJ1ZSIKICAgICAgICBh
cHA6dXNlX2NvbnRyb2xsZXI9InRydWUiCiAgICAgICAgYXBwOnNob3dfYnVmZmVyaW5nPSJ3aGVu
X3BsYXlpbmciLz4KCiAgICA8TGluZWFyTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRj
aF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IiBhbmRyb2lkOm9y
aWVudGF0aW9uPSJ2ZXJ0aWNhbCIgYW5kcm9pZDpwYWRkaW5nPSIxNmRwIiBhbmRyb2lkOmJhY2tn
cm91bmQ9IiM5OTAwMDAwMCI+CiAgICAgICAgPFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvY2hh
bm5lbE5hbWUiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5
b3V0X2hlaWdodD0id3JhcF9jb250ZW50IiBhbmRyb2lkOnRleHQ9IktyaXN0YWwgU3RyZWFtcyIg
YW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJv
bGQiIGFuZHJvaWQ6dGV4dFNpemU9IjE4c3AiLz4KICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDpp
ZD0iQCtpZC9ub3dOZXh0IiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRy
b2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9w
PSI0ZHAiIGFuZHJvaWQ6dGV4dD0iTk9XIOKAoiBQcm9ncmFtIiBhbmRyb2lkOnRleHRDb2xvcj0i
QGNvbG9yL2tzX3JlZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTJzcCIvPgogICAgPC9MaW5lYXJMYXlv
dXQ+CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvcGxheWVyVHJh
Y2tDb250cm9scyIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50Igog
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgIGFuZHJv
aWQ6bGF5b3V0X2dyYXZpdHk9ImJvdHRvbXxlbmQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luRW5kPSIxOGRwIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpbkJvdHRvbT0iODJkcCIK
ICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IiNDQzExMTExMSIKICAgICAgICBhbmRyb2lkOmdy
YXZpdHk9ImNlbnRlciIKICAgICAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIgog
ICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iNmRwIgogICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0eT0i
Z29uZSI+CiAgICAgICAgPEJ1dHRvbgogICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL2F1ZGlv
VHJhY2tCdXR0b24iCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRl
bnQiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDZkcCIKICAgICAgICAgICAg
YW5kcm9pZDptaW5XaWR0aD0iMTM4ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0i
QGRyYXdhYmxlL2JnX2J1dHRvbiIKICAgICAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9InRydWUi
CiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iQVVESU8g4oCiIEFVVE8iCiAgICAgICAgICAgIGFu
ZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dFNpemU9IjEwc3AiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIi8+CiAgICAg
ICAgPEJ1dHRvbgogICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL3N1YnRpdGxlVHJhY2tCdXR0
b24iCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAg
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDZkcCIKICAgICAgICAgICAgYW5kcm9pZDps
YXlvdXRfbWFyZ2luU3RhcnQ9IjhkcCIKICAgICAgICAgICAgYW5kcm9pZDptaW5XaWR0aD0iMTUw
ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIK
ICAgICAgICAgICAgYW5kcm9pZDpmb2N1c2FibGU9InRydWUiCiAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dD0iU1VCVElUTEVTIOKAoiBPRkYiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJA
Y29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiCiAgICAg
ICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIi8+CiAgICA8L0xpbmVhckxheW91dD4KCiAg
ICA8TGluZWFyTGF5b3V0CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9zdGF0dXNPdmVybGF5Igog
ICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9p
ZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDpncmF2aXR5PSJj
ZW50ZXIiCiAgICAgICAgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiCiAgICAgICAgYW5k
cm9pZDpwYWRkaW5nPSIyOGRwIgogICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iI0NDMDAwMDAw
IgogICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29uZSI+CiAgICAgICAgPEltYWdlVmlldyBh
bmRyb2lkOmxheW91dF93aWR0aD0iNjhkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI2OGRwIiBh
bmRyb2lkOnNyYz0iQGRyYXdhYmxlL2tzX21vbm9ncmFtIiBhbmRyb2lkOmNvbnRlbnREZXNjcmlw
dGlvbj0iS3Jpc3RhbCBTdHJlYW1zIi8+CiAgICAgICAgPFByb2dyZXNzQmFyIGFuZHJvaWQ6aWQ9
IkAraWQvbG9hZGluZ1NwaW5uZXIiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSI0MmRwIiBhbmRyb2lk
OmxheW91dF9oZWlnaHQ9IjQyZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMThkcCIgYW5k
cm9pZDppbmRldGVybWluYXRlVGludD0iQGNvbG9yL2tzX3JlZCIvPgogICAgICAgIDxUZXh0Vmll
dyBhbmRyb2lkOmlkPSJAK2lkL3N0YXR1c1RleHQiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFw
X2NvbnRlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IiBhbmRyb2lkOmxh
eW91dF9tYXJnaW5Ub3A9IjE4ZHAiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lkOm1h
eFdpZHRoPSI1MjBkcCIgYW5kcm9pZDp0ZXh0PSJDb25uZWN0aW5n4oCmIiBhbmRyb2lkOnRleHRD
b2xvcj0iQGNvbG9yL2tzX3doaXRlIiBhbmRyb2lkOnRleHRTaXplPSIxN3NwIi8+CiAgICAgICAg
PEJ1dHRvbiBhbmRyb2lkOmlkPSJAK2lkL3JldHJ5QnV0dG9uIiBhbmRyb2lkOmxheW91dF93aWR0
aD0iMTgwZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNTJkcCIgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luVG9wPSIyMGRwIiBhbmRyb2lkOnRleHQ9IlJFVFJZIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNv
bG9yL2tzX3doaXRlIiBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIgYW5kcm9pZDpiYWNrZ3JvdW5k
PSJAZHJhd2FibGUvYmdfYnV0dG9uIiBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiIGFuZHJvaWQ6
Zm9jdXNhYmxlPSJ0cnVlIi8+CiAgICA8L0xpbmVhckxheW91dD4KPC9GcmFtZUxheW91dD4K
:::END PLAYERLAYOUT

:::BEGIN WATCHLIST
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQppbXBvcnQgb3JnLmpzb24uSlNPTk9i
amVjdAoKZGF0YSBjbGFzcyBNb3ZpZVdhdGNobGlzdEl0ZW0oCiAgICB2YWwgaWQ6IEludCwKICAg
IHZhbCBuYW1lOiBTdHJpbmcsCiAgICB2YWwgcGxheVVybDogU3RyaW5nLAogICAgdmFsIGltYWdl
VXJsOiBTdHJpbmcsCiAgICB2YWwgY2F0ZWdvcnlJZDogU3RyaW5nLAogICAgdmFsIHllYXI6IFN0
cmluZywKICAgIHZhbCByYXRpbmc6IFN0cmluZwopIHsKICAgIGZ1biBhc0xpYnJhcnlJdGVtKCkg
PSBMaWJyYXJ5SXRlbSgKICAgICAgICBpZCA9IGlkLAogICAgICAgIG5hbWUgPSBuYW1lLAogICAg
ICAgIGtpbmQgPSAibW92aWUiLAogICAgICAgIHBsYXlVcmwgPSBwbGF5VXJsLAogICAgICAgIGlt
YWdlVXJsID0gaW1hZ2VVcmwsCiAgICAgICAgY2F0ZWdvcnlJZCA9IGNhdGVnb3J5SWQsCiAgICAg
ICAgeWVhciA9IHllYXIsCiAgICAgICAgcmF0aW5nID0gcmF0aW5nCiAgICApCn0KCm9iamVjdCBN
b3ZpZVdhdGNobGlzdCB7CiAgICBwcml2YXRlIGNvbnN0IHZhbCBQUkVGUyA9ICJrc19tb3ZpZV93
YXRjaGxpc3QiCiAgICBwcml2YXRlIGNvbnN0IHZhbCBLRVkgPSAibW92aWVzIgoKICAgIGZ1biBh
bGwoY29udGV4dDogQ29udGV4dCk6IExpc3Q8TW92aWVXYXRjaGxpc3RJdGVtPiB7CiAgICAgICAg
dmFsIHJhdyA9IGNvbnRleHQuZ2V0U2hhcmVkUHJlZmVyZW5jZXMoUFJFRlMsIENvbnRleHQuTU9E
RV9QUklWQVRFKS5nZXRTdHJpbmcoS0VZLCAiW10iKSA/OiAiW10iCiAgICAgICAgcmV0dXJuIHRy
eSB7CiAgICAgICAgICAgIHZhbCBhcnJheSA9IEpTT05BcnJheShyYXcpCiAgICAgICAgICAgIGJ1
aWxkTGlzdCB7CiAgICAgICAgICAgICAgICBmb3IgKGluZGV4IGluIDAgdW50aWwgYXJyYXkubGVu
Z3RoKCkpIHsKICAgICAgICAgICAgICAgICAgICB2YWwgaXRlbSA9IGFycmF5Lm9wdEpTT05PYmpl
Y3QoaW5kZXgpID86IGNvbnRpbnVlCiAgICAgICAgICAgICAgICAgICAgYWRkKE1vdmllV2F0Y2hs
aXN0SXRlbSgKICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBpdGVtLm9wdEludCgiaWQiKSwK
ICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGl0ZW0ub3B0U3RyaW5nKCJuYW1lIiwgIk1v
dmllIiksCiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXlVcmwgPSBpdGVtLm9wdFN0cmluZygi
cGxheVVybCIpLAogICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVVybCA9IGl0ZW0ub3B0U3Ry
aW5nKCJpbWFnZVVybCIpLAogICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gaXRl
bS5vcHRTdHJpbmcoImNhdGVnb3J5SWQiKSwKICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9
IGl0ZW0ub3B0U3RyaW5nKCJ5ZWFyIiksCiAgICAgICAgICAgICAgICAgICAgICAgIHJhdGluZyA9
IGl0ZW0ub3B0U3RyaW5nKCJyYXRpbmciKQogICAgICAgICAgICAgICAgICAgICkpCiAgICAgICAg
ICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICB9IGNhdGNoIChfOiBFeGNlcHRpb24pIHsK
ICAgICAgICAgICAgZW1wdHlMaXN0KCkKICAgICAgICB9CiAgICB9CgogICAgZnVuIGNvbnRhaW5z
KGNvbnRleHQ6IENvbnRleHQsIG1vdmllSWQ6IEludCk6IEJvb2xlYW4gPSBhbGwoY29udGV4dCku
YW55IHsgaXQuaWQgPT0gbW92aWVJZCB9CgogICAgZnVuIHRvZ2dsZShjb250ZXh0OiBDb250ZXh0
LCBtb3ZpZTogTW92aWVEZXRhaWxzKTogQm9vbGVhbiB7CiAgICAgICAgdmFsIG1vdmllcyA9IGFs
bChjb250ZXh0KS50b011dGFibGVMaXN0KCkKICAgICAgICB2YWwgZXhpc3RpbmcgPSBtb3ZpZXMu
aW5kZXhPZkZpcnN0IHsgaXQuaWQgPT0gbW92aWUuaWQgfQogICAgICAgIHZhbCBhZGRlZCA9IGV4
aXN0aW5nIDwgMAogICAgICAgIGlmIChhZGRlZCkgewogICAgICAgICAgICBtb3ZpZXMuYWRkKDAs
IE1vdmllV2F0Y2hsaXN0SXRlbSgKICAgICAgICAgICAgICAgIGlkID0gbW92aWUuaWQsCiAgICAg
ICAgICAgICAgICBuYW1lID0gbW92aWUubmFtZSwKICAgICAgICAgICAgICAgIHBsYXlVcmwgPSBt
b3ZpZS5wbGF5VXJsLAogICAgICAgICAgICAgICAgaW1hZ2VVcmwgPSBtb3ZpZS5wb3N0ZXJVcmws
CiAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gbW92aWUuY2F0ZWdvcnlJZCwKICAgICAgICAg
ICAgICAgIHllYXIgPSBtb3ZpZS55ZWFyLAogICAgICAgICAgICAgICAgcmF0aW5nID0gbW92aWUu
cmF0aW5nCiAgICAgICAgICAgICkpCiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgbW92aWVz
LnJlbW92ZUF0KGV4aXN0aW5nKQogICAgICAgIH0KICAgICAgICB3cml0ZShjb250ZXh0LCBtb3Zp
ZXMpCiAgICAgICAgcmV0dXJuIGFkZGVkCiAgICB9CgogICAgZnVuIHJlbW92ZShjb250ZXh0OiBD
b250ZXh0LCBtb3ZpZUlkOiBJbnQpIHsKICAgICAgICB3cml0ZShjb250ZXh0LCBhbGwoY29udGV4
dCkuZmlsdGVyTm90IHsgaXQuaWQgPT0gbW92aWVJZCB9KQogICAgfQoKICAgIHByaXZhdGUgZnVu
IHdyaXRlKGNvbnRleHQ6IENvbnRleHQsIG1vdmllczogTGlzdDxNb3ZpZVdhdGNobGlzdEl0ZW0+
KSB7CiAgICAgICAgdmFsIGFycmF5ID0gSlNPTkFycmF5KCkKICAgICAgICBtb3ZpZXMuZm9yRWFj
aCB7IG1vdmllIC0+CiAgICAgICAgICAgIGFycmF5LnB1dChKU09OT2JqZWN0KCkuYXBwbHkgewog
ICAgICAgICAgICAgICAgcHV0KCJpZCIsIG1vdmllLmlkKQogICAgICAgICAgICAgICAgcHV0KCJu
YW1lIiwgbW92aWUubmFtZSkKICAgICAgICAgICAgICAgIHB1dCgicGxheVVybCIsIG1vdmllLnBs
YXlVcmwpCiAgICAgICAgICAgICAgICBwdXQoImltYWdlVXJsIiwgbW92aWUuaW1hZ2VVcmwpCiAg
ICAgICAgICAgICAgICBwdXQoImNhdGVnb3J5SWQiLCBtb3ZpZS5jYXRlZ29yeUlkKQogICAgICAg
ICAgICAgICAgcHV0KCJ5ZWFyIiwgbW92aWUueWVhcikKICAgICAgICAgICAgICAgIHB1dCgicmF0
aW5nIiwgbW92aWUucmF0aW5nKQogICAgICAgICAgICB9KQogICAgICAgIH0KICAgICAgICBjb250
ZXh0LmdldFNoYXJlZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSkuZWRp
dCgpLnB1dFN0cmluZyhLRVksIGFycmF5LnRvU3RyaW5nKCkpLmFwcGx5KCkKICAgIH0KfQo=
:::END WATCHLIST

:::BEGIN WATCHLISTACTIVITY
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5vcy5CdW5kbGUKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3
CmltcG9ydCBhbmRyb2lkLndpZGdldC5CdXR0b24KaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkdyaWRW
aWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQu
VG9hc3QKaW1wb3J0IGFuZHJvaWR4LmFwcGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0aXZpdHkKCmNs
YXNzIE1vdmllV2F0Y2hsaXN0QWN0aXZpdHkgOiBBcHBDb21wYXRBY3Rpdml0eSgpIHsKICAgIHBy
aXZhdGUgbGF0ZWluaXQgdmFyIGdyaWQ6IEdyaWRWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZh
ciBlbXB0eTogVGV4dFZpZXcKICAgIHByaXZhdGUgbGF0ZWluaXQgdmFyIGNvdW50OiBUZXh0Vmll
dwogICAgcHJpdmF0ZSB2YXIgaXRlbXM6IExpc3Q8TW92aWVXYXRjaGxpc3RJdGVtPiA9IGVtcHR5
TGlzdCgpCgogICAgb3ZlcnJpZGUgZnVuIG9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZTogQnVu
ZGxlPykgewogICAgICAgIHN1cGVyLm9uQ3JlYXRlKHNhdmVkSW5zdGFuY2VTdGF0ZSkKICAgICAg
ICBzZXRDb250ZW50VmlldyhSLmxheW91dC5hY3Rpdml0eV9tb3ZpZV93YXRjaGxpc3QpCiAgICAg
ICAgZ3JpZCA9IGZpbmRWaWV3QnlJZChSLmlkLndhdGNobGlzdEdyaWQpCiAgICAgICAgZW1wdHkg
PSBmaW5kVmlld0J5SWQoUi5pZC53YXRjaGxpc3RFbXB0eSkKICAgICAgICBjb3VudCA9IGZpbmRW
aWV3QnlJZChSLmlkLndhdGNobGlzdENvdW50KQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+
KFIuaWQud2F0Y2hsaXN0QmFjaykuc2V0T25DbGlja0xpc3RlbmVyIHsgZmluaXNoKCkgfQoKICAg
ICAgICBjb25maWd1cmVNZWRpYUdyaWQoZ3JpZCkgeyBwb3NpdGlvbiAtPiBvcGVuTW92aWUocG9z
aXRpb24pIH0KICAgICAgICBncmlkLnNldE9uSXRlbUxvbmdDbGlja0xpc3RlbmVyIHsgXywgXywg
cG9zaXRpb24sIF8gLT4KICAgICAgICAgICAgaWYgKHBvc2l0aW9uICFpbiBpdGVtcy5pbmRpY2Vz
KSByZXR1cm5Ac2V0T25JdGVtTG9uZ0NsaWNrTGlzdGVuZXIgZmFsc2UKICAgICAgICAgICAgTW92
aWVXYXRjaGxpc3QucmVtb3ZlKHRoaXMsIGl0ZW1zW3Bvc2l0aW9uXS5pZCkKICAgICAgICAgICAg
VG9hc3QubWFrZVRleHQodGhpcywgIlJlbW92ZWQgZnJvbSBNeSBMaXN0IiwgVG9hc3QuTEVOR1RI
X1NIT1JUKS5zaG93KCkKICAgICAgICAgICAgcmVmcmVzaCgpCiAgICAgICAgICAgIHRydWUKICAg
ICAgICB9CiAgICB9CgogICAgb3ZlcnJpZGUgZnVuIG9uUmVzdW1lKCkgewogICAgICAgIHN1cGVy
Lm9uUmVzdW1lKCkKICAgICAgICByZWZyZXNoKCkKICAgIH0KCiAgICBwcml2YXRlIGZ1biByZWZy
ZXNoKCkgewogICAgICAgIGl0ZW1zID0gTW92aWVXYXRjaGxpc3QuYWxsKHRoaXMpCiAgICAgICAg
Y291bnQudGV4dCA9ICIke2l0ZW1zLnNpemV9IFNBVkVEIE1PVklFJHtpZiAoaXRlbXMuc2l6ZSA9
PSAxKSAiIiBlbHNlICJTIn0iCiAgICAgICAgaWYgKGl0ZW1zLmlzRW1wdHkoKSkgewogICAgICAg
ICAgICBncmlkLmFkYXB0ZXIgPSBudWxsCiAgICAgICAgICAgIGdyaWQudmlzaWJpbGl0eSA9IFZp
ZXcuR09ORQogICAgICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFCiAgICAg
ICAgICAgIHJldHVybgogICAgICAgIH0KICAgICAgICBlbXB0eS52aXNpYmlsaXR5ID0gVmlldy5H
T05FCiAgICAgICAgZ3JpZC5hZGFwdGVyID0gTWVkaWFHcmlkQWRhcHRlcih0aGlzLCBpdGVtcy5t
YXAgeyBpdC5hc0xpYnJhcnlJdGVtKCkgfSkKICAgICAgICBncmlkLnZpc2liaWxpdHkgPSBWaWV3
LlZJU0lCTEUKICAgICAgICBmb2N1c0ZpcnN0TWVkaWFJdGVtKGdyaWQpCiAgICB9CgogICAgcHJp
dmF0ZSBmdW4gb3Blbk1vdmllKHBvc2l0aW9uOiBJbnQpIHsKICAgICAgICBpZiAocG9zaXRpb24g
IWluIGl0ZW1zLmluZGljZXMpIHJldHVybgogICAgICAgIHZhbCBpdGVtID0gaXRlbXNbcG9zaXRp
b25dCiAgICAgICAgc3RhcnRBY3Rpdml0eShJbnRlbnQodGhpcywgTW92aWVEZXRhaWxzQWN0aXZp
dHk6OmNsYXNzLmphdmEpLmFwcGx5IHsKICAgICAgICAgICAgcHV0RXh0cmEoIm1vdmllSWQiLCBp
dGVtLmlkKQogICAgICAgICAgICBwdXRFeHRyYSgibW92aWVOYW1lIiwgaXRlbS5uYW1lKQogICAg
ICAgICAgICBwdXRFeHRyYSgibW92aWVQbGF5VXJsIiwgaXRlbS5wbGF5VXJsKQogICAgICAgICAg
ICBwdXRFeHRyYSgibW92aWVJbWFnZVVybCIsIGl0ZW0uaW1hZ2VVcmwpCiAgICAgICAgICAgIHB1
dEV4dHJhKCJtb3ZpZUNhdGVnb3J5SWQiLCBpdGVtLmNhdGVnb3J5SWQpCiAgICAgICAgICAgIHB1
dEV4dHJhKCJtb3ZpZVllYXIiLCBpdGVtLnllYXIpCiAgICAgICAgICAgIHB1dEV4dHJhKCJtb3Zp
ZVJhdGluZyIsIGl0ZW0ucmF0aW5nKQogICAgICAgIH0pCiAgICB9Cn0K
:::END WATCHLISTACTIVITY

:::BEGIN WATCHLISTLAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI3NmRwIgogICAgICAgIGFuZHJv
aWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0
PSIxMmRwIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ0VuZD0iMTJkcCIKICAgICAgICBhbmRyb2lk
OmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9oZWFkZXIiPgogICAgICAgIDxJbWFn
ZVZpZXcKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjU4ZHAiCiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNThkcCIKICAgICAgICAgICAgYW5kcm9pZDpzcmM9IkBk
cmF3YWJsZS9vZmZpY2lhbF9tb3ZpZXMiCiAgICAgICAgICAgIGFuZHJvaWQ6c2NhbGVUeXBlPSJj
ZW50ZXJJbnNpZGUiCiAgICAgICAgICAgIGFuZHJvaWQ6Y29udGVudERlc2NyaXB0aW9uPSJNb3Zp
ZXMiLz4KICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSIwZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50
IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxMGRwIgogICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0
aW9uPSJ2ZXJ0aWNhbCI+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAgICAgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
PSJLUklTVEFMIFNUUkVBTVMgQ0lORU1BIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29s
b3I9IkBjb2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9s
ZCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGV0dGVyU3BhY2luZz0iMC4xMiIvPgogICAgICAgICAgICA8VGV4dFZpZXcKICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6dGV4dD0iTVkgTU9WSUUgTElTVCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRT
dHlsZT0iYm9sZCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjE5c3AiLz4KICAg
ICAgICAgICAgPFRleHRWaWV3CiAgICAgICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL3dhdGNo
bGlzdENvdW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29u
dGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50
IgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0PSIwIFNBVkVEIE1PVklFUyIKICAgICAgICAg
ICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAgICAgICAg
ICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIi8+CiAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CiAgICAg
ICAgPEJ1dHRvbgogICAgICAgICAgICBhbmRyb2lkOmlkPSJAK2lkL3dhdGNobGlzdEJhY2siCiAg
ICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSI3MmRwIgogICAgICAgICAgICBhbmRyb2lk
OmxheW91dF9oZWlnaHQ9IjQyZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iQkFDSyIKICAg
ICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAg
YW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEw
c3AiCiAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIv
PgogICAgPC9MaW5lYXJMYXlvdXQ+CgogICAgPFRleHRWaWV3CiAgICAgICAgYW5kcm9pZDppZD0i
QCtpZC93YXRjaGxpc3RFbXB0eSIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAg
ICAgIGFuZHJvaWQ6cGFkZGluZz0iMjhkcCIKICAgICAgICBhbmRyb2lkOmdyYXZpdHk9ImNlbnRl
ciIKICAgICAgICBhbmRyb2lkOnRleHQ9IllvdXIgbW92aWUgbGlzdCBpcyBlbXB0eS4gQWRkIG1v
dmllcyBmcm9tIHRoZWlyIGRldGFpbHMgcGFnZXMuIgogICAgICAgIGFuZHJvaWQ6dGV4dENvbG9y
PSJAY29sb3Iva3NfbXV0ZWQiCiAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTRzcCIvPgoKICAg
IDxHcmlkVmlldwogICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvd2F0Y2hsaXN0R3JpZCIKICAgICAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgIGFuZHJvaWQ6bGF5
b3V0X2hlaWdodD0iMGRwIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAg
ICBhbmRyb2lkOm51bUNvbHVtbnM9IjIiCiAgICAgICAgYW5kcm9pZDpob3Jpem9udGFsU3BhY2lu
Zz0iMTFkcCIKICAgICAgICBhbmRyb2lkOnZlcnRpY2FsU3BhY2luZz0iMTRkcCIKICAgICAgICBh
bmRyb2lkOnBhZGRpbmc9IjEwZHAiCiAgICAgICAgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxz
ZSIKICAgICAgICBhbmRyb2lkOnN0cmV0Y2hNb2RlPSJjb2x1bW5XaWR0aCIKICAgICAgICBhbmRy
b2lkOmxpc3RTZWxlY3Rvcj0iQGRyYXdhYmxlL2JnX21lZGlhX2dyaWRfc2VsZWN0b3IiCiAgICAg
ICAgYW5kcm9pZDpkcmF3U2VsZWN0b3JPblRvcD0idHJ1ZSIKICAgICAgICBhbmRyb2lkOmJhY2tn
cm91bmQ9IkBhbmRyb2lkOmNvbG9yL3RyYW5zcGFyZW50IgogICAgICAgIGFuZHJvaWQ6dmlzaWJp
bGl0eT0iZ29uZSIvPgo8L0xpbmVhckxheW91dD4K
:::END WATCHLISTLAYOUT

:::BEGIN WATCHLISTLAYOUTLAND
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CiAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3Bh
cmVudCIKICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjcwZHAiCiAgICAgICAgYW5kcm9p
ZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiCiAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9
IjE0ZHAiCiAgICAgICAgYW5kcm9pZDpwYWRkaW5nRW5kPSIxNGRwIgogICAgICAgIGFuZHJvaWQ6
YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX29mZmljaWFsX2hlYWRlciI+CiAgICAgICAgPEltYWdl
VmlldwogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iNThkcCIKICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1OGRwIgogICAgICAgICAgICBhbmRyb2lkOnNyYz0iQGRy
YXdhYmxlL29mZmljaWFsX21vdmllcyIKICAgICAgICAgICAgYW5kcm9pZDpzY2FsZVR5cGU9ImNl
bnRlckluc2lkZSIKICAgICAgICAgICAgYW5kcm9pZDpjb250ZW50RGVzY3JpcHRpb249Ik1vdmll
cyIvPgogICAgICAgIDxJbWFnZVZpZXcKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IjIxMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjUwZHAiCiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI5ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6
c3JjPSJAZHJhd2FibGUva3NfYmFubmVyIgogICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0i
Zml0U3RhcnQiCiAgICAgICAgICAgIGFuZHJvaWQ6Y29udGVudERlc2NyaXB0aW9uPSJLcmlzdGFs
IFN0cmVhbXMiLz4KICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9j
b250ZW50IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxNGRwIgogICAgICAgICAgICBhbmRyb2lkOm9y
aWVudGF0aW9uPSJ2ZXJ0aWNhbCI+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgYW5kcm9p
ZDp0ZXh0PSJNWSBNT1ZJRSBMSVNUIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9
IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xk
IgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMjBzcCIvPgogICAgICAgICAgICA8
VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvd2F0Y2hsaXN0Q291bnQi
CiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50IgogICAg
ICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOnRleHQ9IjAgU0FWRUQgTU9WSUVTIgogICAgICAgICAgICAgICAgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRl
eHRTdHlsZT0iYm9sZCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiLz4K
ICAgICAgICA8L0xpbmVhckxheW91dD4KICAgICAgICA8QnV0dG9uCiAgICAgICAgICAgIGFuZHJv
aWQ6aWQ9IkAraWQvd2F0Y2hsaXN0QmFjayIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lk
dGg9Ijc2ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDJkcCIKICAgICAg
ICAgICAgYW5kcm9pZDp0ZXh0PSJCQUNLIgogICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0i
QGNvbG9yL2tzX3doaXRlIgogICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAg
ICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIKICAgICAgICAgICAgYW5kcm9pZDpiYWNr
Z3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CiAgICA8L0xpbmVhckxheW91dD4KICAgIDxU
ZXh0VmlldwogICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvd2F0Y2hsaXN0RW1wdHkiCiAgICAgICAg
YW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICBhbmRyb2lkOnBhZGRpbmc9IjI0ZHAiCiAg
ICAgICAgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXIiCiAgICAgICAgYW5kcm9pZDp0ZXh0PSJZb3Vy
IG1vdmllIGxpc3QgaXMgZW1wdHkuIEFkZCBtb3ZpZXMgZnJvbSB0aGVpciBkZXRhaWxzIHBhZ2Vz
LiIKICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkIgogICAgICAgIGFu
ZHJvaWQ6dGV4dFNpemU9IjE0c3AiLz4KICAgIDxHcmlkVmlldwogICAgICAgIGFuZHJvaWQ6aWQ9
IkAraWQvd2F0Y2hsaXN0R3JpZCIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMGRwIgogICAgICAgIGFuZHJv
aWQ6bGF5b3V0X3dlaWdodD0iMSIKICAgICAgICBhbmRyb2lkOm51bUNvbHVtbnM9IjQiCiAgICAg
ICAgYW5kcm9pZDpob3Jpem9udGFsU3BhY2luZz0iMTRkcCIKICAgICAgICBhbmRyb2lkOnZlcnRp
Y2FsU3BhY2luZz0iMTRkcCIKICAgICAgICBhbmRyb2lkOnBhZGRpbmc9IjEyZHAiCiAgICAgICAg
YW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxzZSIKICAgICAgICBhbmRyb2lkOnN0cmV0Y2hNb2Rl
PSJjb2x1bW5XaWR0aCIKICAgICAgICBhbmRyb2lkOmxpc3RTZWxlY3Rvcj0iQGRyYXdhYmxlL2Jn
X21lZGlhX2dyaWRfc2VsZWN0b3IiCiAgICAgICAgYW5kcm9pZDpkcmF3U2VsZWN0b3JPblRvcD0i
dHJ1ZSIKICAgICAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBhbmRyb2lkOmNvbG9yL3RyYW5zcGFy
ZW50IgogICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29uZSIvPgo8L0xpbmVhckxheW91dD4K
:::END WATCHLISTLAYOUTLAND

:::BEGIN EPISODEADAPTER
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IGFuZHJvaWQudmlldy5MYXlvdXRJbmZsYXRlcgppbXBvcnQgYW5kcm9p
ZC52aWV3LlZpZXcKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3R3JvdXAKaW1wb3J0IGFuZHJvaWQu
d2lkZ2V0LkJhc2VBZGFwdGVyCmltcG9ydCBhbmRyb2lkLndpZGdldC5JbWFnZVZpZXcKaW1wb3J0
IGFuZHJvaWQud2lkZ2V0LlByb2dyZXNzQmFyCmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0Vmll
dwoKY2xhc3MgRXBpc29kZUxpc3RBZGFwdGVyKAogICAgcHJpdmF0ZSB2YWwgY29udGV4dDogQ29u
dGV4dCwKICAgIHByaXZhdGUgdmFsIGVwaXNvZGVzOiBMaXN0PEVwaXNvZGVJdGVtPiwKICAgIHBy
aXZhdGUgdmFsIHByb2dyZXNzQnlVcmw6IE1hcDxTdHJpbmcsIENvbnRpbnVlSXRlbT4KKSA6IEJh
c2VBZGFwdGVyKCkgewoKICAgIHByaXZhdGUgZGF0YSBjbGFzcyBIb2xkZXIoCiAgICAgICAgdmFs
IGltYWdlOiBJbWFnZVZpZXcsCiAgICAgICAgdmFsIGJhZGdlOiBUZXh0VmlldywKICAgICAgICB2
YWwgdGl0bGU6IFRleHRWaWV3LAogICAgICAgIHZhbCBkZXNjcmlwdGlvbjogVGV4dFZpZXcsCiAg
ICAgICAgdmFsIG1ldGE6IFRleHRWaWV3LAogICAgICAgIHZhbCBwcm9ncmVzczogUHJvZ3Jlc3NC
YXIKICAgICkKCiAgICBvdmVycmlkZSBmdW4gZ2V0Q291bnQoKSA9IGVwaXNvZGVzLnNpemUKICAg
IG92ZXJyaWRlIGZ1biBnZXRJdGVtKHBvc2l0aW9uOiBJbnQpID0gZXBpc29kZXNbcG9zaXRpb25d
CiAgICBvdmVycmlkZSBmdW4gZ2V0SXRlbUlkKHBvc2l0aW9uOiBJbnQpID0gZXBpc29kZXNbcG9z
aXRpb25dLmlkLnRvTG9uZygpCgogICAgb3ZlcnJpZGUgZnVuIGdldFZpZXcocG9zaXRpb246IElu
dCwgY29udmVydFZpZXc6IFZpZXc/LCBwYXJlbnQ6IFZpZXdHcm91cCk6IFZpZXcgewogICAgICAg
IHZhbCByb3cgPSBjb252ZXJ0VmlldyA/OiBMYXlvdXRJbmZsYXRlci5mcm9tKGNvbnRleHQpLmlu
ZmxhdGUoUi5sYXlvdXQucm93X2VwaXNvZGVfbW9kZXJuLCBwYXJlbnQsIGZhbHNlKQogICAgICAg
IHZhbCBob2xkZXIgPSAocm93LnRhZyBhcz8gSG9sZGVyKSA/OiBIb2xkZXIoCiAgICAgICAgICAg
IHJvdy5maW5kVmlld0J5SWQoUi5pZC5lcGlzb2RlSW1hZ2UpLCByb3cuZmluZFZpZXdCeUlkKFIu
aWQuZXBpc29kZUJhZGdlKSwKICAgICAgICAgICAgcm93LmZpbmRWaWV3QnlJZChSLmlkLmVwaXNv
ZGVUaXRsZSksIHJvdy5maW5kVmlld0J5SWQoUi5pZC5lcGlzb2RlRGVzY3JpcHRpb24pLAogICAg
ICAgICAgICByb3cuZmluZFZpZXdCeUlkKFIuaWQuZXBpc29kZU1ldGEpLCByb3cuZmluZFZpZXdC
eUlkKFIuaWQuZXBpc29kZVByb2dyZXNzKQogICAgICAgICkuYWxzbyB7IHJvdy50YWcgPSBpdCB9
CgogICAgICAgIHZhbCBlcGlzb2RlID0gZ2V0SXRlbShwb3NpdGlvbikKICAgICAgICB2YWwgc2F2
ZWQgPSBwcm9ncmVzc0J5VXJsW2VwaXNvZGUucGxheVVybF0KICAgICAgICBob2xkZXIuYmFkZ2Uu
dGV4dCA9ICJTJHtlcGlzb2RlLnNlYXNvbn0gRSR7ZXBpc29kZS5lcGlzb2RlfSIKICAgICAgICBo
b2xkZXIudGl0bGUudGV4dCA9IGVwaXNvZGUudGl0bGUKICAgICAgICBob2xkZXIuZGVzY3JpcHRp
b24uYXBwbHkgewogICAgICAgICAgICB0ZXh0ID0gZXBpc29kZS5kZXNjcmlwdGlvbgogICAgICAg
ICAgICB2aXNpYmlsaXR5ID0gaWYgKGVwaXNvZGUuZGVzY3JpcHRpb24uaXNCbGFuaygpKSBWaWV3
LkdPTkUgZWxzZSBWaWV3LlZJU0lCTEUKICAgICAgICB9CiAgICAgICAgdmFsIGZhY3RzID0gYnVp
bGRMaXN0IHsKICAgICAgICAgICAgZXBpc29kZS5haXJEYXRlLnRha2VJZiB7IGl0LmlzTm90Qmxh
bmsoKSB9Py5sZXQgeyBhZGQoaXQpIH0KICAgICAgICAgICAgZXBpc29kZS5kdXJhdGlvbi50YWtl
SWYgeyBpdC5pc05vdEJsYW5rKCkgfT8ubGV0IHsgYWRkKGl0KSB9CiAgICAgICAgICAgIGVwaXNv
ZGUucmF0aW5nLnRha2VJZiB7IGl0LmlzTm90QmxhbmsoKSB9Py5sZXQgeyBhZGQoIuKYhSAkaXQi
KSB9CiAgICAgICAgICAgIHNhdmVkPy5sZXQgeyBhZGQoIlJFU1VNRSAke2Zvcm1hdFRpbWUoaXQu
cG9zaXRpb25Ncyl9IikgfQogICAgICAgIH0KICAgICAgICBob2xkZXIubWV0YS50ZXh0ID0gZmFj
dHMuam9pblRvU3RyaW5nKCIgIOKAoiAgIikuaWZCbGFuayB7ICJTZWxlY3QgdG8gcGxheSIgfQog
ICAgICAgIGhvbGRlci5wcm9ncmVzcy52aXNpYmlsaXR5ID0gaWYgKHNhdmVkICE9IG51bGwgJiYg
c2F2ZWQuZHVyYXRpb25NcyA+IDApIFZpZXcuVklTSUJMRSBlbHNlIFZpZXcuR09ORQogICAgICAg
IGhvbGRlci5wcm9ncmVzcy5wcm9ncmVzcyA9IGlmIChzYXZlZCAhPSBudWxsICYmIHNhdmVkLmR1
cmF0aW9uTXMgPiAwKSB7CiAgICAgICAgICAgICgoc2F2ZWQucG9zaXRpb25NcyAqIDEwMEwpIC8g
c2F2ZWQuZHVyYXRpb25NcykudG9JbnQoKS5jb2VyY2VJbigwLCAxMDApCiAgICAgICAgfSBlbHNl
IDAKICAgICAgICBSZW1vdGVJbWFnZUxvYWRlci5sb2FkKGVwaXNvZGUuaW1hZ2VVcmwsIGhvbGRl
ci5pbWFnZSwgUi5kcmF3YWJsZS5vZmZpY2lhbF9zZXJpZXMsIGNyb3AgPSBlcGlzb2RlLmltYWdl
VXJsLmlzTm90QmxhbmsoKSkKCiAgICAgICAgcm93LmlzRm9jdXNhYmxlID0gZmFsc2U7IHJvdy5p
c0ZvY3VzYWJsZUluVG91Y2hNb2RlID0gZmFsc2U7IHJvdy5pc0NsaWNrYWJsZSA9IGZhbHNlCiAg
ICAgICAgcmV0dXJuIHJvdwogICAgfQoKICAgIHByaXZhdGUgZnVuIGZvcm1hdFRpbWUobXM6IExv
bmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBtaW51dGVzID0gbXMuY29lcmNlQXRMZWFzdCgwTCkg
LyA2MF8wMDBMCiAgICAgICAgcmV0dXJuIGlmIChtaW51dGVzID49IDYwKSAiJHttaW51dGVzIC8g
NjB9aCAke21pbnV0ZXMgJSA2MH1tIiBlbHNlICIke21pbnV0ZXN9bSIKICAgIH0KfQo=
:::END EPISODEADAPTER

:::BEGIN EPISODEROW
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWln
aHQ9IjExOGRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIgogICAgYW5kcm9pZDpn
cmF2aXR5PSJjZW50ZXJfdmVydGljYWwiIGFuZHJvaWQ6cGFkZGluZz0iOWRwIiBhbmRyb2lkOmJh
Y2tncm91bmQ9IkBkcmF3YWJsZS9iZ19lcGlzb2RlX3JvdyIKICAgIGFuZHJvaWQ6Zm9jdXNhYmxl
PSJmYWxzZSIgYW5kcm9pZDpjbGlja2FibGU9ImZhbHNlIj4KICAgIDxGcmFtZUxheW91dCBhbmRy
b2lkOmxheW91dF93aWR0aD0iMTQyZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iOTZkcCI+CiAg
ICAgICAgPEltYWdlVmlldyBhbmRyb2lkOmlkPSJAK2lkL2VwaXNvZGVJbWFnZSIgYW5kcm9pZDps
YXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9w
YXJlbnQiCiAgICAgICAgICAgIGFuZHJvaWQ6c2NhbGVUeXBlPSJjZW50ZXJDcm9wIiBhbmRyb2lk
OnNyYz0iQGRyYXdhYmxlL29mZmljaWFsX3NlcmllcyIgYW5kcm9pZDpjb250ZW50RGVzY3JpcHRp
b249IkVwaXNvZGUgYXJ0d29yayIvPgogICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lk
L2VwaXNvZGVCYWRnZSIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjY0ZHAiIGFuZHJvaWQ6bGF5b3V0
X2hlaWdodD0iMzBkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfZ3Jhdml0eT0iYm90dG9t
fHN0YXJ0IiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlciIgYW5kcm9pZDp0ZXh0PSJTMSBFMSIgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiIGFuZHJvaWQ6YmFja2dyb3VuZD0i
QGRyYXdhYmxlL2JnX2xpdmVfcGlsbCIvPgogICAgPC9GcmFtZUxheW91dD4KICAgIDxMaW5lYXJM
YXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJt
YXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luU3RhcnQ9IjEyZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIiBhbmRyb2lkOmdy
YXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCI+CiAgICAgICAgPFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAr
aWQvZXBpc29kZVRpdGxlIiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRy
b2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDptYXhMaW5lcz0iMSIgYW5k
cm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDp0ZXh0PSJFcGlzb2RlIHRpdGxlIiBhbmRyb2lk
OnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIiBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIgYW5k
cm9pZDp0ZXh0U2l6ZT0iMTZzcCIvPgogICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lk
L2VwaXNvZGVEZXNjcmlwdGlvbiIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6bGF5b3V0X21hcmdp
blRvcD0iNGRwIiBhbmRyb2lkOm1heExpbmVzPSIyIiBhbmRyb2lkOmVsbGlwc2l6ZT0iZW5kIiBh
bmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkXzIiIGFuZHJvaWQ6dGV4dFNpemU9IjEw
c3AiIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29uZSIvPgogICAgICAgIDxUZXh0VmlldyBhbmRyb2lk
OmlkPSJAK2lkL2VwaXNvZGVNZXRhIiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50
IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luVG9wPSI1ZHAiIGFuZHJvaWQ6bWF4TGluZXM9IjEiIGFuZHJvaWQ6ZWxsaXBzaXplPSJlbmQi
IGFuZHJvaWQ6dGV4dD0iU2VsZWN0IHRvIHBsYXkiIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iv
a3NfbXV0ZWQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiLz4KICAgICAgICA8UHJvZ3Jlc3NCYXIg
YW5kcm9pZDppZD0iQCtpZC9lcGlzb2RlUHJvZ3Jlc3MiIHN0eWxlPSI/YW5kcm9pZDphdHRyL3By
b2dyZXNzQmFyU3R5bGVIb3Jpem9udGFsIiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFy
ZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjVkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9w
PSI1ZHAiIGFuZHJvaWQ6bWF4PSIxMDAiIGFuZHJvaWQ6cHJvZ3Jlc3NUaW50PSJAY29sb3Iva3Nf
cmVkIiBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiLz4KICAgIDwvTGluZWFyTGF5b3V0PgogICAg
PFRleHRWaWV3IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIzNmRwIiBhbmRyb2lkOmxheW91dF9oZWln
aHQ9IjQwZHAiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lkOnRleHQ9IuKWtiIgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19yZWQiIGFuZHJvaWQ6dGV4dFNpemU9IjE4c3AiLz4K
PC9MaW5lYXJMYXlvdXQ+Cg==
:::END EPISODEROW

:::BEGIN SERIESDETAILS
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5ncmFwaGljcy5Db2xvcgppbXBvcnQgYW5kcm9pZC5uZXQu
VXJpCmltcG9ydCBhbmRyb2lkLm9zLkJ1bmRsZQppbXBvcnQgYW5kcm9pZC52aWV3LlZpZXcKaW1w
b3J0IGFuZHJvaWQud2lkZ2V0LkJ1dHRvbgppbXBvcnQgYW5kcm9pZC53aWRnZXQuSW1hZ2VWaWV3
CmltcG9ydCBhbmRyb2lkLndpZGdldC5MaW5lYXJMYXlvdXQKaW1wb3J0IGFuZHJvaWQud2lkZ2V0
Lkxpc3RWaWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5Qcm9ncmVzc0JhcgppbXBvcnQgYW5kcm9p
ZC53aWRnZXQuVGV4dFZpZXcKaW1wb3J0IGFuZHJvaWQud2lkZ2V0LlRvYXN0CmltcG9ydCBhbmRy
b2lkeC5hcHBjb21wYXQuYXBwLkFsZXJ0RGlhbG9nCmltcG9ydCBhbmRyb2lkeC5hcHBjb21wYXQu
YXBwLkFwcENvbXBhdEFjdGl2aXR5CmltcG9ydCBqYXZhLnV0aWwuY29uY3VycmVudC5FeGVjdXRv
cnMKaW1wb3J0IGtvdGxpbi5tYXRoLnJvdW5kVG9JbnQKCmNsYXNzIFNlcmllc0RldGFpbHNBY3Rp
dml0eSA6IEFwcENvbXBhdEFjdGl2aXR5KCkgewogICAgcHJpdmF0ZSB2YWwgZXhlY3V0b3IgPSBF
eGVjdXRvcnMubmV3U2luZ2xlVGhyZWFkRXhlY3V0b3IoKQogICAgcHJpdmF0ZSBsYXRlaW5pdCB2
YXIgY3JlZGVudGlhbHM6IFh0cmVhbUNyZWRlbnRpYWxzCiAgICBwcml2YXRlIGxhdGVpbml0IHZh
ciBsaXN0OiBMaXN0VmlldwogICAgcHJpdmF0ZSBsYXRlaW5pdCB2YXIgY3VycmVudDogU2VyaWVz
RGV0YWlscwogICAgcHJpdmF0ZSB2YXIgZXBpc29kZXM6IExpc3Q8RXBpc29kZUl0ZW0+ID0gZW1w
dHlMaXN0KCkKICAgIHByaXZhdGUgdmFyIHZpc2libGVFcGlzb2RlczogTGlzdDxFcGlzb2RlSXRl
bT4gPSBlbXB0eUxpc3QoKQogICAgcHJpdmF0ZSB2YXIgc2VsZWN0ZWRTZWFzb24gPSAwCiAgICBw
cml2YXRlIHZhciByZWxhdGVkQ2F0ZWdvcnkgPSAiIgoKICAgIG92ZXJyaWRlIGZ1biBvbkNyZWF0
ZShzYXZlZEluc3RhbmNlU3RhdGU6IEJ1bmRsZT8pIHsKICAgICAgICBzdXBlci5vbkNyZWF0ZShz
YXZlZEluc3RhbmNlU3RhdGUpCiAgICAgICAgc2V0Q29udGVudFZpZXcoUi5sYXlvdXQuYWN0aXZp
dHlfc2VyaWVzX2RldGFpbHMpCiAgICAgICAgY3JlZGVudGlhbHMgPSBTZXNzaW9uLmxvYWQodGhp
cykgPzogcnVuIHsgZmluaXNoKCk7IHJldHVybiB9CgogICAgICAgIHZhbCBzZXJpZXNJZCA9IGlu
dGVudC5nZXRJbnRFeHRyYSgic2VyaWVzSWQiLCAtMSkKICAgICAgICBjdXJyZW50ID0gU2VyaWVz
RGV0YWlscygKICAgICAgICAgICAgaWQgPSBzZXJpZXNJZCwKICAgICAgICAgICAgbmFtZSA9IGlu
dGVudC5nZXRTdHJpbmdFeHRyYSgic2VyaWVzTmFtZSIpID86ICJTZXJpZXMiLAogICAgICAgICAg
ICBwb3N0ZXJVcmwgPSBpbnRlbnQuZ2V0U3RyaW5nRXh0cmEoInNlcmllc0ltYWdlVXJsIikub3JF
bXB0eSgpLAogICAgICAgICAgICB5ZWFyID0gaW50ZW50LmdldFN0cmluZ0V4dHJhKCJzZXJpZXNZ
ZWFyIikub3JFbXB0eSgpLAogICAgICAgICAgICByYXRpbmcgPSBpbnRlbnQuZ2V0U3RyaW5nRXh0
cmEoInNlcmllc1JhdGluZyIpLm9yRW1wdHkoKSwKICAgICAgICAgICAgY2F0ZWdvcnlJZCA9IGlu
dGVudC5nZXRTdHJpbmdFeHRyYSgic2VyaWVzQ2F0ZWdvcnlJZCIpLm9yRW1wdHkoKQogICAgICAg
ICkKCiAgICAgICAgbGlzdCA9IGZpbmRWaWV3QnlJZChSLmlkLmVwaXNvZGVMaXN0KQogICAgICAg
IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzQmFjaykuc2V0T25DbGlja0xpc3RlbmVy
IHsgZmluaXNoKCkgfQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzV2F0
Y2hsaXN0KS5zZXRPbkNsaWNrTGlzdGVuZXIgewogICAgICAgICAgICB2YWwgYWRkZWQgPSBTZXJp
ZXNXYXRjaGxpc3QudG9nZ2xlKHRoaXMsIGN1cnJlbnQpCiAgICAgICAgICAgIHVwZGF0ZVdhdGNo
bGlzdEJ1dHRvbigpCiAgICAgICAgICAgIFRvYXN0Lm1ha2VUZXh0KHRoaXMsIGlmIChhZGRlZCkg
IkFkZGVkIHRvIE15IFNlcmllcyIgZWxzZSAiUmVtb3ZlZCBmcm9tIE15IFNlcmllcyIsIFRvYXN0
LkxFTkdUSF9TSE9SVCkuc2hvdygpCiAgICAgICAgfQogICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0
b24+KFIuaWQuc2VyaWVzVHJhaWxlcikuc2V0T25DbGlja0xpc3RlbmVyIHsgb3BlblRyYWlsZXIo
KSB9CiAgICAgICAgY29uZmlndXJlTWVkaWFMaXN0KGxpc3QpIHsgcG9zaXRpb24gLT4gY2hvb3Nl
RXBpc29kZShwb3NpdGlvbikgfQogICAgICAgIHJlbmRlckRldGFpbHMoY3VycmVudCkKCiAgICAg
ICAgaWYgKHNlcmllc0lkIDw9IDApIHsKICAgICAgICAgICAgc2hvd0Vycm9yKCJTZXJpZXMgaW5m
b3JtYXRpb24gaXMgdW5hdmFpbGFibGUuIikKICAgICAgICAgICAgcmV0dXJuCiAgICAgICAgfQoK
ICAgICAgICBleGVjdXRvci5leGVjdXRlIHsKICAgICAgICAgICAgdHJ5IHsKICAgICAgICAgICAg
ICAgIHZhbCBjb250ZW50ID0gWHRyZWFtQ2xpZW50LnNlcmllc0NvbnRlbnQoY3JlZGVudGlhbHMs
IHNlcmllc0lkKQogICAgICAgICAgICAgICAgdmFsIGRldGFpbHMgPSBjb250ZW50LmRldGFpbHMu
Y29weSgKICAgICAgICAgICAgICAgICAgICBuYW1lID0gY29udGVudC5kZXRhaWxzLm5hbWUudGFr
ZVVubGVzcyB7IGl0ID09ICJTZXJpZXMiIH0ub3JFbXB0eSgpLmlmQmxhbmsgeyBjdXJyZW50Lm5h
bWUgfSwKICAgICAgICAgICAgICAgICAgICBwb3N0ZXJVcmwgPSBjb250ZW50LmRldGFpbHMucG9z
dGVyVXJsLmlmQmxhbmsgeyBjdXJyZW50LnBvc3RlclVybCB9LAogICAgICAgICAgICAgICAgICAg
IHllYXIgPSBjb250ZW50LmRldGFpbHMueWVhci5pZkJsYW5rIHsgY3VycmVudC55ZWFyIH0sCiAg
ICAgICAgICAgICAgICAgICAgcmF0aW5nID0gY29udGVudC5kZXRhaWxzLnJhdGluZy5pZkJsYW5r
IHsgY3VycmVudC5yYXRpbmcgfSwKICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeUlkID0gY29u
dGVudC5kZXRhaWxzLmNhdGVnb3J5SWQuaWZCbGFuayB7IGN1cnJlbnQuY2F0ZWdvcnlJZCB9CiAg
ICAgICAgICAgICAgICApCiAgICAgICAgICAgICAgICBydW5PblVpVGhyZWFkIHsKICAgICAgICAg
ICAgICAgICAgICBmaW5kVmlld0J5SWQ8UHJvZ3Jlc3NCYXI+KFIuaWQuc2VyaWVzUHJvZ3Jlc3Mp
LnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gZGV0
YWlscwogICAgICAgICAgICAgICAgICAgIGVwaXNvZGVzID0gY29udGVudC5lcGlzb2RlcwogICAg
ICAgICAgICAgICAgICAgIHJlbmRlckRldGFpbHMoY3VycmVudCkKICAgICAgICAgICAgICAgICAg
ICByZW5kZXJTZWFzb25zKCkKICAgICAgICAgICAgICAgICAgICByZWZyZXNoRXBpc29kZXMocmVz
dG9yZVNlYXNvbiA9IHRydWUpCiAgICAgICAgICAgICAgICAgICAgbG9hZFJlbGF0ZWQoY3VycmVu
dC5jYXRlZ29yeUlkKQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGNhdGNoIChlOiBF
eGNlcHRpb24pIHsKICAgICAgICAgICAgICAgIHJ1bk9uVWlUaHJlYWQgeyBzaG93RXJyb3IoZS5t
ZXNzYWdlID86ICJVbmFibGUgdG8gbG9hZCB0aGlzIHNlcmllcyIpIH0KICAgICAgICAgICAgfQog
ICAgICAgIH0KICAgIH0KCiAgICBvdmVycmlkZSBmdW4gb25SZXN1bWUoKSB7CiAgICAgICAgc3Vw
ZXIub25SZXN1bWUoKQogICAgICAgIGlmIChlcGlzb2Rlcy5pc05vdEVtcHR5KCkpIHJlZnJlc2hF
cGlzb2RlcyhyZXN0b3JlU2Vhc29uID0gZmFsc2UpCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gcmVu
ZGVyRGV0YWlscyhzZXJpZXM6IFNlcmllc0RldGFpbHMpIHsKICAgICAgICBmaW5kVmlld0J5SWQ8
VGV4dFZpZXc+KFIuaWQuc2VyaWVzVGl0bGUpLnRleHQgPSBzZXJpZXMubmFtZQogICAgICAgIHZh
bCBtZXRhID0gYnVpbGRMaXN0IHsKICAgICAgICAgICAgc2VyaWVzLnllYXIudGFrZUlmIHsgaXQu
aXNOb3RCbGFuaygpIH0/LmxldCB7IGFkZChpdCkgfQogICAgICAgICAgICBzZXJpZXMucmF0aW5n
LnRha2VJZiB7IGl0LmlzTm90QmxhbmsoKSB9Py5sZXQgeyBhZGQoIuKYhSAkaXQiKSB9CiAgICAg
ICAgICAgIHNlcmllcy5zdGF0dXMudGFrZUlmIHsgaXQuaXNOb3RCbGFuaygpIH0/LmxldCB7IGFk
ZChpdCkgfQogICAgICAgIH0uam9pblRvU3RyaW5nKCIgIOKAoiAgIikKICAgICAgICBmaW5kVmll
d0J5SWQ8VGV4dFZpZXc+KFIuaWQuc2VyaWVzTWV0YSkudGV4dCA9IG1ldGEuaWZCbGFuayB7ICJT
RUFTT05TICYgRVBJU09ERVMiIH0KICAgICAgICBmaW5kVmlld0J5SWQ8VGV4dFZpZXc+KFIuaWQu
c2VyaWVzRGVzY3JpcHRpb24pLnRleHQgPSBzZXJpZXMuZGVzY3JpcHRpb24uaWZCbGFuayB7CiAg
ICAgICAgICAgICJBIGRlc2NyaXB0aW9uIHdhcyBub3Qgc3VwcGxpZWQgZm9yIHRoaXMgc2VyaWVz
IGJ5IHRoZSBwcm92aWRlci4iCiAgICAgICAgfQogICAgICAgIHNldEZhY3QoUi5pZC5zZXJpZXNH
ZW5yZSwgIkdFTlJFIiwgc2VyaWVzLmdlbnJlKQogICAgICAgIHNldEZhY3QoUi5pZC5zZXJpZXND
YXN0LCAiQ0FTVCIsIHNlcmllcy5jYXN0KQogICAgICAgIHNldEZhY3QoUi5pZC5zZXJpZXNEaXJl
Y3RvciwgIkRJUkVDVE9SIiwgc2VyaWVzLmRpcmVjdG9yKQogICAgICAgIHNldEZhY3QoUi5pZC5z
ZXJpZXNSZWxlYXNlZCwgIlJFTEVBU0VEIiwgc2VyaWVzLnJlbGVhc2VEYXRlKQogICAgICAgIHNl
dEZhY3QoUi5pZC5zZXJpZXNMYXN0QWlyLCAiTEFTVCBBSVJFRCIsIHNlcmllcy5sYXN0QWlyRGF0
ZSkKICAgICAgICBSZW1vdGVJbWFnZUxvYWRlci5sb2FkKHNlcmllcy5wb3N0ZXJVcmwsIGZpbmRW
aWV3QnlJZChSLmlkLnNlcmllc0hlYWRlckljb24pLCBSLmRyYXdhYmxlLm9mZmljaWFsX3Nlcmll
cywgY3JvcCA9IHNlcmllcy5wb3N0ZXJVcmwuaXNOb3RCbGFuaygpKQogICAgICAgIHZhbCBiYWNr
ZHJvcCA9IHNlcmllcy5iYWNrZHJvcFVybC5pZkJsYW5rIHsgc2VyaWVzLnBvc3RlclVybCB9CiAg
ICAgICAgUmVtb3RlSW1hZ2VMb2FkZXIubG9hZChiYWNrZHJvcCwgZmluZFZpZXdCeUlkKFIuaWQu
c2VyaWVzQmFja2Ryb3ApLCBSLmRyYXdhYmxlLm9mZmljaWFsX2Rhc2hib2FyZF9iZywgY3JvcCA9
IGJhY2tkcm9wLmlzTm90QmxhbmsoKSkKICAgICAgICBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlk
LnNlcmllc1RyYWlsZXIpLnZpc2liaWxpdHkgPSBpZiAoc2VyaWVzLnRyYWlsZXJVcmwuaXNCbGFu
aygpKSBWaWV3LkdPTkUgZWxzZSBWaWV3LlZJU0lCTEUKICAgICAgICB1cGRhdGVXYXRjaGxpc3RC
dXR0b24oKQogICAgfQoKICAgIHByaXZhdGUgZnVuIHJlbmRlclNlYXNvbnMoKSB7CiAgICAgICAg
dmFsIGJhciA9IGZpbmRWaWV3QnlJZDxMaW5lYXJMYXlvdXQ+KFIuaWQuc2VyaWVzU2Vhc29uQmFy
KQogICAgICAgIGJhci5yZW1vdmVBbGxWaWV3cygpCiAgICAgICAgZXBpc29kZXMubWFwIHsgaXQu
c2Vhc29uIH0uZGlzdGluY3QoKS5zb3J0ZWQoKS5mb3JFYWNoIHsgc2Vhc29uIC0+CiAgICAgICAg
ICAgIGJhci5hZGRWaWV3KEJ1dHRvbih0aGlzKS5hcHBseSB7CiAgICAgICAgICAgICAgICB0ZXh0
ID0gaWYgKHNlYXNvbiA8PSAwKSAiU1BFQ0lBTFMiIGVsc2UgIlNFQVNPTiAkc2Vhc29uIgogICAg
ICAgICAgICAgICAgaXNBbGxDYXBzID0gZmFsc2UKICAgICAgICAgICAgICAgIHNldFRleHRDb2xv
cihDb2xvci5XSElURSkKICAgICAgICAgICAgICAgIHRleHRTaXplID0gMTFmCiAgICAgICAgICAg
ICAgICBiYWNrZ3JvdW5kID0gZ2V0RHJhd2FibGUoUi5kcmF3YWJsZS5iZ19yb3cpCiAgICAgICAg
ICAgICAgICBpc0ZvY3VzYWJsZSA9IHRydWUKICAgICAgICAgICAgICAgIGxheW91dFBhcmFtcyA9
IExpbmVhckxheW91dC5MYXlvdXRQYXJhbXMoMTMyLmRwLCA0Ni5kcCkuYXBwbHkgeyBtYXJnaW5F
bmQgPSA4LmRwIH0KICAgICAgICAgICAgICAgIHNldE9uQ2xpY2tMaXN0ZW5lciB7CiAgICAgICAg
ICAgICAgICAgICAgc2VsZWN0ZWRTZWFzb24gPSBzZWFzb24KICAgICAgICAgICAgICAgICAgICBT
ZXJpZXNIaXN0b3J5LnNhdmVTZWxlY3RlZFNlYXNvbih0aGlzQFNlcmllc0RldGFpbHNBY3Rpdml0
eSwgY3VycmVudC5pZCwgc2Vhc29uKQogICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlYXNvbkJ1
dHRvbnMoKQogICAgICAgICAgICAgICAgICAgIHJlZnJlc2hFcGlzb2RlcyhyZXN0b3JlU2Vhc29u
ID0gZmFsc2UpCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB0YWcgPSBzZWFzb24K
ICAgICAgICAgICAgfSkKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0ZSBmdW4gdXBkYXRlU2Vh
c29uQnV0dG9ucygpIHsKICAgICAgICB2YWwgYmFyID0gZmluZFZpZXdCeUlkPExpbmVhckxheW91
dD4oUi5pZC5zZXJpZXNTZWFzb25CYXIpCiAgICAgICAgZm9yIChpbmRleCBpbiAwIHVudGlsIGJh
ci5jaGlsZENvdW50KSB7CiAgICAgICAgICAgIHZhbCBidXR0b24gPSBiYXIuZ2V0Q2hpbGRBdChp
bmRleCkgYXM/IEJ1dHRvbiA/OiBjb250aW51ZQogICAgICAgICAgICBidXR0b24uaXNBY3RpdmF0
ZWQgPSBidXR0b24udGFnID09IHNlbGVjdGVkU2Vhc29uCiAgICAgICAgfQogICAgfQoKICAgIHBy
aXZhdGUgZnVuIHJlZnJlc2hFcGlzb2RlcyhyZXN0b3JlU2Vhc29uOiBCb29sZWFuKSB7CiAgICAg
ICAgaWYgKGVwaXNvZGVzLmlzRW1wdHkoKSkgewogICAgICAgICAgICBsaXN0LnZpc2liaWxpdHkg
PSBWaWV3LkdPTkUKICAgICAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLmVwaXNv
ZGVDb3VudCkudGV4dCA9ICIwIEVQSVNPREVTIgogICAgICAgICAgICBmaW5kVmlld0J5SWQ8VGV4
dFZpZXc+KFIuaWQuc2VyaWVzRW1wdHkpLmFwcGx5IHsgdGV4dCA9ICJObyBlcGlzb2RlcyB3ZXJl
IHJldHVybmVkIGZvciB0aGlzIHNlcmllcy4iOyB2aXNpYmlsaXR5ID0gVmlldy5WSVNJQkxFIH0K
ICAgICAgICAgICAgcmV0dXJuCiAgICAgICAgfQogICAgICAgIHZhbCBzZWFzb25zID0gZXBpc29k
ZXMubWFwIHsgaXQuc2Vhc29uIH0uZGlzdGluY3QoKS5zb3J0ZWQoKQogICAgICAgIGlmIChyZXN0
b3JlU2Vhc29uIHx8IHNlbGVjdGVkU2Vhc29uICFpbiBzZWFzb25zKSB7CiAgICAgICAgICAgIHNl
bGVjdGVkU2Vhc29uID0gU2VyaWVzSGlzdG9yeS5zZWxlY3RlZFNlYXNvbih0aGlzLCBjdXJyZW50
LmlkLCBzZWFzb25zLmZpcnN0KCkpCiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlYXNvbiAhaW4g
c2Vhc29ucykgc2VsZWN0ZWRTZWFzb24gPSBzZWFzb25zLmZpcnN0KCkKICAgICAgICB9CiAgICAg
ICAgdXBkYXRlU2Vhc29uQnV0dG9ucygpCiAgICAgICAgdmlzaWJsZUVwaXNvZGVzID0gZXBpc29k
ZXMuZmlsdGVyIHsgaXQuc2Vhc29uID09IHNlbGVjdGVkU2Vhc29uIH0KICAgICAgICB2YWwgc2F2
ZWQgPSBDb250aW51ZVdhdGNoaW5nLmFsbCh0aGlzKS5maWx0ZXIgeyBpdC5raW5kID09ICJlcGlz
b2RlIiB9LmFzc29jaWF0ZUJ5IHsgaXQudXJsIH0KICAgICAgICBsaXN0LmFkYXB0ZXIgPSBFcGlz
b2RlTGlzdEFkYXB0ZXIodGhpcywgdmlzaWJsZUVwaXNvZGVzLCBzYXZlZCkKICAgICAgICBsaXN0
LnZpc2liaWxpdHkgPSBWaWV3LlZJU0lCTEUKICAgICAgICBmaW5kVmlld0J5SWQ8VGV4dFZpZXc+
KFIuaWQuc2VyaWVzRW1wdHkpLnZpc2liaWxpdHkgPSBWaWV3LkdPTkUKICAgICAgICBmaW5kVmll
d0J5SWQ8VGV4dFZpZXc+KFIuaWQuZXBpc29kZUNvdW50KS50ZXh0ID0gIlNFQVNPTiAkc2VsZWN0
ZWRTZWFzb24gIOKAoiAgJHt2aXNpYmxlRXBpc29kZXMuc2l6ZX0gRVBJU09ERVMiCiAgICAgICAg
dXBkYXRlQ29udGludWVQYW5lbCgpCiAgICAgICAgZm9jdXNSZW1lbWJlcmVkRXBpc29kZSgpCiAg
ICB9CgogICAgcHJpdmF0ZSBmdW4gdXBkYXRlQ29udGludWVQYW5lbCgpIHsKICAgICAgICB2YWwg
cGFuZWwgPSBmaW5kVmlld0J5SWQ8Vmlldz4oUi5pZC5zZXJpZXNDb250aW51ZVBhbmVsKQogICAg
ICAgIHZhbCBsYXRlc3QgPSBDb250aW51ZVdhdGNoaW5nLmFsbCh0aGlzKS5maXJzdE9yTnVsbCB7
IHNhdmVkSXRlbSAtPgogICAgICAgICAgICBzYXZlZEl0ZW0ua2luZCA9PSAiZXBpc29kZSIgJiYg
ZXBpc29kZXMuYW55IHsgZXBpc29kZSAtPiBlcGlzb2RlLnBsYXlVcmwgPT0gc2F2ZWRJdGVtLnVy
bCB9CiAgICAgICAgfQogICAgICAgIHZhbCBsYXN0SWQgPSBTZXJpZXNIaXN0b3J5Lmxhc3RFcGlz
b2RlSWQodGhpcywgY3VycmVudC5pZCkKICAgICAgICB2YWwgbGFzdEluZGV4ID0gZXBpc29kZXMu
aW5kZXhPZkZpcnN0IHsgaXQuaWQgPT0gbGFzdElkIH0KICAgICAgICB2YWwgbmV4dCA9IGVwaXNv
ZGVzLmdldE9yTnVsbChsYXN0SW5kZXggKyAxKQogICAgICAgIHZhbCBjb250aW51ZUJ1dHRvbiA9
IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzQ29udGludWUpCiAgICAgICAgdmFsIG5l
eHRCdXR0b24gPSBmaW5kVmlld0J5SWQ8QnV0dG9uPihSLmlkLnNlcmllc05leHQpCgogICAgICAg
IGNvbnRpbnVlQnV0dG9uLnZpc2liaWxpdHkgPSBpZiAobGF0ZXN0ID09IG51bGwpIFZpZXcuR09O
RSBlbHNlIFZpZXcuVklTSUJMRQogICAgICAgIGlmIChsYXRlc3QgIT0gbnVsbCkgewogICAgICAg
ICAgICB2YWwgZXBpc29kZSA9IGVwaXNvZGVzLmZpcnN0IHsgaXQucGxheVVybCA9PSBsYXRlc3Qu
dXJsIH0KICAgICAgICAgICAgY29udGludWVCdXR0b24udGV4dCA9ICLilrYgIFJFU1VNRSBTJHtl
cGlzb2RlLnNlYXNvbn0gRSR7ZXBpc29kZS5lcGlzb2RlfSIKICAgICAgICAgICAgY29udGludWVC
dXR0b24uc2V0T25DbGlja0xpc3RlbmVyIHsgcGxheUVwaXNvZGUoZXBpc29kZSwgbGF0ZXN0LnBv
c2l0aW9uTXMsIHJlc3RhcnQgPSBmYWxzZSkgfQogICAgICAgICAgICBmaW5kVmlld0J5SWQ8VGV4
dFZpZXc+KFIuaWQuc2VyaWVzQ29udGludWVMYWJlbCkudGV4dCA9ICJDb250aW51ZSAke2VwaXNv
ZGUudGl0bGV9IGZyb20gJHtmb3JtYXRUaW1lKGxhdGVzdC5wb3NpdGlvbk1zKX0iCiAgICAgICAg
fSBlbHNlIHsKICAgICAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLnNlcmllc0Nv
bnRpbnVlTGFiZWwpLnRleHQgPSAiQ2hvb3NlIGFuIGVwaXNvZGUgdG8gYmVnaW4gd2F0Y2hpbmci
CiAgICAgICAgfQoKICAgICAgICBuZXh0QnV0dG9uLnZpc2liaWxpdHkgPSBpZiAobmV4dCA9PSBu
dWxsKSBWaWV3LkdPTkUgZWxzZSBWaWV3LlZJU0lCTEUKICAgICAgICBpZiAobmV4dCAhPSBudWxs
KSB7CiAgICAgICAgICAgIG5leHRCdXR0b24udGV4dCA9ICJORVhUICDigKIgIFMke25leHQuc2Vh
c29ufSBFJHtuZXh0LmVwaXNvZGV9IgogICAgICAgICAgICBuZXh0QnV0dG9uLnNldE9uQ2xpY2tM
aXN0ZW5lciB7IHBsYXlFcGlzb2RlKG5leHQsIDBMLCByZXN0YXJ0ID0gdHJ1ZSkgfQogICAgICAg
IH0KICAgICAgICBwYW5lbC52aXNpYmlsaXR5ID0gaWYgKGxhdGVzdCAhPSBudWxsIHx8IG5leHQg
IT0gbnVsbCkgVmlldy5WSVNJQkxFIGVsc2UgVmlldy5HT05FCiAgICB9CgogICAgcHJpdmF0ZSBm
dW4gZm9jdXNSZW1lbWJlcmVkRXBpc29kZSgpIHsKICAgICAgICB2YWwgbGFzdElkID0gU2VyaWVz
SGlzdG9yeS5sYXN0RXBpc29kZUlkKHRoaXMsIGN1cnJlbnQuaWQpCiAgICAgICAgdmFsIGluZGV4
ID0gdmlzaWJsZUVwaXNvZGVzLmluZGV4T2ZGaXJzdCB7IGl0LmlkID09IGxhc3RJZCB9LnRha2VJ
ZiB7IGl0ID49IDAgfSA/OiAwCiAgICAgICAgbGlzdC5wb3N0IHsgbGlzdC5zZXRTZWxlY3Rpb24o
aW5kZXgpOyBsaXN0LnJlcXVlc3RGb2N1cygpIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBjaG9v
c2VFcGlzb2RlKHBvc2l0aW9uOiBJbnQpIHsKICAgICAgICBpZiAocG9zaXRpb24gIWluIHZpc2li
bGVFcGlzb2Rlcy5pbmRpY2VzKSByZXR1cm4KICAgICAgICB2YWwgZXBpc29kZSA9IHZpc2libGVF
cGlzb2Rlc1twb3NpdGlvbl0KICAgICAgICB2YWwgc2F2ZWQgPSBDb250aW51ZVdhdGNoaW5nLmZp
bmQodGhpcywgZXBpc29kZS5wbGF5VXJsLCAiZXBpc29kZSIpCiAgICAgICAgaWYgKHNhdmVkID09
IG51bGwgfHwgc2F2ZWQucG9zaXRpb25NcyA8IDE1XzAwMEwpIHsKICAgICAgICAgICAgcGxheUVw
aXNvZGUoZXBpc29kZSwgMEwsIHJlc3RhcnQgPSB0cnVlKQogICAgICAgICAgICByZXR1cm4KICAg
ICAgICB9CiAgICAgICAgQWxlcnREaWFsb2cuQnVpbGRlcih0aGlzKQogICAgICAgICAgICAuc2V0
VGl0bGUoZXBpc29kZS50aXRsZSkKICAgICAgICAgICAgLnNldEl0ZW1zKGFycmF5T2YoIlJlc3Vt
ZSBmcm9tICR7Zm9ybWF0VGltZShzYXZlZC5wb3NpdGlvbk1zKX0iLCAiUGxheSBmcm9tIGJlZ2lu
bmluZyIpKSB7IF8sIHdoaWNoIC0+CiAgICAgICAgICAgICAgICBwbGF5RXBpc29kZShlcGlzb2Rl
LCBpZiAod2hpY2ggPT0gMCkgc2F2ZWQucG9zaXRpb25NcyBlbHNlIDBMLCByZXN0YXJ0ID0gd2hp
Y2ggPT0gMSkKICAgICAgICAgICAgfQogICAgICAgICAgICAuc2V0TmVnYXRpdmVCdXR0b24oIkNh
bmNlbCIsIG51bGwpCiAgICAgICAgICAgIC5zaG93KCkKICAgIH0KCiAgICBwcml2YXRlIGZ1biBw
bGF5RXBpc29kZShlcGlzb2RlOiBFcGlzb2RlSXRlbSwgcG9zaXRpb25NczogTG9uZywgcmVzdGFy
dDogQm9vbGVhbikgewogICAgICAgIGlmIChlcGlzb2RlLnBsYXlVcmwuaXNCbGFuaygpKSB7IFRv
YXN0Lm1ha2VUZXh0KHRoaXMsICJUaGlzIGVwaXNvZGUgaGFzIG5vIHBsYXlhYmxlIFVSTC4iLCBU
b2FzdC5MRU5HVEhfU0hPUlQpLnNob3coKTsgcmV0dXJuIH0KICAgICAgICBpZiAocmVzdGFydCkg
Q29udGludWVXYXRjaGluZy5yZW1vdmUodGhpcywgZXBpc29kZS5wbGF5VXJsKQogICAgICAgIFNl
cmllc0hpc3RvcnkubWFya09wZW5lZCh0aGlzLCBjdXJyZW50LmlkLCBlcGlzb2RlLmlkLCBlcGlz
b2RlLnNlYXNvbikKICAgICAgICBzdGFydEFjdGl2aXR5KEludGVudCh0aGlzLCBQbGF5ZXJBY3Rp
dml0eTo6Y2xhc3MuamF2YSkuYXBwbHkgewogICAgICAgICAgICBwdXRFeHRyYSgibmFtZSIsIGVw
aXNvZGUudGl0bGUpOyBwdXRFeHRyYSgidXJsIiwgZXBpc29kZS5wbGF5VXJsKTsgcHV0RXh0cmEo
ImtpbmQiLCAiZXBpc29kZSIpOyBwdXRFeHRyYSgicmVzdW1lTXMiLCBwb3NpdGlvbk1zKQogICAg
ICAgIH0pCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gdXBkYXRlV2F0Y2hsaXN0QnV0dG9uKCkgewog
ICAgICAgIGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzV2F0Y2hsaXN0KS50ZXh0ID0g
aWYgKFNlcmllc1dhdGNobGlzdC5jb250YWlucyh0aGlzLCBjdXJyZW50LmlkKSkgIuKckyAgSU4g
TVkgU0VSSUVTIiBlbHNlICIrICBNWSBTRVJJRVMiCiAgICB9CgogICAgcHJpdmF0ZSBmdW4gb3Bl
blRyYWlsZXIoKSB7CiAgICAgICAgdHJ5IHsgc3RhcnRBY3Rpdml0eShJbnRlbnQoSW50ZW50LkFD
VElPTl9WSUVXLCBVcmkucGFyc2UoY3VycmVudC50cmFpbGVyVXJsKSkpIH0KICAgICAgICBjYXRj
aCAoXzogRXhjZXB0aW9uKSB7IFRvYXN0Lm1ha2VUZXh0KHRoaXMsICJObyBhcHAgaXMgYXZhaWxh
YmxlIHRvIG9wZW4gdGhpcyB0cmFpbGVyLiIsIFRvYXN0LkxFTkdUSF9TSE9SVCkuc2hvdygpIH0K
ICAgIH0KCiAgICBwcml2YXRlIGZ1biBsb2FkUmVsYXRlZChjYXRlZ29yeUlkOiBTdHJpbmcpIHsK
ICAgICAgICBpZiAoY2F0ZWdvcnlJZC5pc0JsYW5rKCkgfHwgY2F0ZWdvcnlJZCA9PSByZWxhdGVk
Q2F0ZWdvcnkpIHJldHVybgogICAgICAgIHJlbGF0ZWRDYXRlZ29yeSA9IGNhdGVnb3J5SWQKICAg
ICAgICBleGVjdXRvci5leGVjdXRlIHsKICAgICAgICAgICAgdmFsIHJlbGF0ZWQgPSB0cnkgeyBY
dHJlYW1DbGllbnQuc2VyaWVzKGNyZWRlbnRpYWxzLCBjYXRlZ29yeUlkKS5maWx0ZXJOb3QgeyBp
dC5pZCA9PSBjdXJyZW50LmlkIH0udGFrZSgxMCkgfSBjYXRjaCAoXzogRXhjZXB0aW9uKSB7IGVt
cHR5TGlzdCgpIH0KICAgICAgICAgICAgcnVuT25VaVRocmVhZCB7IHJlbmRlclJlbGF0ZWQocmVs
YXRlZCkgfQogICAgICAgIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biByZW5kZXJSZWxhdGVkKGl0
ZW1zOiBMaXN0PExpYnJhcnlJdGVtPikgewogICAgICAgIHZhbCBzZWN0aW9uID0gZmluZFZpZXdC
eUlkPFZpZXc+KFIuaWQuc2VyaWVzUmVsYXRlZFNlY3Rpb24pCiAgICAgICAgdmFsIHJvdyA9IGZp
bmRWaWV3QnlJZDxMaW5lYXJMYXlvdXQ+KFIuaWQuc2VyaWVzUmVsYXRlZFJvdykKICAgICAgICBy
b3cucmVtb3ZlQWxsVmlld3MoKTsgc2VjdGlvbi52aXNpYmlsaXR5ID0gaWYgKGl0ZW1zLmlzRW1w
dHkoKSkgVmlldy5HT05FIGVsc2UgVmlldy5WSVNJQkxFCiAgICAgICAgaXRlbXMuZm9yRWFjaCB7
IGl0ZW0gLT4KICAgICAgICAgICAgdmFsIGNhcmQgPSBMaW5lYXJMYXlvdXQodGhpcykuYXBwbHkg
ewogICAgICAgICAgICAgICAgb3JpZW50YXRpb24gPSBMaW5lYXJMYXlvdXQuVkVSVElDQUw7IGlz
Rm9jdXNhYmxlID0gdHJ1ZTsgaXNDbGlja2FibGUgPSB0cnVlCiAgICAgICAgICAgICAgICBiYWNr
Z3JvdW5kID0gZ2V0RHJhd2FibGUoUi5kcmF3YWJsZS5iZ19yb3cpOyBzZXRQYWRkaW5nKDcuZHAs
IDcuZHAsIDcuZHAsIDguZHApCiAgICAgICAgICAgICAgICBsYXlvdXRQYXJhbXMgPSBMaW5lYXJM
YXlvdXQuTGF5b3V0UGFyYW1zKDE0OC5kcCwgMjMwLmRwKS5hcHBseSB7IG1hcmdpbkVuZCA9IDEw
LmRwIH0KICAgICAgICAgICAgICAgIHNldE9uQ2xpY2tMaXN0ZW5lciB7IHN0YXJ0QWN0aXZpdHko
SW50ZW50KHRoaXNAU2VyaWVzRGV0YWlsc0FjdGl2aXR5LCBTZXJpZXNEZXRhaWxzQWN0aXZpdHk6
OmNsYXNzLmphdmEpLmFwcGx5IHsKICAgICAgICAgICAgICAgICAgICBwdXRFeHRyYSgic2VyaWVz
SWQiLCBpdGVtLmlkKTsgcHV0RXh0cmEoInNlcmllc05hbWUiLCBpdGVtLm5hbWUpOyBwdXRFeHRy
YSgic2VyaWVzSW1hZ2VVcmwiLCBpdGVtLmltYWdlVXJsKQogICAgICAgICAgICAgICAgICAgIHB1
dEV4dHJhKCJzZXJpZXNDYXRlZ29yeUlkIiwgaXRlbS5jYXRlZ29yeUlkKTsgcHV0RXh0cmEoInNl
cmllc1llYXIiLCBpdGVtLnllYXIpOyBwdXRFeHRyYSgic2VyaWVzUmF0aW5nIiwgaXRlbS5yYXRp
bmcpCiAgICAgICAgICAgICAgICB9KSB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdmFsIHBv
c3RlciA9IEltYWdlVmlldyh0aGlzKS5hcHBseSB7IHNjYWxlVHlwZSA9IEltYWdlVmlldy5TY2Fs
ZVR5cGUuQ0VOVEVSX0NST1A7IGxheW91dFBhcmFtcyA9IExpbmVhckxheW91dC5MYXlvdXRQYXJh
bXMoTGluZWFyTGF5b3V0LkxheW91dFBhcmFtcy5NQVRDSF9QQVJFTlQsIDE3NC5kcCkgfQogICAg
ICAgICAgICB2YWwgdGl0bGUgPSBUZXh0Vmlldyh0aGlzKS5hcHBseSB7IHRleHQgPSBpdGVtLm5h
bWU7IHNldFRleHRDb2xvcihnZXRDb2xvcihSLmNvbG9yLmtzX3doaXRlKSk7IHRleHRTaXplID0g
MTJmOyBtYXhMaW5lcyA9IDI7IHNldFBhZGRpbmcoMy5kcCwgNi5kcCwgMy5kcCwgMCkgfQogICAg
ICAgICAgICBjYXJkLmFkZFZpZXcocG9zdGVyKTsgY2FyZC5hZGRWaWV3KHRpdGxlKQogICAgICAg
ICAgICBSZW1vdGVJbWFnZUxvYWRlci5sb2FkKGl0ZW0uaW1hZ2VVcmwsIHBvc3RlciwgUi5kcmF3
YWJsZS5vZmZpY2lhbF9zZXJpZXMsIGNyb3AgPSBpdGVtLmltYWdlVXJsLmlzTm90QmxhbmsoKSkK
ICAgICAgICAgICAgcm93LmFkZFZpZXcoY2FyZCkKICAgICAgICB9CiAgICB9CgogICAgcHJpdmF0
ZSBmdW4gc2V0RmFjdChpZDogSW50LCBsYWJlbDogU3RyaW5nLCB2YWx1ZTogU3RyaW5nKSB7CiAg
ICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihpZCkuYXBwbHkgeyB0ZXh0ID0gIiRsYWJlbCAg
4oCiICAkdmFsdWUiOyB2aXNpYmlsaXR5ID0gaWYgKHZhbHVlLmlzQmxhbmsoKSkgVmlldy5HT05F
IGVsc2UgVmlldy5WSVNJQkxFIH0KICAgIH0KCiAgICBwcml2YXRlIGZ1biBzaG93RXJyb3IobWVz
c2FnZTogU3RyaW5nKSB7CiAgICAgICAgZmluZFZpZXdCeUlkPFByb2dyZXNzQmFyPihSLmlkLnNl
cmllc1Byb2dyZXNzKS52aXNpYmlsaXR5ID0gVmlldy5HT05FCiAgICAgICAgbGlzdC52aXNpYmls
aXR5ID0gVmlldy5HT05FCiAgICAgICAgZmluZFZpZXdCeUlkPFRleHRWaWV3PihSLmlkLmVwaXNv
ZGVDb3VudCkudGV4dCA9ICJFUElTT0RFUyBVTkFWQUlMQUJMRSIKICAgICAgICBmaW5kVmlld0J5
SWQ8VGV4dFZpZXc+KFIuaWQuc2VyaWVzRW1wdHkpLmFwcGx5IHsgdGV4dCA9IG1lc3NhZ2U7IHZp
c2liaWxpdHkgPSBWaWV3LlZJU0lCTEUgfQogICAgfQoKICAgIHByaXZhdGUgZnVuIGZvcm1hdFRp
bWUobXM6IExvbmcpOiBTdHJpbmcgewogICAgICAgIHZhbCBtaW51dGVzID0gbXMuY29lcmNlQXRM
ZWFzdCgwTCkgLyA2MF8wMDBMCiAgICAgICAgcmV0dXJuIGlmIChtaW51dGVzID49IDYwKSAiJHtt
aW51dGVzIC8gNjB9aCAke21pbnV0ZXMgJSA2MH1tIiBlbHNlICIke21pbnV0ZXN9bSIKICAgIH0K
CiAgICBwcml2YXRlIHZhbCBJbnQuZHA6IEludCBnZXQoKSA9ICh0aGlzICogcmVzb3VyY2VzLmRp
c3BsYXlNZXRyaWNzLmRlbnNpdHkpLnJvdW5kVG9JbnQoKQoKICAgIG92ZXJyaWRlIGZ1biBvbkRl
c3Ryb3koKSB7IGV4ZWN1dG9yLnNodXRkb3duTm93KCk7IHN1cGVyLm9uRGVzdHJveSgpIH0KfQo=
:::END SERIESDETAILS

:::BEGIN SERIESHISTORY
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKCm9iamVjdCBTZXJpZXNIaXN0b3J5IHsKICAgIHByaXZhdGUgY29uc3QgdmFsIFBS
RUZTID0gImtzX3Nlcmllc19oaXN0b3J5IgoKICAgIGZ1biBzZWxlY3RlZFNlYXNvbihjb250ZXh0
OiBDb250ZXh0LCBzZXJpZXNJZDogSW50LCBmYWxsYmFjazogSW50KTogSW50ID0KICAgICAgICBj
b250ZXh0LmdldFNoYXJlZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSku
Z2V0SW50KCJzZWFzb25fJHNlcmllc0lkIiwgZmFsbGJhY2spCgogICAgZnVuIHNhdmVTZWxlY3Rl
ZFNlYXNvbihjb250ZXh0OiBDb250ZXh0LCBzZXJpZXNJZDogSW50LCBzZWFzb246IEludCkgewog
ICAgICAgIGNvbnRleHQuZ2V0U2hhcmVkUHJlZmVyZW5jZXMoUFJFRlMsIENvbnRleHQuTU9ERV9Q
UklWQVRFKS5lZGl0KCkucHV0SW50KCJzZWFzb25fJHNlcmllc0lkIiwgc2Vhc29uKS5hcHBseSgp
CiAgICB9CgogICAgZnVuIGxhc3RFcGlzb2RlSWQoY29udGV4dDogQ29udGV4dCwgc2VyaWVzSWQ6
IEludCk6IEludCA9CiAgICAgICAgY29udGV4dC5nZXRTaGFyZWRQcmVmZXJlbmNlcyhQUkVGUywg
Q29udGV4dC5NT0RFX1BSSVZBVEUpLmdldEludCgiZXBpc29kZV8kc2VyaWVzSWQiLCAtMSkKCiAg
ICBmdW4gbWFya09wZW5lZChjb250ZXh0OiBDb250ZXh0LCBzZXJpZXNJZDogSW50LCBlcGlzb2Rl
SWQ6IEludCwgc2Vhc29uOiBJbnQpIHsKICAgICAgICBjb250ZXh0LmdldFNoYXJlZFByZWZlcmVu
Y2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSkuZWRpdCgpCiAgICAgICAgICAgIC5wdXRJ
bnQoImVwaXNvZGVfJHNlcmllc0lkIiwgZXBpc29kZUlkKQogICAgICAgICAgICAucHV0SW50KCJz
ZWFzb25fJHNlcmllc0lkIiwgc2Vhc29uKQogICAgICAgICAgICAuYXBwbHkoKQogICAgfQp9Cg==
:::END SERIESHISTORY

:::BEGIN SERIESLAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPEZyYW1lTGF5b3V0IHhtbG5z
OmFuZHJvaWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJt
YXRjaF9wYXJlbnQiIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hi
b2FyZF9iZyI+CiAgICA8SW1hZ2VWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQmFja2Ryb3Ai
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdo
dD0iMjgwZHAiIGFuZHJvaWQ6c2NhbGVUeXBlPSJjZW50ZXJDcm9wIiBhbmRyb2lkOmFscGhhPSIw
LjE2IiBhbmRyb2lkOmNvbnRlbnREZXNjcmlwdGlvbj0iU2VyaWVzIGJhY2tkcm9wIi8+CiAgICA8
TGluZWFyTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNh
bCI+CiAgICAgICAgPExpbmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFy
ZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjY4ZHAiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVy
X3ZlcnRpY2FsIiBhbmRyb2lkOnBhZGRpbmdTdGFydD0iMTBkcCIgYW5kcm9pZDpwYWRkaW5nRW5k
PSIxMGRwIiBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9oZWFkZXIi
PgogICAgICAgICAgICA8QnV0dG9uIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQmFjayIgYW5kcm9p
ZDpsYXlvdXRfd2lkdGg9IjcwZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDJkcCIgYW5kcm9p
ZDp0ZXh0PSJCQUNLIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIiBhbmRyb2lk
OnRleHRTdHlsZT0iYm9sZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIgYW5kcm9pZDpiYWNrZ3Jv
dW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CiAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRl
bnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9
IjEyZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIj4KICAgICAgICAgICAgICAgIDxU
ZXh0VmlldyBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50IiBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDp0ZXh0PSJLUklTVEFMIFNUUkVBTVMiIGFu
ZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIiBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIg
YW5kcm9pZDp0ZXh0U2l6ZT0iOXNwIiBhbmRyb2lkOmxldHRlclNwYWNpbmc9IjAuMTQiLz4KICAg
ICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50
IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDp0ZXh0PSJTRVJJ
RVMgREVUQUlMUyIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIgYW5kcm9pZDp0
ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjE4c3AiLz4KICAgICAgICAgICAgPC9M
aW5lYXJMYXlvdXQ+CiAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CiAgICAgICAgPExpbmVhckxheW91
dCBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWln
aHQ9IjIxMGRwIiBhbmRyb2lkOmxheW91dF9tYXJnaW49IjEwZHAiIGFuZHJvaWQ6b3JpZW50YXRp
b249Imhvcml6b250YWwiIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX21vdmllX2Rl
dGFpbHNfcGFuZWwiPgogICAgICAgICAgICA8SW1hZ2VWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2Vy
aWVzSGVhZGVySWNvbiIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjEyMGRwIiBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IjE4NmRwIiBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVyQ3JvcCIgYW5kcm9pZDpi
YWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfcG9zdGVyX2ZyYW1lIiBhbmRyb2lkOmNvbnRlbnREZXNj
cmlwdGlvbj0iU2VyaWVzIGFydHdvcmsiLz4KICAgICAgICAgICAgPFNjcm9sbFZpZXcgYW5kcm9p
ZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQi
IGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjEy
ZHAiPgogICAgICAgICAgICAgICAgPExpbmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0i
bWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9p
ZDpvcmllbnRhdGlvbj0idmVydGljYWwiPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBh
bmRyb2lkOmlkPSJAK2lkL3Nlcmllc1RpdGxlIiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hf
cGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5kcm9pZDptYXhM
aW5lcz0iMyIgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDp0ZXh0PSJTZXJpZXMiIGFu
ZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xk
IiBhbmRyb2lkOnRleHRTaXplPSIyM3NwIi8+CiAgICAgICAgICAgICAgICAgICAgPFRleHRWaWV3
IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzTWV0YSIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6bGF5
b3V0X21hcmdpblRvcD0iNmRwIiBhbmRyb2lkOnRleHQ9IlNFQVNPTlMgJmFtcDsgRVBJU09ERVMi
IGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiIGFuZHJvaWQ6dGV4dFN0eWxlPSJi
b2xkIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIi8+CiAgICAgICAgICAgICAgICAgICAgPFRleHRW
aWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzRGVzY3JpcHRpb24iIGFuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IiBh
bmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjlkcCIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9r
c193aGl0ZSIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTJzcCIgYW5kcm9pZDpsaW5lU3BhY2luZ0V4dHJh
PSIyZHAiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9z
ZXJpZXNHZW5yZSIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAgICAgICAgICAgICAgICAg
ICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDYXN0IiBzdHlsZT0iQHN0eWxlL01v
dmllRmFjdCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lk
L3Nlcmllc0RpcmVjdG9yIiBzdHlsZT0iQHN0eWxlL01vdmllRmFjdCIvPgogICAgICAgICAgICAg
ICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc1JlbGVhc2VkIiBzdHlsZT0i
QHN0eWxlL01vdmllRmFjdCIvPgogICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lk
OmlkPSJAK2lkL3Nlcmllc0xhc3RBaXIiIHN0eWxlPSJAc3R5bGUvTW92aWVGYWN0Ii8+CiAgICAg
ICAgICAgICAgICA8L0xpbmVhckxheW91dD4KICAgICAgICAgICAgPC9TY3JvbGxWaWV3PgogICAg
ICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRf
d2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0OGRwIiBhbmRyb2lk
OmxheW91dF9tYXJnaW5TdGFydD0iMTBkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luRW5kPSIxMGRw
IiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIj4KICAgICAgICAgICAgPEJ1dHRvbiBh
bmRyb2lkOmlkPSJAK2lkL3Nlcmllc1RyYWlsZXIiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIwZHAi
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF93ZWln
aHQ9IjEiIGFuZHJvaWQ6bGF5b3V0X21hcmdpbkVuZD0iNGRwIiBhbmRyb2lkOnRleHQ9IuKWtyBU
UkFJTEVSIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIiBhbmRyb2lkOnRleHRT
dHlsZT0iYm9sZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJA
ZHJhd2FibGUvYmdfYnV0dG9uIiBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiLz4KICAgICAgICAg
ICAgPEJ1dHRvbiBhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc1dhdGNobGlzdCIgYW5kcm9pZDpsYXlv
dXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiIGFuZHJv
aWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjRkcCIgYW5k
cm9pZDp0ZXh0PSIrIE1ZIFNFUklFUyIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0
ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiIGFuZHJv
aWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIvPgogICAgICAgIDwvTGluZWFyTGF5
b3V0PgogICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51
ZVBhbmVsIiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9Ijc2ZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpbj0iMTBkcCIgYW5kcm9pZDpvcmll
bnRhdGlvbj0idmVydGljYWwiIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX21vdmll
X2RldGFpbHNfcGFuZWwiIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29uZSI+CiAgICAgICAgICAgIDxU
ZXh0VmlldyBhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlTGFiZWwiIGFuZHJvaWQ6bGF5
b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250
ZW50IiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkIiBhbmRyb2lkOnRleHRTaXpl
PSIxMHNwIi8+CiAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0NmRwIiBhbmRyb2lkOmxheW91
dF9tYXJnaW5Ub3A9IjVkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCI+CiAgICAg
ICAgICAgICAgICA8QnV0dG9uIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ29udGludWUiIGFuZHJv
aWQ6bGF5b3V0X3dpZHRoPSIwZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50
IiBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiIGFuZHJvaWQ6bGF5b3V0X21hcmdpbkVuZD0iNGRw
IiBhbmRyb2lkOnRleHQ9IlJFU1VNRSIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0
ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiIGFuZHJv
aWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIvPgogICAgICAgICAgICAgICAgPEJ1
dHRvbiBhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc05leHQiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIw
ZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF93
ZWlnaHQ9IjEiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI0ZHAiIGFuZHJvaWQ6dGV4dD0i
TkVYVCBFUElTT0RFIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIiBhbmRyb2lk
OnRleHRTdHlsZT0iYm9sZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIgYW5kcm9pZDpiYWNrZ3Jv
dW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CiAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0Pgog
ICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgIDxIb3Jpem9udGFsU2Nyb2xsVmlldyBhbmRy
b2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU2
ZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxMGRwIiBhbmRyb2lkOmxheW91dF9tYXJn
aW5FbmQ9IjEwZHAiIGFuZHJvaWQ6ZmlsbFZpZXdwb3J0PSJmYWxzZSIgYW5kcm9pZDpiYWNrZ3Jv
dW5kPSJAZHJhd2FibGUvYmdfb2ZmaWNpYWxfcGFuZWwiPgogICAgICAgICAgICA8TGluZWFyTGF5
b3V0IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzU2Vhc29uQmFyIiBhbmRyb2lkOmxheW91dF93aWR0
aD0id3JhcF9jb250ZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIgYW5k
cm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVy
dGljYWwiIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0PSI2ZHAiIGFuZHJvaWQ6cGFkZGluZ0VuZD0iNmRw
Ii8+CiAgICAgICAgPC9Ib3Jpem9udGFsU2Nyb2xsVmlldz4KICAgICAgICA8VGV4dFZpZXcgYW5k
cm9pZDppZD0iQCtpZC9lcGlzb2RlQ291bnQiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMzZkcCIgYW5kcm9pZDpncmF2aXR5PSJjZW50
ZXJfdmVydGljYWwiIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0PSIxMmRwIiBhbmRyb2lkOnRleHQ9Ikxv
YWRpbmcgZXBpc29kZXPigKYiIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiIGFu
ZHJvaWQ6dGV4dFN0eWxlPSJib2xkIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIi8+CiAgICAgICAg
PFByb2dyZXNzQmFyIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzUHJvZ3Jlc3MiIGFuZHJvaWQ6bGF5
b3V0X3dpZHRoPSI0MmRwIiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQyZHAiIGFuZHJvaWQ6bGF5
b3V0X2dyYXZpdHk9ImNlbnRlcl9ob3Jpem9udGFsIi8+CiAgICAgICAgPFRleHRWaWV3IGFuZHJv
aWQ6aWQ9IkAraWQvc2VyaWVzRW1wdHkiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJl
bnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IiBhbmRyb2lkOnBhZGRpbmc9
IjIwZHAiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9y
L2tzX211dGVkIiBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiLz4KICAgICAgICA8TGlzdFZpZXcg
YW5kcm9pZDppZD0iQCtpZC9lcGlzb2RlTGlzdCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSIwZHAiIGFuZHJvaWQ6bGF5b3V0X3dlaWdo
dD0iMSIgYW5kcm9pZDpkaXZpZGVyPSJAYW5kcm9pZDpjb2xvci90cmFuc3BhcmVudCIgYW5kcm9p
ZDpkaXZpZGVySGVpZ2h0PSI5ZHAiIGFuZHJvaWQ6cGFkZGluZz0iMTBkcCIgYW5kcm9pZDpjbGlw
VG9QYWRkaW5nPSJmYWxzZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAYW5kcm9pZDpjb2xvci90cmFu
c3BhcmVudCIvPgogICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNS
ZWxhdGVkU2VjdGlvbiIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9p
ZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0
PSIxMGRwIiBhbmRyb2lkOmxheW91dF9tYXJnaW5FbmQ9IjEwZHAiIGFuZHJvaWQ6b3JpZW50YXRp
b249InZlcnRpY2FsIiBhbmRyb2lkOnZpc2liaWxpdHk9ImdvbmUiPgogICAgICAgICAgICA8VGV4
dFZpZXcgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6dGV4dD0iTU9SRSBMSUtFIFRISVMiIGFuZHJv
aWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfcmVkIiBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIgYW5k
cm9pZDp0ZXh0U2l6ZT0iMTBzcCIvPgogICAgICAgICAgICA8SG9yaXpvbnRhbFNjcm9sbFZpZXcg
YW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0
PSIyNDJkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI2ZHAiIGFuZHJvaWQ6ZmlsbFZpZXdw
b3J0PSJmYWxzZSI+CiAgICAgICAgICAgICAgICA8TGluZWFyTGF5b3V0IGFuZHJvaWQ6aWQ9IkAr
aWQvc2VyaWVzUmVsYXRlZFJvdyIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6b3JpZW50YXRpb249
Imhvcml6b250YWwiLz4KICAgICAgICAgICAgPC9Ib3Jpem9udGFsU2Nyb2xsVmlldz4KICAgICAg
ICA8L0xpbmVhckxheW91dD4KICAgIDwvTGluZWFyTGF5b3V0Pgo8L0ZyYW1lTGF5b3V0Pgo=
:::END SERIESLAYOUT

:::BEGIN SERIESLAYOUTLAND
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPEZyYW1lTGF5b3V0IHhtbG5z
OmFuZHJvaWQ9Imh0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL2Fway9yZXMvYW5kcm9pZCIgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJt
YXRjaF9wYXJlbnQiIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hi
b2FyZF9iZyI+CiAgICA8SW1hZ2VWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQmFja2Ryb3Ai
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdo
dD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVyQ3JvcCIgYW5kcm9pZDph
bHBoYT0iMC4xMyIgYW5kcm9pZDpjb250ZW50RGVzY3JpcHRpb249IlNlcmllcyBiYWNrZHJvcCIv
PgogICAgPExpbmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBh
bmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpvcmllbnRhdGlvbj0i
dmVydGljYWwiPgogICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1h
dGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI2OGRwIiBhbmRyb2lkOmdyYXZpdHk9
ImNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjE0ZHAiIGFuZHJvaWQ6cGFk
ZGluZ0VuZD0iMTRkcCIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfb2ZmaWNpYWxf
aGVhZGVyIj4KICAgICAgICAgICAgPEJ1dHRvbiBhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0JhY2si
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSI3NmRwIiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQyZHAi
IGFuZHJvaWQ6dGV4dD0iQkFDSyIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIg
YW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiIGFuZHJvaWQ6
YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIvPgogICAgICAgICAgICA8SW1hZ2VWaWV3
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIyMTBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1MGRw
IiBhbmRyb2lkOmxheW91dF9tYXJnaW5TdGFydD0iMTJkcCIgYW5kcm9pZDpzcmM9IkBkcmF3YWJs
ZS9rc19iYW5uZXIiIGFuZHJvaWQ6c2NhbGVUeXBlPSJmaXRTdGFydCIgYW5kcm9pZDpjb250ZW50
RGVzY3JpcHRpb249IktyaXN0YWwgU3RyZWFtcyIvPgogICAgICAgICAgICA8VGV4dFZpZXcgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRl
bnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9
IjE0ZHAiIGFuZHJvaWQ6dGV4dD0iU0VSSUVTIERFVEFJTFMgIOKAoiAgU0VBU09OUyAmYW1wOyBF
UElTT0RFUyIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIgYW5kcm9pZDp0ZXh0
U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjE4c3AiLz4KICAgICAgICA8L0xpbmVhckxh
eW91dD4KICAgICAgICA8TGluZWFyTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMGRwIiBhbmRyb2lkOmxheW91dF93ZWlnaHQ9
IjEiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiIGFuZHJvaWQ6cGFkZGluZz0iMTJk
cCI+CiAgICAgICAgICAgIDxTY3JvbGxWaWV3IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIzMjBkcCIg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6ZmlsbFZpZXdwb3J0
PSJ0cnVlIiBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19tb3ZpZV9kZXRhaWxzX3Bh
bmVsIj4KICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJv
aWQ6b3JpZW50YXRpb249InZlcnRpY2FsIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlcl9ob3Jpem9u
dGFsIj4KICAgICAgICAgICAgICAgICAgICA8SW1hZ2VWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2Vy
aWVzSGVhZGVySWNvbiIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjIxMGRwIiBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9IjMwMGRwIiBhbmRyb2lkOnNjYWxlVHlwZT0iY2VudGVyQ3JvcCIgYW5kcm9pZDpi
YWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfcG9zdGVyX2ZyYW1lIiBhbmRyb2lkOmNvbnRlbnREZXNj
cmlwdGlvbj0iU2VyaWVzIGFydHdvcmsiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcg
YW5kcm9pZDppZD0iQCtpZC9zZXJpZXNUaXRsZSIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNo
X3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6bGF5
b3V0X21hcmdpblRvcD0iMTJkcCIgYW5kcm9pZDptYXhMaW5lcz0iMyIgYW5kcm9pZDp0ZXh0PSJT
ZXJpZXMiIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiIGFuZHJvaWQ6dGV4dFN0
eWxlPSJib2xkIiBhbmRyb2lkOnRleHRTaXplPSIyNXNwIi8+CiAgICAgICAgICAgICAgICAgICAg
PFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzTWV0YSIgYW5kcm9pZDpsYXlvdXRfd2lk
dGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFu
ZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iNmRwIiBhbmRyb2lkOnRleHQ9IlNFQVNPTlMgJmFtcDsg
RVBJU09ERVMiIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiIGFuZHJvaWQ6dGV4
dFN0eWxlPSJib2xkIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIi8+CiAgICAgICAgICAgICAgICAg
ICAgPFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzRGVzY3JpcHRpb24iIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9j
b250ZW50IiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjEwZHAiIGFuZHJvaWQ6dGV4dENvbG9y
PSJAY29sb3Iva3Nfd2hpdGUiIGFuZHJvaWQ6dGV4dFNpemU9IjEzc3AiIGFuZHJvaWQ6bGluZVNw
YWNpbmdFeHRyYT0iM2RwIi8+CiAgICAgICAgICAgICAgICAgICAgPFRleHRWaWV3IGFuZHJvaWQ6
aWQ9IkAraWQvc2VyaWVzR2VucmUiIHN0eWxlPSJAc3R5bGUvTW92aWVGYWN0Ii8+CiAgICAgICAg
ICAgICAgICAgICAgPFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ2FzdCIgc3R5bGU9
IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9p
ZDppZD0iQCtpZC9zZXJpZXNEaXJlY3RvciIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAg
ICAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNSZWxlYXNl
ZCIgc3R5bGU9IkBzdHlsZS9Nb3ZpZUZhY3QiLz4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZp
ZXcgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNMYXN0QWlyIiBzdHlsZT0iQHN0eWxlL01vdmllRmFj
dCIvPgogICAgICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lk
dGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0OGRwIiBhbmRyb2lkOmxh
eW91dF9tYXJnaW5Ub3A9IjEwZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiPgog
ICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzVHJh
aWxlciIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJt
YXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFy
Z2luRW5kPSI0ZHAiIGFuZHJvaWQ6dGV4dD0iVFJBSUxFUiIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBj
b2xvci9rc193aGl0ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9
IjlzcCIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIiBhbmRyb2lkOnZp
c2liaWxpdHk9ImdvbmUiLz4KICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBhbmRyb2lk
OmlkPSJAK2lkL3Nlcmllc1dhdGNobGlzdCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5k
cm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0i
MSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjRkcCIgYW5kcm9pZDp0ZXh0PSJNWSBTRVJJ
RVMiIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiIGFuZHJvaWQ6dGV4dFN0eWxl
PSJib2xkIiBhbmRyb2lkOnRleHRTaXplPSI5c3AiIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdh
YmxlL2JnX2J1dHRvbiIvPgogICAgICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAg
ICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNSZWxh
dGVkU2VjdGlvbiIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDps
YXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iMTRk
cCIgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiIGFuZHJvaWQ6dmlzaWJpbGl0eT0iZ29u
ZSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0VmlldyBhbmRyb2lkOmxheW91dF93aWR0
aD0id3JhcF9jb250ZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5k
cm9pZDp0ZXh0PSJNT1JFIExJS0UgVEhJUyIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19y
ZWQiIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIiBhbmRyb2lkOnRleHRTaXplPSIxMHNwIi8+CiAg
ICAgICAgICAgICAgICAgICAgICAgIDxIb3Jpem9udGFsU2Nyb2xsVmlldyBhbmRyb2lkOmxheW91
dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjI0MmRwIiBhbmRy
b2lkOmxheW91dF9tYXJnaW5Ub3A9IjZkcCIgYW5kcm9pZDpmaWxsVmlld3BvcnQ9ImZhbHNlIj4K
ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDppZD0iQCtp
ZC9zZXJpZXNSZWxhdGVkUm93IiBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50IiBh
bmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpvcmllbnRhdGlvbj0i
aG9yaXpvbnRhbCIvPgogICAgICAgICAgICAgICAgICAgICAgICA8L0hvcml6b250YWxTY3JvbGxW
aWV3PgogICAgICAgICAgICAgICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgICAgICAgICAg
PC9MaW5lYXJMYXlvdXQ+CiAgICAgICAgICAgIDwvU2Nyb2xsVmlldz4KICAgICAgICAgICAgPExp
bmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIiBhbmRyb2lkOmxheW91dF9oZWln
aHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lkOmxheW91
dF9tYXJnaW5TdGFydD0iMTJkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiIGFuZHJv
aWQ6cGFkZGluZz0iOGRwIiBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lh
bF9wYW5lbCI+CiAgICAgICAgICAgICAgICA8TGluZWFyTGF5b3V0IGFuZHJvaWQ6aWQ9IkAraWQv
c2VyaWVzQ29udGludWVQYW5lbCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI3NmRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNh
bCIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfbW92aWVfZGV0YWlsc19wYW5lbCIg
YW5kcm9pZDp2aXNpYmlsaXR5PSJnb25lIj4KICAgICAgICAgICAgICAgICAgICA8VGV4dFZpZXcg
YW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZUxhYmVsIiBhbmRyb2lkOmxheW91dF93aWR0
aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIv
PgogICAgICAgICAgICAgICAgICAgIDxMaW5lYXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0NmRwIiBhbmRyb2lkOmxheW91
dF9tYXJnaW5Ub3A9IjVkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCI+CiAgICAg
ICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51
ZSIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjBkcCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJtYXRj
aF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpsYXlvdXRfbWFyZ2lu
RW5kPSI0ZHAiIGFuZHJvaWQ6dGV4dD0iUkVTVU1FIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9y
L2tzX3doaXRlIiBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBz
cCIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIi8+CiAgICAgICAgICAg
ICAgICAgICAgICAgIDxCdXR0b24gYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNOZXh0IiBhbmRyb2lk
OmxheW91dF93aWR0aD0iMGRwIiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIg
YW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lkOmxheW91dF9tYXJnaW5TdGFydD0iNGRw
IiBhbmRyb2lkOnRleHQ9Ik5FWFQgRVBJU09ERSIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9r
c193aGl0ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3Ai
IGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX2J1dHRvbiIvPgogICAgICAgICAgICAg
ICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgICAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CiAg
ICAgICAgICAgICAgICA8SG9yaXpvbnRhbFNjcm9sbFZpZXcgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1NmRwIiBhbmRyb2lkOmxheW91
dF9tYXJnaW5Ub3A9IjZkcCIgYW5kcm9pZDpmaWxsVmlld3BvcnQ9ImZhbHNlIj4KICAgICAgICAg
ICAgICAgICAgICA8TGluZWFyTGF5b3V0IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzU2Vhc29uQmFy
IiBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9jb250ZW50IiBhbmRyb2lkOmxheW91dF9oZWln
aHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCIgYW5kcm9p
ZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiLz4KICAgICAgICAgICAgICAgIDwvSG9yaXpvbnRh
bFNjcm9sbFZpZXc+CiAgICAgICAgICAgICAgICA8VGV4dFZpZXcgYW5kcm9pZDppZD0iQCtpZC9l
cGlzb2RlQ291bnQiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iMzhkcCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiIGFu
ZHJvaWQ6dGV4dD0iTG9hZGluZyBlcGlzb2Rlc+KApiIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xv
ci9rc193aGl0ZSIgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiIGFuZHJvaWQ6dGV4dFNpemU9IjEy
c3AiLz4KICAgICAgICAgICAgICAgIDxQcm9ncmVzc0JhciBhbmRyb2lkOmlkPSJAK2lkL3Nlcmll
c1Byb2dyZXNzIiBhbmRyb2lkOmxheW91dF93aWR0aD0iNDJkcCIgYW5kcm9pZDpsYXlvdXRfaGVp
Z2h0PSI0MmRwIiBhbmRyb2lkOmxheW91dF9ncmF2aXR5PSJjZW50ZXJfaG9yaXpvbnRhbCIvPgog
ICAgICAgICAgICAgICAgPFRleHRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzRW1wdHkiIGFu
ZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0i
d3JhcF9jb250ZW50IiBhbmRyb2lkOnBhZGRpbmc9IjIwZHAiIGFuZHJvaWQ6Z3Jhdml0eT0iY2Vu
dGVyIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkIiBhbmRyb2lkOnZpc2liaWxp
dHk9ImdvbmUiLz4KICAgICAgICAgICAgICAgIDxMaXN0VmlldyBhbmRyb2lkOmlkPSJAK2lkL2Vw
aXNvZGVMaXN0IiBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxh
eW91dF9oZWlnaHQ9IjBkcCIgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lkOmRpdmlk
ZXI9IkBhbmRyb2lkOmNvbG9yL3RyYW5zcGFyZW50IiBhbmRyb2lkOmRpdmlkZXJIZWlnaHQ9Ijlk
cCIgYW5kcm9pZDpwYWRkaW5nPSI2ZHAiIGFuZHJvaWQ6Y2xpcFRvUGFkZGluZz0iZmFsc2UiIGFu
ZHJvaWQ6YmFja2dyb3VuZD0iQGFuZHJvaWQ6Y29sb3IvdHJhbnNwYXJlbnQiLz4KICAgICAgICAg
ICAgPC9MaW5lYXJMYXlvdXQ+CiAgICAgICAgPC9MaW5lYXJMYXlvdXQ+CiAgICA8L0xpbmVhckxh
eW91dD4KPC9GcmFtZUxheW91dD4K
:::END SERIESLAYOUTLAND

:::BEGIN SERIESWATCHLIST
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkNvbnRleHQKaW1wb3J0IG9yZy5qc29uLkpTT05BcnJheQppbXBvcnQgb3JnLmpzb24uSlNPTk9i
amVjdAoKZGF0YSBjbGFzcyBTZXJpZXNXYXRjaGxpc3RJdGVtKAogICAgdmFsIGlkOiBJbnQsCiAg
ICB2YWwgbmFtZTogU3RyaW5nLAogICAgdmFsIGltYWdlVXJsOiBTdHJpbmcsCiAgICB2YWwgY2F0
ZWdvcnlJZDogU3RyaW5nLAogICAgdmFsIHllYXI6IFN0cmluZywKICAgIHZhbCByYXRpbmc6IFN0
cmluZwopIHsKICAgIGZ1biBhc0xpYnJhcnlJdGVtKCkgPSBMaWJyYXJ5SXRlbShpZCwgbmFtZSwg
InNlcmllcyIsIGltYWdlVXJsID0gaW1hZ2VVcmwsIGNhdGVnb3J5SWQgPSBjYXRlZ29yeUlkLCB5
ZWFyID0geWVhciwgcmF0aW5nID0gcmF0aW5nKQp9CgpvYmplY3QgU2VyaWVzV2F0Y2hsaXN0IHsK
ICAgIHByaXZhdGUgY29uc3QgdmFsIFBSRUZTID0gImtzX3Nlcmllc193YXRjaGxpc3QiCiAgICBw
cml2YXRlIGNvbnN0IHZhbCBLRVkgPSAic2VyaWVzIgoKICAgIGZ1biBhbGwoY29udGV4dDogQ29u
dGV4dCk6IExpc3Q8U2VyaWVzV2F0Y2hsaXN0SXRlbT4gewogICAgICAgIHZhbCByYXcgPSBjb250
ZXh0LmdldFNoYXJlZFByZWZlcmVuY2VzKFBSRUZTLCBDb250ZXh0Lk1PREVfUFJJVkFURSkuZ2V0
U3RyaW5nKEtFWSwgIltdIikgPzogIltdIgogICAgICAgIHJldHVybiB0cnkgewogICAgICAgICAg
ICB2YWwgYXJyYXkgPSBKU09OQXJyYXkocmF3KQogICAgICAgICAgICBidWlsZExpc3QgewogICAg
ICAgICAgICAgICAgZm9yIChpbmRleCBpbiAwIHVudGlsIGFycmF5Lmxlbmd0aCgpKSB7CiAgICAg
ICAgICAgICAgICAgICAgdmFsIGl0ZW0gPSBhcnJheS5vcHRKU09OT2JqZWN0KGluZGV4KSA/OiBj
b250aW51ZQogICAgICAgICAgICAgICAgICAgIGFkZChTZXJpZXNXYXRjaGxpc3RJdGVtKAogICAg
ICAgICAgICAgICAgICAgICAgICBpdGVtLm9wdEludCgiaWQiKSwgaXRlbS5vcHRTdHJpbmcoIm5h
bWUiLCAiU2VyaWVzIiksIGl0ZW0ub3B0U3RyaW5nKCJpbWFnZVVybCIpLAogICAgICAgICAgICAg
ICAgICAgICAgICBpdGVtLm9wdFN0cmluZygiY2F0ZWdvcnlJZCIpLCBpdGVtLm9wdFN0cmluZygi
eWVhciIpLCBpdGVtLm9wdFN0cmluZygicmF0aW5nIikKICAgICAgICAgICAgICAgICAgICApKQog
ICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgfSBjYXRjaCAoXzogRXhjZXB0
aW9uKSB7IGVtcHR5TGlzdCgpIH0KICAgIH0KCiAgICBmdW4gY29udGFpbnMoY29udGV4dDogQ29u
dGV4dCwgaWQ6IEludCkgPSBhbGwoY29udGV4dCkuYW55IHsgaXQuaWQgPT0gaWQgfQoKICAgIGZ1
biB0b2dnbGUoY29udGV4dDogQ29udGV4dCwgc2VyaWVzOiBTZXJpZXNEZXRhaWxzKTogQm9vbGVh
biB7CiAgICAgICAgdmFsIGl0ZW1zID0gYWxsKGNvbnRleHQpLnRvTXV0YWJsZUxpc3QoKQogICAg
ICAgIHZhbCBleGlzdGluZyA9IGl0ZW1zLmluZGV4T2ZGaXJzdCB7IGl0LmlkID09IHNlcmllcy5p
ZCB9CiAgICAgICAgdmFsIGFkZGVkID0gZXhpc3RpbmcgPCAwCiAgICAgICAgaWYgKGFkZGVkKSBp
dGVtcy5hZGQoMCwgU2VyaWVzV2F0Y2hsaXN0SXRlbShzZXJpZXMuaWQsIHNlcmllcy5uYW1lLCBz
ZXJpZXMucG9zdGVyVXJsLCBzZXJpZXMuY2F0ZWdvcnlJZCwgc2VyaWVzLnllYXIsIHNlcmllcy5y
YXRpbmcpKQogICAgICAgIGVsc2UgaXRlbXMucmVtb3ZlQXQoZXhpc3RpbmcpCiAgICAgICAgd3Jp
dGUoY29udGV4dCwgaXRlbXMpCiAgICAgICAgcmV0dXJuIGFkZGVkCiAgICB9CgogICAgZnVuIHJl
bW92ZShjb250ZXh0OiBDb250ZXh0LCBpZDogSW50KSA9IHdyaXRlKGNvbnRleHQsIGFsbChjb250
ZXh0KS5maWx0ZXJOb3QgeyBpdC5pZCA9PSBpZCB9KQoKICAgIHByaXZhdGUgZnVuIHdyaXRlKGNv
bnRleHQ6IENvbnRleHQsIGl0ZW1zOiBMaXN0PFNlcmllc1dhdGNobGlzdEl0ZW0+KSB7CiAgICAg
ICAgdmFsIGFycmF5ID0gSlNPTkFycmF5KCkKICAgICAgICBpdGVtcy5mb3JFYWNoIHsgaXRlbSAt
PiBhcnJheS5wdXQoSlNPTk9iamVjdCgpLmFwcGx5IHsKICAgICAgICAgICAgcHV0KCJpZCIsIGl0
ZW0uaWQpOyBwdXQoIm5hbWUiLCBpdGVtLm5hbWUpOyBwdXQoImltYWdlVXJsIiwgaXRlbS5pbWFn
ZVVybCkKICAgICAgICAgICAgcHV0KCJjYXRlZ29yeUlkIiwgaXRlbS5jYXRlZ29yeUlkKTsgcHV0
KCJ5ZWFyIiwgaXRlbS55ZWFyKTsgcHV0KCJyYXRpbmciLCBpdGVtLnJhdGluZykKICAgICAgICB9
KSB9CiAgICAgICAgY29udGV4dC5nZXRTaGFyZWRQcmVmZXJlbmNlcyhQUkVGUywgQ29udGV4dC5N
T0RFX1BSSVZBVEUpLmVkaXQoKS5wdXRTdHJpbmcoS0VZLCBhcnJheS50b1N0cmluZygpKS5hcHBs
eSgpCiAgICB9Cn0K
:::END SERIESWATCHLIST

:::BEGIN SERIESWATCHLISTACTIVITY
cGFja2FnZSBjb20ua3Jpc3RhbHN0cmVhbXMucGxheWVyCgppbXBvcnQgYW5kcm9pZC5jb250ZW50
LkludGVudAppbXBvcnQgYW5kcm9pZC5vcy5CdW5kbGUKaW1wb3J0IGFuZHJvaWQudmlldy5WaWV3
CmltcG9ydCBhbmRyb2lkLndpZGdldC5CdXR0b24KaW1wb3J0IGFuZHJvaWQud2lkZ2V0LkdyaWRW
aWV3CmltcG9ydCBhbmRyb2lkLndpZGdldC5UZXh0VmlldwppbXBvcnQgYW5kcm9pZC53aWRnZXQu
VG9hc3QKaW1wb3J0IGFuZHJvaWR4LmFwcGNvbXBhdC5hcHAuQXBwQ29tcGF0QWN0aXZpdHkKCmNs
YXNzIFNlcmllc1dhdGNobGlzdEFjdGl2aXR5IDogQXBwQ29tcGF0QWN0aXZpdHkoKSB7CiAgICBw
cml2YXRlIGxhdGVpbml0IHZhciBncmlkOiBHcmlkVmlldwogICAgcHJpdmF0ZSBsYXRlaW5pdCB2
YXIgZW1wdHk6IFRleHRWaWV3CiAgICBwcml2YXRlIGxhdGVpbml0IHZhciBjb3VudDogVGV4dFZp
ZXcKICAgIHByaXZhdGUgdmFyIGl0ZW1zOiBMaXN0PFNlcmllc1dhdGNobGlzdEl0ZW0+ID0gZW1w
dHlMaXN0KCkKCiAgICBvdmVycmlkZSBmdW4gb25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlOiBC
dW5kbGU/KSB7CiAgICAgICAgc3VwZXIub25DcmVhdGUoc2F2ZWRJbnN0YW5jZVN0YXRlKQogICAg
ICAgIHNldENvbnRlbnRWaWV3KFIubGF5b3V0LmFjdGl2aXR5X3Nlcmllc193YXRjaGxpc3QpCiAg
ICAgICAgZ3JpZCA9IGZpbmRWaWV3QnlJZChSLmlkLnNlcmllc1dhdGNobGlzdEdyaWQpCiAgICAg
ICAgZW1wdHkgPSBmaW5kVmlld0J5SWQoUi5pZC5zZXJpZXNXYXRjaGxpc3RFbXB0eSkKICAgICAg
ICBjb3VudCA9IGZpbmRWaWV3QnlJZChSLmlkLnNlcmllc1dhdGNobGlzdENvdW50KQogICAgICAg
IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzV2F0Y2hsaXN0QmFjaykuc2V0T25DbGlj
a0xpc3RlbmVyIHsgZmluaXNoKCkgfQogICAgICAgIGNvbmZpZ3VyZU1lZGlhR3JpZChncmlkKSB7
IHBvc2l0aW9uIC0+IG9wZW5TZXJpZXMocG9zaXRpb24pIH0KICAgICAgICBncmlkLnNldE9uSXRl
bUxvbmdDbGlja0xpc3RlbmVyIHsgXywgXywgcG9zaXRpb24sIF8gLT4KICAgICAgICAgICAgaWYg
KHBvc2l0aW9uICFpbiBpdGVtcy5pbmRpY2VzKSByZXR1cm5Ac2V0T25JdGVtTG9uZ0NsaWNrTGlz
dGVuZXIgZmFsc2UKICAgICAgICAgICAgU2VyaWVzV2F0Y2hsaXN0LnJlbW92ZSh0aGlzLCBpdGVt
c1twb3NpdGlvbl0uaWQpCiAgICAgICAgICAgIFRvYXN0Lm1ha2VUZXh0KHRoaXMsICJSZW1vdmVk
IGZyb20gTXkgU2VyaWVzIiwgVG9hc3QuTEVOR1RIX1NIT1JUKS5zaG93KCkKICAgICAgICAgICAg
cmVmcmVzaCgpCiAgICAgICAgICAgIHRydWUKICAgICAgICB9CiAgICB9CgogICAgb3ZlcnJpZGUg
ZnVuIG9uUmVzdW1lKCkgeyBzdXBlci5vblJlc3VtZSgpOyByZWZyZXNoKCkgfQoKICAgIHByaXZh
dGUgZnVuIHJlZnJlc2goKSB7CiAgICAgICAgaXRlbXMgPSBTZXJpZXNXYXRjaGxpc3QuYWxsKHRo
aXMpCiAgICAgICAgY291bnQudGV4dCA9ICIke2l0ZW1zLnNpemV9IFNBVkVEIFNFUklFUyIKICAg
ICAgICBpZiAoaXRlbXMuaXNFbXB0eSgpKSB7CiAgICAgICAgICAgIGdyaWQuYWRhcHRlciA9IG51
bGw7IGdyaWQudmlzaWJpbGl0eSA9IFZpZXcuR09ORTsgZW1wdHkudmlzaWJpbGl0eSA9IFZpZXcu
VklTSUJMRTsgcmV0dXJuCiAgICAgICAgfQogICAgICAgIGVtcHR5LnZpc2liaWxpdHkgPSBWaWV3
LkdPTkUKICAgICAgICBncmlkLmFkYXB0ZXIgPSBNZWRpYUdyaWRBZGFwdGVyKHRoaXMsIGl0ZW1z
Lm1hcCB7IGl0LmFzTGlicmFyeUl0ZW0oKSB9KQogICAgICAgIGdyaWQudmlzaWJpbGl0eSA9IFZp
ZXcuVklTSUJMRQogICAgICAgIGZvY3VzRmlyc3RNZWRpYUl0ZW0oZ3JpZCkKICAgIH0KCiAgICBw
cml2YXRlIGZ1biBvcGVuU2VyaWVzKHBvc2l0aW9uOiBJbnQpIHsKICAgICAgICBpZiAocG9zaXRp
b24gIWluIGl0ZW1zLmluZGljZXMpIHJldHVybgogICAgICAgIHZhbCBpdGVtID0gaXRlbXNbcG9z
aXRpb25dCiAgICAgICAgc3RhcnRBY3Rpdml0eShJbnRlbnQodGhpcywgU2VyaWVzRGV0YWlsc0Fj
dGl2aXR5OjpjbGFzcy5qYXZhKS5hcHBseSB7CiAgICAgICAgICAgIHB1dEV4dHJhKCJzZXJpZXNJ
ZCIsIGl0ZW0uaWQpOyBwdXRFeHRyYSgic2VyaWVzTmFtZSIsIGl0ZW0ubmFtZSkKICAgICAgICAg
ICAgcHV0RXh0cmEoInNlcmllc0ltYWdlVXJsIiwgaXRlbS5pbWFnZVVybCk7IHB1dEV4dHJhKCJz
ZXJpZXNDYXRlZ29yeUlkIiwgaXRlbS5jYXRlZ29yeUlkKQogICAgICAgICAgICBwdXRFeHRyYSgi
c2VyaWVzWWVhciIsIGl0ZW0ueWVhcik7IHB1dEV4dHJhKCJzZXJpZXNSYXRpbmciLCBpdGVtLnJh
dGluZykKICAgICAgICB9KQogICAgfQp9Cg==
:::END SERIESWATCHLISTACTIVITY

:::BEGIN SERIESWATCHLISTLAYOUT
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CgogICAgPExpbmVhckxheW91dAogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI3NmRwIgogICAgICAgIGFuZHJv
aWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ1N0YXJ0
PSIxMmRwIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZ0VuZD0iMTJkcCIKICAgICAgICBhbmRyb2lk
OmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9oZWFkZXIiPgogICAgICAgIDxJbWFn
ZVZpZXcKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjU4ZHAiCiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNThkcCIKICAgICAgICAgICAgYW5kcm9pZDpzcmM9IkBk
cmF3YWJsZS9vZmZpY2lhbF9tb3ZpZXMiCiAgICAgICAgICAgIGFuZHJvaWQ6c2NhbGVUeXBlPSJj
ZW50ZXJJbnNpZGUiCiAgICAgICAgICAgIGFuZHJvaWQ6Y29udGVudERlc2NyaXB0aW9uPSJTZXJp
ZXMiLz4KICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSIwZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50
IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAgIGFuZHJv
aWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxMGRwIgogICAgICAgICAgICBhbmRyb2lkOm9yaWVudGF0
aW9uPSJ2ZXJ0aWNhbCI+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAgICAgYW5k
cm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
PSJLUklTVEFMIFNUUkVBTVMgQ0lORU1BIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0Q29s
b3I9IkBjb2xvci9rc19yZWQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9s
ZCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICAgICAgICAg
IGFuZHJvaWQ6bGV0dGVyU3BhY2luZz0iMC4xMiIvPgogICAgICAgICAgICA8VGV4dFZpZXcKICAg
ICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAgICAgICAg
ICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6dGV4dD0iTVkgU0VSSUVTIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxl
PSJib2xkIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTlzcCIvPgogICAgICAg
ICAgICA8VGV4dFZpZXcKICAgICAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzV2F0
Y2hsaXN0Q291bnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0id3JhcF9j
b250ZW50IgogICAgICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2NvbnRl
bnQiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHQ9IjAgU0FWRUQgU0VSSUVTIgogICAgICAg
ICAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIKICAgICAgICAgICAg
ICAgIGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiLz4KICAgICAgICA8L0xpbmVhckxheW91dD4KICAg
ICAgICA8QnV0dG9uCiAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzV2F0Y2hsaXN0
QmFjayIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjcyZHAiCiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDJkcCIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0PSJC
QUNLIgogICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3doaXRlIgogICAg
ICAgICAgICBhbmRyb2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAgICAgICAgYW5kcm9pZDp0ZXh0
U2l6ZT0iMTBzcCIKICAgICAgICAgICAgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdf
YnV0dG9uIi8+CiAgICA8L0xpbmVhckxheW91dD4KCiAgICA8VGV4dFZpZXcKICAgICAgICBhbmRy
b2lkOmlkPSJAK2lkL3Nlcmllc1dhdGNobGlzdEVtcHR5IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0
X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFw
X2NvbnRlbnQiCiAgICAgICAgYW5kcm9pZDpwYWRkaW5nPSIyOGRwIgogICAgICAgIGFuZHJvaWQ6
Z3Jhdml0eT0iY2VudGVyIgogICAgICAgIGFuZHJvaWQ6dGV4dD0iWW91ciBTZXJpZXMgbGlzdCBp
cyBlbXB0eS4gQWRkIHNob3dzIGZyb20gdGhlaXIgZGV0YWlscyBwYWdlcy4iCiAgICAgICAgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIKICAgICAgICBhbmRyb2lkOnRleHRTaXpl
PSIxNHNwIi8+CgogICAgPEdyaWRWaWV3CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNX
YXRjaGxpc3RHcmlkIgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQi
CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSIwZHAiCiAgICAgICAgYW5kcm9pZDpsYXlv
dXRfd2VpZ2h0PSIxIgogICAgICAgIGFuZHJvaWQ6bnVtQ29sdW1ucz0iMiIKICAgICAgICBhbmRy
b2lkOmhvcml6b250YWxTcGFjaW5nPSIxMWRwIgogICAgICAgIGFuZHJvaWQ6dmVydGljYWxTcGFj
aW5nPSIxNGRwIgogICAgICAgIGFuZHJvaWQ6cGFkZGluZz0iMTBkcCIKICAgICAgICBhbmRyb2lk
OmNsaXBUb1BhZGRpbmc9ImZhbHNlIgogICAgICAgIGFuZHJvaWQ6c3RyZXRjaE1vZGU9ImNvbHVt
bldpZHRoIgogICAgICAgIGFuZHJvaWQ6bGlzdFNlbGVjdG9yPSJAZHJhd2FibGUvYmdfbWVkaWFf
Z3JpZF9zZWxlY3RvciIKICAgICAgICBhbmRyb2lkOmRyYXdTZWxlY3Rvck9uVG9wPSJ0cnVlIgog
ICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGFuZHJvaWQ6Y29sb3IvdHJhbnNwYXJlbnQiCiAg
ICAgICAgYW5kcm9pZDp2aXNpYmlsaXR5PSJnb25lIi8+CjwvTGluZWFyTGF5b3V0Pgo=
:::END SERIESWATCHLISTLAYOUT

:::BEGIN SERIESWATCHLISTLAYOUTLAND
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSJtYXRjaF9wYXJlbnQiCiAgICBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIK
ICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL29mZmljaWFsX2Rhc2hib2FyZF9iZyI+
CiAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3Bh
cmVudCIKICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjcwZHAiCiAgICAgICAgYW5kcm9p
ZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiCiAgICAgICAgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9
IjE0ZHAiCiAgICAgICAgYW5kcm9pZDpwYWRkaW5nRW5kPSIxNGRwIgogICAgICAgIGFuZHJvaWQ6
YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX29mZmljaWFsX2hlYWRlciI+CiAgICAgICAgPEltYWdl
VmlldwogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0iNThkcCIKICAgICAgICAgICAg
YW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1OGRwIgogICAgICAgICAgICBhbmRyb2lkOnNyYz0iQGRy
YXdhYmxlL29mZmljaWFsX21vdmllcyIKICAgICAgICAgICAgYW5kcm9pZDpzY2FsZVR5cGU9ImNl
bnRlckluc2lkZSIKICAgICAgICAgICAgYW5kcm9pZDpjb250ZW50RGVzY3JpcHRpb249IlNlcmll
cyIvPgogICAgICAgIDxJbWFnZVZpZXcKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IjIxMGRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjUwZHAiCiAgICAgICAg
ICAgIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSI5ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6
c3JjPSJAZHJhd2FibGUva3NfYmFubmVyIgogICAgICAgICAgICBhbmRyb2lkOnNjYWxlVHlwZT0i
Zml0U3RhcnQiCiAgICAgICAgICAgIGFuZHJvaWQ6Y29udGVudERlc2NyaXB0aW9uPSJLcmlzdGFs
IFN0cmVhbXMiLz4KICAgICAgICA8TGluZWFyTGF5b3V0CiAgICAgICAgICAgIGFuZHJvaWQ6bGF5
b3V0X3dpZHRoPSIwZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9j
b250ZW50IgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiCiAgICAgICAgICAg
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxNGRwIgogICAgICAgICAgICBhbmRyb2lkOm9y
aWVudGF0aW9uPSJ2ZXJ0aWNhbCI+CiAgICAgICAgICAgIDxUZXh0VmlldwogICAgICAgICAgICAg
ICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IndyYXBfY29udGVudCIKICAgICAgICAgICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgICAgICAgICAgYW5kcm9p
ZDp0ZXh0PSJNWSBTRVJJRVMiCiAgICAgICAgICAgICAgICBhbmRyb2lkOnRleHRDb2xvcj0iQGNv
bG9yL2tzX3doaXRlIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U3R5bGU9ImJvbGQiCiAg
ICAgICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIyMHNwIi8+CiAgICAgICAgICAgIDxUZXh0
VmlldwogICAgICAgICAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNXYXRjaGxpc3RDb3Vu
dCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJ3cmFwX2NvbnRlbnQiCiAg
ICAgICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IndyYXBfY29udGVudCIKICAgICAg
ICAgICAgICAgIGFuZHJvaWQ6dGV4dD0iMCBTQVZFRCBTRVJJRVMiCiAgICAgICAgICAgICAgICBh
bmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX3JlZCIKICAgICAgICAgICAgICAgIGFuZHJvaWQ6
dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIv
PgogICAgICAgIDwvTGluZWFyTGF5b3V0PgogICAgICAgIDxCdXR0b24KICAgICAgICAgICAgYW5k
cm9pZDppZD0iQCtpZC9zZXJpZXNXYXRjaGxpc3RCYWNrIgogICAgICAgICAgICBhbmRyb2lkOmxh
eW91dF93aWR0aD0iNzZkcCIKICAgICAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI0MmRw
IgogICAgICAgICAgICBhbmRyb2lkOnRleHQ9IkJBQ0siCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJi
b2xkIgogICAgICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxMHNwIgogICAgICAgICAgICBhbmRy
b2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19idXR0b24iLz4KICAgIDwvTGluZWFyTGF5b3V0
PgogICAgPFRleHRWaWV3CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNXYXRjaGxpc3RF
bXB0eSIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAg
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3JhcF9jb250ZW50IgogICAgICAgIGFuZHJvaWQ6cGFk
ZGluZz0iMjRkcCIKICAgICAgICBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlciIKICAgICAgICBhbmRy
b2lkOnRleHQ9IllvdXIgU2VyaWVzIGxpc3QgaXMgZW1wdHkuIEFkZCBzaG93cyBmcm9tIHRoZWly
IGRldGFpbHMgcGFnZXMuIgogICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0
ZWQiCiAgICAgICAgYW5kcm9pZDp0ZXh0U2l6ZT0iMTRzcCIvPgogICAgPEdyaWRWaWV3CiAgICAg
ICAgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNXYXRjaGxpc3RHcmlkIgogICAgICAgIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0
PSIwZHAiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIgogICAgICAgIGFuZHJvaWQ6
bnVtQ29sdW1ucz0iNCIKICAgICAgICBhbmRyb2lkOmhvcml6b250YWxTcGFjaW5nPSIxNGRwIgog
ICAgICAgIGFuZHJvaWQ6dmVydGljYWxTcGFjaW5nPSIxNGRwIgogICAgICAgIGFuZHJvaWQ6cGFk
ZGluZz0iMTJkcCIKICAgICAgICBhbmRyb2lkOmNsaXBUb1BhZGRpbmc9ImZhbHNlIgogICAgICAg
IGFuZHJvaWQ6c3RyZXRjaE1vZGU9ImNvbHVtbldpZHRoIgogICAgICAgIGFuZHJvaWQ6bGlzdFNl
bGVjdG9yPSJAZHJhd2FibGUvYmdfbWVkaWFfZ3JpZF9zZWxlY3RvciIKICAgICAgICBhbmRyb2lk
OmRyYXdTZWxlY3Rvck9uVG9wPSJ0cnVlIgogICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGFu
ZHJvaWQ6Y29sb3IvdHJhbnNwYXJlbnQiCiAgICAgICAgYW5kcm9pZDp2aXNpYmlsaXR5PSJnb25l
Ii8+CjwvTGluZWFyTGF5b3V0Pgo=
:::END SERIESWATCHLISTLAYOUTLAND

:::BEGIN LAYOUTPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCiRlcGlzb2RlUm93
ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRccm93X2Vw
aXNvZGVfbW9kZXJuLnhtbCcKJGFjdGl2aXR5ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBw
XHNyY1xtYWluXGphdmFcY29tXGtyaXN0YWxzdHJlYW1zXHBsYXllclxTZXJpZXNEZXRhaWxzQWN0
aXZpdHkua3QnCgpmb3JlYWNoICgkbGF5b3V0IGluIEAoJHBvcnRyYWl0LCAkbGFuZHNjYXBlKSkg
ewogICAgUmVwbGFjZS1SZXF1aXJlZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0Nv
bnRpbnVlUGFuZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iNzZkcCInICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFu
ZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0iOTZkcCInICdDb250aW51ZSBwYW5lbCBoZWlnaHQnCiAgICBSZXBsYWNlLVJlcXVpcmVk
ICRsYXlvdXQgJ2FuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ29udGludWVMYWJlbCIgYW5kcm9pZDps
YXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSJ3cmFwX2Nv
bnRlbnQiIGFuZHJvaWQ6dGV4dENvbG9yPScgJ2FuZHJvaWQ6aWQ9IkAraWQvc2VyaWVzQ29udGlu
dWVMYWJlbCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlv
dXRfaGVpZ2h0PSIyOGRwIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9p
ZDppbmNsdWRlRm9udFBhZGRpbmc9ImZhbHNlIiBhbmRyb2lkOnRleHRDb2xvcj0nICdDb250aW51
ZSBsYWJlbCBhbGlnbm1lbnQnCiAgICBSZXBsYWNlLVJlcXVpcmVkICRsYXlvdXQgJ2FuZHJvaWQ6
bGF5b3V0X2hlaWdodD0iNDZkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI1ZHAiIGFuZHJv
aWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiJyAnYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI1NmRw
IiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjRkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9y
aXpvbnRhbCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiJyAnQ29udGludWUgYnV0
dG9uIHJvdyBzaXppbmcnCiAgICAkeG1sID0gW0lPLkZpbGVdOjpSZWFkQWxsVGV4dCgkbGF5b3V0
KQogICAgJHhtbCA9ICR4bWwuUmVwbGFjZSgnYW5kcm9pZDp0ZXh0U2l6ZT0iMTBzcCIgYW5kcm9p
ZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIicsICdhbmRyb2lkOnRleHRTaXplPSIx
MHNwIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlciIgYW5kcm9pZDpwYWRkaW5nPSIwZHAiIGFuZHJv
aWQ6bWluSGVpZ2h0PSIwZHAiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRkaW5nPSJmYWxzZSIgYW5k
cm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIicpCiAgICBbSU8uRmlsZV06Oldy
aXRlQWxsVGV4dCgkbGF5b3V0LCAkeG1sLCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNl
KSkKfQoKUmVwbGFjZS1SZXF1aXJlZCAkYWN0aXZpdHkgInRleHRTaXplID0gMTFmYG4gICAgICAg
ICAgICAgICAgYmFja2dyb3VuZCA9IGdldERyYXdhYmxlKFIuZHJhd2FibGUuYmdfcm93KSIgInRl
eHRTaXplID0gMTFmYG4gICAgICAgICAgICAgICAgZ3Jhdml0eSA9IGFuZHJvaWQudmlldy5HcmF2
aXR5LkNFTlRFUmBuICAgICAgICAgICAgICAgIGluY2x1ZGVGb250UGFkZGluZyA9IGZhbHNlYG4g
ICAgICAgICAgICAgICAgbWluSGVpZ2h0ID0gMGBuICAgICAgICAgICAgICAgIHNldFBhZGRpbmco
MTIuZHAsIDAsIDEyLmRwLCAwKWBuICAgICAgICAgICAgICAgIGJhY2tncm91bmQgPSBnZXREcmF3
YWJsZShSLmRyYXdhYmxlLmJnX3JvdykiICdTZWFzb24gYnV0dG9uIGNlbnRlcmluZycKUmVwbGFj
ZS1SZXF1aXJlZCAkYWN0aXZpdHkgJ2xheW91dFBhcmFtcyA9IExpbmVhckxheW91dC5MYXlvdXRQ
YXJhbXMoMTMyLmRwLCA0Ni5kcCkuYXBwbHknICdsYXlvdXRQYXJhbXMgPSBMaW5lYXJMYXlvdXQu
TGF5b3V0UGFyYW1zKDEzMi5kcCwgNTAuZHApLmFwcGx5JyAnU2Vhc29uIGJ1dHRvbiBoZWlnaHQn
CgpSZXBsYWNlLVJlcXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0
Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjExOGRwIiBhbmRyb2lkOm9yaWVudGF0
aW9uPSJob3Jpem9udGFsIicgJ2FuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTQyZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250
YWwiJyAnRXBpc29kZSBjYXJkIGhlaWdodCcKUmVwbGFjZS1SZXF1aXJlZCAkZXBpc29kZVJvdyAn
PEZyYW1lTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSIxNDJkcCIgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSI5NmRwIj4nICc8RnJhbWVMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9IjE0OGRw
IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjExNmRwIj4nICdFcGlzb2RlIGFydHdvcmsgaGVpZ2h0
JwpSZXBsYWNlLVJlcXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOm1heExpbmVzPSIxIiBhbmRy
b2lkOmVsbGlwc2l6ZT0iZW5kIiBhbmRyb2lkOnRleHQ9IkVwaXNvZGUgdGl0bGUiJyAnYW5kcm9p
ZDptYXhMaW5lcz0iMiIgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDpncmF2aXR5PSJj
ZW50ZXJfdmVydGljYWwiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRkaW5nPSJmYWxzZSIgYW5kcm9p
ZDp0ZXh0PSJFcGlzb2RlIHRpdGxlIicgJ0VwaXNvZGUgdGl0bGUgc2l6aW5nJwpSZXBsYWNlLVJl
cXVpcmVkICRlcGlzb2RlUm93ICdhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkXzIi
IGFuZHJvaWQ6dGV4dFNpemU9IjEwc3AiJyAnYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19t
dXRlZF8yIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIiBhbmRyb2lkOmxpbmVTcGFjaW5nRXh0cmE9
IjFkcCInICdFcGlzb2RlIGRlc2NyaXB0aW9uIHNpemluZycKCldyaXRlLUhvc3QgJ1NlcmllcyBE
ZXRhaWxzIGxheW91dCBtZWFzdXJlbWVudHMgdXBkYXRlZCBzdWNjZXNzZnVsbHkuJwo=
:::END LAYOUTPATCH

:::BEGIN TEXTFITPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCiRlcGlzb2RlUm93
ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRccm93X2Vw
aXNvZGVfbW9kZXJuLnhtbCcKJGFjdGl2aXR5ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBw
XHNyY1xtYWluXGphdmFcY29tXGtyaXN0YWxzdHJlYW1zXHBsYXllclxTZXJpZXNEZXRhaWxzQWN0
aXZpdHkua3QnCiRhZGFwdGVyID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XGphdmFcY29tXGtyaXN0YWxzdHJlYW1zXHBsYXllclxFcGlzb2RlTGlzdEFkYXB0ZXIua3QnCgpm
b3JlYWNoICgkbGF5b3V0IGluIEAoJHBvcnRyYWl0LCAkbGFuZHNjYXBlKSkgewogICAgUmVwbGFj
ZS1SZXF1aXJlZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFuZWwi
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdo
dD0iOTZkcCInICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFuZWwiIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTEwZHAi
IGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIiBhbmRyb2lkOmNsaXBUb1BhZGRpbmc9InRydWUi
JyAnYm91bmRlZCBDb250aW51ZSBwYW5lbCcKICAgIFJlcGxhY2UtUmVxdWlyZWQgJGxheW91dCAn
YW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZUxhYmVsIiBhbmRyb2lkOmxheW91dF93aWR0
aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjI4ZHAiIGFuZHJvaWQ6Z3Jh
dml0eT0iY2VudGVyX3ZlcnRpY2FsIiBhbmRyb2lkOmluY2x1ZGVGb250UGFkZGluZz0iZmFsc2Ui
IGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3NfbXV0ZWQiIGFuZHJvaWQ6dGV4dFNpemU9IjEw
c3AiJyAnYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZUxhYmVsIiBhbmRyb2lkOmxheW91
dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjQwZHAiIGFuZHJv
aWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lkOnRleHRBbGlnbm1lbnQ9ImNlbnRlciIgYW5kcm9p
ZDptYXhMaW5lcz0iMiIgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDpwYWRkaW5nU3Rh
cnQ9IjhkcCIgYW5kcm9pZDpwYWRkaW5nRW5kPSI4ZHAiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRk
aW5nPSJmYWxzZSIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIgYW5kcm9pZDp0
ZXh0U2l6ZT0iMTFzcCInICdib3VuZGVkIENvbnRpbnVlIGxhYmVsJwogICAgUmVwbGFjZS1SZXF1
aXJlZCAkbGF5b3V0ICdhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU2ZHAiIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblRvcD0iNGRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIiBhbmRyb2lk
OmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCInICdhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjYyZHAi
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iNGRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jp
em9udGFsIiBhbmRyb2lkOmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9pZDpjbGlwQ2hp
bGRyZW49InRydWUiJyAnYm91bmRlZCBDb250aW51ZSBidXR0b24gcm93JwogICAgJHhtbCA9IFtJ
Ty5GaWxlXTo6UmVhZEFsbFRleHQoJGxheW91dCkKICAgICR4bWwgPSAkeG1sLlJlcGxhY2UoJ2Fu
ZHJvaWQ6dGV4dFNpemU9IjEwc3AiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lkOnBh
ZGRpbmc9IjBkcCIgYW5kcm9pZDptaW5IZWlnaHQ9IjBkcCIgYW5kcm9pZDppbmNsdWRlRm9udFBh
ZGRpbmc9ImZhbHNlIiBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19idXR0b24iJywg
J2FuZHJvaWQ6dGV4dFNpemU9IjExc3AiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyIiBhbmRyb2lk
OnRleHRBbGlnbm1lbnQ9ImNlbnRlciIgYW5kcm9pZDptYXhMaW5lcz0iMiIgYW5kcm9pZDplbGxp
cHNpemU9ImVuZCIgYW5kcm9pZDpwYWRkaW5nU3RhcnQ9IjVkcCIgYW5kcm9pZDpwYWRkaW5nRW5k
PSI1ZHAiIGFuZHJvaWQ6bWluSGVpZ2h0PSIwZHAiIGFuZHJvaWQ6aW5jbHVkZUZvbnRQYWRkaW5n
PSJmYWxzZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdfYnV0dG9uIicpCiAgICBb
SU8uRmlsZV06OldyaXRlQWxsVGV4dCgkbGF5b3V0LCAkeG1sLCBbVGV4dC5VVEY4RW5jb2Rpbmdd
OjpuZXcoJGZhbHNlKSkKfQoKUmVwbGFjZS1SZXF1aXJlZCAkYWN0aXZpdHkgInNldFBhZGRpbmco
MTIuZHAsIDAsIDEyLmRwLCAwKWBuICAgICAgICAgICAgICAgIGJhY2tncm91bmQgPSBnZXREcmF3
YWJsZShSLmRyYXdhYmxlLmJnX3JvdykiICJzZXRQYWRkaW5nKDEwLmRwLCAwLCAxMC5kcCwgMClg
biAgICAgICAgICAgICAgICBtYXhMaW5lcyA9IDJgbiAgICAgICAgICAgICAgICBlbGxpcHNpemUg
PSBhbmRyb2lkLnRleHQuVGV4dFV0aWxzLlRydW5jYXRlQXQuRU5EYG4gICAgICAgICAgICAgICAg
YW5kcm9pZHguY29yZS53aWRnZXQuVGV4dFZpZXdDb21wYXQuc2V0QXV0b1NpemVUZXh0VHlwZVVu
aWZvcm1XaXRoQ29uZmlndXJhdGlvbih0aGlzLCA4LCAxMSwgMSwgYW5kcm9pZC51dGlsLlR5cGVk
VmFsdWUuQ09NUExFWF9VTklUX1NQKWBuICAgICAgICAgICAgICAgIGJhY2tncm91bmQgPSBnZXRE
cmF3YWJsZShSLmRyYXdhYmxlLmJnX3JvdykiICdzZWFzb24gdGV4dCBmaXR0aW5nJwpSZXBsYWNl
LVJlcXVpcmVkICRhY3Rpdml0eSAnbGF5b3V0UGFyYW1zID0gTGluZWFyTGF5b3V0LkxheW91dFBh
cmFtcygxMzIuZHAsIDUwLmRwKS5hcHBseScgJ2xheW91dFBhcmFtcyA9IExpbmVhckxheW91dC5M
YXlvdXRQYXJhbXMoMTQwLmRwLCA1NC5kcCkuYXBwbHknICdzZWFzb24gYnV0dG9uIGJvdW5kcycK
UmVwbGFjZS1SZXF1aXJlZCAkYWN0aXZpdHkgInZhbCBjb250aW51ZUJ1dHRvbiA9IGZpbmRWaWV3
QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzQ29udGludWUpYG4gICAgICAgIHZhbCBuZXh0QnV0dG9u
ID0gZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5pZC5zZXJpZXNOZXh0KSIgInZhbCBjb250aW51ZUJ1
dHRvbiA9IGZpbmRWaWV3QnlJZDxCdXR0b24+KFIuaWQuc2VyaWVzQ29udGludWUpYG4gICAgICAg
IHZhbCBuZXh0QnV0dG9uID0gZmluZFZpZXdCeUlkPEJ1dHRvbj4oUi5pZC5zZXJpZXNOZXh0KWBu
ICAgICAgICB2YWwgY29udGludWVMYWJlbCA9IGZpbmRWaWV3QnlJZDxUZXh0Vmlldz4oUi5pZC5z
ZXJpZXNDb250aW51ZUxhYmVsKWBuICAgICAgICBjb250aW51ZUxhYmVsLm1heExpbmVzID0gMmBu
ICAgICAgICBjb250aW51ZUxhYmVsLmVsbGlwc2l6ZSA9IGFuZHJvaWQudGV4dC5UZXh0VXRpbHMu
VHJ1bmNhdGVBdC5FTkRgbiAgICAgICAgYW5kcm9pZHguY29yZS53aWRnZXQuVGV4dFZpZXdDb21w
YXQuc2V0QXV0b1NpemVUZXh0VHlwZVVuaWZvcm1XaXRoQ29uZmlndXJhdGlvbihjb250aW51ZUxh
YmVsLCA5LCAxMSwgMSwgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUuQ09NUExFWF9VTklUX1NQKWBu
ICAgICAgICBsaXN0T2YoY29udGludWVCdXR0b24sIG5leHRCdXR0b24pLmZvckVhY2ggeyBidXR0
b24gLT5gbiAgICAgICAgICAgIGJ1dHRvbi5tYXhMaW5lcyA9IDJgbiAgICAgICAgICAgIGJ1dHRv
bi5lbGxpcHNpemUgPSBhbmRyb2lkLnRleHQuVGV4dFV0aWxzLlRydW5jYXRlQXQuRU5EYG4gICAg
ICAgICAgICBidXR0b24uZ3Jhdml0eSA9IGFuZHJvaWQudmlldy5HcmF2aXR5LkNFTlRFUmBuICAg
ICAgICAgICAgYW5kcm9pZHguY29yZS53aWRnZXQuVGV4dFZpZXdDb21wYXQuc2V0QXV0b1NpemVU
ZXh0VHlwZVVuaWZvcm1XaXRoQ29uZmlndXJhdGlvbihidXR0b24sIDgsIDExLCAxLCBhbmRyb2lk
LnV0aWwuVHlwZWRWYWx1ZS5DT01QTEVYX1VOSVRfU1ApYG4gICAgICAgIH0iICdDb250aW51ZSBh
bmQgTmV4dCB0ZXh0IGZpdHRpbmcnCgpSZXBsYWNlLVJlcXVpcmVkICRlcGlzb2RlUm93ICdhbmRy
b2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjE0
MmRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIicgJ2FuZHJvaWQ6bGF5b3V0X3dp
ZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTU0ZHAiIGFuZHJvaWQ6
b3JpZW50YXRpb249Imhvcml6b250YWwiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIiBhbmRy
b2lkOmNsaXBUb1BhZGRpbmc9InRydWUiJyAnYm91bmRlZCBlcGlzb2RlIGNhcmQnClJlcGxhY2Ut
UmVxdWlyZWQgJGVwaXNvZGVSb3cgJzxGcmFtZUxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0i
MTQ4ZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTE2ZHAiPicgJzxGcmFtZUxheW91dCBhbmRy
b2lkOmxheW91dF93aWR0aD0iMTUyZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTMwZHAiIGFu
ZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIj4nICdib3VuZGVkIGVwaXNvZGUgYXJ0d29yaycKUmVw
bGFjZS1SZXF1aXJlZCAkZXBpc29kZVJvdyAnYW5kcm9pZDptYXhMaW5lcz0iMiIgYW5kcm9pZDpl
bGxpcHNpemU9ImVuZCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiIGFuZHJvaWQ6
aW5jbHVkZUZvbnRQYWRkaW5nPSJmYWxzZSIgYW5kcm9pZDp0ZXh0PSJFcGlzb2RlIHRpdGxlIicg
J2FuZHJvaWQ6bWF4TGluZXM9IjIiIGFuZHJvaWQ6ZWxsaXBzaXplPSJlbmQiIGFuZHJvaWQ6Z3Jh
dml0eT0ic3RhcnR8Y2VudGVyX3ZlcnRpY2FsIiBhbmRyb2lkOmluY2x1ZGVGb250UGFkZGluZz0i
ZmFsc2UiIGFuZHJvaWQ6dGV4dD0iRXBpc29kZSB0aXRsZSInICdsZWZ0LWFsaWduZWQgZXBpc29k
ZSB0aXRsZScKUmVwbGFjZS1SZXF1aXJlZCAkZXBpc29kZVJvdyAnYW5kcm9pZDptYXhMaW5lcz0i
MiIgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19t
dXRlZF8yIiBhbmRyb2lkOnRleHRTaXplPSIxMXNwIiBhbmRyb2lkOmxpbmVTcGFjaW5nRXh0cmE9
IjFkcCInICdhbmRyb2lkOm1heExpbmVzPSIyIiBhbmRyb2lkOmVsbGlwc2l6ZT0iZW5kIiBhbmRy
b2lkOmdyYXZpdHk9InN0YXJ0fGNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9pZDppbmNsdWRlRm9udFBh
ZGRpbmc9ImZhbHNlIiBhbmRyb2lkOnRleHRDb2xvcj0iQGNvbG9yL2tzX211dGVkXzIiIGFuZHJv
aWQ6dGV4dFNpemU9IjExc3AiIGFuZHJvaWQ6bGluZVNwYWNpbmdFeHRyYT0iMWRwIicgJ2xlZnQt
YWxpZ25lZCBlcGlzb2RlIGRlc2NyaXB0aW9uJwoKUmVwbGFjZS1SZXF1aXJlZCAkYWRhcHRlciAi
KS5hbHNvIHsgcm93LnRhZyA9IGl0IH1gbmBuICAgICAgICB2YWwgZXBpc29kZSA9IGdldEl0ZW0o
cG9zaXRpb24pIiAiKS5hbHNvIHsgcm93LnRhZyA9IGl0IH1gbmBuICAgICAgICBob2xkZXIudGl0
bGUubWF4TGluZXMgPSAyYG4gICAgICAgIGhvbGRlci50aXRsZS5lbGxpcHNpemUgPSBhbmRyb2lk
LnRleHQuVGV4dFV0aWxzLlRydW5jYXRlQXQuRU5EYG4gICAgICAgIGhvbGRlci50aXRsZS5ncmF2
aXR5ID0gYW5kcm9pZC52aWV3LkdyYXZpdHkuU1RBUlQgb3IgYW5kcm9pZC52aWV3LkdyYXZpdHku
Q0VOVEVSX1ZFUlRJQ0FMYG4gICAgICAgIGFuZHJvaWR4LmNvcmUud2lkZ2V0LlRleHRWaWV3Q29t
cGF0LnNldEF1dG9TaXplVGV4dFR5cGVVbmlmb3JtV2l0aENvbmZpZ3VyYXRpb24oaG9sZGVyLnRp
dGxlLCAxMiwgMTYsIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUClg
biAgICAgICAgaG9sZGVyLmRlc2NyaXB0aW9uLm1heExpbmVzID0gMmBuICAgICAgICBob2xkZXIu
ZGVzY3JpcHRpb24uZWxsaXBzaXplID0gYW5kcm9pZC50ZXh0LlRleHRVdGlscy5UcnVuY2F0ZUF0
LkVORGBuICAgICAgICBob2xkZXIuZGVzY3JpcHRpb24uZ3Jhdml0eSA9IGFuZHJvaWQudmlldy5H
cmF2aXR5LlNUQVJUIG9yIGFuZHJvaWQudmlldy5HcmF2aXR5LkNFTlRFUl9WRVJUSUNBTGBuICAg
ICAgICBhbmRyb2lkeC5jb3JlLndpZGdldC5UZXh0Vmlld0NvbXBhdC5zZXRBdXRvU2l6ZVRleHRU
eXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRlci5kZXNjcmlwdGlvbiwgOSwgMTEsIDEs
IGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUClgbiAgICAgICAgaG9sZGVy
Lm1ldGEubWF4TGluZXMgPSAxYG4gICAgICAgIGhvbGRlci5tZXRhLmVsbGlwc2l6ZSA9IGFuZHJv
aWQudGV4dC5UZXh0VXRpbHMuVHJ1bmNhdGVBdC5FTkRgbiAgICAgICAgYW5kcm9pZHguY29yZS53
aWRnZXQuVGV4dFZpZXdDb21wYXQuc2V0QXV0b1NpemVUZXh0VHlwZVVuaWZvcm1XaXRoQ29uZmln
dXJhdGlvbihob2xkZXIubWV0YSwgOCwgMTAsIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNP
TVBMRVhfVU5JVF9TUClgbiAgICAgICAgaG9sZGVyLmJhZGdlLm1heExpbmVzID0gMWBuICAgICAg
ICBob2xkZXIuYmFkZ2UuZWxsaXBzaXplID0gYW5kcm9pZC50ZXh0LlRleHRVdGlscy5UcnVuY2F0
ZUF0LkVORGBuICAgICAgICBhbmRyb2lkeC5jb3JlLndpZGdldC5UZXh0Vmlld0NvbXBhdC5zZXRB
dXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRlci5iYWRnZSwgOCwg
MTAsIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9TUClgbmBuICAgICAg
ICB2YWwgZXBpc29kZSA9IGdldEl0ZW0ocG9zaXRpb24pIiAnZXBpc29kZSB0ZXh0IGZpdHRpbmcn
CgpXcml0ZS1Ib3N0ICdBbGwgU2VyaWVzIERldGFpbHMgdGV4dCBpcyBjb25zdHJhaW5lZCBpbnNp
ZGUgaXRzIGNhcmQuJwo=
:::END TEXTFITPATCH

:::BEGIN BUTTONPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCgpmb3JlYWNoICgk
bGF5b3V0IGluIEAoJHBvcnRyYWl0LCAkbGFuZHNjYXBlKSkgewogICAgUmVwbGFjZS1SZXF1aXJl
ZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFuZWwiIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTEwZHAi
IGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIiBhbmRyb2lkOmNsaXBUb1BhZGRpbmc9InRydWUi
JyAnYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZVBhbmVsIiBhbmRyb2lkOmxheW91dF93
aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjEyNGRwIiBhbmRyb2lk
OmNsaXBDaGlsZHJlbj0iZmFsc2UiIGFuZHJvaWQ6Y2xpcFRvUGFkZGluZz0iZmFsc2UiJyAnQ29u
dGludWUgcGFuZWwgdmlzaWJpbGl0eScKICAgIFJlcGxhY2UtUmVxdWlyZWQgJGxheW91dCAnYW5k
cm9pZDpsYXlvdXRfaGVpZ2h0PSI2MmRwIiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjRkcCIg
YW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJf
dmVydGljYWwiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIicgJ2FuZHJvaWQ6bGF5b3V0X2hl
aWdodD0iNzRkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI0ZHAiIGFuZHJvaWQ6b3JpZW50
YXRpb249Imhvcml6b250YWwiIGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIiBhbmRy
b2lkOnBhZGRpbmdUb3A9IjNkcCIgYW5kcm9pZDpwYWRkaW5nQm90dG9tPSI3ZHAiIGFuZHJvaWQ6
Y2xpcENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxzZSInICdDb250
aW51ZSBidXR0b24gYm90dG9tIGNsZWFyYW5jZScKfQoKUmVwbGFjZS1SZXF1aXJlZCAkcG9ydHJh
aXQgJzxIb3Jpem9udGFsU2Nyb2xsVmlldyBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFy
ZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU2ZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0
YXJ0PSIxMGRwIicgJzxIb3Jpem9udGFsU2Nyb2xsVmlldyBhbmRyb2lkOmxheW91dF93aWR0aD0i
bWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjY0ZHAiIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblN0YXJ0PSIxMGRwIicgJ3BvcnRyYWl0IHNlYXNvbi1idXR0b24gY2xlYXJhbmNlJwpS
ZXBsYWNlLVJlcXVpcmVkICRsYW5kc2NhcGUgJzxIb3Jpem9udGFsU2Nyb2xsVmlldyBhbmRyb2lk
OmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU2ZHAi
IGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iNmRwIicgJzxIb3Jpem9udGFsU2Nyb2xsVmlldyBh
bmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9
IjY0ZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblRvcD0iNmRwIicgJ2xhbmRzY2FwZSBzZWFzb24t
YnV0dG9uIGNsZWFyYW5jZScKClJlcGxhY2UtUmVxdWlyZWQgJHBvcnRyYWl0ICc8TGluZWFyTGF5
b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0iNDhkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3RhcnQ9IjEwZHAiIGFuZHJvaWQ6bGF5
b3V0X21hcmdpbkVuZD0iMTBkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0iaG9yaXpvbnRhbCI+JyAn
PExpbmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lk
OmxheW91dF9oZWlnaHQ9IjQ4ZHAiIGFuZHJvaWQ6bGF5b3V0X21hcmdpblN0YXJ0PSIxMGRwIiBh
bmRyb2lkOmxheW91dF9tYXJnaW5FbmQ9IjEwZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6
b250YWwiIGFuZHJvaWQ6cGFkZGluZ1RvcD0iM2RwIiBhbmRyb2lkOnBhZGRpbmdCb3R0b209IjNk
cCIgYW5kcm9pZDpjbGlwQ2hpbGRyZW49ImZhbHNlIiBhbmRyb2lkOmNsaXBUb1BhZGRpbmc9ImZh
bHNlIj4nICdwb3J0cmFpdCBhY3Rpb24tYnV0dG9uIGNsZWFyYW5jZScKUmVwbGFjZS1SZXF1aXJl
ZCAkbGFuZHNjYXBlICc8TGluZWFyTGF5b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9w
YXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDhkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2lu
VG9wPSIxMGRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIj4nICc8TGluZWFyTGF5
b3V0IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hl
aWdodD0iNDhkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSIxMGRwIiBhbmRyb2lkOm9yaWVu
dGF0aW9uPSJob3Jpem9udGFsIiBhbmRyb2lkOnBhZGRpbmdUb3A9IjNkcCIgYW5kcm9pZDpwYWRk
aW5nQm90dG9tPSIzZHAiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlw
VG9QYWRkaW5nPSJmYWxzZSI+JyAnbGFuZHNjYXBlIGFjdGlvbi1idXR0b24gY2xlYXJhbmNlJwoK
V3JpdGUtSG9zdCAnQWxsIFNlcmllcyBEZXRhaWxzIGJ1dHRvbiBjb250YWluZXJzIG5vdyBoYXZl
IGNvbXBsZXRlIGJvdHRvbSBjbGVhcmFuY2UuJwo=
:::END BUTTONPATCH

:::BEGIN PADDINGPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCgpmb3JlYWNoICgk
bGF5b3V0IGluIEAoJHBvcnRyYWl0LCAkbGFuZHNjYXBlKSkgewogICAgUmVwbGFjZS1SZXF1aXJl
ZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFuZWwiIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTI0ZHAi
IGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxz
ZSInICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmllc0NvbnRpbnVlUGFuZWwiIGFuZHJvaWQ6bGF5b3V0
X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTM2ZHAiIGFuZHJv
aWQ6Y2xpcENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxzZSInICdD
b250aW51ZSBwYW5lbCBib3R0b20gc3BhY2UnCiAgICBSZXBsYWNlLVJlcXVpcmVkICRsYXlvdXQg
J2FuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNzRkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI0
ZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwiIGFuZHJvaWQ6Z3Jhdml0eT0iY2Vu
dGVyX3ZlcnRpY2FsIiBhbmRyb2lkOnBhZGRpbmdUb3A9IjNkcCIgYW5kcm9pZDpwYWRkaW5nQm90
dG9tPSI3ZHAiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlwVG9QYWRk
aW5nPSJmYWxzZSInICdhbmRyb2lkOmxheW91dF9oZWlnaHQ9Ijg0ZHAiIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblRvcD0iNGRwIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFsIiBhbmRyb2lk
OmdyYXZpdHk9ImNlbnRlcl92ZXJ0aWNhbCIgYW5kcm9pZDpwYWRkaW5nVG9wPSIzZHAiIGFuZHJv
aWQ6cGFkZGluZ0JvdHRvbT0iMTdkcCIgYW5kcm9pZDpjbGlwQ2hpbGRyZW49ImZhbHNlIiBhbmRy
b2lkOmNsaXBUb1BhZGRpbmc9ImZhbHNlIicgJ3JlZCBidXR0b24gYm90dG9tIHBhZGRpbmcnCn0K
CldyaXRlLUhvc3QgJ0V4dHJhIGJvdHRvbSBwYWRkaW5nIGFkZGVkIGJlbmVhdGggdGhlIFNlcmll
cyByZWQgYnV0dG9uLicK
:::END PADDINGPATCH

:::BEGIN REBALANCEPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCiRhY3Rpdml0eSA9
IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZhXGNvbVxrcmlzdGFsc3Ry
ZWFtc1xwbGF5ZXJcU2VyaWVzRGV0YWlsc0FjdGl2aXR5Lmt0JwoKZm9yZWFjaCAoJGxheW91dCBp
biBAKCRwb3J0cmFpdCwgJGxhbmRzY2FwZSkpIHsKICAgIFJlcGxhY2UtUmVxdWlyZWQgJGxheW91
dCAnYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZVBhbmVsIiBhbmRyb2lkOmxheW91dF93
aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjEzNmRwIiBhbmRyb2lk
OmNsaXBDaGlsZHJlbj0iZmFsc2UiIGFuZHJvaWQ6Y2xpcFRvUGFkZGluZz0iZmFsc2UiJyAnYW5k
cm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZVBhbmVsIiBhbmRyb2lkOmxheW91dF93aWR0aD0i
bWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjExMGRwIiBhbmRyb2lkOmNsaXBD
aGlsZHJlbj0iZmFsc2UiIGFuZHJvaWQ6Y2xpcFRvUGFkZGluZz0iZmFsc2UiJyAnQ29udGludWUg
cGFuZWwgaGVpZ2h0JwogICAgUmVwbGFjZS1SZXF1aXJlZCAkbGF5b3V0ICdhbmRyb2lkOmlkPSJA
K2lkL3Nlcmllc0NvbnRpbnVlTGFiZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJl
bnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNDBkcCInICdhbmRyb2lkOmlkPSJAK2lkL3Nlcmll
c0NvbnRpbnVlTGFiZWwiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJv
aWQ6bGF5b3V0X2hlaWdodD0iMzZkcCInICdDb250aW51ZSBsYWJlbCBoZWlnaHQnCiAgICBSZXBs
YWNlLVJlcXVpcmVkICRsYXlvdXQgJ2FuZHJvaWQ6bGF5b3V0X2hlaWdodD0iODRkcCIgYW5kcm9p
ZDpsYXlvdXRfbWFyZ2luVG9wPSI0ZHAiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhvcml6b250YWwi
IGFuZHJvaWQ6Z3Jhdml0eT0iY2VudGVyX3ZlcnRpY2FsIiBhbmRyb2lkOnBhZGRpbmdUb3A9IjNk
cCIgYW5kcm9pZDpwYWRkaW5nQm90dG9tPSIxN2RwIiBhbmRyb2lkOmNsaXBDaGlsZHJlbj0iZmFs
c2UiIGFuZHJvaWQ6Y2xpcFRvUGFkZGluZz0iZmFsc2UiJyAnYW5kcm9pZDpsYXlvdXRfaGVpZ2h0
PSI2NmRwIiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjJkcCIgYW5kcm9pZDpvcmllbnRhdGlv
bj0iaG9yaXpvbnRhbCIgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXJfdmVydGljYWwiIGFuZHJvaWQ6
cGFkZGluZ1RvcD0iMmRwIiBhbmRyb2lkOnBhZGRpbmdCb3R0b209IjEyZHAiIGFuZHJvaWQ6Y2xp
cENoaWxkcmVuPSJmYWxzZSIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxzZSInICdyZWQtYnV0
dG9uIHJvdyBiYWxhbmNlJwp9CgpSZXBsYWNlLVJlcXVpcmVkICRwb3J0cmFpdCAnYW5kcm9pZDps
YXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSI2NGRwIiBh
bmRyb2lkOmxheW91dF9tYXJnaW5TdGFydD0iMTBkcCInICdhbmRyb2lkOmxheW91dF93aWR0aD0i
bWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjU2ZHAiIGFuZHJvaWQ6bGF5b3V0
X21hcmdpblN0YXJ0PSIxMGRwIicgJ3BvcnRyYWl0IFNlYXNvbiBib3ggaGVpZ2h0JwpSZXBsYWNl
LVJlcXVpcmVkICRsYW5kc2NhcGUgJ2FuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQi
IGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNjRkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI2
ZHAiJyAnYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSI1NmRwIiBhbmRyb2lkOmxheW91dF9tYXJnaW5Ub3A9IjZkcCInICdsYW5kc2NhcGUg
U2Vhc29uIGJveCBoZWlnaHQnClJlcGxhY2UtUmVxdWlyZWQgJGFjdGl2aXR5ICdsYXlvdXRQYXJh
bXMgPSBMaW5lYXJMYXlvdXQuTGF5b3V0UGFyYW1zKDE0MC5kcCwgNTQuZHApLmFwcGx5JyAnbGF5
b3V0UGFyYW1zID0gTGluZWFyTGF5b3V0LkxheW91dFBhcmFtcygxNDAuZHAsIDQ2LmRwKS5hcHBs
eScgJ1NlYXNvbiBidXR0b24gaGVpZ2h0JwoKV3JpdGUtSG9zdCAnU2VyaWVzIGNvbnRyb2xzIHJl
YmFsYW5jZWQ6IHJlZC1idXR0b24gY2xlYXJhbmNlIHByZXNlcnZlZCBhbmQgU2Vhc29uIGJveCBy
ZXN0b3JlZC4nCg==
:::END REBALANCEPATCH

:::BEGIN ABOVEFOLDPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBNb3ZlLVNl
YXNvbkJlZm9yZUNvbnRpbnVlIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJFNl
YXNvblN0YXJ0LCBbc3RyaW5nXSRMYWJlbCkKCiAgICAkY29udGVudCA9IFtJTy5GaWxlXTo6UmVh
ZEFsbFRleHQoJFBhdGgpCiAgICAkc2Vhc29uQXQgPSAkY29udGVudC5JbmRleE9mKCRTZWFzb25T
dGFydCwgW1N0cmluZ0NvbXBhcmlzb25dOjpPcmRpbmFsKQogICAgaWYgKCRzZWFzb25BdCAtbHQg
MCkgeyB0aHJvdyAiQ291bGQgbm90IGZpbmQgdGhlICRMYWJlbCBTZWFzb24gc2VsZWN0b3IgaW4g
JFBhdGgiIH0KCiAgICAkc2Vhc29uRW5kVGFnID0gJzwvSG9yaXpvbnRhbFNjcm9sbFZpZXc+Jwog
ICAgJHNlYXNvbkVuZCA9ICRjb250ZW50LkluZGV4T2YoJHNlYXNvbkVuZFRhZywgJHNlYXNvbkF0
LCBbU3RyaW5nQ29tcGFyaXNvbl06Ok9yZGluYWwpCiAgICBpZiAoJHNlYXNvbkVuZCAtbHQgMCkg
eyB0aHJvdyAiQ291bGQgbm90IGZpbmQgdGhlIGVuZCBvZiB0aGUgJExhYmVsIFNlYXNvbiBzZWxl
Y3RvciBpbiAkUGF0aCIgfQogICAgJHNlYXNvbkVuZCArPSAkc2Vhc29uRW5kVGFnLkxlbmd0aAoK
ICAgICRzZWFzb25CbG9jayA9ICRjb250ZW50LlN1YnN0cmluZygkc2Vhc29uQXQsICRzZWFzb25F
bmQgLSAkc2Vhc29uQXQpCiAgICAkd2l0aG91dFNlYXNvbiA9ICRjb250ZW50LlJlbW92ZSgkc2Vh
c29uQXQsICRzZWFzb25FbmQgLSAkc2Vhc29uQXQpCgogICAgJGNvbnRpbnVlTWFya2VyID0gJzxM
aW5lYXJMYXlvdXQgYW5kcm9pZDppZD0iQCtpZC9zZXJpZXNDb250aW51ZVBhbmVsIicKICAgICRj
b250aW51ZUF0ID0gJHdpdGhvdXRTZWFzb24uSW5kZXhPZigkY29udGludWVNYXJrZXIsIFtTdHJp
bmdDb21wYXJpc29uXTo6T3JkaW5hbCkKICAgIGlmICgkY29udGludWVBdCAtbHQgMCkgeyB0aHJv
dyAiQ291bGQgbm90IGZpbmQgdGhlICRMYWJlbCBDb250aW51ZSBwYW5lbCBpbiAkUGF0aCIgfQoK
ICAgICR1cGRhdGVkID0gJHdpdGhvdXRTZWFzb24uSW5zZXJ0KCRjb250aW51ZUF0LCAkc2Vhc29u
QmxvY2sgKyBbRW52aXJvbm1lbnRdOjpOZXdMaW5lKQogICAgaWYgKCR1cGRhdGVkLkluZGV4T2Yo
J3Nlcmllc1NlYXNvbkJhcicsIFtTdHJpbmdDb21wYXJpc29uXTo6T3JkaW5hbCkgLWd0ICR1cGRh
dGVkLkluZGV4T2YoJ3Nlcmllc0NvbnRpbnVlUGFuZWwnLCBbU3RyaW5nQ29tcGFyaXNvbl06Ok9y
ZGluYWwpKSB7CiAgICAgICAgdGhyb3cgIlRoZSAkTGFiZWwgU2Vhc29uIHNlbGVjdG9yIGRpZCBu
b3QgbW92ZSBhYm92ZSB0aGUgQ29udGludWUgcGFuZWwiCiAgICB9CgogICAgW0lPLkZpbGVdOjpX
cml0ZUFsbFRleHQoJFBhdGgsICR1cGRhdGVkLCBbVGV4dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZh
bHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFpbHMueG1sJwokbGFuZHNjYXBlID0gSm9p
bi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0
eV9zZXJpZXNfZGV0YWlscy54bWwnCgpNb3ZlLVNlYXNvbkJlZm9yZUNvbnRpbnVlICRwb3J0cmFp
dCAnPEhvcml6b250YWxTY3JvbGxWaWV3IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJl
bnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNTZkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luU3Rh
cnQ9IjEwZHAiJyAncG9ydHJhaXQnCk1vdmUtU2Vhc29uQmVmb3JlQ29udGludWUgJGxhbmRzY2Fw
ZSAnPEhvcml6b250YWxTY3JvbGxWaWV3IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJl
bnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0iNTZkcCIgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9w
PSI2ZHAiJyAnbGFuZHNjYXBlJwoKV3JpdGUtSG9zdCAnU2Vhc29uIDEgbm93IGFwcGVhcnMgYWJv
dmUgdGhlIGZvbGQgYmVmb3JlIHRoZSBDb250aW51ZSBhbmQgTmV4dCBjb250cm9scy4nCg==
:::END ABOVEFOLDPATCH

:::BEGIN GRIDPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJHBvcnRyYWl0ID0gSm9pbi1QYXRoICRQ
cm9qZWN0Um9vdCAnYXBwXHNyY1xtYWluXHJlc1xsYXlvdXRcYWN0aXZpdHlfc2VyaWVzX2RldGFp
bHMueG1sJwokbGFuZHNjYXBlID0gSm9pbi1QYXRoICRQcm9qZWN0Um9vdCAnYXBwXHNyY1xtYWlu
XHJlc1xsYXlvdXQtbGFuZFxhY3Rpdml0eV9zZXJpZXNfZGV0YWlscy54bWwnCiRhY3Rpdml0eSA9
IEpvaW4tUGF0aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZhXGNvbVxrcmlzdGFsc3Ry
ZWFtc1xwbGF5ZXJcU2VyaWVzRGV0YWlsc0FjdGl2aXR5Lmt0JwokYWRhcHRlciA9IEpvaW4tUGF0
aCAkUHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxqYXZhXGNvbVxrcmlzdGFsc3RyZWFtc1xwbGF5
ZXJcRXBpc29kZUxpc3RBZGFwdGVyLmt0JwoKJHBvcnRyYWl0TGlzdCA9ICc8TGlzdFZpZXcgYW5k
cm9pZDppZD0iQCtpZC9lcGlzb2RlTGlzdCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3Bh
cmVudCIgYW5kcm9pZDpsYXlvdXRfaGVpZ2h0PSIwZHAiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0i
MSIgYW5kcm9pZDpkaXZpZGVyPSJAYW5kcm9pZDpjb2xvci90cmFuc3BhcmVudCIgYW5kcm9pZDpk
aXZpZGVySGVpZ2h0PSI5ZHAiIGFuZHJvaWQ6cGFkZGluZz0iMTBkcCIgYW5kcm9pZDpjbGlwVG9Q
YWRkaW5nPSJmYWxzZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAYW5kcm9pZDpjb2xvci90cmFuc3Bh
cmVudCIvPicKJHBvcnRyYWl0R3JpZCA9ICc8R3JpZFZpZXcgYW5kcm9pZDppZD0iQCtpZC9lcGlz
b2RlTGlzdCIgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlv
dXRfaGVpZ2h0PSIwZHAiIGFuZHJvaWQ6bGF5b3V0X3dlaWdodD0iMSIgYW5kcm9pZDpudW1Db2x1
bW5zPSIyIiBhbmRyb2lkOmhvcml6b250YWxTcGFjaW5nPSI4ZHAiIGFuZHJvaWQ6dmVydGljYWxT
cGFjaW5nPSI4ZHAiIGFuZHJvaWQ6c3RyZXRjaE1vZGU9ImNvbHVtbldpZHRoIiBhbmRyb2lkOmdy
YXZpdHk9ImNlbnRlciIgYW5kcm9pZDpjaG9pY2VNb2RlPSJzaW5nbGVDaG9pY2UiIGFuZHJvaWQ6
cGFkZGluZz0iOGRwIiBhbmRyb2lkOmNsaXBUb1BhZGRpbmc9ImZhbHNlIiBhbmRyb2lkOmJhY2tn
cm91bmQ9IkBhbmRyb2lkOmNvbG9yL3RyYW5zcGFyZW50Ii8+JwpSZXBsYWNlLVJlcXVpcmVkICRw
b3J0cmFpdCAkcG9ydHJhaXRMaXN0ICRwb3J0cmFpdEdyaWQgJ3BvcnRyYWl0IHR3by1jb2x1bW4g
ZXBpc29kZSBncmlkJwoKJGxhbmRzY2FwZUxpc3QgPSAnPExpc3RWaWV3IGFuZHJvaWQ6aWQ9IkAr
aWQvZXBpc29kZUxpc3QiIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJv
aWQ6bGF5b3V0X2hlaWdodD0iMGRwIiBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiIGFuZHJvaWQ6
ZGl2aWRlcj0iQGFuZHJvaWQ6Y29sb3IvdHJhbnNwYXJlbnQiIGFuZHJvaWQ6ZGl2aWRlckhlaWdo
dD0iOWRwIiBhbmRyb2lkOnBhZGRpbmc9IjZkcCIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxz
ZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAYW5kcm9pZDpjb2xvci90cmFuc3BhcmVudCIvPicKJGxh
bmRzY2FwZUdyaWQgPSAnPEdyaWRWaWV3IGFuZHJvaWQ6aWQ9IkAraWQvZXBpc29kZUxpc3QiIGFu
ZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0i
MGRwIiBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiIGFuZHJvaWQ6bnVtQ29sdW1ucz0iMyIgYW5k
cm9pZDpob3Jpem9udGFsU3BhY2luZz0iNmRwIiBhbmRyb2lkOnZlcnRpY2FsU3BhY2luZz0iNmRw
IiBhbmRyb2lkOnN0cmV0Y2hNb2RlPSJjb2x1bW5XaWR0aCIgYW5kcm9pZDpncmF2aXR5PSJjZW50
ZXIiIGFuZHJvaWQ6Y2hvaWNlTW9kZT0ic2luZ2xlQ2hvaWNlIiBhbmRyb2lkOnBhZGRpbmc9IjZk
cCIgYW5kcm9pZDpjbGlwVG9QYWRkaW5nPSJmYWxzZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAYW5k
cm9pZDpjb2xvci90cmFuc3BhcmVudCIvPicKUmVwbGFjZS1SZXF1aXJlZCAkbGFuZHNjYXBlICRs
YW5kc2NhcGVMaXN0ICRsYW5kc2NhcGVHcmlkICdsYW5kc2NhcGUgdGhyZWUtY29sdW1uIGVwaXNv
ZGUgZ3JpZCcKClJlcGxhY2UtUmVxdWlyZWQgJGFjdGl2aXR5ICdpbXBvcnQgYW5kcm9pZC53aWRn
ZXQuTGlzdFZpZXcnICdpbXBvcnQgYW5kcm9pZC53aWRnZXQuR3JpZFZpZXcnICdHcmlkVmlldyBp
bXBvcnQnClJlcGxhY2UtUmVxdWlyZWQgJGFjdGl2aXR5ICdwcml2YXRlIGxhdGVpbml0IHZhciBs
aXN0OiBMaXN0VmlldycgJ3ByaXZhdGUgbGF0ZWluaXQgdmFyIGxpc3Q6IEdyaWRWaWV3JyAnZXBp
c29kZSBHcmlkVmlldyBmaWVsZCcKUmVwbGFjZS1SZXF1aXJlZCAkYWN0aXZpdHkgJ2NvbmZpZ3Vy
ZU1lZGlhTGlzdChsaXN0KSB7IHBvc2l0aW9uIC0+IGNob29zZUVwaXNvZGUocG9zaXRpb24pIH0n
ICdjb25maWd1cmVNZWRpYUdyaWQobGlzdCkgeyBwb3NpdGlvbiAtPiBjaG9vc2VFcGlzb2RlKHBv
c2l0aW9uKSB9JyAnZXBpc29kZSBncmlkIG5hdmlnYXRpb24nCgpSZXBsYWNlLVJlcXVpcmVkICRh
ZGFwdGVyICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRl
ci50aXRsZSwgMTIsIDE2LCAxLCBhbmRyb2lkLnV0aWwuVHlwZWRWYWx1ZS5DT01QTEVYX1VOSVRf
U1ApJyAnc2V0QXV0b1NpemVUZXh0VHlwZVVuaWZvcm1XaXRoQ29uZmlndXJhdGlvbihob2xkZXIu
dGl0bGUsIDEwLCAxMywgMSwgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUuQ09NUExFWF9VTklUX1NQ
KScgJ2NvbXBhY3QgZXBpc29kZS10aXRsZSBmaXR0aW5nJwpSZXBsYWNlLVJlcXVpcmVkICRhZGFw
dGVyICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRlci5k
ZXNjcmlwdGlvbiwgOSwgMTEsIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5J
VF9TUCknICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRl
ci5kZXNjcmlwdGlvbiwgOCwgOSwgMSwgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUuQ09NUExFWF9V
TklUX1NQKScgJ2NvbXBhY3QgZXBpc29kZS1kZXNjcmlwdGlvbiBmaXR0aW5nJwpSZXBsYWNlLVJl
cXVpcmVkICRhZGFwdGVyICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0
aW9uKGhvbGRlci5tZXRhLCA4LCAxMCwgMSwgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUuQ09NUExF
WF9VTklUX1NQKScgJ3NldEF1dG9TaXplVGV4dFR5cGVVbmlmb3JtV2l0aENvbmZpZ3VyYXRpb24o
aG9sZGVyLm1ldGEsIDgsIDksIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5J
VF9TUCknICdjb21wYWN0IGVwaXNvZGUtbWV0YSBmaXR0aW5nJwpSZXBsYWNlLVJlcXVpcmVkICRh
ZGFwdGVyICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRl
ci5iYWRnZSwgOCwgMTAsIDEsIGFuZHJvaWQudXRpbC5UeXBlZFZhbHVlLkNPTVBMRVhfVU5JVF9T
UCknICdzZXRBdXRvU2l6ZVRleHRUeXBlVW5pZm9ybVdpdGhDb25maWd1cmF0aW9uKGhvbGRlci5i
YWRnZSwgOCwgOSwgMSwgYW5kcm9pZC51dGlsLlR5cGVkVmFsdWUuQ09NUExFWF9VTklUX1NQKScg
J2NvbXBhY3QgZXBpc29kZS1iYWRnZSBmaXR0aW5nJwoKV3JpdGUtSG9zdCAnRXBpc29kZXMgbm93
IHVzZSBjb21wYWN0IHR3by1jb2x1bW4gYW5kIHRocmVlLWNvbHVtbiBjYXJkIGdyaWRzLicK
:::END GRIDPATCH
:::BEGIN COMPACTEPISODEROW
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPExpbmVhckxheW91dCB4bWxu
czphbmRyb2lkPSJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWQiCiAg
ICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgYW5kcm9pZDpsYXlvdXRf
aGVpZ2h0PSIxNjZkcCIKICAgIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIgogICAgYW5k
cm9pZDpwYWRkaW5nPSI2ZHAiCiAgICBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19l
cGlzb2RlX3JvdyIKICAgIGFuZHJvaWQ6Zm9jdXNhYmxlPSJmYWxzZSIKICAgIGFuZHJvaWQ6Y2xp
Y2thYmxlPSJmYWxzZSI+CgogICAgPEZyYW1lTGF5b3V0CiAgICAgICAgYW5kcm9pZDpsYXlvdXRf
d2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Ijc2ZHAi
PgoKICAgICAgICA8SW1hZ2VWaWV3CiAgICAgICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvZXBpc29k
ZUltYWdlIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50Igog
ICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIKICAgICAgICAg
ICAgYW5kcm9pZDpzY2FsZVR5cGU9ImNlbnRlckNyb3AiCiAgICAgICAgICAgIGFuZHJvaWQ6c3Jj
PSJAZHJhd2FibGUvb2ZmaWNpYWxfc2VyaWVzIgogICAgICAgICAgICBhbmRyb2lkOmNvbnRlbnRE
ZXNjcmlwdGlvbj0iRXBpc29kZSBhcnR3b3JrIiAvPgoKICAgICAgICA8VGV4dFZpZXcKICAgICAg
ICAgICAgYW5kcm9pZDppZD0iQCtpZC9lcGlzb2RlQmFkZ2UiCiAgICAgICAgICAgIGFuZHJvaWQ6
bGF5b3V0X3dpZHRoPSI1NmRwIgogICAgICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjI0
ZHAiCiAgICAgICAgICAgIGFuZHJvaWQ6bGF5b3V0X2dyYXZpdHk9ImJvdHRvbXxzdGFydCIKICAg
ICAgICAgICAgYW5kcm9pZDpncmF2aXR5PSJjZW50ZXIiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4
dD0iUzEgRTEiCiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dENvbG9yPSJAY29sb3Iva3Nfd2hpdGUi
CiAgICAgICAgICAgIGFuZHJvaWQ6dGV4dFN0eWxlPSJib2xkIgogICAgICAgICAgICBhbmRyb2lk
OnRleHRTaXplPSI5c3AiCiAgICAgICAgICAgIGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxl
L2JnX2xpdmVfcGlsbCIgLz4KICAgIDwvRnJhbWVMYXlvdXQ+CgogICAgPFRleHRWaWV3CiAgICAg
ICAgYW5kcm9pZDppZD0iQCtpZC9lcGlzb2RlVGl0bGUiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRf
d2lkdGg9Im1hdGNoX3BhcmVudCIKICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjM0ZHAi
CiAgICAgICAgYW5kcm9pZDpsYXlvdXRfbWFyZ2luVG9wPSI1ZHAiCiAgICAgICAgYW5kcm9pZDpt
YXhMaW5lcz0iMiIKICAgICAgICBhbmRyb2lkOmVsbGlwc2l6ZT0iZW5kIgogICAgICAgIGFuZHJv
aWQ6Z3Jhdml0eT0ic3RhcnR8Y2VudGVyX3ZlcnRpY2FsIgogICAgICAgIGFuZHJvaWQ6aW5jbHVk
ZUZvbnRQYWRkaW5nPSJmYWxzZSIKICAgICAgICBhbmRyb2lkOnRleHQ9IkVwaXNvZGUgdGl0bGUi
CiAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc193aGl0ZSIKICAgICAgICBhbmRy
b2lkOnRleHRTdHlsZT0iYm9sZCIKICAgICAgICBhbmRyb2lkOnRleHRTaXplPSIxM3NwIiAvPgoK
ICAgIDxUZXh0VmlldwogICAgICAgIGFuZHJvaWQ6aWQ9IkAraWQvZXBpc29kZURlc2NyaXB0aW9u
IgogICAgICAgIGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiCiAgICAgICAgYW5k
cm9pZDpsYXlvdXRfaGVpZ2h0PSIxOGRwIgogICAgICAgIGFuZHJvaWQ6bWF4TGluZXM9IjEiCiAg
ICAgICAgYW5kcm9pZDplbGxpcHNpemU9ImVuZCIKICAgICAgICBhbmRyb2lkOmdyYXZpdHk9InN0
YXJ0fGNlbnRlcl92ZXJ0aWNhbCIKICAgICAgICBhbmRyb2lkOmluY2x1ZGVGb250UGFkZGluZz0i
ZmFsc2UiCiAgICAgICAgYW5kcm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZF8yIgogICAg
ICAgIGFuZHJvaWQ6dGV4dFNpemU9IjlzcCIKICAgICAgICBhbmRyb2lkOnZpc2liaWxpdHk9Imdv
bmUiIC8+CgogICAgPFRleHRWaWV3CiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9lcGlzb2RlTWV0
YSIKICAgICAgICBhbmRyb2lkOmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IgogICAgICAgIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0iMTdkcCIKICAgICAgICBhbmRyb2lkOm1heExpbmVzPSIxIgog
ICAgICAgIGFuZHJvaWQ6ZWxsaXBzaXplPSJlbmQiCiAgICAgICAgYW5kcm9pZDpncmF2aXR5PSJz
dGFydHxjZW50ZXJfdmVydGljYWwiCiAgICAgICAgYW5kcm9pZDppbmNsdWRlRm9udFBhZGRpbmc9
ImZhbHNlIgogICAgICAgIGFuZHJvaWQ6dGV4dD0iU2VsZWN0IHRvIHBsYXkiCiAgICAgICAgYW5k
cm9pZDp0ZXh0Q29sb3I9IkBjb2xvci9rc19tdXRlZCIKICAgICAgICBhbmRyb2lkOnRleHRTaXpl
PSI5c3AiIC8+CgogICAgPFByb2dyZXNzQmFyCiAgICAgICAgYW5kcm9pZDppZD0iQCtpZC9lcGlz
b2RlUHJvZ3Jlc3MiCiAgICAgICAgc3R5bGU9Ij9hbmRyb2lkOmF0dHIvcHJvZ3Jlc3NCYXJTdHls
ZUhvcml6b250YWwiCiAgICAgICAgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIK
ICAgICAgICBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjRkcCIKICAgICAgICBhbmRyb2lkOmxheW91
dF9tYXJnaW5Ub3A9IjJkcCIKICAgICAgICBhbmRyb2lkOm1heD0iMTAwIgogICAgICAgIGFuZHJv
aWQ6cHJvZ3Jlc3NUaW50PSJAY29sb3Iva3NfcmVkIgogICAgICAgIGFuZHJvaWQ6dmlzaWJpbGl0
eT0iZ29uZSIgLz4KPC9MaW5lYXJMYXlvdXQ+Cg==
:::END COMPACTEPISODEROW

:::BEGIN POSTERLOCKPATCH
cGFyYW0oCiAgICBbUGFyYW1ldGVyKE1hbmRhdG9yeSA9ICR0cnVlKV1bc3RyaW5nXSRQcm9qZWN0
Um9vdAopCgokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCgpmdW5jdGlvbiBSZXBsYWNl
LVJlcXVpcmVkIHsKICAgIHBhcmFtKFtzdHJpbmddJFBhdGgsIFtzdHJpbmddJE9sZCwgW3N0cmlu
Z10kTmV3LCBbc3RyaW5nXSRMYWJlbCkKICAgICRjb250ZW50ID0gW0lPLkZpbGVdOjpSZWFkQWxs
VGV4dCgkUGF0aCkKICAgIGlmICgtbm90ICRjb250ZW50LkNvbnRhaW5zKCRPbGQpKSB7IHRocm93
ICJDb3VsZCBub3QgZmluZCBleHBlY3RlZCAkTGFiZWwgaW4gJFBhdGgiIH0KICAgIFtJTy5GaWxl
XTo6V3JpdGVBbGxUZXh0KCRQYXRoLCAkY29udGVudC5SZXBsYWNlKCRPbGQsICROZXcpLCBbVGV4
dC5VVEY4RW5jb2RpbmddOjpuZXcoJGZhbHNlKSkKfQoKJGxhbmRzY2FwZSA9IEpvaW4tUGF0aCAk
UHJvamVjdFJvb3QgJ2FwcFxzcmNcbWFpblxyZXNcbGF5b3V0LWxhbmRcYWN0aXZpdHlfc2VyaWVz
X2RldGFpbHMueG1sJwoKUmVwbGFjZS1SZXF1aXJlZCAkbGFuZHNjYXBlICc8TGluZWFyTGF5b3V0
IGFuZHJvaWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdo
dD0iMGRwIiBhbmRyb2lkOmxheW91dF93ZWlnaHQ9IjEiIGFuZHJvaWQ6b3JpZW50YXRpb249Imhv
cml6b250YWwiIGFuZHJvaWQ6cGFkZGluZz0iMTJkcCI+JyAnPExpbmVhckxheW91dCBhbmRyb2lk
OmxheW91dF93aWR0aD0ibWF0Y2hfcGFyZW50IiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9IjBkcCIg
YW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lkOm9yaWVudGF0aW9uPSJob3Jpem9udGFs
IiBhbmRyb2lkOnBhZGRpbmc9IjEyZHAiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIiBhbmRy
b2lkOmNsaXBUb1BhZGRpbmc9InRydWUiPicgJ2xhbmRzY2FwZSBzcGxpdC1wYW5lIGNsaXBwaW5n
JwoKUmVwbGFjZS1SZXF1aXJlZCAkbGFuZHNjYXBlICc8U2Nyb2xsVmlldyBhbmRyb2lkOmxheW91
dF93aWR0aD0iMzIwZHAiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0ibWF0Y2hfcGFyZW50IiBhbmRy
b2lkOmZpbGxWaWV3cG9ydD0idHJ1ZSIgYW5kcm9pZDpiYWNrZ3JvdW5kPSJAZHJhd2FibGUvYmdf
bW92aWVfZGV0YWlsc19wYW5lbCI+JyAnPFNjcm9sbFZpZXcgYW5kcm9pZDpsYXlvdXRfd2lkdGg9
IjI4MGRwIiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpmaWxs
Vmlld3BvcnQ9InRydWUiIGFuZHJvaWQ6Y2xpcENoaWxkcmVuPSJ0cnVlIiBhbmRyb2lkOmNsaXBU
b1BhZGRpbmc9InRydWUiIGFuZHJvaWQ6b3ZlclNjcm9sbE1vZGU9Im5ldmVyIiBhbmRyb2lkOmJh
Y2tncm91bmQ9IkBkcmF3YWJsZS9iZ19tb3ZpZV9kZXRhaWxzX3BhbmVsIj4nICdib3VuZGVkIGxh
bmRzY2FwZSBkZXRhaWxzIHBhbmUnCgpSZXBsYWNlLVJlcXVpcmVkICRsYW5kc2NhcGUgJzxMaW5l
YXJMYXlvdXQgYW5kcm9pZDpsYXlvdXRfd2lkdGg9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlv
dXRfaGVpZ2h0PSJ3cmFwX2NvbnRlbnQiIGFuZHJvaWQ6b3JpZW50YXRpb249InZlcnRpY2FsIiBh
bmRyb2lkOmdyYXZpdHk9ImNlbnRlcl9ob3Jpem9udGFsIj4nICc8TGluZWFyTGF5b3V0IGFuZHJv
aWQ6bGF5b3V0X3dpZHRoPSJtYXRjaF9wYXJlbnQiIGFuZHJvaWQ6bGF5b3V0X2hlaWdodD0id3Jh
cF9jb250ZW50IiBhbmRyb2lkOm9yaWVudGF0aW9uPSJ2ZXJ0aWNhbCIgYW5kcm9pZDpncmF2aXR5
PSJjZW50ZXJfaG9yaXpvbnRhbCIgYW5kcm9pZDpjbGlwQ2hpbGRyZW49InRydWUiIGFuZHJvaWQ6
Y2xpcFRvUGFkZGluZz0idHJ1ZSI+JyAnbGFuZHNjYXBlIHBvc3RlciBjb250YWluZXIgY2xpcHBp
bmcnCgpSZXBsYWNlLVJlcXVpcmVkICRsYW5kc2NhcGUgJzxJbWFnZVZpZXcgYW5kcm9pZDppZD0i
QCtpZC9zZXJpZXNIZWFkZXJJY29uIiBhbmRyb2lkOmxheW91dF93aWR0aD0iMjEwZHAiIGFuZHJv
aWQ6bGF5b3V0X2hlaWdodD0iMzAwZHAiIGFuZHJvaWQ6c2NhbGVUeXBlPSJjZW50ZXJDcm9wIiBh
bmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19wb3N0ZXJfZnJhbWUiIGFuZHJvaWQ6Y29u
dGVudERlc2NyaXB0aW9uPSJTZXJpZXMgYXJ0d29yayIvPicgJzxJbWFnZVZpZXcgYW5kcm9pZDpp
ZD0iQCtpZC9zZXJpZXNIZWFkZXJJY29uIiBhbmRyb2lkOmxheW91dF93aWR0aD0iMTgwZHAiIGFu
ZHJvaWQ6bGF5b3V0X2hlaWdodD0iMjUwZHAiIGFuZHJvaWQ6bWF4V2lkdGg9IjE4MGRwIiBhbmRy
b2lkOm1heEhlaWdodD0iMjUwZHAiIGFuZHJvaWQ6YWRqdXN0Vmlld0JvdW5kcz0iZmFsc2UiIGFu
ZHJvaWQ6Y3JvcFRvUGFkZGluZz0idHJ1ZSIgYW5kcm9pZDpzY2FsZVR5cGU9ImNlbnRlckNyb3Ai
IGFuZHJvaWQ6YmFja2dyb3VuZD0iQGRyYXdhYmxlL2JnX3Bvc3Rlcl9mcmFtZSIgYW5kcm9pZDpj
b250ZW50RGVzY3JpcHRpb249IlNlcmllcyBhcnR3b3JrIi8+JyAnYm91bmRlZCBsYW5kc2NhcGUg
c2VyaWVzIHBvc3RlcicKClJlcGxhY2UtUmVxdWlyZWQgJGxhbmRzY2FwZSAnPExpbmVhckxheW91
dCBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIiBhbmRyb2lkOmxheW91dF9oZWlnaHQ9Im1hdGNo
X3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lkOmxheW91dF9tYXJnaW5T
dGFydD0iMTJkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwiIGFuZHJvaWQ6cGFkZGlu
Zz0iOGRwIiBhbmRyb2lkOmJhY2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9wYW5lbCI+
JyAnPExpbmVhckxheW91dCBhbmRyb2lkOmxheW91dF93aWR0aD0iMGRwIiBhbmRyb2lkOmxheW91
dF9oZWlnaHQ9Im1hdGNoX3BhcmVudCIgYW5kcm9pZDpsYXlvdXRfd2VpZ2h0PSIxIiBhbmRyb2lk
OmxheW91dF9tYXJnaW5TdGFydD0iMTJkcCIgYW5kcm9pZDpvcmllbnRhdGlvbj0idmVydGljYWwi
IGFuZHJvaWQ6cGFkZGluZz0iOGRwIiBhbmRyb2lkOmNsaXBDaGlsZHJlbj0idHJ1ZSIgYW5kcm9p
ZDpjbGlwVG9QYWRkaW5nPSJ0cnVlIiBhbmRyb2lkOmVsZXZhdGlvbj0iMmRwIiBhbmRyb2lkOmJh
Y2tncm91bmQ9IkBkcmF3YWJsZS9iZ19vZmZpY2lhbF9wYW5lbCI+JyAncHJvdGVjdGVkIGxhbmRz
Y2FwZSBlcGlzb2RlIHBhbmUnCgpXcml0ZS1Ib3N0ICdMYW5kc2NhcGUgc2VyaWVzIHBvc3RlciBp
cyBsb2NrZWQgaW5zaWRlIHRoZSBsZWZ0IGRldGFpbHMgcGFuZS4nCg==
:::END POSTERLOCKPATCH
