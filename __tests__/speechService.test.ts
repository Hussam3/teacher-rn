jest.mock('react-native', () => {
  const mockListeners = new Map();
  return {
    Platform: { OS: 'android' },
    NativeModules: {
      SpeechRecognition: {
        start: jest.fn(),
        cancel: jest.fn(),
        destroy: jest.fn(),
      },
    },
    DeviceEventEmitter: {
      addListener: jest.fn((name, listener) => {
        mockListeners.set(name, listener);
        return { remove: jest.fn() };
      }),
    },
    PermissionsAndroid: {
      PERMISSIONS: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
      RESULTS: { GRANTED: 'granted' },
      check: jest.fn().mockResolvedValue(true),
      request: jest.fn(),
    },
    __listeners: mockListeners,
  };
});

jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {},
}));

import { startDictation, stopDictation } from '../src/services/speechService';

const mockReactNative = jest.requireMock('react-native') as {
  NativeModules: {
    SpeechRecognition: {
      start: jest.Mock;
      cancel: jest.Mock;
      destroy: jest.Mock;
    };
  };
  __listeners: Map<string, (event: unknown) => void>;
};
const mockSpeechRecognition = mockReactNative.NativeModules.SpeechRecognition;

function emitSpeechEvent(event: string, payload: unknown = {}): void {
  const listener = mockReactNative.__listeners.get(event);
  if (!listener) throw new Error(`Missing listener for ${event}`);
  listener(payload);
}

describe('continuous dictation', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSpeechRecognition.start.mockResolvedValue(undefined);
    mockSpeechRecognition.cancel.mockResolvedValue(undefined);
    mockSpeechRecognition.destroy.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await stopDictation();
    jest.useRealTimers();
  });

  it('waits for the final result after speech end before restarting', async () => {
    const onResult = jest.fn();
    await startDictation({ onResult });

    emitSpeechEvent('teacherbagSpeechEnd');
    jest.advanceTimersByTime(500);
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1);
    expect(mockSpeechRecognition.destroy).not.toHaveBeenCalled();

    emitSpeechEvent('teacherbagSpeechResults', { value: ['السؤال الأول'] });
    expect(onResult).toHaveBeenCalledWith('السؤال الأول');

    jest.advanceTimersByTime(299);
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);
    expect(mockSpeechRecognition.destroy).not.toHaveBeenCalled();
  });

  it('keeps the session active through silent recognition timeouts', async () => {
    const onResult = jest.fn();
    await startDictation({ onResult });

    emitSpeechEvent('teacherbagSpeechError', {
      error: { message: '6/No speech input' },
    });
    jest.advanceTimersByTime(449);
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);

    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('continues safely when a recognition result contains no text', async () => {
    const onResult = jest.fn();
    await startDictation({ onResult });

    emitSpeechEvent('teacherbagSpeechResults', { value: [] });
    jest.advanceTimersByTime(450);

    expect(onResult).not.toHaveBeenCalled();
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);
  });

  it('uses the requested Arabic locale and extended silence settings', async () => {
    await startDictation({ onResult: jest.fn(), locale: 'ar-SA' });

    expect(mockSpeechRecognition.start).toHaveBeenCalledWith(
      'ar-SA',
      expect.objectContaining({
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 4_500,
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 8_000,
      }),
    );
  });
});
