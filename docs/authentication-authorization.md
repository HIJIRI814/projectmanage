# 認証・認可の詳細

## 概要

このアプリケーションでは、JWT（JSON Web Token）ベースの認証システムを実装しています。認証は、ユーザーのログイン状態を管理し、認可は、ユーザーの権限に基づいてアクセス制御を行います。

## 認証フロー

### ログインフロー

```
1. ユーザーがログインフォームに入力
   ↓
2. POST /api/auth/login
   - メールアドレスとパスワードを送信
   ↓
3. バリデーション（Zod）
   ↓
4. LoginUserユースケースの実行
   - ユーザーの検索
   - パスワードの検証
   - JWTトークンの生成
   ↓
5. レスポンス
   - accessToken（15分有効）
   - refreshToken（7日有効）
   - ユーザー情報
   ↓
6. クライアント側
   - トークンをPiniaストアに保存
   - トークンをクッキーに保存（SSR用）
```

### 認証状態の管理

#### クライアントサイド

- **Piniaストア**: 認証状態を管理
- **クッキー**: SSR時の認証チェック用

#### サーバーサイド

- **クッキー**: アクセストークンをクッキーに保存
- **JWT検証**: リクエストごとにトークンを検証

## JWTトークン

### アクセストークン（Access Token）

- **有効期限**: 15分
- **用途**: APIリクエストの認証
- **保存場所**: 
  - クライアント: Piniaストア + クッキー
  - サーバー: クッキーから取得

### リフレッシュトークン（Refresh Token）

- **有効期限**: 7日
- **用途**: アクセストークンの更新（現在は未実装）
- **保存場所**: Piniaストア

### トークンの生成

**ファイル**: `infrastructure/auth/jwtService.ts`

```typescript
generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, this.accessTokenSecret, {
    expiresIn: '15m',
  });
}

generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, this.refreshTokenSecret, {
    expiresIn: '7d',
  });
}
```

### トークンの検証

```typescript
verifyAccessToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, this.accessTokenSecret) as { userId: string };
  } catch (error) {
    throw new Error('Invalid access token');
  }
}
```

## 認証の実装

### APIエンドポイントでの認証

**共通パターン**: `getCurrentUser`関数

```typescript
async function getCurrentUser(event: any) {
  // 1. クッキーからトークンを取得
  const accessTokenCookie = getCookie(event, 'accessToken');
  if (!accessTokenCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    // 2. トークンの検証
    const { userId } = jwtService.verifyAccessToken(accessTokenCookie);
    
    // 3. ユーザー情報の取得
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    return user;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
}
```

### 使用例

```typescript
export default defineEventHandler(async (event) => {
  // 認証チェック
  const currentUser = await getCurrentUser(event);
  
  // 認証済みユーザーとして処理を続行
  // ...
});
```

## 認可（Authorization）

### ユーザータイプ

```typescript
export enum UserType {
  ADMINISTRATOR = 1,  // 管理者
  MEMBER = 2,        // メンバー
  PARTNER = 3,       // パートナー
  CUSTOMER = 4,      // 顧客
}
```

### 権限チェック

#### 管理者チェック

```typescript
// ドメイン層
user.isAdministrator(): boolean

// アプリケーション層
if (!user.isAdministrator()) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden: Administrator access required',
  });
}
```

#### 管理者・メンバーチェック

```typescript
function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden: Administrator or Member access required',
  });
}
```

### 認可の実装例

#### プロジェクト作成API

**ファイル**: `server/api/projects/index.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  // 1. 認証チェック
  const currentUser = await getCurrentUser(event);

  // 2. 認可チェック（管理者・メンバーのみ）
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  // 3. 処理を続行
  // ...
});
```

#### ユーザー管理API

**ファイル**: `server/api/manage/users/index.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  // 1. 認証・認可チェック（管理者のみ）
  const currentUser = await getCurrentUser(event);
  if (!currentUser.isAdministrator()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }

  // 2. 処理を続行
  // ...
});
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

```
1. SSR時
   - クッキーからトークンを取得
   - トークンを検証
   - ユーザー情報を取得
   - 管理者権限をチェック
   
2. クライアントサイド時
   - ストアの状態をチェック
   - クッキーから状態を復元（必要に応じて）
   - ユーザー情報を取得（必要に応じて）
   - 管理者権限をチェック
```

#### 使用例

```typescript
// pages/manage/users/index.vue
definePageMeta({
  middleware: 'admin'
});
```

## フロントエンドでの認証

### useAuthコンポーザブル

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

```typescript
// コンポーネント内
const { isAuthenticated, user, login, logout } = useAuth();

// ログイン
await login('user@example.com', 'password123');

// ログアウト
logout();

// 認証状態のチェック
if (isAuthenticated.value) {
  // 認証済みの処理
}
```

### Piniaストア

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

#### アクション

- **login**: ログイン処理
- **logout**: ログアウト処理
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

## セキュリティの考慮事項

### 1. パスワードのハッシュ化

- **bcrypt**: パスワードはbcryptでハッシュ化
- **ソルト**: bcryptが自動的にソルトを生成
- **ラウンド数**: 10ラウンド（デフォルト）

### 2. JWTトークンのセキュリティ

- **シークレットキー**: 環境変数から取得
- **有効期限**: アクセストークンは15分、リフレッシュトークンは7日
- **HTTPS**: 本番環境ではHTTPSを使用（secureフラグ）

### 3. クッキーのセキュリティ

```typescript
const accessTokenCookie = useCookie('accessToken', {
  maxAge: 60 * 15,      // 15分
  secure: true,         // HTTPSのみ
  sameSite: 'strict',  // CSRF対策
});
```

### 4. エラーメッセージ

- **情報漏洩の防止**: 詳細なエラーメッセージを返さない
- **統一されたエラー**: 認証失敗時は常に「Invalid credentials」

## テスト

認証・認可のテストは、各レイヤーで実装されています：

- **ドメイン層**: パスワード検証、ユーザータイプチェック
- **アプリケーション層**: ログインユースケース
- **API層**: 認証・認可エンドポイント

## ベストプラクティス

1. **トークンの有効期限**: 適切な有効期限を設定
2. **クッキーのセキュリティ**: secure、sameSiteフラグを設定
3. **エラーハンドリング**: 情報漏洩を防ぐエラーメッセージ
4. **認可チェック**: すべての保護されたリソースで認可チェックを実装
5. **状態の管理**: SSRとクライアントサイドの両方で状態を適切に管理

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [API層の詳細](./api-layer.md)
- [フロントエンド層の詳細](./frontend-layer.md)

