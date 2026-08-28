@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Kristal Streams Android Rebuild - MultiView

echo.
echo ============================================================
echo  KRISTAL STREAMS - SINGLE COMMAND WINDOWS BUILD
echo  Clean Android rebuild with MultiView shell
echo ============================================================
echo.

set "WORK=C:\KristalStreamsAndroidRebuild"
set "PROJECT=%WORK%\ks_multiview"
set "OUTAPK=%USERPROFILE%\Desktop\KristalStreams-MultiView-Rebuild-debug.apk"

echo Creating clean project folder...
if exist "%WORK%" rmdir /s /q "%WORK%"
mkdir "%PROJECT%\app\src\main\java\com\kristalstreams\player" >nul 2>nul
mkdir "%PROJECT%\app\src\main\res\drawable" >nul 2>nul
mkdir "%PROJECT%\app\src\main\res\mipmap-hdpi" >nul 2>nul

echo Writing Android project files...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$p='%PROJECT%'; ^
Set-Content -Encoding UTF8 -Path "$p\settings.gradle" -Value @'
pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = 'KristalStreamsPlayer'
include ':app'
'@; ^
Set-Content -Encoding UTF8 -Path "$p\build.gradle" -Value @'
plugins {
    id 'com.android.application' version '8.7.3' apply false
}
'@; ^
Set-Content -Encoding UTF8 -Path "$p\app\build.gradle" -Value @'
plugins { id 'com.android.application' }

android {
    namespace 'com.kristalstreams.player'
    compileSdk 35
    defaultConfig {
        applicationId 'com.kristalstreams.player'
        minSdk 23
        targetSdk 35
        versionCode 3
        versionName '1.0.3-multiview-rebuild'
    }
}

dependencies {
    implementation 'androidx.media3:media3-exoplayer:1.4.1'
    implementation 'androidx.media3:media3-ui:1.4.1'
}
'@; ^
Set-Content -Encoding UTF8 -Path "$p\app\src\main\AndroidManifest.xml" -Value @'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application android:theme="@style/AppTheme" android:label="Kristal Streams" android:usesCleartextTraffic="true" android:allowBackup="false" android:supportsRtl="true">
        <activity android:name=".PlayerActivity" android:screenOrientation="landscape" android:configChanges="keyboard|keyboardHidden|orientation|screenSize" />
        <activity android:name=".MultiViewActivity" android:screenOrientation="landscape" android:configChanges="keyboard|keyboardHidden|orientation|screenSize" />
        <activity android:name=".LiveTvActivity" />
        <activity android:name=".LoginActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'@; ^
New-Item -Force -ItemType Directory "$p\app\src\main\res\values" | Out-Null; ^
Set-Content -Encoding UTF8 -Path "$p\app\src\main\res\values\styles.xml" -Value @'
<resources>
    <style name="AppTheme" parent="android:style/Theme.Material.NoActionBar">
        <item name="android:fontFamily">sans</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:colorAccent">#E50914</item>
    </style>
</resources>
'@; ^
Set-Content -Encoding UTF8 -Path "$p\app\src\main\res\drawable\ks_bg.xml" -Value @'
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient android:startColor="#000000" android:centerColor="#180000" android:endColor="#000000" android:angle="45" />
</shape>
'@"
if errorlevel 1 goto FAIL

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$d='%PROJECT%\app\src\main\java\com\kristalstreams\player'; ^
Set-Content -Encoding UTF8 -Path "$d\LoginActivity.java" -Value @'
package com.kristalstreams.player;

import android.app.*;import android.os.*;import android.content.*;import android.graphics.Color;import android.view.*;import android.widget.*;import android.graphics.Typeface;

