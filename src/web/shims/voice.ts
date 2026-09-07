/**
 * محاكي التعرف على الصوت على الويب — عبر Web Speech API.
 */
export interface SpeechResultsEvent {
  value?: string[];
}

export interface SpeechErrorEvent {
  error?: { message?: string };
}

type SpeechResultHandler = (e: SpeechResultsEvent) => void;
type SpeechErrorHandler = (e: SpeechErrorEvent) => void;

class WebVoice {
  private recognition: any = null;
  private isListening = false;
  private currentLocale = 'ar-IQ';

  onSpeechResults: SpeechResultHandler | null = null;
  onSpeechPartialResults: SpeechResultHandler | null = null;
  onSpeechError: SpeechErrorHandler | null = null;
  onSpeechStart: (() => void) | null = null;
  onSpeechEnd: (() => void) | null = null;

  private teardown() {
    this.isListening = false;
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try {
        rec.abort();
      } catch {
        /* تجاهل */
      }
    }
  }

  private createRecognition(locale: string): any {
    const w = typeof window !== 'undefined' ? (window as any) : {};
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      throw new Error('Web Speech API غير مدعوم في هذا المتصفح');
    }
    const rec = new Ctor();
    rec.lang = locale || 'ar-IQ';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    return rec;
  }

  private bindEvents(rec: any) {
    rec.onresult = (e: any) => {
      if (!e?.results) return;
      const resultIndex = typeof e.resultIndex === 'number' ? e.resultIndex : 0;
      for (let i = resultIndex; i < e.results.length; i++) {
        const item = e.results[i];
        if (!item) continue;
        const transcript = item[0]?.transcript?.trim();
        if (!transcript) continue;
        if (item.isFinal) {
          this.onSpeechResults?.({ value: [transcript] });
        } else {
          this.onSpeechPartialResults?.({ value: [transcript] });
        }
      }
    };

    rec.onstart = () => {
      this.onSpeechStart?.();
    };

    rec.onerror = (e: any) => {
      const errCode = e?.error;
      if (errCode === 'no-speech' || errCode === 'aborted') {
        return;
      }
      this.isListening = false;
      if (this.onSpeechError) {
        this.onSpeechError({ error: { message: errCode ?? 'speech-error' } });
      }
    };

    rec.onend = () => {
      if (this.isListening) {
        // إعادة التشغيل تلقائياً للاستماع المستمر عند توقف المتصفح المؤقت
        try {
          const newRec = this.createRecognition(this.currentLocale);
          this.bindEvents(newRec);
          this.recognition = newRec;
          newRec.start();
          return;
        } catch {
          this.isListening = false;
        }
      }
      this.recognition = null;
      this.onSpeechEnd?.();
    };
  }

  async start(locale?: string): Promise<void> {
    this.teardown();
    this.isListening = true;
    this.currentLocale = locale ?? 'ar-IQ';
    const rec = this.createRecognition(this.currentLocale);
    this.bindEvents(rec);
    this.recognition = rec;
    rec.start();
  }

  async stop(): Promise<void> {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* تجاهل */
      }
      this.recognition = null;
    }
    this.onSpeechEnd?.();
  }

  async destroy(): Promise<void> {
    this.isListening = false;
    this.teardown();
  }

  async removeAllListeners(): Promise<void> {
    this.onSpeechResults = null;
    this.onSpeechPartialResults = null;
    this.onSpeechError = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
  }
}

export default new WebVoice();