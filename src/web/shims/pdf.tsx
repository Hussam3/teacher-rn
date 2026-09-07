/**
 * محاكي عرض PDF على الويب — iframe يستخدم عارض PDF المدمج في المتصفح.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { resolveFileUri } from './blobUtil';

interface PdfProps {
  source?: { uri?: string; cache?: boolean } | null;
  style?: any;
  onLoad?: (e: { nativeEvent: { numberOfPages: number } }) => void;
  onError?: (e: { message: string }) => void;
  trustAllCerts?: boolean;
}

export default function Pdf({ source, style, onLoad, onError }: PdfProps) {
  const rawUri = source?.uri;
  if (!rawUri) {
    return <View style={style} />;
  }
  const uri = resolveFileUri(rawUri);
  return (
    <View style={[styles.container, style]}>
      <iframe
        src={uri}
        style={iframeStyle}
        title="PDF"
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onLoad={() => onLoad?.({ nativeEvent: { numberOfPages: 1 } })}
        onError={() => onError?.({ message: 'تعذر تحميل الملف' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

const iframeStyle: React.CSSProperties = { flex: 1, width: '100%', height: '100%', border: 'none' };