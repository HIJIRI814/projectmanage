import { vi } from 'vitest';
import { ref, watch, onMounted } from 'vue';

// グローバルなモック設定などがあればここに記述
// 例: process.env のデフォルト値設定
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

// Nuxtのグローバル関数をモック
globalThis.defineEventHandler = vi.fn((handler: any) => handler);
globalThis.readBody = vi.fn();
globalThis.createError = vi.fn((error: any) => {
  const err = new Error(error.statusMessage || 'Error');
  (err as any).statusCode = error.statusCode;
  (err as any).statusMessage = error.statusMessage;
  (err as any).data = error.data;
  return err;
});

// Vueのグローバル関数をモック
globalThis.ref = ref;
globalThis.watch = watch;
globalThis.onMounted = onMounted;
globalThis.useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
globalThis.useRoute = vi.fn(() => ({
  path: '/',
  params: {},
  query: {},
}));
globalThis.navigateTo = vi.fn();
globalThis.useFetch = vi.fn();
globalThis.definePageMeta = vi.fn();
globalThis.useCookie = vi.fn((name: string, options?: any) => {
  return ref<string | null>(null);
});

// useAuthをモック（テストファイルで上書き可能）
globalThis.useAuth = vi.fn(() => ({
  user: { value: null },
  accessToken: { value: null },
  refreshToken: { value: null },
  isLoading: { value: false },
  error: { value: null },
  isAuthenticated: { value: false },
  isAdministrator: { value: false },
  login: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
  setTokens: vi.fn(),
  clearError: vi.fn(),
}));

