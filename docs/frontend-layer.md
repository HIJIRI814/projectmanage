# フロントエンド層の詳細

## 概要

フロントエンド層は、ユーザーインターフェースを提供するレイヤーです。Nuxt 3の機能を活用し、ページコンポーネント、コンポーザブル、ミドルウェア、Piniaストアで構成されています。

## ディレクトリ構造

```
├── pages/                    # ページコンポーネント
│   ├── index.vue             # トップページ
│   ├── login.vue              # ログインページ
│   ├── dashboard.vue          # ダッシュボード
│   ├── projects/              # プロジェクト関連ページ
│   │   ├── index.vue
│   │   ├── new.vue
│   │   └── [id]/
│   │       └── edit.vue
│   └── manage/                # 管理ページ
│       └── users/
│           ├── index.vue
│           ├── new.vue
│           └── [id]/
│               └── index.vue
├── composables/              # コンポーザブル
│   ├── useAuth.ts            # 認証関連のコンポーザブル
│   └── useAuth.test.ts
├── stores/                   # Piniaストア
│   └── auth.ts               # 認証ストア
├── middleware/               # ルートミドルウェア
│   ├── auth.ts               # 認証ミドルウェア
│   ├── admin.ts              # 管理者ミドルウェア
│   └── guest.ts              # ゲストミドルウェア
└── plugins/                  # プラグイン
    └── pinia.ts              # Piniaプラグイン
```

## ページコンポーネント

### ログインページ

**ファイル**: `pages/login.vue`

ユーザーのログイン処理を行うページです。

#### 主な機能

- メールアドレスとパスワードの入力
- ログイン処理
- エラーメッセージの表示
- ログイン成功後のリダイレクト

#### 実装の特徴

- `useAuth`コンポーザブルを使用
- フォームバリデーション
- ローディング状態の管理

### ダッシュボード

**ファイル**: `pages/dashboard.vue`

認証済みユーザー向けのダッシュボードページです。

#### 主な機能

- ユーザー情報の表示
- プロジェクト一覧の表示
- ログアウト機能

#### 認証

```typescript
definePageMeta({
  middleware: 'auth'
});
```

### プロジェクト管理ページ

**ファイル**: `pages/projects/index.vue`

プロジェクト一覧を表示するページです。

#### 主な機能

- プロジェクト一覧の取得と表示
- 新規プロジェクト作成へのリンク
- プロジェクト編集へのリンク

### ユーザー管理ページ（管理者用）

**ファイル**: `pages/manage/users/index.vue`

ユーザー一覧を表示するページです（管理者のみ）。

#### 認証・認可

```typescript
definePageMeta({
  middleware: 'admin'
});
```

## コンポーザブル（Composables）

### useAuth

**ファイル**: `composables/useAuth.ts`

認証関連のロジックを提供するコンポーザブルです。

#### 提供する機能

```typescript
export const useAuth = () => {
  const store = useAuthStore();
  const { user, accessToken, refreshToken, isLoading, error, isAuthenticated } =
    storeToRefs(store);

  const isAdministrator = computed(() => {
    return user.value?.userType === UserType.ADMINISTRATOR;
  });

  return {
    // State（リアクティブ）
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isAdministrator,
    // Actions
    login: (email: string, password: string) => store.login(email, password),
    logout: () => store.logout(),
    setUser: (user: User | null) => store.setUser(user),
    setTokens: (accessToken: string | null, refreshToken: string | null) =>
      store.setTokens(accessToken, refreshToken),
    clearError: () => store.clearError(),
  };
};
```

#### 使用例

```vue
<script setup lang="ts">
const { isAuthenticated, user, login, logout, isLoading, error } = useAuth();

const handleLogin = async () => {
  try {
    await login(email.value, password.value);
    await navigateTo('/dashboard');
  } catch (err) {
    // エラーハンドリング
  }
};
</script>

<template>
  <div v-if="isAuthenticated">
    <p>ようこそ、{{ user?.name }}さん</p>
    <button @click="logout">ログアウト</button>
  </div>
</template>
```

#### 特徴

- **Piniaストアのラッパー**: Piniaストアを直接公開せず、コンポーザブル経由でアクセス
- **リアクティブな状態**: `storeToRefs`を使用してリアクティブな状態を提供
- **計算プロパティ**: `isAdministrator`などの計算プロパティを提供

## Piniaストア

### authストア

**ファイル**: `stores/auth.ts`

認証状態を管理するPiniaストアです。

#### 状態

```typescript
state: () => ({
  user: null as User | null,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  isLoading: false,
  error: null as string | null,
})
```

#### ゲッター

```typescript
getters: {
  isAuthenticated: (state) => state.user !== null && state.accessToken !== null,
}
```

#### アクション

- **login**: ログイン処理
  - APIを呼び出してログイン
  - トークンとユーザー情報をストアに保存
  - クッキーにトークンを保存（SSR用）

- **logout**: ログアウト処理
  - ストアの状態をクリア
  - クッキーからトークンを削除

- **setUser**: ユーザー情報の設定
- **setTokens**: トークンの設定
- **clearError**: エラーのクリア

#### ログイン処理の詳細

