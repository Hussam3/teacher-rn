const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'build') {
        processDir(fullPath);
      }
    } else if (entry.name === 'build.gradle') {
      patchBuildGradle(fullPath);
    }
  }
}

function patchBuildGradle(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Comment out explicit kotlin plugins that conflict with com.facebook.react
  if (content.includes('apply plugin: "org.jetbrains.kotlin.android"') ||
      content.includes("apply plugin: 'org.jetbrains.kotlin.android'") ||
      content.includes('apply plugin: "kotlin-android"') ||
      content.includes("apply plugin: 'kotlin-android'")) {
    content = content.replace(/apply\s+plugin:\s*["']org\.jetbrains\.kotlin\.android["']/g, '// apply plugin: "org.jetbrains.kotlin.android"');
    content = content.replace(/apply\s+plugin:\s*["']kotlin-android["']/g, '// apply plugin: "kotlin-android"');
    changed = true;
  }

  // 2. Remove kotlinOptions block inside android {} which fails without kotlin plugin in AGP 8+
  if (content.includes('kotlinOptions {') || content.includes('kotlinOptions{')) {
    content = content.replace(/kotlinOptions\s*\{[^}]*\}/g, '// kotlinOptions removed for AGP 8+');
    changed = true;
  }

  // 3. Remove obsolete fix-prefab.gradle scripts
  if (content.includes('fix-prefab.gradle')) {
    content = content.replace(/apply\s+from:\s*["'].*fix-prefab\.gradle["']/g, '// fix-prefab removed for AGP 8+');
    changed = true;
  }

  // 4. Remove ksp plugin and ksp dependencies in async-storage
  if (content.includes("apply plugin: 'com.google.devtools.ksp'") || content.includes('apply plugin: "com.google.devtools.ksp"')) {
    content = content.replace(/apply\s+plugin:\s*["']com\.google\.devtools\.ksp["']/g, '// ksp removed for RN 0.87');
    content = content.replace(/^\s*ksp\s+["'].*room-compiler.*["']/gm, '// ksp room compiler removed');
    changed = true;
  }

  // 5. Replace jcenter() with mavenCentral()
  if (content.includes('jcenter()')) {
    content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
    changed = true;
  }

  // 6. Replace proguard-android.txt with proguard-android-optimize.txt for AGP 8.8+
  if (content.includes('proguard-android.txt')) {
    content = content.replace(/proguard-android\.txt/g, 'proguard-android-optimize.txt');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Patched:', filePath);
  }
}

function patchVoiceModule() {
  const distFile = path.join(__dirname, '../node_modules/@react-native-voice/voice/dist/index.js');
  if (fs.existsSync(distFile)) {
    let content = fs.readFileSync(distFile, 'utf8');
    if (!content.includes('NativeModules.RCTVoice')) {
      content = content.replace(
        /const Voice = react_native_1\.NativeModules\.Voice;/g,
        'const Voice = react_native_1.NativeModules.Voice || react_native_1.NativeModules.RCTVoice;'
      );
      content = content.replace(
        /const voiceEmitter = react_native_1\.Platform\.OS !== ['"]web['"] \? new react_native_1\.NativeEventEmitter\(Voice\) : null;/g,
        'const voiceEmitter = react_native_1.Platform.OS !== "web" && Voice ? new react_native_1.NativeEventEmitter(Voice) : null;'
      );
      fs.writeFileSync(distFile, content, 'utf8');
      console.log('✅ Patched @react-native-voice/voice dist/index.js');
    }
  }

  const srcFile = path.join(__dirname, '../node_modules/@react-native-voice/voice/src/index.ts');
  if (fs.existsSync(srcFile)) {
    let content = fs.readFileSync(srcFile, 'utf8');
    if (!content.includes('NativeModules.RCTVoice')) {
      content = content.replace(
        /const Voice = NativeModules\.Voice as VoiceModule;/g,
        'const Voice = (NativeModules.Voice || NativeModules.RCTVoice) as VoiceModule;'
      );
      content = content.replace(
        /const voiceEmitter =\s*Platform\.OS !== ['"]web['"] \? new NativeEventEmitter\(Voice\) : null;/g,
        'const voiceEmitter = Platform.OS !== "web" && Voice ? new NativeEventEmitter(Voice) : null;'
      );
      fs.writeFileSync(srcFile, content, 'utf8');
      console.log('✅ Patched @react-native-voice/voice src/index.ts');
    }
  }

  const javaFile = path.join(__dirname, '../node_modules/@react-native-voice/voice/android/src/main/java/com/wenkesj/voice/VoiceModule.java');
  if (fs.existsSync(javaFile)) {
    let content = fs.readFileSync(javaFile, 'utf8');
    if (!content.includes('@ReactModule')) {
      content = content.replace(
        'public class VoiceModule extends ReactContextBaseJavaModule implements RecognitionListener {',
        'import com.facebook.react.module.annotations.ReactModule;\n\n@ReactModule(name = "RCTVoice")\npublic class VoiceModule extends ReactContextBaseJavaModule implements RecognitionListener {'
      );
      fs.writeFileSync(javaFile, content, 'utf8');
      console.log('✅ Patched VoiceModule.java with @ReactModule annotation');
    }
  }
}

function patchBlobUtilDownload() {
  const javaFile = path.join(
    __dirname,
    '../node_modules/react-native-blob-util/android/src/main/java/com/ReactNativeBlobUtil/Response/ReactNativeBlobUtilFileResp.java',
  );
  if (!fs.existsSync(javaFile)) return;

  let content = fs.readFileSync(javaFile, 'utf8');
  if (content.includes('sink.write(bytes, 0, (int) read);')) return;

  const writeLine = '                    ofStream.write(bytes, 0, (int) read);';
  if (!content.includes(writeLine)) {
    console.warn('Unable to patch react-native-blob-util download response.');
    return;
  }

  content = content.replace(
    writeLine,
    `${writeLine}\n                    sink.write(bytes, 0, (int) read);`,
  );
  fs.writeFileSync(javaFile, content, 'utf8');
  console.log('✅ Patched react-native-blob-util Android file download response');
}

const nodeModulesDir = path.join(__dirname, '../node_modules');
processDir(nodeModulesDir);
patchVoiceModule();
patchBlobUtilDownload();
console.log('Finished scanning and patching node_modules.');
