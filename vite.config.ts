/**
 * إعدادات Vite لبناء الويب — يوجّه مكتبات React Native الأصلية إلى محاكيات الويب.
 */
import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import reactNativeWeb from 'vite-plugin-react-native-web';

const shim = (file: string) => path.resolve(__dirname, 'src/web/shims', file);

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  plugins: [reactNativeWeb(), react()],
  resolve: {
    alias: {
      'react-native-mmkv': shim('mmkv.ts'),
      'react-native-haptic-feedback': shim('haptics.ts'),
      '@react-native-voice/voice': shim('voice.ts'),
      'react-native-pdf': shim('pdf.tsx'),
      'react-native-print': shim('print.ts'),
      'react-native-share': shim('share.ts'),
      'react-native-blob-util': shim('blobUtil.ts'),
      '@react-native-documents/picker': shim('docPicker.ts'),
      '@notifee/react-native': shim('notifee.ts'),
      'react-native-html-to-pdf': shim('htmlToPdf.ts'),
      'react-native-webview': shim('webview.tsx'),
      'react-native-vector-icons/MaterialIcons': shim('MaterialIcons.tsx'),
      'react-native-vector-icons/MaterialCommunityIcons': shim('MaterialCommunityIcons.tsx'),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: '../dist-web',
    sourcemap: false,
  },
});