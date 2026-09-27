/**
 * إعدادات Vite لبناء الويب — يوجّه مكتبات React Native الأصلية إلى محاكيات الويب.
 *
 * البناء ينتج أيضاً `version.json` (رقم الإصدار + معرّف البناء) ويحقن معرّف البناء
 * داخل الحزمة كـ `__WEB_BUILD_ID__`، لتعمل آلية التحديث الفورية للويب: يفحص التطبيق
 * `version.json` عند كل إقلاع ويكتشف أن نشراً أحدث منه يعمل.
 */
import { defineConfig, type Plugin } from 'vite';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import reactNativeWeb from 'vite-plugin-react-native-web';
import pkg from './package.json';

const shim = (file: string) => path.resolve(__dirname, 'src/web/shims', file);

/**
 * معرّف البناء: أولوية لِـ commit المنشور على Vercel، ثم لـ commit المحلي، ثم
 * طابع زمني. يجب أن يبقى ثابتاً لنفس المصدر حتى لا يُعلَن عن تحديث بلا سبب.
 */
function resolveBuildId(): string {
  const fromEnv = (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    ''
  ).trim();
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return `local-${Date.now().toString(36)}`;
  }
}

/**
 * يكتب بيان البناء للويب: `version.json` لفحص التحديثات، ويختم `sw.js` بمعرّف
 * البناء كي تتخلص ذاكرة التخزين المؤقت من أصول النشر السابق.
 */
function webBuildInfo(version: string, buildId: string): Plugin {
  let outDir = '';
  return {
    name: 'teacher-bag:web-build-info',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(
          { version, buildId, builtAt: new Date().toISOString() },
          null,
          2,
        )}\n`,
      });
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const source = fs.readFileSync(swPath, 'utf8');
      if (!source.includes('__BUILD_ID__')) return;
      fs.writeFileSync(swPath, source.split('__BUILD_ID__').join(buildId));
    },
  };
}

const buildId = resolveBuildId();

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  plugins: [reactNativeWeb(), react(), webBuildInfo(pkg.version, buildId)],
  define: {
    __WEB_BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      'react-native-mmkv': shim('mmkv.ts'),
      'react-native-haptic-feedback': shim('haptics.ts'),
      'react-native-pdf': shim('pdf.tsx'),
      'react-native-print': shim('print.ts'),
      'react-native-share': shim('share.ts'),
      'react-native-blob-util': shim('blobUtil.ts'),
      '@react-native-documents/picker': shim('docPicker.ts'),
      '@notifee/react-native': shim('notifee.ts'),
      'react-native-html-to-pdf': shim('htmlToPdf.ts'),
      'react-native-webview': shim('webview.tsx'),
      'react-native-vector-icons/MaterialIcons': shim('MaterialIcons.tsx'),
      'react-native-vector-icons/MaterialCommunityIcons': shim('MaterialIcons.tsx'),
      '@react-native/assets-registry/registry': shim('assetRegistry.ts'),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: '../dist-web',
    // المخرجات خارج جذر المشروع، فبلا هذا الخيار لا ينظّف Vite المجلد
    // وتتراكم حزم(migrations) البناءات السابقة داخل dist-web.
    emptyOutDir: true,
    sourcemap: false,
  },
});