public class LoginActivity extends Activity{
 EditText server,user,pass;
 public void onCreate(Bundle b){super.onCreate(b); getWindow().setStatusBarColor(Color.BLACK);
  LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(36,36,36,36);root.setBackgroundColor(Color.BLACK);
  TextView title=new TextView(this);title.setText("KS  Kristal Streams");title.setTextColor(Color.WHITE);title.setTextSize(30);title.setTypeface(Typeface.DEFAULT_BOLD);root.addView(title);
  TextView sub=new TextView(this);sub.setText("Clean rebuild player - Phase 2 MultiView");sub.setTextColor(0xffff5555);sub.setTextSize(15);root.addView(sub);
  server=box("Server URL");user=box("Username");pass=box("Password");pass.setInputType(0x00000081);root.addView(server);root.addView(user);root.addView(pass);
  Button live=btn("Open Live TV");Button multi=btn("Open Multi-View");root.addView(live);root.addView(multi);
  live.setOnClickListener(v->{save();startActivity(new Intent(this,LiveTvActivity.class));});
  multi.setOnClickListener(v->{save();startActivity(new Intent(this,MultiViewActivity.class));});
  setContentView(root);
 }
 EditText box(String h){EditText e=new EditText(this);e.setHint(h);e.setHintTextColor(0xff999999);e.setTextColor(Color.WHITE);e.setSingleLine(true);e.setPadding(18,18,18,18);return e;}
 Button btn(String t){Button b=new Button(this);b.setText(t);b.setTextColor(Color.WHITE);b.setBackgroundColor(0xffe50914);return b;}
 void save(){getSharedPreferences("ks",0).edit().putString("server",server.getText().toString()).putString("user",user.getText().toString()).putString("pass",pass.getText().toString()).apply();}
}
'@; ^
Set-Content -Encoding UTF8 -Path "$d\LiveTvActivity.java" -Value @'
package com.kristalstreams.player;
import android.app.*;import android.os.*;import android.content.*;import android.graphics.Color;import android.view.*;import android.widget.*;
public class LiveTvActivity extends Activity{ public void onCreate(Bundle b){super.onCreate(b);LinearLayout r=new LinearLayout(this);r.setOrientation(LinearLayout.VERTICAL);r.setPadding(24,24,24,24);r.setBackgroundColor(Color.BLACK);TextView t=new TextView(this);t.setText("Live TV - Kristal Streams");t.setTextColor(Color.WHITE);t.setTextSize(26);r.addView(t);String[] chans={"Sample Channel 1","Sample Channel 2","Sample Channel 3","Open Multi-View"};ListView list=new ListView(this);list.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_list_item_1,chans));r.addView(list,new LinearLayout.LayoutParams(-1,0,1));list.setOnItemClickListener((a,v,pos,id)->{ if(pos==3)startActivity(new Intent(this,MultiViewActivity.class)); else {Intent in=new Intent(this,PlayerActivity.class);in.putExtra("title",chans[pos]);in.putExtra("url","");startActivity(in);} });setContentView(r);} }
'@; ^
Set-Content -Encoding UTF8 -Path "$d\MultiViewActivity.java" -Value @'
package com.kristalstreams.player;
import android.app.*;import android.os.*;import android.graphics.Color;import android.view.*;import android.widget.*;import androidx.media3.exoplayer.ExoPlayer;import androidx.media3.ui.PlayerView;import androidx.media3.common.MediaItem;
public class MultiViewActivity extends Activity{
 GridLayout grid; PlayerView[] views=new PlayerView[4]; ExoPlayer[] players=new ExoPlayer[4]; int active=0, count=4;
 String[] demo={"http://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8","https://test-streams.mux.dev/test_001/stream.m3u8","http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",""};
 public void onCreate(Bundle b){super.onCreate(b);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);LinearLayout root=new LinearLayout(this);root.setBackgroundColor(Color.BLACK);root.setOrientation(LinearLayout.HORIZONTAL);
  LinearLayout side=new LinearLayout(this);side.setOrientation(LinearLayout.VERTICAL);side.setPadding(12,12,12,12);side.setBackgroundColor(0xff120000);TextView title=new TextView(this);title.setText("KS Multi-View");title.setTextColor(Color.WHITE);title.setTextSize(20);side.addView(title);
  for(int i=1;i<=4;i++){final int n=i;Button btt=new Button(this);btt.setText(i+" Screen");btt.setOnClickListener(v->{count=n;layoutGrid();});side.addView(btt);} 
  String[] chans={"Add Sample 1","Add Sample 2","Add Sample 3","Clear Tile"};ListView list=new ListView(this);list.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_list_item_1,chans));side.addView(list,new LinearLayout.LayoutParams(260,0,1));list.setOnItemClickListener((a,v,pos,id)->{ if(pos==3)clear(active); else play(active,demo[pos]); active=(active+1)%count;});
  grid=new GridLayout(this);grid.setColumnCount(2);grid.setRowCount(2);root.addView(side,new LinearLayout.LayoutParams(300,-1));root.addView(grid,new LinearLayout.LayoutParams(0,-1,1));setContentView(root);layoutGrid();}
 void layoutGrid(){grid.removeAllViews();for(int i=0;i<count;i++){final int idx=i;FrameLayout frame=new FrameLayout(this);frame.setPadding(4,4,4,4);views[i]=new PlayerView(this);views[i].setUseController(true);views[i].setBackgroundColor(0xff202020);TextView lab=new TextView(this);lab.setText("Tile "+(i+1));lab.setTextColor(Color.WHITE);lab.setBackgroundColor(0x99000000);frame.addView(views[i],new FrameLayout.LayoutParams(-1,-1));frame.addView(lab);frame.setOnClickListener(v->{active=idx;});int w=(count==1)?-1:0;int h=(count<=2)?-1:0;GridLayout.LayoutParams lp=new GridLayout.LayoutParams();lp.width=(count==1)?GridLayout.LayoutParams.MATCH_PARENT:0;lp.height=(count<=2)?GridLayout.LayoutParams.MATCH_PARENT:0;lp.columnSpec=GridLayout.spec(GridLayout.UNDEFINED,1f);lp.rowSpec=GridLayout.spec(GridLayout.UNDEFINED,1f);grid.addView(frame,lp);}}
 void play(int i,String url){try{clear(i);players[i]=new ExoPlayer.Builder(this).build();views[i].setPlayer(players[i]);players[i].setMediaItem(MediaItem.fromUri(url));players[i].prepare();players[i].play();}catch(Exception e){Toast.makeText(this,e.getMessage(),0).show();}}
 void clear(int i){if(players[i]!=null){players[i].release();players[i]=null;}if(views[i]!=null)views[i].setPlayer(null);} public void onDestroy(){for(int i=0;i<4;i++)clear(i);super.onDestroy();}
}
'@; ^
Set-Content -Encoding UTF8 -Path "$d\PlayerActivity.java" -Value @'
package com.kristalstreams.player;
import android.app.*;import android.os.*;import android.graphics.Color;import android.view.*;import android.widget.*;import androidx.media3.exoplayer.ExoPlayer;import androidx.media3.ui.PlayerView;import androidx.media3.common.MediaItem;
public class PlayerActivity extends Activity{ExoPlayer p; public void onCreate(Bundle b){super.onCreate(b);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);PlayerView pv=new PlayerView(this);pv.setBackgroundColor(Color.BLACK);setContentView(pv);String url=getIntent().getStringExtra("url");if(url!=null&&url.length()>0){p=new ExoPlayer.Builder(this).build();pv.setPlayer(p);p.setMediaItem(MediaItem.fromUri(url));p.prepare();p.play();}else Toast.makeText(this,"Player ready. IPTV URL will be wired next.",1).show();} public void onDestroy(){if(p!=null)p.release();super.onDestroy();}}
'@"
if errorlevel 1 goto FAIL

