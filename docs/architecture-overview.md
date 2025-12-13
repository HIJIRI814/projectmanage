# アーキテクチャ概要

## 概要

このプロジェクトは、**ドメイン駆動設計（DDD）**の原則に基づいて構築されたNuxt 3アプリケーションです。レイヤードアーキテクチャを採用し、各レイヤーの責務を明確に分離しています。

## アーキテクチャの全体像

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Pages, Components, Composables, Middleware)              │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│                  Application Layer                        │
│  (Use Cases, DTOs)                                       │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│                    Domain Layer                           │
│  (Entities, Value Objects, Domain Services)              │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│              Infrastructure Layer                         │
│  (Repository Implementations, External Services)          │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│              Database (PostgreSQL + Prisma)               │
└───────────────────────────────────────────────────────────┘
```

## レイヤー構成

### 1. ドメイン層（Domain Layer）

**責務**: ビジネスロジックの核心を表現

- **エンティティ**: ビジネスオブジェクト（User, Project）
- **値オブジェクト**: 不変の値（Email, PasswordHash, UserTypeValue）
- **ドメインサービス**: エンティティに属さないビジネスロジック（AuthDomainService）
- **リポジトリインターフェース**: 永続化の抽象化（IUserRepository, IProjectRepository）

**特徴**:
- フレームワークや技術に依存しない
- ビジネスルールを表現
- テストが容易

### 2. アプリケーション層（Application Layer）

**責務**: ユースケースの実装とアプリケーションの調整

- **ユースケース**: アプリケーションの操作単位（LoginUser, CreateProject, etc.）
- **DTO**: データ転送オブジェクト（LoginInput, AuthResult, ProjectOutput, etc.）

**特徴**:
- ドメイン層のオブジェクトを組み合わせてユースケースを実現
- トランザクション管理
- エラーハンドリング

### 3. インフラストラクチャ層（Infrastructure Layer）

**責務**: 技術的な実装の詳細

- **リポジトリ実装**: データベースアクセスの実装（UserRepositoryImpl, ProjectRepositoryImpl）
- **外部サービス**: JWT、bcryptなどの技術的サービス（JwtService）

**特徴**:
- ドメイン層のインターフェースを実装
- 技術的な詳細をカプセル化
- フレームワークやライブラリへの依存

### 4. プレゼンテーション層（Presentation Layer）

**責務**: ユーザーインターフェースとAPIエンドポイント

- **APIエンドポイント**: `server/api/`配下のRESTful API
- **ページコンポーネント**: `pages/`配下のVueコンポーネント
- **コンポーザブル**: `composables/`配下の再利用可能なロジック
- **ミドルウェア**: 認証・認可のルーティング制御

**特徴**:
- ユーザーとのインターフェース
- HTTPリクエスト/レスポンスの処理
- バリデーション（Zodを使用）

## データフロー

### 認証フローの例

```
1. ユーザーがログインフォームに入力
   ↓
2. APIエンドポイント（server/api/auth/login.post.ts）
   - Zodでバリデーション
   - LoginInput DTOを作成
   ↓
3. ユースケース（application/auth/useCases/LoginUser.ts）
   - Email値オブジェクトを作成
   - UserRepositoryでユーザーを検索
   - AuthDomainServiceで認証
   - JwtServiceでトークン生成
   ↓
4. ドメイン層
   - Userエンティティがパスワード検証
   - Email値オブジェクトがバリデーション
   ↓
5. インフラストラクチャ層
   - UserRepositoryImplがPrismaでDBアクセス
   - JwtServiceがJWTトークンを生成
   ↓
6. レスポンス
   - AuthResult DTOを返却
   - クライアントにトークンとユーザー情報を返す
```

## 依存関係の方向

```
Presentation Layer
    ↓ (depends on)
Application Layer
    ↓ (depends on)
Domain Layer
    ↑ (implemented by)
Infrastructure Layer
```

**重要な原則**:
- 内側のレイヤーは外側のレイヤーに依存しない
- ドメイン層は他のレイヤーに依存しない
- インフラストラクチャ層はドメイン層のインターフェースを実装

## 技術スタック

- **フレームワーク**: Nuxt 3
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **状態管理**: Pinia
- **認証**: JWT (jsonwebtoken)
- **パスワードハッシュ**: bcrypt
- **バリデーション**: Zod
- **テスト**: Vitest

## ディレクトリ構造

```
nuxt-app/
├── domain/              # ドメイン層
│   ├── user/
│   │   ├── model/      # エンティティ、値オブジェクト、リポジトリインターフェース
│   │   └── service/    # ドメインサービス
│   └── project/
│       └── model/
├── application/         # アプリケーション層
│   ├── auth/
│   │   ├── useCases/
│   │   └── dto/
│   ├── user/
│   │   ├── useCases/
│   │   └── dto/
│   └── project/
│       ├── useCases/
│       └── dto/
├── infrastructure/      # インフラストラクチャ層
│   ├── auth/
│   ├── project/
│   └── prisma/
├── server/
│   └── api/            # APIエンドポイント
│       ├── auth/
│       ├── projects/
│       └── manage/
├── composables/         # コンポーザブル
├── stores/             # Piniaストア
├── pages/              # ページコンポーネント
└── middleware/         # ルートミドルウェア
```

## 設計原則

### 1. 依存性逆転の原則（DIP）

ドメイン層は抽象に依存し、インフラストラクチャ層がその実装を提供します。

### 2. 単一責任の原則（SRP）

各クラス・モジュールは単一の責務を持ちます。

### 3. 開放閉鎖の原則（OCP）

拡張に対して開いており、修正に対して閉じています。

### 4. ドメイン駆動設計（DDD）

- エンティティと値オブジェクトの明確な区別
- リポジトリパターンによる永続化の抽象化
- ドメインサービスによる複雑なビジネスロジックの表現

## テスト戦略

- **ドメイン層**: ユニットテスト（Vitest）
- **アプリケーション層**: ユニットテスト（モックを使用）
- **インフラストラクチャ層**: 統合テスト
- **API層**: E2Eテスト

## 次のステップ

各レイヤーの詳細については、以下のドキュメントを参照してください：

- [ドメイン層の詳細](./domain-layer.md)
- [アプリケーション層の詳細](./application-layer.md)
- [インフラストラクチャ層の詳細](./infrastructure-layer.md)
- [API層の詳細](./api-layer.md)
- [認証・認可の詳細](./authentication-authorization.md)
- [フロントエンド層の詳細](./frontend-layer.md)

