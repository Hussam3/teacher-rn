/**
 * محاكي react-native-webview على الويب — iframe بـ srcDoc مع جسر رسائل:
 * يوفر window.ReactNativeWebView.postMessage داخل المستند ويوصّل رسائله
 * إلى onMessage في المكوّن، كما ينفّذ injectedJavaScript بعد التحميل.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

export interface WebViewMessageEvent {
  nativeEvent: { data: string };
}

interface WebViewProps {
  source?: { html?: string; uri?: string } | null;
  style?: any;
  onMessage?: (event: WebViewMessageEvent) => void;
  injectedJavaScript?: string;
  title?: string;
}

const BRIDGE_SCRIPT = `
<script>
  window.ReactNativeWebView = {
    postMessage: function (data) {
      parent.postMessage({ __webview: true, data: String(data) }, '*');
    }
  };
</script>
`;

export function WebView({ source, style, onMessage, injectedJavaScript, title }: WebViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as { __webview?: boolean; data?: unknown } | null;
      if (data && typeof data === 'object' && data.__webview === true) {
        onMessageRef.current?.({ nativeEvent: { data: String(data.data ?? '') } });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!source?.html) {
    if (source?.uri) {
      return (
        <View style={[styles.container, style]}>
          <iframe
            src={source.uri}
            style={iframeStyle}
            title={title ?? 'webview'}
            allow="autoplay; fullscreen; clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </View>
      );
    }
    return <View style={style} />;
  }


  const doc = source.html.replace('</head>', `${BRIDGE_SCRIPT}</head>`);

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={doc}
        style={iframeStyle}
        title={title ?? 'webview'}
        onLoad={() => {
          try {
            const win = iframeRef.current?.contentWindow as any;
            if (win && injectedJavaScript && typeof win.eval === 'function') {
              win.eval(injectedJavaScript);
            }
          } catch {
            // تجاهل — المعاينة تبقى تعمل دون قياس الصفحات على الويب
          }
        }}
      />
    </View>
  );
}

export default WebView;

const styles = StyleSheet.create({
  container: { flex: 1 },
});

const iframeStyle: React.CSSProperties = { flex: 1, width: '100%', height: '100%', border: 'none' };