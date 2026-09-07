/**
 * خدمة الإملاء الصوتي المتقدم — مصممة خصيصاً لمحرر الأسئلة لتمكين الاستماع المستمر بدون انقطاع.
 *
 * المزايا:
 * 1. استماع مستمر (Continuous Dictation) يعيد تشغيل نفسه بعد وصول النتيجة النهائية.
 * 2. معالجة ذكية للأخطاء الصامتة (تجاهل أخطاء no-speech و timeouts مؤقتاً لتسهيل التفكير أثناء الإملاء).
 * 3. انتظار نتيجة Android النهائية بعد انتهاء الكلام حتى لا تُقطع الجملة أثناء معالجتها.
 * 4. توافقية كاملة مع نظام أندرويد والويب.
 */
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import * as RN from 'react-native';
import Voice from '@react-native-voice/voice';

export type DictationStatus = 'listening' | 'processing' | 'restarting' | 'idle';

export interface DictationCallbacks {
  /** نتيجة نهائية تم التعرف عليها */
  onResult: (text: string) => void;
  /** نتيجة جزئية فورية للمعاينة اللحظية أثناء الكلام */
  onPartialResult?: (text: string) => void;
  /** إشعار ببدء الاستماع الفعلي */
  onStart?: () => void;
  /** إشعار بانتهاء الجلسة الصريحة */
  onEnd?: () => void;
  /** إشعار بحدوث خطأ حقيقي يستدعي تنبيه المعلم */
  onError?: (message: string) => void;
  /** إشعار بتغير حالة المحرك */
  onStatusChange?: (status: DictationStatus) => void;
  /** اللهجة المطلوبة؛ عند عدم تحديدها تُستخدم لهجة الجهاز العربية إن توفرت. */
  locale?: 'ar-IQ' | 'ar-SA';
}

interface SpeechResultsEvent {
  value?: string[];
}

interface SpeechErrorEvent {
  error?: { message?: string };
}

interface AndroidSpeechRecognitionModule {
  start(locale: string, options: Record<string, unknown>): Promise<void>;
  cancel(): Promise<void>;
  destroy(): Promise<void>;
}

const androidSpeechRecognition = NativeModules
  .SpeechRecognition as AndroidSpeechRecognitionModule | undefined;
const isAndroidNativeRecognizer = Platform.OS === 'android';
const NATIVE_EVENTS = {
  start: 'teacherbagSpeechStart',
  end: 'teacherbagSpeechEnd',
  results: 'teacherbagSpeechResults',
  partialResults: 'teacherbagSpeechPartialResults',
  error: 'teacherbagSpeechError',
} as const;

// الحالة الداخلية للجلسة
let activeCallbacks: DictationCallbacks | null = null;
let isDictationActive = false;
let restartTimer: ReturnType<typeof setTimeout> | null = null;
let finalResultTimer: ReturnType<typeof setTimeout> | null = null;
let consecutiveSilenceCount = 0;
let launchInProgress = false;
let hasFinalResultForTurn = false;

const FINAL_RESULT_GRACE_MS = 1_200;
const RESULT_RESTART_DELAY_MS = 300;
const SILENCE_RESTART_BASE_MS = 450;
const MAX_SILENCE_RESTART_DELAY_MS = 1_500;
const VOICE_START_OPTIONS = {
  EXTRA_MAX_RESULTS: 1,
  EXTRA_PARTIAL_RESULTS: true,
  // Keep natural Arabic pauses from being reported as a no-speech timeout.
  EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 10_000,
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 4_500,
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 8_000,
};

function preferredLocales(): string[] {
  const requested = activeCallbacks?.locale;
  if (requested) return [requested, requested === 'ar-IQ' ? 'ar-SA' : 'ar-IQ', 'ar'];

  const deviceLocale = String(
    (NativeModules.I18nManager as { localeIdentifier?: string } | undefined)
      ?.localeIdentifier ??
      (typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : ''),
  ).replace('_', '-');
  const primary = deviceLocale.toLowerCase().startsWith('ar-sa') ? 'ar-SA' : 'ar-IQ';
  return [primary, primary === 'ar-IQ' ? 'ar-SA' : 'ar-IQ', 'ar'];
}

