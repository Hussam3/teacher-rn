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
    } else if (entry.name === 'build.gradle' || entry.name.endsWith('+autolinking.gradle')) {
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

  if (!content.includes('kotlin.srcDirs +=')) {
    const withKotlinSourceDirs = content.replace(
      /([ \t]*)java\.srcDirs \+= (\[[\s\S]*?\])/g,
      (block, indent, dirs) => {
        if (!/newarch|oldarch|kotlin/i.test(dirs)) return block;
        return `${block}\n${indent}kotlin.srcDirs += ${dirs}`;
      },
    );
    if (withKotlinSourceDirs !== content) {
      content = withKotlinSourceDirs;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Patched:', filePath);
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

function patchPrintAndroidSdk() {
  const gradleFile = path.join(
    __dirname,
    '../node_modules/react-native-print/android/build.gradle',
  );
  if (!fs.existsSync(gradleFile)) return;

  const original = fs.readFileSync(gradleFile, 'utf8');
  const content = original
    .replace(/buildToolsVersion\s*=\s*["']31\.0\.0["']/, 'buildToolsVersion = "36.0.0"')
    .replace(/compileSdkVersion\s*=\s*31\b/, 'compileSdkVersion = 36');

  if (content !== original) {
    fs.writeFileSync(gradleFile, content, 'utf8');
    console.log('✅ Patched react-native-print Android SDK versions');
  }
}

function patchMmkvPrefabOrdering() {
  const gradleFile = path.join(
    __dirname,
    '../node_modules/react-native-mmkv/android/build.gradle',
  );
  if (!fs.existsSync(gradleFile)) return;

  const original = fs.readFileSync(gradleFile, 'utf8');
  const marker = 'task.dependsOn(":react-native-nitro-modules:prefab${variantName}Package")';
  if (original.includes(marker)) return;

  const dependencyBlock = [
    '',
    'tasks.configureEach { task ->',
    '  if (task.name.startsWith("configureCMake")) {',
    '    def variantName = task.name.contains("Debug") ? "Debug" : "Release"',
    `    ${marker}`,
    '  }',
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(gradleFile, `${original.trimEnd()}\n${dependencyBlock}`, 'utf8');
  console.log('✅ Patched react-native-mmkv Prefab task ordering');
}

const nodeModulesDir = path.join(__dirname, '../node_modules');
processDir(nodeModulesDir);
patchBlobUtilDownload();
patchPrintAndroidSdk();
patchMmkvPrefabOrdering();
console.log('Finished scanning and patching node_modules.');
