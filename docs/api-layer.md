# API層の詳細

## 概要

API層は、HTTPリクエストとレスポンスを処理するプレゼンテーション層です。Nuxt 3の`server/api/`ディレクトリに配置され、RESTful APIエンドポイントを提供します。

## ディレクトリ構造

```
server/api/
├── auth/
│   ├── login.post.ts                   # ログインAPI
│   ├── login.post.test.ts
│   └── me.get.ts                       # 現在のユーザー情報取得API
├── projects/
│   ├── index.get.ts                    # プロジェクト一覧取得API
│   ├── index.post.ts                   # プロジェクト作成API
│   ├── [id].get.ts                     # プロジェクト詳細取得API
│   ├── [id].put.ts                     # プロジェクト更新API
│   └── [id].delete.ts                  # プロジェクト削除API
└── manage/
    └── users/
        ├── index.get.ts                # ユーザー一覧取得API（管理者用）
        ├── index.post.ts               # ユーザー作成API（管理者用）
        ├── [id].get.ts                 # ユーザー詳細取得API（管理者用）
        ├── [id].put.ts                 # ユーザー更新API（管理者用）
        └── [id].delete.ts              # ユーザー削除API（管理者用）
```

## APIエンドポイントの命名規則

Nuxt 3のファイルベースルーティングを使用しています：

- `index.get.ts` → `GET /api/{directory}`
- `index.post.ts` → `POST /api/{directory}`
- `[id].get.ts` → `GET /api/{directory}/:id`
- `[id].put.ts` → `PUT /api/{directory}/:id`
- `[id].delete.ts` → `DELETE /api/{directory}/:id`

## 認証API

### POST /api/auth/login

**ファイル**: `server/api/auth/login.post.ts`

ユーザーのログイン処理を行います。

#### リクエスト

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス（成功時）

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "userType": 4
  }
}
```

#### 実装の詳細

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // 1. Zodでバリデーション
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    // 2. DTOの作成
    const input = new LoginInput(
      validationResult.data.email,
      validationResult.data.password
    );

    // 3. ユースケースの実行
    const result = await loginUserUseCase.execute(input);

    // 4. レスポンスの返却
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  } catch (error: any) {
    // エラーハンドリング
    if (error.message === 'Invalid credentials') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      });
    }
    // ...
  }
});
```

#### エラーレスポンス

- **400 Bad Request**: バリデーションエラー
- **401 Unauthorized**: 認証失敗

### GET /api/auth/me

**ファイル**: `server/api/auth/me.get.ts`

現在ログインしているユーザーの情報を取得します。

#### リクエスト

認証が必要です。クッキーに`accessToken`を含める必要があります。

#### レスポンス（成功時）

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "userType": 4
}
```

#### 実装の詳細

```typescript
export default defineEventHandler(async (event) => {
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
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // 4. レスポンスの返却
    return {
      id: user.id,
      email: user.email.toString(),
      name: user.name,
      userType: user.userType.toNumber(),
    };
  } catch (error: any) {
    // エラーハンドリング
    // ...
  }
});
```

#### エラーレスポンス

- **401 Unauthorized**: トークンが無効または存在しない
- **404 Not Found**: ユーザーが見つからない

## プロジェクトAPI

### GET /api/projects

**ファイル**: `server/api/projects/index.get.ts`

プロジェクト一覧を取得します。

#### 認証・認可

- 認証が必要
- 管理者・メンバーのみ全プロジェクトを取得可能
- パートナー・顧客は空配列を返す

#### レスポンス（成功時）

```json
[
  {
    "id": "project-id",
    "name": "Project Name",
    "description": "Project Description",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 実装の詳細

```typescript
export default defineEventHandler(async (event) => {
  // 1. 現在のユーザーを取得
  const currentUser = await getCurrentUser(event);

  // 2. 権限チェック
  if (isAdministratorOrMember(currentUser.userType.toNumber())) {
    const projects = await listProjectsUseCase.execute();
    return projects;
  }

  // 3. 権限がない場合は空配列を返す
  return [];
});
```

### POST /api/projects

**ファイル**: `server/api/projects/index.post.ts`

新規プロジェクトを作成します。

#### リクエスト

```json
{
  "name": "Project Name",
  "description": "Project Description"
}
```

#### 認証・認可

- 認証が必要
- 管理者・メンバーのみ作成可能

#### レスポンス（成功時）

```json
{
  "id": "project-id",
  "name": "Project Name",
  "description": "Project Description",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 実装の詳細

```typescript
export default defineEventHandler(async (event) => {
  // 1. 認証・認可チェック
  const currentUser = await getCurrentUser(event);
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  // 2. リクエストボディの取得
  const body = await readBody(event);

  // 3. バリデーション
  const validationResult = createProjectSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: validationResult.error.errors,
    });
  }

  // 4. DTOの作成とユースケースの実行
  const input = new CreateProjectInput(
    validationResult.data.name,
    validationResult.data.description
  );
  const result = await createProjectUseCase.execute(input);

  return result;
});
```

### GET /api/projects/:id

**ファイル**: `server/api/projects/[id].get.ts`

指定されたIDのプロジェクト詳細を取得します。

### PUT /api/projects/:id

**ファイル**: `server/api/projects/[id].put.ts`

指定されたIDのプロジェクトを更新します。

### DELETE /api/projects/:id

**ファイル**: `server/api/projects/[id].delete.ts`

指定されたIDのプロジェクトを削除します。

## ユーザー管理API（管理者用）

### GET /api/manage/users

**ファイル**: `server/api/manage/users/index.get.ts`

ユーザー一覧を取得します（管理者のみ）。

#### 認証・認可

- 認証が必要
- 管理者のみアクセス可能

### POST /api/manage/users

**ファイル**: `server/api/manage/users/index.post.ts`

新規ユーザーを作成します（管理者のみ）。

#### リクエスト

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "userType": 4
}
```

