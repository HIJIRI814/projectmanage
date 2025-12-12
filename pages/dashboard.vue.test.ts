import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import Dashboard from './dashboard.vue';

// useAuthをモック
vi.mock('../composables/useAuth', () => ({
  useAuth: vi.fn(),
}));

// useRouterをモック
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { useAuth } from '../composables/useAuth';

describe('Dashboard.vue', () => {
  let mockAuth: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockAuth = {
      user: { value: null },
      accessToken: { value: null },
      refreshToken: { value: null },
      isLoading: { value: false },
      error: { value: null },
      isAuthenticated: { value: false },
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      setTokens: vi.fn(),
      clearError: vi.fn(),
    };

    vi.mocked(useAuth).mockReturnValue(mockAuth);
  });

  describe('rendering', () => {
    it('should render dashboard with user information when authenticated', () => {
      mockAuth.user.value = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.isAuthenticated.value = true;

      const wrapper = mount(Dashboard);

      expect(wrapper.find('h1').text()).toBe('ダッシュボード');
      expect(wrapper.text()).toContain('test-id');
      expect(wrapper.text()).toContain('test@example.com');
      expect(wrapper.text()).toContain('Test User');
    });

    it('should display logout button', () => {
      mockAuth.user.value = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.isAuthenticated.value = true;

      const wrapper = mount(Dashboard);

      const logoutButton = wrapper.find('button');
      expect(logoutButton.exists()).toBe(true);
      expect(logoutButton.text()).toBe('ログアウト');
    });
  });

  describe('authentication redirect', () => {
    it('should redirect to login when not authenticated', async () => {
      mockAuth.isAuthenticated.value = false;
      const wrapper = mount(Dashboard);

      // watchが実行されるまで待つ
      await wrapper.vm.$nextTick();

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not redirect when authenticated', () => {
      mockAuth.user.value = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.isAuthenticated.value = true;

      mount(Dashboard);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call logout when logout button is clicked', async () => {
      mockAuth.user.value = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.isAuthenticated.value = true;

      const wrapper = mount(Dashboard);
      const logoutButton = wrapper.find('button');

      await logoutButton.trigger('click');

      expect(mockAuth.logout).toHaveBeenCalled();
    });

    it('should redirect to login after logout', async () => {
      mockAuth.user.value = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.isAuthenticated.value = true;

      const wrapper = mount(Dashboard);
      const logoutButton = wrapper.find('button');

      await logoutButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('user information display', () => {
    it('should display all user fields', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
      };
      mockAuth.user.value = user;
      mockAuth.isAuthenticated.value = true;

      const wrapper = mount(Dashboard);

      expect(wrapper.text()).toContain('user-123');
      expect(wrapper.text()).toContain('user@example.com');
      expect(wrapper.text()).toContain('John Doe');
    });

    it('should handle null user gracefully', () => {
      mockAuth.user.value = null;
      mockAuth.isAuthenticated.value = false;

      const wrapper = mount(Dashboard);

      // リダイレクトが発生するため、コンテンツは表示されない
      expect(wrapper.text()).not.toContain('ダッシュボード');
    });
  });
});

