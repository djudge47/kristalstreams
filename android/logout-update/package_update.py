"""Package a self-contained Windows launcher; no APKs or signing keys included."""
import argparse
import base64
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent


def embedded_script():
    script = (ROOT / 'Build-Logout-Update.ps1').read_text()
    support = (ROOT / 'builder_support.ps1').read_text()
    script = script.replace("# SUPPORT_FUNCTIONS\nif (-not (Get-Command Find-ManifestVersionOffset -ErrorAction SilentlyContinue)) {\n  . (Join-Path $PSScriptRoot 'builder_support.ps1')\n}", support)
    config = base64.b64encode((ROOT / 'patch.json').read_bytes()).decode()
    script = script.replace("# PATCH_CONFIGURATION\n$patch = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'patch.json') -Raw | ConvertFrom-Json",
                            "$patch = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('" + config + "')) | ConvertFrom-Json")
    assert "$PSScriptRoot" not in script
    return script


def launcher_bytes():
    encoded = base64.b64encode(embedded_script().encode('utf-8')).decode()
    command = ('"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" '
               '-NoProfile -ExecutionPolicy Bypass -Command '
               '"$t=[IO.File]::ReadAllText($env:KS_LOGOUT_BUNDLE);'
               "$b=($t -split ':KS_LOGOUT_PAYLOAD\\r?\\n',2)[1];"
               '$s=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b.Trim()));'
               '& ([ScriptBlock]::Create($s))"')
    text = '\r\n'.join(['@echo off', 'setlocal', 'title Kristal Streams - Log Out to Onn Home',
                         'set "KS_LOGOUT_BUNDLE=%~f0"', command, 'set "KS_RESULT=%ERRORLEVEL%"',
                         'echo.', 'pause', 'exit /b %KS_RESULT%', ':KS_LOGOUT_PAYLOAD', encoded, ''])
    return text.encode('ascii')


README = """KRISTAL STREAMS - LOG OUT TO ONN HOME (2026102002)

On the Windows computer that built your current app, open START.cmd.
It finds your current LOGOUT, WORKING-BASE or APPROVED-ARTWORK APK in Downloads.
If asked, select that current APK. The existing Android SDK and matching
signing key are required. No new signing key is created.

Wait for SUCCESS. The new LOGOUT APK appears in Downloads.
Install that APK as an update on your Onn; keep the current app installed.

On the app's Home screen, open the single-person Account icon.
The Account screen now has a visible Log Out button.
Cancel keeps you signed in. Confirming Log Out clears the active login,
opens the Onn home screen and finishes the Kristal Streams activity task.
When you reopen Kristal Streams, your saved users remain available to sign in.

This updater preserves artwork, saved users, native libraries and all
other code outside the reviewed logout method. It checks every APK file
and the signing certificate before reporting SUCCESS.
If it stops, send the displayed error. Do not substitute an older APK.

This package was checked using binary and simulated logout tests.
Actual Home-screen, Back-button, restart and re-login testing on Onn is pending.
"""


def package(destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('START.cmd', launcher_bytes())
        archive.writestr('READ-ME.txt', README.replace('\n', '\r\n'))
    print(f'Created {destination} ({destination.stat().st_size:,} bytes)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('destination', type=Path)
    package(parser.parse_args().destination)
