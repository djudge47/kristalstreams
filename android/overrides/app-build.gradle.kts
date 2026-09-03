import java.util.Base64

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
        versionCode = 1682194
        versionName = "1.6.8-red-black-1682194"
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

val redesignAssetsDir = rootProject.projectDir.parentFile.resolve("redesign/assets")
val appResDir = project.projectDir.resolve("src/main/res")

fun decodeRedesignAsset(sourceName: String): ByteArray? {
    val source = redesignAssetsDir.resolve(sourceName)
    if (!source.isFile) return null
    return Base64.getMimeDecoder().decode(source.readText().trim())
}

fun removeResourceCopies(baseName: String, folderPrefix: String) {
    appResDir.listFiles()?.filter { it.isDirectory && it.name.startsWith(folderPrefix) }?.forEach { dir ->
        dir.listFiles()?.filter { it.nameWithoutExtension == baseName }?.forEach { it.delete() }
    }
}

fun restoreKristalLauncher() {
    val bytes = decodeRedesignAsset("ks_launcher.png.b64") ?: return
    require(bytes.size >= 8 && bytes[0] == 0x89.toByte() && bytes[1] == 0x50.toByte() && bytes[2] == 0x4E.toByte() && bytes[3] == 0x47.toByte()) {
        "Kristal launcher asset is not a PNG"
    }
    removeResourceCopies("ic_launcher", "mipmap")
    removeResourceCopies("ic_launcher_round", "mipmap")
    listOf("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi").forEach { folder ->
        val dir = appResDir.resolve(folder).apply { mkdirs() }
        dir.resolve("ic_launcher.png").writeBytes(bytes)
        dir.resolve("ic_launcher_round.png").writeBytes(bytes)
    }
    println("Restored Kristal redesign launcher icon")
}

restoreKristalLauncher()

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")
}