echo Checking Android SDK...
if defined ANDROID_HOME if exist "%ANDROID_HOME%\platforms" goto SDK_FOUND
if defined ANDROID_SDK_ROOT if exist "%ANDROID_SDK_ROOT%\platforms" (set "ANDROID_HOME=%ANDROID_SDK_ROOT%"& goto SDK_FOUND)
if exist "%LOCALAPPDATA%\Android\Sdk\platforms" (set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"& goto SDK_FOUND)
echo ERROR: Android SDK not found. Expected %LOCALAPPDATA%\Android\Sdk
goto FAIL
:SDK_FOUND
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
echo Android SDK: %ANDROID_HOME%

echo Detecting highest installed Android platform...
set "BESTSDK="
for /f "tokens=*" %%D in ('dir /b "%ANDROID_HOME%\platforms" 2^>nul ^| findstr /r "^android-[0-9][0-9]*$"') do (set "P=%%D"& set "BESTSDK=!P:android-=!")
if defined BESTSDK powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Content '%PROJECT%\app\build.gradle') -replace 'compileSdk [0-9]+','compileSdk !BESTSDK!' -replace 'targetSdk [0-9]+','targetSdk !BESTSDK!' | Set-Content '%PROJECT%\app\build.gradle'"

echo Checking Java...
java -version
if errorlevel 1 goto FAIL

echo Looking for the same Gradle wrapper style...
set "GRADLE_CMD="
for %%G in (
  "C:\KristalStreams168-R2-WORKING\gradlew.bat"
  "C:\ksserieslandscapebuttonverify-20260825-065729\gradlew.bat"
  "%USERPROFILE%\Downloads\KristalStreams168-R2-WORKING\gradlew.bat"
  "%USERPROFILE%\Desktop\KristalStreams168-R2-WORKING\gradlew.bat"
) do (
  if exist %%~G (
    echo Found old Gradle wrapper: %%~G
    copy /y %%~G "%PROJECT%\gradlew.bat" >nul
    set "OLDROOT=%%~dpG"
    if exist "!OLDROOT!gradle\wrapper\gradle-wrapper.jar" (
      mkdir "%PROJECT%\gradle\wrapper" >nul 2>nul
      copy /y "!OLDROOT!gradle\wrapper\gradle-wrapper.jar" "%PROJECT%\gradle\wrapper\gradle-wrapper.jar" >nul
      copy /y "!OLDROOT!gradle\wrapper\gradle-wrapper.properties" "%PROJECT%\gradle\wrapper\gradle-wrapper.properties" >nul
      set "GRADLE_CMD=%PROJECT%\gradlew.bat"
      goto BUILD
    )
  )
)

where gradle >nul 2>nul
if %errorlevel%==0 set "GRADLE_CMD=gradle"& goto BUILD

echo ERROR: Gradle wrapper not found from old Kristal/R2 folders.
echo This builder did NOT download Gradle. That keeps the workflow from changing.
echo Send me this screen and we will point it to the exact old working folder.
goto FAIL

:BUILD
echo Building APK using: %GRADLE_CMD%
cd /d "%PROJECT%"
call "%GRADLE_CMD%" --no-daemon clean assembleDebug
if errorlevel 1 goto FAIL
if not exist "%PROJECT%\app\build\outputs\apk\debug\app-debug.apk" goto FAIL
copy /y "%PROJECT%\app\build\outputs\apk\debug\app-debug.apk" "%OUTAPK%" >nul
echo.
echo ============================================================
echo BUILD SUCCESSFUL
echo APK created on Desktop:
echo %OUTAPK%
echo ============================================================
pause
exit /b 0

:FAIL
echo.
echo BUILD STOPPED OR FAILED.
echo Send me the last 30-40 lines from this window.
echo.
pause
exit /b 1