function mapErrorMessage(msg?: string): string {
  if (!msg) return 'تعذر التعرف على الصوت، يرجى المحاولة ثانية';
  const str = String(msg).toLowerCase();
  if (
    str.includes('not available') ||
    str.includes('recognition service') ||
    str.includes('no recognizer') ||
    str.includes('recognizer not found') ||
    str.includes('binding') ||
    str.includes('service_not_available')
  ) {
    return 'خدمة التعرف على الصوت غير مفعّلة. يرجى تفعيل تطبيق Google أو Google Speech Services على هاتفك.';
  }
  if (
    str.includes('7') ||
    str.includes('no match') ||
    str.includes('nomatch') ||
    str.includes('no-speech')
  ) {
    return 'لم يتم تمييز أي صوت، تحدث بوضوح بالقرب من الميكروفون';
  }
  if (str.includes('6') || str.includes('timeout')) {
    return 'انتهت مهلة الاستماع دون التقاط صوت';
  }
  if (
    str.includes('9') ||
    str.includes('permission') ||
    str.includes('not-allowed') ||
    str.includes('service-not-allowed')
  ) {
    return 'يرجى تفعيل إذن الميكروفون من إعدادات الهاتف أو المتصفح';
  }
  if (str.includes('5') || str.includes('client') || str.includes('busy')) {
    return 'خدمة التعرف على الصوت مشغولة حالياً، يرجى المحاولة بعد لحظات';
  }
  if (str.includes('3') || str.includes('audio')) {
    return 'خطأ في تسجيل الصوت، تأكد من عدم استخدام تطبيق آخر للميكروفون';
  }
  if (str.includes('network') || str.includes('1') || str.includes('2')) {
    return 'خطأ في الاتصال بالإنترنت اللازم لخدمة التعرف على الصوت';
  }
  if (
    str.includes('startspeech') ||
    str.includes('null') ||
    str.includes('undefined') ||
    str.includes('cannot read property') ||
    str.includes('native module')
  ) {
    return 'محرك الصوت غير مدمج في هذا التثبيت، يرجى تثبيت أحدث نسخة APK من التطبيق.';
  }
  if (str.includes('not-supported') || str.includes('غير مدعوم')) {
    return 'ميزة التعرف على الصوت غير مدعومة في هذا المتصفح';
  }
  return `تعذر التعرف على الصوت: ${msg}`;
}

async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const PermissionsAndroid = Reflect.get(RN, 'PermissionsAndroid') as Record<string, any> | undefined;
  if (!PermissionsAndroid) return true;
  try {
    const isGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (isGranted) return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'إذن الميكروفون',
        message:
          'يحتاج التطبيق لإذن الميكروفون لتمكين ميزة الكتابة بالصوت وإملاء الأسئلة.',
        buttonPositive: 'موافق',
        buttonNegative: 'إلغاء',
      },
    );
    return (
      granted === PermissionsAndroid.RESULTS.GRANTED ||
      granted === true ||
      granted === 'granted'
    );
  } catch (err) {
    console.warn('Record audio permission error:', err);
    return false;
  }
}

function clearRestartTimer() {
  if (!restartTimer) return;
  clearTimeout(restartTimer);
  restartTimer = null;
}

function clearFinalResultTimer() {
  if (!finalResultTimer) return;
  clearTimeout(finalResultTimer);
  finalResultTimer = null;
}

function silenceRestartDelay(): number {
  return Math.min(
    SILENCE_RESTART_BASE_MS + (consecutiveSilenceCount - 1) * 300,
    MAX_SILENCE_RESTART_DELAY_MS,
  );
}

function finishDictationWithError(message: string) {
  const callbacks = activeCallbacks;
  isDictationActive = false;
  launchInProgress = false;
  hasFinalResultForTurn = false;
  clearRestartTimer();
  clearFinalResultTimer();
  activeCallbacks = null;

  // Cancel first so no late result from the failed session is inserted.
  cancelRecognizer().catch(() => {});
  destroyRecognizer().catch(() => {});
  callbacks?.onError?.(message);
  callbacks?.onEnd?.();
  callbacks?.onStatusChange?.('idle');
}

async function startRecognizer(locale: string): Promise<void> {
  if (isAndroidNativeRecognizer) {
    if (!androidSpeechRecognition) {
      throw new Error('SpeechRecognition native module is unavailable');
    }
    await androidSpeechRecognition.start(locale, VOICE_START_OPTIONS);
    return;
  }
  await Voice.start(locale, VOICE_START_OPTIONS);
}

