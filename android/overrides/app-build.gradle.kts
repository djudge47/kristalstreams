plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kristalstreams.player"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.kristalstreams.player"
        minSdk = 23
        targetSdk = 35
        versionCode = 29
        versionName = "1.6.8-rc1-r4"
    }

    buildFeatures {
        viewBinding = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlin {
        jvmToolchain(11)
    }
}

// Restore real visual assets recovered from the user's known-good APK.
// The GitHub workflow reconstructs android/player on every run, so these are
// applied at Gradle configuration time after that reconstruction is complete.
val goodAssetsDir = rootProject.projectDir.parentFile.resolve("good-apk-assets")
val appResDir = project.projectDir.resolve("src/main/res")

fun decodeGoodAsset(sourceName: String): ByteArray? {
    val source = goodAssetsDir.resolve(sourceName)
    if (!source.isFile) return null
    return java.util.Base64.getMimeDecoder().decode(source.readText().trim())
}

fun removeResourceCopies(baseName: String, folderPrefix: String) {
    appResDir.listFiles()?.filter { it.isDirectory && it.name.startsWith(folderPrefix) }?.forEach { dir ->
        dir.listFiles()?.filter { it.nameWithoutExtension == baseName }?.forEach { it.delete() }
    }
}

fun restoreDrawable(sourceName: String, resourceName: String) {
    val bytes = decodeGoodAsset(sourceName) ?: return
    removeResourceCopies(resourceName, "drawable")
    val outDir = appResDir.resolve("drawable-nodpi").apply { mkdirs() }
    outDir.resolve("$resourceName.png").writeBytes(bytes)
    println("Restored good APK drawable: $resourceName")
}

fun restoreLauncher() {
    val bytes = decodeGoodAsset("ic_launcher.png.b64") ?: return
    listOf("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi").forEach { folder ->
        val dir = appResDir.resolve(folder).apply { mkdirs() }
        dir.resolve("ic_launcher.png").writeBytes(bytes)
        dir.resolve("ic_launcher_round.png").writeBytes(bytes)
    }
    removeResourceCopies("ic_launcher", "mipmap")
    removeResourceCopies("ic_launcher_round", "mipmap")
    listOf("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi").forEach { folder ->
        val dir = appResDir.resolve(folder).apply { mkdirs() }
        dir.resolve("ic_launcher.png").writeBytes(bytes)
        dir.resolve("ic_launcher_round.png").writeBytes(bytes)
    }
    println("Restored good APK launcher icon")
}

restoreLauncher()
restoreDrawable("official_live_tv.png.b64", "official_live_tv")
restoreDrawable("official_live_tv.png.b64", "official_live_tv_focused")
restoreDrawable("official_movies.png.b64", "official_movies")
restoreDrawable("official_movies.png.b64", "official_movies_focused")

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")
}
