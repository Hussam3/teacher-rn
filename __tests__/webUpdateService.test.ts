jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

type WebUpdateModule = typeof import('../src/services/webUpdateService');

/** المعرّف يُقرأ عند تحميل الوحدة، لذا يُعاد تحميلها بقيمة جديدة لكل حالة. */
function loadModule(buildId: string): WebUpdateModule {
  (globalThis as Record<string, unknown>).__WEB_BUILD_ID__ = buildId;
  let loaded!: WebUpdateModule;
  jest.isolateModules(() => {
    loaded = jest.requireActual('../src/services/webUpdateService');
  });
  return loaded;
}

const LOCAL_BUILD = 'a'.repeat(40);
const REMOTE_BUILD = 'b'.repeat(40);
const MANIFEST_PATH =
  loadModule(LOCAL_BUILD).WEB_BUILD_MANIFEST_PATH;

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('web live updates', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    delete (globalThis as Record<string, unknown>).__WEB_BUILD_ID__;
  });

  it('is enabled only for a web build that carries a build id', () => {
    expect(loadModule(LOCAL_BUILD).isWebUpdateSupported()).toBe(true);
    expect(loadModule('').isWebUpdateSupported()).toBe(false);
    expect(loadModule(LOCAL_BUILD).currentWebBuildId()).toBe(LOCAL_BUILD);
  });

  it('reads the published build manifest without any cache', async () => {
    const { fetchLatestWebBuild: fetchBuild } = loadModule(LOCAL_BUILD);
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({
        version: '1.1.19',
        buildId: REMOTE_BUILD,
        builtAt: '2026-09-27T10:00:00.000Z',
      }),
    );

    await expect(fetchBuild()).resolves.toEqual({
      version: '1.1.19',
      buildId: REMOTE_BUILD,
      builtAt: '2026-09-27T10:00:00.000Z',
    });

    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url.startsWith(MANIFEST_PATH)).toBe(true);
    expect(init.cache).toBe('no-store');
  });

  it('ignores a missing, failed or malformed manifest', async () => {
    const { fetchLatestWebBuild: fetchBuild } = loadModule(LOCAL_BUILD);
    const fetchMock = globalThis.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(jsonResponse({}, false));
    await expect(fetchBuild()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(jsonResponse({ version: '1.1.19' }));
    await expect(fetchBuild()).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(fetchBuild()).resolves.toBeNull();
  });

  it('reports an update only when the published build differs', () => {
    const { isStaleWebBuild: isStale } = loadModule(LOCAL_BUILD);
    expect(isStale({ version: '1.1.19', buildId: REMOTE_BUILD })).toBe(true);
    expect(isStale({ version: '1.1.19', buildId: LOCAL_BUILD })).toBe(false);
    expect(isStale(null)).toBe(false);
  });

  it('applies an update by clearing caches and reloading', async () => {
    const { activateLatestWebBuild: activate } = loadModule(LOCAL_BUILD);
    const unregister = jest.fn().mockResolvedValue(true);
    const deleteCache = jest.fn().mockResolvedValue(true);
    const reload = jest.fn();
    const getRegistrations = jest
      .fn()
      .mockResolvedValue([{ unregister }, { unregister }]);
    const keys = jest
      .fn()
      .mockResolvedValue(['teacher-bag-old', 'teacher-bag-new']);
    (globalThis as Record<string, unknown>).navigator = {
      serviceWorker: { getRegistrations },
    };
    (globalThis as Record<string, unknown>).caches = {
      keys,
      delete: deleteCache,
    };
    (globalThis as Record<string, unknown>).location = { reload };

    await expect(activate()).resolves.toBe(true);

    expect(getRegistrations).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenCalledWith('teacher-bag-old');
    expect(deleteCache).toHaveBeenCalledWith('teacher-bag-new');
    expect(reload).toHaveBeenCalledTimes(1);

    delete (globalThis as Record<string, unknown>).navigator;
    delete (globalThis as Record<string, unknown>).caches;
    delete (globalThis as Record<string, unknown>).location;
  });
});
