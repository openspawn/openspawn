import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to re-import each test because getSandboxUrl reads window at import time
describe('getSandboxUrl', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    // Restore window
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
  });

  async function loadGetSandboxUrl() {
    const mod = await import('../sandbox-url');
    return mod.getSandboxUrl;
  }

  it('returns empty string when port is 443', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'app.example.com', port: '443', protocol: 'https:' },
    });
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('');
  });

  it('returns empty string when port is 80', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'app.example.com', port: '80', protocol: 'http:' },
    });
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('');
  });

  it('returns empty string when port is empty', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'app.example.com', port: '', protocol: 'https:' },
    });
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('');
  });

  it('returns http://localhost:3333 when window is undefined', async () => {
    // @ts-expect-error — intentionally removing window
    delete globalThis.window;
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('http://localhost:3333');
    // Restore
    globalThis.window = originalWindow;
  });

  it('returns http://{hostname}:3333 for dev ports like 4200', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'localhost', port: '4200', protocol: 'http:' },
    });
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('http://localhost:3333');
  });

  it('respects VITE_SANDBOX_URL env override', async () => {
    vi.stubEnv('VITE_SANDBOX_URL', 'https://custom.example.com');
    const getSandboxUrl = await loadGetSandboxUrl();
    expect(getSandboxUrl()).toBe('https://custom.example.com');
  });
});