#### 認証・認可

- 認証が必要
- 管理者のみ作成可能

#### レスポンス（成功時）

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "userType": 4,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### エラーレスポンス

- **400 Bad Request**: バリデーションエラー
- **401 Unauthorized**: 認証が必要
- **403 Forbidden**: 管理者権限が必要
- **409 Conflict**: メールアドレスが既に存在

### GET /api/manage/users/:id

**ファイル**: `server/api/manage/users/[id].get.ts`

指定されたIDのユーザー詳細を取得します（管理者のみ）。

### PUT /api/manage/users/:id

**ファイル**: `server/api/manage/users/[id].put.ts`

指定されたIDのユーザーを更新します（管理者のみ）。

### DELETE /api/manage/users/:id

**ファイル**: `server/api/manage/users/[id].delete.ts`

指定されたIDのユーザーを削除します（管理者のみ）。

## 共通パターン

### 認証チェック

多くのエンドポイントで使用される認証チェックのパターン：

```typescript
async function getCurrentUser(event: any) {
  const accessTokenCookie = getCookie(event, 'accessToken');
  if (!accessTokenCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const { userId } = jwtService.verifyAccessToken(accessTokenCookie);
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

### バリデーション

Zodを使用したバリデーションのパターン：

```typescript
const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const validationResult = schema.safeParse(body);
if (!validationResult.success) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Validation error',
    data: validationResult.error.errors,
  });
}
```

### エラーハンドリング

統一されたエラーハンドリングのパターン：

```typescript
try {
  // 処理
} catch (error: any) {
  // 既にHTTPエラーの場合はそのままスロー
  if (error.statusCode) {
    throw error;
  }

  // ビジネスロジックエラーの場合
  if (error.message === 'Email already exists') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already exists',
    });
  }

  // その他のエラー
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error',
  });
}
```

## 設計原則

### 1. 単一責任の原則

各エンドポイントは、単一の操作のみを担当します。

### 2. バリデーション

すべての入力は、Zodを使用してバリデーションします。

### 3. エラーハンドリング

統一されたエラーレスポンス形式を使用します。

### 4. 認証・認可

認証が必要なエンドポイントでは、適切な認証・認可チェックを行います。

### 5. DTOの使用

ドメインオブジェクトを直接公開せず、DTOを使用します。

## テスト

各APIエンドポイントには、対応するテストファイル（`.test.ts`）があります。

### テストの例

```typescript
// server/api/auth/login.post.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
    expect(response).toHaveProperty('user');
  });

  it('should return 401 with invalid credentials', async () => {
    await expect(
      $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrong-password',
        },
      })
    ).rejects.toThrow();
  });
});
```

## ベストプラクティス

1. **バリデーション**: すべての入力をバリデーションする
2. **エラーハンドリング**: 統一されたエラーレスポンス形式を使用する
3. **認証・認可**: 適切な認証・認可チェックを実装する
4. **DTOの使用**: ドメインオブジェクトを直接公開しない
5. **テストの記述**: すべてのエンドポイントにテストを記述する

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [アプリケーション層の詳細](./application-layer.md)
- [認証・認可の詳細](./authentication-authorization.md)

