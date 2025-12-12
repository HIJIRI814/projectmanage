import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import Login from './login.vue';

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

describe('Login.vue', () => {
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
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      setUser: vi.fn(),
      setTokens: vi.fn(),
      clearError: vi.fn(),
    };

    vi.mocked(useAuth).mockReturnValue(mockAuth);
  });

  describe('rendering', () => {
    it('should render login form', () => {
      const wrapper = mount(Login);

      expect(wrapper.find('h1').text()).toBe('ログイン');
      expect(wrapper.find('input[type="email"]').exists()).toBe(true);
      expect(wrapper.find('input[type="password"]').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    it('should display email and password input fields', () => {
      const wrapper = mount(Login);

      const emailInput = wrapper.find('input[type="email"]');
      const passwordInput = wrapper.find('input[type="password"]');

      expect(emailInput.attributes('placeholder')).toBe('example@email.com');
      expect(passwordInput.attributes('placeholder')).toBe('パスワードを入力');
    });
  });

  describe('form submission', () => {
    it('should call login when form is submitted', async () => {
      const wrapper = mount(Login);

      await wrapper.find('input[type="email"]').setValue('test@example.com');
      await wrapper.find('input[type="password"]').setValue('password123');
      await wrapper.find('form').trigger('submit');

      expect(mockAuth.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should disable form inputs during loading', async () => {
      mockAuth.isLoading.value = true;
      const wrapper = mount(Login);

      const emailInput = wrapper.find('input[type="email"]');
      const passwordInput = wrapper.find('input[type="password"]');
      const submitButton = wrapper.find('button[type="submit"]');

      expect(emailInput.attributes('disabled')).toBeDefined();
      expect(passwordInput.attributes('disabled')).toBeDefined();
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should show loading text on button during login', () => {
      mockAuth.isLoading.value = true;
      const wrapper = mount(Login);

      const button = wrapper.find('button[type="submit"]');
      expect(button.text()).toBe('ログイン中...');
    });
  });

  describe('error handling', () => {
    it('should display error message when login fails', async () => {
      mockAuth.error.value = 'Invalid credentials';
      const wrapper = mount(Login);

      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toBe('Invalid credentials');
    });

    it('should not display error message when there is no error', () => {
      mockAuth.error.value = null;
      const wrapper = mount(Login);

      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.exists()).toBe(false);
    });
  });

  describe('authentication redirect', () => {
    it('should redirect to dashboard when authenticated', async () => {
      mockAuth.isAuthenticated.value = true;
      const wrapper = mount(Login);

      // watchが実行されるまで待つ
      await wrapper.vm.$nextTick();

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should not redirect when not authenticated', () => {
      mockAuth.isAuthenticated.value = false;
      mount(Login);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('user input', () => {
    it('should bind email input to email data', async () => {
      const wrapper = mount(Login);
      const emailInput = wrapper.find('input[type="email"]') as any;

      await emailInput.setValue('test@example.com');

      expect(emailInput.element.value).toBe('test@example.com');
    });

    it('should bind password input to password data', async () => {
      const wrapper = mount(Login);
      const passwordInput = wrapper.find('input[type="password"]') as any;

      await passwordInput.setValue('password123');

      expect(passwordInput.element.value).toBe('password123');
    });
  });
});