```typescript
async login(email: string, password: string) {
  this.isLoading = true;
  this.error = null;
  try {
    const { data, error: fetchError } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Login failed');
    }

    if (data.value) {
      const result = data.value as {
        accessToken: string;
        refreshToken: string;
        user: User;
      };
      this.user = result.user;
      this.accessToken = result.accessToken;
      this.refreshToken = result.refreshToken;

      // クッキーにトークンを保存（SSR時の認証チェック用）
      const accessTokenCookie = useCookie('accessToken', {
        maxAge: 60 * 15, // 15分
        secure: true,
        sameSite: 'strict',
      });
      accessTokenCookie.value = result.accessToken;
    }
  } catch (err: any) {
    this.error = err.message || 'An error occurred';
    throw err;
  } finally {
    this.isLoading = false;
  }
}
```

## ミドルウェア

### authミドルウェア

**ファイル**: `middleware/auth.ts`

認証が必要なページで使用されるミドルウェアです。

#### 実装

```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    if (!accessTokenCookie.value) {
      return navigateTo('/login');
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated.value) {
      return navigateTo('/login');
    }
  }
});
```

#### 使用例

```typescript
// pages/dashboard.vue
definePageMeta({
  middleware: 'auth'
});
```

### adminミドルウェア

**ファイル**: `middleware/admin.ts`

管理者権限が必要なページで使用されるミドルウェアです。

#### 実装の特徴

- **SSR対応**: サーバーサイドでも認証・認可チェック
- **状態の復元**: クライアントサイドでクッキーから状態を復元
- **詳細なログ**: デバッグ用のログ出力（開発時）

#### 処理フロー

1. **SSR時**:
   - クッキーからトークンを取得
   - トークンを検証
   - ユーザー情報を取得
   - 管理者権限をチェック

2. **クライアントサイド時**:
   - ストアの状態をチェック
   - クッキーから状態を復元（必要に応じて）
   - ユーザー情報を取得（必要に応じて）
   - 管理者権限をチェック

#### 使用例

```typescript
// pages/manage/users/index.vue
definePageMeta({
  middleware: 'admin'
});
```

### guestミドルウェア

**ファイル**: `middleware/guest.ts`

ゲスト（未認証ユーザー）のみアクセス可能なページで使用されるミドルウェアです。

#### 実装

```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated.value) {
    return navigateTo('/dashboard');
  }
});
```

#### 使用例

```typescript
// pages/login.vue
definePageMeta({
  middleware: 'guest'
});
```

## プラグイン

### Piniaプラグイン

**ファイル**: `plugins/pinia.ts`

Piniaストアを初期化するプラグインです。

#### 実装

```typescript
import { createPinia } from 'pinia';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createPinia());
});
```

## データフェッチング

### useFetchの使用

Nuxt 3の`useFetch`を使用してAPIからデータを取得します。

#### 例: プロジェクト一覧の取得

```typescript
const { data: projects, error } = await useFetch('/api/projects', {
  method: 'GET',
});
```

#### 例: プロジェクトの作成

```typescript
const { data, error } = await useFetch('/api/projects', {
  method: 'POST',
  body: {
    name: projectName.value,
    description: projectDescription.value,
  },
});
```

## 状態管理のアーキテクチャ

### ストアの設計原則

1. **コンポーザブル経由でのアクセス**: Piniaストアを直接公開せず、コンポーザブル経由でアクセス
2. **単一責任**: 各ストアは単一のドメイン（認証など）を担当
3. **リアクティブな状態**: `storeToRefs`を使用してリアクティブな状態を提供

### 状態の流れ

```
APIレスポンス
  ↓
Piniaストア（状態の保存）
  ↓
storeToRefs（リアクティブな参照）
  ↓
コンポーザブル（useAuth）
  ↓
コンポーネント（使用）
```

## エラーハンドリング

### エラー状態の管理

```typescript
const { error, clearError } = useAuth();

// エラーの表示
<template>
  <div v-if="error" class="error">
    {{ error }}
    <button @click="clearError">閉じる</button>
  </div>
</template>
```

### ローディング状態の管理

```typescript
const { isLoading } = useAuth();

// ローディングの表示
<template>
  <div v-if="isLoading">読み込み中...</div>
</template>
```

## テスト

### コンポーザブルのテスト

**ファイル**: `composables/useAuth.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should return authentication state', () => {
    const { isAuthenticated, user } = useAuth();
    
    expect(isAuthenticated.value).toBe(false);
    expect(user.value).toBeNull();
  });
});
```

### ページコンポーネントのテスト

**ファイル**: `pages/login.vue.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPage from './login.vue';

describe('LoginPage', () => {
  it('should render login form', () => {
    const wrapper = mount(LoginPage);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });
});
```

## ベストプラクティス

1. **コンポーザブルの使用**: 再利用可能なロジックはコンポーザブルに抽出
2. **ストアの設計**: Piniaストアを直接公開せず、コンポーザブル経由でアクセス
3. **ミドルウェアの活用**: 認証・認可チェックはミドルウェアで実装
4. **エラーハンドリング**: 適切なエラーハンドリングとユーザーフィードバック
5. **ローディング状態**: 非同期処理中はローディング状態を表示
6. **型安全性**: TypeScriptを使用して型安全性を確保

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [認証・認可の詳細](./authentication-authorization.md)
- [API層の詳細](./api-layer.md)