async function cancelRecognizer(): Promise<void> {
  if (isAndroidNativeRecognizer) {
    await androidSpeechRecognition?.cancel();
    return;
  }
  await Voice.cancel();
}

async function destroyRecognizer(): Promise<void> {
  if (isAndroidNativeRecognizer) {
    await androidSpeechRecognition?.destroy();
    return;
  }
  await Voice.destroy();
}

/** تشغيل محرك التعرف الصوتي بدعم اللهجات */
async function launchNativeVoice(): Promise<boolean> {
  if (!isDictationActive || launchInProgress) return false;

  launchInProgress = true;
  clearFinalResultTimer();
  clearRestartTimer();
  hasFinalResultForTurn = false;

  try {
    const locales = preferredLocales();
    let lastError: unknown = null;

    for (const locale of locales) {
      if (!isDictationActive) return false;
      try {
        // Android sends onSpeechEnd before onSpeechResults. Destroying here was
        // cutting off the final result and making the microphone flap per phrase.
        await startRecognizer(locale);
        if (!isDictationActive) {
          await cancelRecognizer().catch(() => {});
          return false;
        }
        activeCallbacks?.onStatusChange?.('listening');
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (isDictationActive) {
      const message = lastError instanceof Error ? lastError.message : String(lastError ?? '');
      finishDictationWithError(mapErrorMessage(message));
    }
    return false;
  } catch (error) {
    if (isDictationActive) {
      const message = error instanceof Error ? error.message : String(error ?? '');
      finishDictationWithError(mapErrorMessage(message));
    }
    return false;
  } finally {
    launchInProgress = false;
  }
}

/** جدولة إعادة التشغيل بعد اكتمال نتيجة أو انتهاء صامت */
function scheduleAutoRestart(delayMs: number) {
  if (!isDictationActive) return;

  clearFinalResultTimer();
  clearRestartTimer();
  activeCallbacks?.onStatusChange?.('restarting');

  restartTimer = setTimeout(() => {
    restartTimer = null;
    if (!isDictationActive || launchInProgress) return;
    launchNativeVoice().catch(() => {});
  }, delayMs);
}

/** ينتظر Android ليُرسل onSpeechResults بعد onSpeechEnd قبل البدء من جديد. */
function waitForFinalResult() {
  if (!isDictationActive || hasFinalResultForTurn) return;

  clearFinalResultTimer();
  activeCallbacks?.onStatusChange?.('processing');
  finalResultTimer = setTimeout(() => {
    finalResultTimer = null;
    if (!isDictationActive || hasFinalResultForTurn) return;
    consecutiveSilenceCount++;
    scheduleAutoRestart(silenceRestartDelay());
  }, FINAL_RESULT_GRACE_MS);
}

// ----------------------------------------------------
// ربط أحداث Voice
// ----------------------------------------------------

function handleSpeechStart() {
  if (!isDictationActive) return;
  activeCallbacks?.onStart?.();
  activeCallbacks?.onStatusChange?.('listening');
}

function handleSpeechResults(e: SpeechResultsEvent) {
  if (!isDictationActive || hasFinalResultForTurn) return;
  hasFinalResultForTurn = true;
  clearFinalResultTimer();

  const text = e.value?.[0];
  if (text && text.trim()) {
    // تم التقاط كلام حقيقي -> تصفير عداد الصمت.
    consecutiveSilenceCount = 0;
    activeCallbacks?.onResult(text.trim());
  }

  // Web Speech API is natively continuous. Android sessions are not, so only
  // Android needs a new recognition turn after the final result arrives.
  if (Platform.OS !== 'web') {
    scheduleAutoRestart(RESULT_RESTART_DELAY_MS);
  }
}

function handleSpeechPartialResults(e: SpeechResultsEvent) {
  if (!isDictationActive || hasFinalResultForTurn) return;
  const text = e.value?.[0];
  if (text && text.trim()) {
    consecutiveSilenceCount = 0;
    activeCallbacks?.onPartialResult?.(text.trim());
  }
}

function handleSpeechEnd() {
  if (isDictationActive) {
    // هذا ليس نهاية جلسة المستخدم. في Android يأتي هذا الحدث قبل النتيجة
    // النهائية، لذا ننتظرها بدلاً من تدمير المعرّف وفتح الميكروفون من جديد.
    waitForFinalResult();
  } else {
    activeCallbacks?.onEnd?.();
    activeCallbacks?.onStatusChange?.('idle');
  }
}

function handleSpeechError(e: SpeechErrorEvent) {
  if (!isDictationActive || hasFinalResultForTurn) return;

  clearFinalResultTimer();
  const rawMsg = e?.error?.message ?? String(e?.error ?? 'speech-error');
  const str = String(rawMsg).toLowerCase();

  // فحص هل هو مجرد صمت مؤقت (Error 7 / no-match / no-speech / timeout)
  const isSilenceError =
    str.includes('7') ||
    str.includes('6') ||
    str.includes('no match') ||
    str.includes('nomatch') ||
    str.includes('no-speech') ||
    str.includes('timeout');

  if (isSilenceError) {
    consecutiveSilenceCount++;
    // تبقى الجلسة مفتوحة حتى لو توقف المعلم للتفكير؛ نُبطئ المحاولات فقط.
    scheduleAutoRestart(silenceRestartDelay());
    return;
  }

  // أخطاء حرجة (أذونات، انعدام الخدمة، إلخ)
  finishDictationWithError(mapErrorMessage(rawMsg));
}

if (isAndroidNativeRecognizer) {
  DeviceEventEmitter.addListener(NATIVE_EVENTS.start, handleSpeechStart);
  DeviceEventEmitter.addListener(NATIVE_EVENTS.results, handleSpeechResults);
  DeviceEventEmitter.addListener(
    NATIVE_EVENTS.partialResults,
    handleSpeechPartialResults,
  );
  DeviceEventEmitter.addListener(NATIVE_EVENTS.end, handleSpeechEnd);
  DeviceEventEmitter.addListener(NATIVE_EVENTS.error, handleSpeechError);
} else {
  Voice.onSpeechStart = handleSpeechStart;
  Voice.onSpeechResults = handleSpeechResults;
  Voice.onSpeechPartialResults = handleSpeechPartialResults;
  Voice.onSpeechEnd = handleSpeechEnd;
  Voice.onSpeechError = handleSpeechError;
}

// ----------------------------------------------------
// الدوال العامة المصدّرة
// ----------------------------------------------------

/**
 * بدء جلسة إملاء مستمرة (Continuous Dictation Session)
 */
export async function startDictation(cb: DictationCallbacks): Promise<boolean> {
  try {
    if (isAndroidNativeRecognizer && !androidSpeechRecognition) {
      cb.onError?.(
        'محرك التعرف على الصوت غير مدمج في ملف الـ APK الحالي على هاتفك. يلزم تثبيت ملف APK الأحدث للتطبيق.',
      );
      return false;
    }

    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      cb.onError?.('يرجى منح إذن الميكروفون من إعدادات الهاتف لاستخدام الكتابة بالصوت');
      return false;
    }

    // إيقاف أي جلسة سابقة أولاً، بما في ذلك نتيجة متأخرة قيد المعالجة.
    if (isDictationActive) await stopDictation();

    activeCallbacks = cb;
    isDictationActive = true;
    consecutiveSilenceCount = 0;

    return await launchNativeVoice();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? '');
    if (isDictationActive) {
      finishDictationWithError(mapErrorMessage(message));
    } else {
      cb.onError?.(mapErrorMessage(message));
    }
    return false;
  }
}

/**
 * إيقاف جلسة الإملاء الصوتي بالكامل
 */
export async function stopDictation(): Promise<void> {
  const callbacks = activeCallbacks;
  isDictationActive = false;
  launchInProgress = false;
  hasFinalResultForTurn = false;
  consecutiveSilenceCount = 0;
  activeCallbacks = null;

  clearRestartTimer();
  clearFinalResultTimer();

  try {
    await cancelRecognizer();
  } catch {}
  try {
    await destroyRecognizer();
  } catch {}

  callbacks?.onEnd?.();
  callbacks?.onStatusChange?.('idle');
}

/** الاستعلام عن نشاط الاستماع */
export function isDictationRunning(): boolean {
  return isDictationActive;
}

// ----------------------------------------------------
// للتوافق مع التسميات القديمة
// ----------------------------------------------------
export interface SpeechCallbacks extends DictationCallbacks {}

export async function startListening(cb: SpeechCallbacks): Promise<boolean> {
  return startDictation(cb);
}

export async function stopListening(): Promise<void> {
  return stopDictation();
}

export function isListening(): boolean {
  return isDictationRunning();
}
