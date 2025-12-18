import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/auth';
import { ref } from 'vue';

// $fetchをモック
globalThis.$fetch = vi.fn();

// useCookieをモック
globalThis.useCookie = vi.fn(() => ref<string | null>(null));

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should return initial state values', () => {
      const auth = useAuth();

      expect(auth.user.value).toBeNull();
      expect(auth.accessToken.value).toBeNull();
      expect(auth.refreshToken.value).toBeNull();
      expect(auth.isLoading.value).toBe(false);
      expect(auth.error.value).toBeNull();
      expect(auth.isAuthenticated.value).toBe(false);
    });
  });

  describe('login', () => {
    it('should call store login method and update state on success', async () => {
      const auth = useAuth();
      const email = 'test@example.com';
      const password = 'password123';
      const mockResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      vi.mocked(globalThis.$fetch).mockResolvedValue(mockResponse);

      await auth.login(email, password);

      const store = useAuthStore();
      expect(store.user).toEqual(mockResponse.user);
      expect(store.accessToken).toBe(mockResponse.accessToken);
      expect(store.refreshToken).toBe(mockResponse.refreshToken);
    });

    it('should handle login errors', async () => {
      const auth = useAuth();
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const mockError = {
        data: {
          statusMessage: 'Invalid credentials',
        },
      };

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      await expect(auth.login(email, password)).rejects.toEqual(mockError);
    });
  });

  describe('logout', () => {
    it('should clear store state', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      // まずユーザーを設定
      store.setUser({ id: 'test-id', email: 'test@example.com', name: 'Test' });
      store.setTokens('token', 'refresh');
      
      auth.logout();

      expect(store.user).toBeNull();
      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update store user', () => {
      const auth = useAuth();
      const store = useAuthStore();
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };

      auth.setUser(user);

      expect(store.user).toEqual(user);
    });

    it('should allow setting user to null', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      auth.setUser(null);

      expect(store.user).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should update store tokens', () => {
      const auth = useAuth();
      const store = useAuthStore();
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      auth.setTokens(accessToken, refreshToken);

      expect(store.accessToken).toBe(accessToken);
      expect(store.refreshToken).toBe(refreshToken);
    });

    it('should allow setting tokens to null', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      auth.setTokens(null, null);

      expect(store.accessToken).toBeNull();
      expect(store.refreshToken).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear store error', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      store.error = 'Some error';
      auth.clearError();

      expect(store.error).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user and accessToken are set', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      store.setUser({ id: 'test-id', email: 'test@example.com', name: 'Test' });
      store.setTokens('test-token', 'refresh-token');

      expect(auth.isAuthenticated.value).toBe(true);
    });

    it('should return false when user is null', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      store.setUser(null);
      store.setTokens('test-token', 'refresh-token');

      expect(auth.isAuthenticated.value).toBe(false);
    });

    it('should return false when accessToken is null', () => {
      const auth = useAuth();
      const store = useAuthStore();
      
      store.setUser({ id: 'test-id', email: 'test@example.com', name: 'Test' });
      store.setTokens(null, null);

      expect(auth.isAuthenticated.value).toBe(false);
    });
  });

  describe('reactive state', () => {
    it('should reflect store state changes', () => {
      const auth = useAuth();
      const store = useAuthStore();

      // 初期状態
      expect(auth.user.value).toBeNull();

      // ストアの状態を変更
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      store.setUser(user);

      // リアクティブな値が更新されることを確認
      expect(auth.user.value).toEqual(user);
    });
  });
});

